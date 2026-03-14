import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
  TextInput,
  useWindowDimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useRef, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import {
  startRecording,
  requestAudioPermission,
  uploadAudioFile,
  formatDuration,
  type AudioRecording,
} from "@/lib/audio-capture";
import { captureAndUploadPhoto } from "@/lib/photo-capture";
import {
  createSiteCapture,
  updateSiteCapture,
  completeSiteCapture,
  type ChecklistData,
  DEFAULT_CHECKLIST,
} from "@/lib/api/site-capture";

const STEPS = ["Aufnahme", "Fotos", "Checkliste", "Zusammenfassung"];

// --- Checklist items ---
const CHECKLIST_ITEMS: { key: keyof Omit<ChecklistData, "besonderheiten">; label: string; icon: string }[] = [
  { key: "zugang", label: "Zugang vorhanden", icon: "key" },
  { key: "strom", label: "Strom vorhanden", icon: "flash" },
  { key: "wasser", label: "Wasser vorhanden", icon: "water" },
  { key: "aufzug", label: "Aufzug vorhanden", icon: "arrow-up" },
  { key: "parken", label: "Parkmöglichkeit", icon: "car" },
];

export default function BaustellenaufnahmeScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { width: screenWidth } = useWindowDimensions();

  const [step, setStep] = useState(0);
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1: Audio
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDurationMs, setAudioDurationMs] = useState(0);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioStoragePath, setAudioStoragePath] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 2: Photos
  const [photoCount, setPhotoCount] = useState(0);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoThumbs, setPhotoThumbs] = useState<{ id: string; path: string; signedUrl?: string }[]>([]);

  // Step 3: Checklist
  const [checklist, setChecklist] = useState<ChecklistData>({ ...DEFAULT_CHECKLIST });
  const [notes, setNotes] = useState("");

  // Step 4: Summary — completing
  const [completing, setCompleting] = useState(false);

  // Create site_capture on mount
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const capture = await createSiteCapture(projectId);
        setCaptureId(capture.id);
      } catch (err: any) {
        Alert.alert("Fehler", err.message || "Baustellenaufnahme konnte nicht erstellt werden");
      }
    })();
  }, [projectId]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      const start = Date.now() - durationMs;
      timerRef.current = setInterval(() => {
        setDurationMs(Date.now() - start);
      }, 250);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Auto-save checklist when it changes
  useEffect(() => {
    if (!captureId) return;
    const timeout = setTimeout(() => {
      updateSiteCapture(captureId, { checklist_data: checklist, notes: notes || undefined }).catch(() => {});
    }, 800);
    return () => clearTimeout(timeout);
  }, [checklist, notes, captureId]);

  // --- Audio handlers ---
  const handleStartRecording = useCallback(async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) return;

    const rec = await startRecording();
    if (!rec) return;

    setRecording(rec);
    setIsRecording(true);
    setIsPaused(false);
    setDurationMs(0);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const handlePauseResume = useCallback(async () => {
    if (!recording) return;
    if (isPaused) {
      await recording.resume();
      setIsPaused(false);
    } else {
      await recording.pause();
      setIsPaused(true);
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [recording, isPaused]);

  const handleStopRecording = useCallback(async () => {
    if (!recording) return;
    const result = await recording.stop();
    setRecording(null);
    setIsRecording(false);
    setIsPaused(false);
    setAudioUri(result.uri);
    setAudioDurationMs(result.durationMs || durationMs);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Upload immediately
    if (projectId && result.uri) {
      setAudioUploading(true);
      const uploaded = await uploadAudioFile(projectId, result.uri, result.durationMs || durationMs);
      setAudioUploading(false);
      if (uploaded) {
        setAudioStoragePath(uploaded.storagePath);
      }
    }
  }, [recording, durationMs, projectId]);

  // --- Photo handler ---
  const handleCapturePhoto = useCallback(async () => {
    if (!projectId || photoUploading) return;
    setPhotoUploading(true);
    try {
      const result = await captureAndUploadPhoto({
        projectId,
        inspectionType: "erstbegehung", // reuse type for storage path
        roomName: "Baustellenaufnahme",
      });
      if (result) {
        setPhotoCount((c) => c + 1);
        setPhotoThumbs((prev) => [...prev, { id: result.id, path: result.storagePath }]);
        // Get signed URL for thumb
        const { data: urlData } = await supabase.storage
          .from("project-files")
          .createSignedUrl(result.storagePath, 3600);
        if (urlData?.signedUrl) {
          setPhotoThumbs((prev) =>
            prev.map((p) => (p.id === result.id ? { ...p, signedUrl: urlData.signedUrl } : p))
          );
        }
      }
    } catch {
      // captureAndUploadPhoto handles its own alerts
    }
    setPhotoUploading(false);
  }, [projectId, photoUploading]);

  // --- Complete ---
  const handleComplete = useCallback(async () => {
    if (!captureId || !projectId) return;
    setCompleting(true);
    try {
      await updateSiteCapture(captureId, {
        checklist_data: checklist,
        notes: notes || undefined,
      });
      await completeSiteCapture(captureId, projectId, {
        audio_storage_path: audioStoragePath,
        audio_duration_ms: audioDurationMs,
        photo_count: photoCount,
        checklist: checklist,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Erfolgreich", "Baustellenaufnahme abgeschlossen. Transkription wird gestartet.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Fehler", err.message || "Abschließen fehlgeschlagen");
    }
    setCompleting(false);
  }, [captureId, projectId, checklist, notes, audioStoragePath, audioDurationMs, photoCount]);

  // --- Step navigation ---
  const canGoNext = step < STEPS.length - 1;
  const canGoPrev = step > 0;

  const goNext = () => {
    if (canGoNext) {
      setStep((s) => s + 1);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const goPrev = () => {
    if (canGoPrev) {
      setStep((s) => s - 1);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const thumbSize = Math.floor((screenWidth - 60) / 3);

  // ==================== RENDER ====================

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.raw.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Baustellenaufnahme</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Step indicators */}
      <View style={styles.stepRow}>
        {STEPS.map((label, i) => (
          <Pressable key={label} onPress={() => setStep(i)} style={styles.stepItem}>
            <View style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]} />
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* ============ STEP 0: AUDIO ============ */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Gespräch aufnehmen</Text>
            <Text style={styles.stepDesc}>
              Halten Sie das Kundengespräch fest. Die Aufnahme wird automatisch transkribiert.
            </Text>

            {/* Timer display */}
            <Text style={styles.timerText}>{formatDuration(isRecording ? durationMs : audioDurationMs)}</Text>

            {/* Record button */}
            {!audioUri ? (
              <View style={styles.recordControls}>
                {!isRecording ? (
                  <Pressable
                    onPress={handleStartRecording}
                    style={({ pressed }) => [styles.recordBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Ionicons name="mic" size={36} color={Colors.raw.white} />
                  </Pressable>
                ) : (
                  <View style={styles.recordingActions}>
                    <Pressable
                      onPress={handlePauseResume}
                      style={({ pressed }) => [styles.controlBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Ionicons name={isPaused ? "play" : "pause"} size={28} color={Colors.raw.white} />
                    </Pressable>
                    <Pressable
                      onPress={handleStopRecording}
                      style={({ pressed }) => [styles.stopBtn, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Ionicons name="stop" size={36} color={Colors.raw.white} />
                    </Pressable>
                  </View>
                )}
                {isRecording && (
                  <Text style={styles.recordingHint}>{isPaused ? "Pausiert" : "Aufnahme läuft..."}</Text>
                )}
              </View>
            ) : (
              <View style={styles.audioDone}>
                {audioUploading ? (
                  <View style={styles.uploadingRow}>
                    <ActivityIndicator color={Colors.raw.amber500} />
                    <Text style={styles.uploadingText}>Wird hochgeladen...</Text>
                  </View>
                ) : audioStoragePath ? (
                  <View style={styles.audioDoneRow}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.raw.emerald500} />
                    <Text style={styles.audioDoneText}>
                      Aufnahme gespeichert ({formatDuration(audioDurationMs)})
                    </Text>
                  </View>
                ) : (
                  <View style={styles.audioDoneRow}>
                    <Ionicons name="alert-circle" size={24} color={Colors.raw.rose500} />
                    <Text style={styles.audioDoneText}>Upload fehlgeschlagen</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => {
                    setAudioUri(null);
                    setAudioStoragePath(null);
                    setAudioDurationMs(0);
                    setDurationMs(0);
                  }}
                  style={({ pressed }) => [styles.retakeBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Ionicons name="refresh" size={18} color={Colors.raw.amber500} />
                  <Text style={styles.retakeBtnText}>Neue Aufnahme</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* ============ STEP 1: PHOTOS ============ */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Fotos aufnehmen</Text>
            <Text style={styles.stepDesc}>Dokumentieren Sie die Baustelle mit Fotos.</Text>

            <Pressable
              onPress={handleCapturePhoto}
              disabled={photoUploading}
              style={({ pressed }) => [
                styles.photoBtn,
                { opacity: pressed || photoUploading ? 0.6 : 1 },
              ]}
            >
              {photoUploading ? (
                <ActivityIndicator color={Colors.raw.zinc950} />
              ) : (
                <>
                  <Ionicons name="camera" size={24} color={Colors.raw.zinc950} />
                  <Text style={styles.photoBtnText}>Foto aufnehmen</Text>
                </>
              )}
            </Pressable>

            {photoCount > 0 && (
              <Text style={styles.photoCountText}>{photoCount} Foto{photoCount !== 1 ? "s" : ""} aufgenommen</Text>
            )}

            {/* Photo grid */}
            {photoThumbs.length > 0 && (
              <View style={styles.photoGrid}>
                {photoThumbs.map((photo) => (
                  <View key={photo.id} style={[styles.photoThumb, { width: thumbSize, height: thumbSize }]}>
                    {photo.signedUrl ? (
                      <Image source={{ uri: photo.signedUrl }} style={styles.photoThumbImg} />
                    ) : (
                      <View style={styles.photoThumbPlaceholder}>
                        <ActivityIndicator size="small" color={Colors.raw.zinc500} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ============ STEP 2: CHECKLIST ============ */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Checkliste</Text>
            <Text style={styles.stepDesc}>Gegebenheiten vor Ort prüfen.</Text>

            {CHECKLIST_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                style={styles.checkItem}
                onPress={() => {
                  setChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }));
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={styles.checkItemLeft}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.raw.zinc400} />
                  <Text style={styles.checkItemLabel}>{item.label}</Text>
                </View>
                <Switch
                  value={checklist[item.key]}
                  onValueChange={(val) => setChecklist((prev) => ({ ...prev, [item.key]: val }))}
                  trackColor={{ false: Colors.raw.zinc700, true: Colors.raw.emerald500 }}
                  thumbColor={Colors.raw.white}
                />
              </Pressable>
            ))}

            <Text style={styles.notesLabel}>Besonderheiten / Notizen</Text>
            <TextInput
              style={styles.notesInput}
              value={checklist.besonderheiten}
              onChangeText={(text) => setChecklist((prev) => ({ ...prev, besonderheiten: text }))}
              placeholder="z.B. Zugang nur Mo-Fr 7-16 Uhr, Hund im Garten..."
              placeholderTextColor={Colors.raw.zinc600}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.notesLabel}>Allgemeine Notizen</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Weitere Anmerkungen zur Baustelle..."
              placeholderTextColor={Colors.raw.zinc600}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* ============ STEP 3: SUMMARY ============ */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Zusammenfassung</Text>
            <Text style={styles.stepDesc}>Prüfen Sie Ihre Aufnahme und schließen Sie ab.</Text>

            <View style={styles.summaryCard}>
              <SummaryRow
                icon="mic"
                label="Audio-Aufnahme"
                value={audioStoragePath ? formatDuration(audioDurationMs) : "Keine Aufnahme"}
                ok={!!audioStoragePath}
              />
              <SummaryRow
                icon="camera"
                label="Fotos"
                value={`${photoCount} Foto${photoCount !== 1 ? "s" : ""}`}
                ok={photoCount > 0}
              />
              <SummaryRow
                icon="checkbox"
                label="Checkliste"
                value={`${CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length}/${CHECKLIST_ITEMS.length} geprüft`}
                ok={CHECKLIST_ITEMS.some((i) => checklist[i.key])}
              />
              <SummaryRow
                icon="document-text"
                label="Notizen"
                value={notes || checklist.besonderheiten ? "Vorhanden" : "Keine"}
                ok={!!(notes || checklist.besonderheiten)}
              />
            </View>

            <Pressable
              onPress={handleComplete}
              disabled={completing}
              style={({ pressed }) => [
                styles.completeBtn,
                { opacity: pressed || completing ? 0.7 : 1 },
              ]}
            >
              {completing ? (
                <ActivityIndicator color={Colors.raw.zinc950} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={Colors.raw.zinc950} />
                  <Text style={styles.completeBtnText}>Aufnahme abschließen</Text>
                </>
              )}
            </Pressable>

            <Text style={styles.completeHint}>
              Nach dem Abschließen wird die Audio-Aufnahme automatisch transkribiert.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom navigation */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={goPrev}
          disabled={!canGoPrev}
          style={({ pressed }) => [styles.navBtn, { opacity: !canGoPrev ? 0.3 : pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.raw.white} />
          <Text style={styles.navBtnText}>Zurück</Text>
        </Pressable>

        <View style={styles.dotRow}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.navDot, i === step && styles.navDotActive]} />
          ))}
        </View>

        {step < STEPS.length - 1 ? (
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [styles.navBtn, styles.navBtnNext, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.navBtnTextNext}>Weiter</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.raw.zinc950} />
          </Pressable>
        ) : (
          <View style={{ width: 90 }} />
        )}
      </View>
    </View>
  );
}

// --- Summary Row ---
function SummaryRow({
  icon,
  label,
  value,
  ok,
}: {
  icon: string;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryRowLeft}>
        <Ionicons name={icon as any} size={20} color={ok ? Colors.raw.emerald500 : Colors.raw.zinc500} />
        <Text style={styles.summaryRowLabel}>{label}</Text>
      </View>
      <Text style={[styles.summaryRowValue, { color: ok ? Colors.raw.emerald500 : Colors.raw.zinc500 }]}>
        {value}
      </Text>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.raw.white,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stepItem: {
    alignItems: "center",
    gap: 4,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.raw.zinc700,
  },
  stepDotActive: {
    backgroundColor: Colors.raw.amber500,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepDotDone: {
    backgroundColor: Colors.raw.emerald500,
  },
  stepLabel: {
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  stepLabelActive: {
    color: Colors.raw.amber500,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.raw.white,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.raw.zinc400,
    lineHeight: 20,
  },

  // Audio
  timerText: {
    fontSize: 48,
    fontWeight: "300",
    color: Colors.raw.white,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    marginTop: 20,
  },
  recordControls: {
    alignItems: "center",
    gap: 16,
    marginTop: 20,
  },
  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.raw.rose500,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.raw.rose500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.raw.zinc700,
    alignItems: "center",
    justifyContent: "center",
  },
  stopBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.raw.rose500,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingHint: {
    fontSize: 14,
    color: Colors.raw.rose400,
    fontWeight: "500",
  },
  audioDone: {
    alignItems: "center",
    gap: 16,
    marginTop: 20,
  },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uploadingText: {
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  audioDoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioDoneText: {
    fontSize: 15,
    color: Colors.raw.white,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
  },
  retakeBtnText: {
    fontSize: 14,
    color: Colors.raw.amber500,
    fontWeight: "500",
  },

  // Photos
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.raw.amber500,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 52,
  },
  photoBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.raw.zinc950,
  },
  photoCountText: {
    fontSize: 14,
    color: Colors.raw.zinc400,
    textAlign: "center",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  photoThumb: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.raw.zinc800,
  },
  photoThumbImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoThumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Checklist
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 52,
  },
  checkItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkItemLabel: {
    fontSize: 15,
    color: Colors.raw.white,
  },
  notesLabel: {
    fontSize: 13,
    color: Colors.raw.zinc400,
    fontWeight: "600",
    marginTop: 8,
  },
  notesInput: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 10,
    padding: 14,
    color: Colors.raw.white,
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  summaryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  summaryRowLabel: {
    fontSize: 15,
    color: Colors.raw.white,
  },
  summaryRowValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.raw.emerald500,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    minHeight: 56,
  },
  completeBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.raw.zinc950,
  },
  completeHint: {
    fontSize: 12,
    color: Colors.raw.zinc500,
    textAlign: "center",
    lineHeight: 18,
  },

  // Bottom nav
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    backgroundColor: Colors.raw.zinc950,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 90,
  },
  navBtnNext: {
    backgroundColor: Colors.raw.amber500,
    justifyContent: "center",
  },
  navBtnText: {
    fontSize: 14,
    color: Colors.raw.white,
    fontWeight: "500",
  },
  navBtnTextNext: {
    fontSize: 14,
    color: Colors.raw.zinc950,
    fontWeight: "600",
  },
  dotRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  navDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.raw.zinc700,
  },
  navDotActive: {
    backgroundColor: Colors.raw.amber500,
  },
});
