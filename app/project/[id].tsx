import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  Modal,
  Image,
  useWindowDimensions,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import Colors from "@/constants/colors";
import { ScreenState } from "@/components/ScreenState";
import { supabase } from "@/lib/supabase";
import { mapDbStatus, type ProjectStatus } from "@/lib/status";
import { captureAndUploadPhoto } from "@/lib/photo-capture";
import { useOffline } from "@/contexts/OfflineContext";
import { useProjectDetail } from "@/hooks/queries/useProjectDetail";
import { SkeletonBox, SkeletonLine } from "@/components/Skeleton";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Alert that works on web too
function showAlert(title: string, msg?: string) {
  if (Platform.OS === "web") {
    window.alert(msg ? `${title}: ${msg}` : title);
  } else {
    Alert.alert(title, msg);
  }
}

// Sanitize filename for Supabase Storage (no spaces, no special chars)
function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/[ß]/g, "ss")
    .replace(/\s+/g, "_")       // spaces → underscores
    .replace(/[^a-zA-Z0-9._-]/g, ""); // remove everything else
}

// --- Types ---

interface OfferData {
  id: string;
  offer_number: string;
  total_net: number | null;
  status: string | null;
  pdf_storage_path: string | null;
  internal_notes: string | null;
}

interface InspectionData {
  id: string;
  protocol_type: string;
  status: string | null;
  inspection_date: string;
  finalized_at: string | null;
  created_at: string;
  pdf_storage_path: string | null;
  offer_id: string | null;
  catalog_label: string | null;
}

interface SagaOrderData {
  id: string;
  external_ref: string | null;
  address: string | null;
  pdf_url: string | null;
  pdf_file_url: string | null;
  status: string | null;
  created_at: string;
}

interface MessageData {
  id: string;
  message_type: string;
  text: string | null;
  sender_id: string | null;
  created_at: string;
}

// --- Reusable Components ---

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[qaStyles.container, animStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
      }}
    >
      <View style={qaStyles.circle}>{icon}</View>
      <Text style={qaStyles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const qaStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 64,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc400,
    textAlign: "center",
  },
});

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 20,
    marginBottom: 16,
  },
});

function SectionHeader({
  title,
  badge,
  rightIcon,
  onRightPress,
}: {
  title: string;
  badge?: string;
  rightIcon?: string;
  onRightPress?: () => void;
}) {
  return (
    <View style={shStyles.row}>
      <View style={shStyles.left}>
        <Text style={shStyles.title}>{title}</Text>
        {badge && (
          <View style={shStyles.badge}>
            <Text style={shStyles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      {rightIcon && (
        <Pressable
          onPress={onRightPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name={rightIcon as any} size={22} color={Colors.raw.zinc500} />
        </Pressable>
      )}
    </View>
  );
}

const shStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  badge: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#000",
  },
});

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { color: string; label: string }> = {
  kritisch: { color: Colors.raw.rose500, label: "Kritisch" },
  achtung: { color: Colors.raw.amber500, label: "Achtung" },
  laeuft: { color: Colors.raw.emerald500, label: "Läuft" },
  fertig: { color: Colors.raw.zinc500, label: "Fertig" },
};

const DB_STATUS_LABEL: Record<string, string> = {
  INTAKE: "Eingang",
  DRAFT: "Entwurf",
  ACTIVE: "Aktiv",
  INSPECTION: "Erstbegehung",
  PLANNING: "Planung",
  IN_PROGRESS: "In Arbeit",
  COMPLETION: "Abnahme",
  BILLING: "Abrechnung",
  ON_HOLD: "Pausiert",
  COMPLETED: "Fertig",
  CANCELLED: "Storniert",
  ARCHIVED: "Archiviert",
};

type BegehungStatus = "erledigt" | "geplant" | "offen";

const BEGEHUNG_CONFIG: Record<BegehungStatus, { dot: string; label: string }> = {
  erledigt: { dot: Colors.raw.emerald500, label: "erledigt" },
  geplant: { dot: Colors.raw.amber500, label: "geplant" },
  offen: { dot: Colors.raw.zinc600, label: "nicht geplant" },
};

function mapInspectionStatus(status: string | null, finalizedAt: string | null): BegehungStatus {
  if (finalizedAt) return "erledigt";
  if (status === "completed") return "erledigt";
  if (status === "in_progress") return "geplant";
  return "offen";
}

function mapBegehungType(type: string): string {
  const map: Record<string, string> = {
    erstbegehung: "Erstbegehung",
    zwischenbegehung: "Zwischenbegehung",
    abnahme: "Abnahme",
  };
  return map[type.toLowerCase()] || type;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function BegehungRow({ name, status, date, projectId, protocolId, catalogLabel, indent }: { name: string; status: BegehungStatus; date: string; projectId: string; protocolId?: string; catalogLabel?: string | null; indent?: boolean }) {
  const cfg = BEGEHUNG_CONFIG[status];
  const typeMap: Record<string, string> = {
    Erstbegehung: "erstbegehung",
    Zwischenbegehung: "zwischenbegehung",
    Abnahme: "abnahme",
  };
  const baseName = name.split(" ")[0]; // "Erstbegehung" from "Erstbegehung AV"
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const params: any = { type: typeMap[baseName] || "zwischenbegehung", projectId };
    if (protocolId) params.protocolId = protocolId;
    router.push({ pathname: "/begehung/[type]", params });
  };
  const catalogBadgeColor = catalogLabel === "WABS" ? Colors.raw.amber500 : catalogLabel === "AV" ? "#6366f1" : Colors.raw.zinc600;
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [bgStyles.row, { opacity: pressed ? 0.8 : 1, marginLeft: indent ? 24 : 0 }]}
    >
      <View style={bgStyles.left}>
        {indent && <View style={{ width: 2, height: 20, backgroundColor: Colors.raw.zinc700, marginRight: 8 }} />}
        <View style={[bgStyles.dot, { backgroundColor: cfg.dot }]} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={bgStyles.name}>{baseName}</Text>
            {catalogLabel && (
              <View style={{ backgroundColor: catalogBadgeColor, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{catalogLabel}</Text>
              </View>
            )}
          </View>
          <Text style={bgStyles.meta}>
            {date ? `${date} \u2022 ` : ""}
            {cfg.label}
          </Text>
        </View>
      </View>
      {status === "erledigt" && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.raw.emerald500} />
      )}
      {status === "geplant" && (
        <View style={bgStyles.startBtn}>
          <Text style={bgStyles.startText}>Starten</Text>
        </View>
      )}
      {status === "offen" && (
        <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
      )}
    </Pressable>
  );
}

function NextBegehungPrompt({ type, catalogLabel, projectId, offerId }: { type: string; catalogLabel: string; projectId: string; offerId?: string }) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const params: any = { type, projectId };
    if (offerId) params.offerId = offerId;
    router.push({ pathname: "/begehung/[type]", params });
  };
  const typeLabel =
    type === "erstbegehung" ? "Erstbegehung" :
    type === "zwischenbegehung" ? "Zwischenbegehung" : "Abnahme";
  const marginLeft = type === "abnahme" ? 48 : type === "zwischenbegehung" ? 24 : 0;
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        marginLeft,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: Colors.raw.zinc900,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.raw.amber500 + "40",
        marginTop: 4,
        marginBottom: 4,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: Colors.raw.amber500, fontSize: 13, fontWeight: "600" }}>
        {typeLabel}{catalogLabel ? ` ${catalogLabel}` : ""} starten
      </Text>
      <Text style={{ color: Colors.raw.zinc400, fontSize: 12, marginTop: 2 }}>
        Möchtest du die {typeLabel} jetzt machen?
      </Text>
    </Pressable>
  );
}

const bgStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  meta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  startBtn: {
    backgroundColor: Colors.raw.amber500 + "18",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
});

function DocumentRow({
  name,
  subtitle,
  storagePath,
  externalUrl,
  icon,
  onPress,
  rightIcon,
  onLongPress,
}: {
  name: string;
  subtitle?: string;
  storagePath?: string | null;
  externalUrl?: string | null;
  icon?: string;
  onPress?: () => void;
  rightIcon?: "navigate" | "download";
  onLongPress?: () => void;
}) {
  const hasPdf = !!storagePath || !!externalUrl;
  const isClickable = !!onPress || hasPdf;

  const handlePress = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
      return;
    }
    if (externalUrl) {
      Linking.openURL(externalUrl);
      return;
    }
    if (!storagePath) return;
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storagePath, 300);
    if (data?.signedUrl) {
      Linking.openURL(data.signedUrl);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={!isClickable}
      style={({ pressed }) => [
        docStyles.row,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons
        name={(icon as any) || "document-text"}
        size={20}
        color={isClickable ? Colors.raw.amber500 : Colors.raw.zinc700}
      />
      <View style={docStyles.textCol}>
        <Text style={[docStyles.name, !isClickable && { color: Colors.raw.zinc600 }]}>{name}</Text>
        {subtitle && <Text style={docStyles.subtitle}>{subtitle}</Text>}
      </View>
      {rightIcon === "navigate" ? (
        <Feather name="chevron-right" size={16} color={Colors.raw.zinc500} />
      ) : hasPdf ? (
        <Feather name="download" size={16} color={Colors.raw.amber500} />
      ) : !onPress ? (
        <Text style={docStyles.noPdf}>Kein PDF</Text>
      ) : null}
    </Pressable>
  );
}

const docStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  textCol: {
    flex: 1,
  },
  name: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc300,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
    marginTop: 2,
  },
  noPdf: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc700,
  },
});

// --- Document Manager Modal ---

interface FolderData {
  id: string;
  name: string;
  file_count: number;
}

interface FileData {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  storage_path: string;
  folder_id: string | null;
  created_at: string;
}

function DocumentManagerModal({
  projectId,
  visible,
  onClose,
  offers,
  inspections,
  sagaOrders,
}: {
  projectId: string;
  visible: boolean;
  onClose: () => void;
  offers: OfferData[];
  inspections: InspectionData[];
  sagaOrders: SagaOrderData[];
}) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 20 : insets.top;
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const filesOffsetRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dropContainerRef = useRef<View>(null);

  // Drag & Drop Upload (Web)
  const handleDrop = useCallback(async (droppedFiles: File[]) => {
    if (!droppedFiles.length) return;
    setUploading(true);
    setDragOver(false);
    try {
      for (const file of droppedFiles) {
        const ts = Date.now();
        const storagePath = `documents/${projectId}/${ts}_${sanitizeFileName(file.name)}`;
        console.log("[Upload] Drag&Drop uploading:", file.name, "to", storagePath, "folder:", activeFolder);
        const { error: uploadErr } = await supabase.storage
          .from("project-files")
          .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });
        if (uploadErr) { console.error("[Upload] Storage error:", uploadErr); showAlert("Upload-Fehler", uploadErr.message); continue; }

        const fileType = file.type?.startsWith("image/") ? "photo" : file.type === "application/pdf" ? "pdf" : "document";
        const { error: dbErr } = await supabase.from("project_files").insert({
          project_id: projectId,
          file_type: fileType,
          file_name: file.name,
          mime_type: file.type,
          file_size_bytes: file.size,
          storage_path: storagePath,
          folder_id: activeFolder,
        });
        if (dbErr) { console.error("[Upload] DB insert error:", dbErr); showAlert("DB-Fehler", dbErr.message); continue; }
        console.log("[Upload] Success:", file.name);
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchData();
    } catch (err: any) {
      console.error("[Upload] Catch error:", err);
      showAlert("Fehler", err.message || "Upload fehlgeschlagen");
    }
    setUploading(false);
  }, [projectId, activeFolder]);

  // Native DOM event listeners for drag & drop on web
  useEffect(() => {
    if (Platform.OS !== "web" || !visible) return;

    let target: HTMLElement | null = null;
    let cleanup: (() => void) | null = null;

    const attach = () => {
      target = document.querySelector('[data-dropzone="doc-manager"]') as HTMLElement | null;
      if (!target) return;

      const onDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
      const onDragLeave = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        // Only hide overlay when actually leaving the container
        const related = e.relatedTarget as HTMLElement | null;
        if (!related || !target?.contains(related)) setDragOver(false);
      };
      const onDropHandler = (e: DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        const dt = e.dataTransfer;
        if (dt?.files?.length) handleDrop(Array.from(dt.files));
      };

      target.addEventListener("dragover", onDragOver);
      target.addEventListener("dragleave", onDragLeave);
      target.addEventListener("drop", onDropHandler);

      cleanup = () => {
        target?.removeEventListener("dragover", onDragOver);
        target?.removeEventListener("dragleave", onDragLeave);
        target?.removeEventListener("drop", onDropHandler);
      };
    };

    // Modal may not be in DOM yet — retry briefly
    const timer = setTimeout(attach, 100);
    const timer2 = setTimeout(() => { if (!target) attach(); }, 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      cleanup?.();
    };
  }, [visible, handleDrop]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [foldersRes, filesRes] = await Promise.all([
      supabase
        .from("project_folders")
        .select("id, name")
        .eq("project_id", projectId)
        .order("sort_order")
        .order("name"),
      supabase
        .from("project_files")
        .select("id, file_name, mime_type, file_size_bytes, storage_path, folder_id, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);

    const allFiles = filesRes.data || [];
    const foldersWithCount = (foldersRes.data || []).map((f: any) => ({
      ...f,
      file_count: allFiles.filter((file: any) => file.folder_id === f.id).length,
    }));

    setFolders(foldersWithCount);
    setFiles(allFiles);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (visible) fetchData();
  }, [visible, fetchData]);

  const createFolder = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from("project_folders")
      .insert({ project_id: projectId, name: trimmed });
    if (error) {
      Alert.alert("Fehler", error.message.includes("unique") ? "Ordnername existiert bereits" : error.message);
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewFolderName("");
    setShowNewFolder(false);
    fetchData();
  };

  const deleteFolder = (folderId: string, folderName: string) => {
    if (Platform.OS === "web") {
      if (!window.confirm(`"${folderName}" wirklich löschen? Dateien werden nicht gelöscht.`)) return;
      supabase.from("project_folders").delete().eq("id", folderId).then(() => {
        if (activeFolder === folderId) setActiveFolder(null);
        fetchData();
      });
    } else {
      Alert.alert(
        "Ordner löschen",
        `"${folderName}" wirklich löschen? Dateien werden nicht gelöscht.`,
        [
          { text: "Abbrechen", style: "cancel" },
          {
            text: "Löschen",
            style: "destructive",
            onPress: async () => {
              await supabase.from("project_folders").delete().eq("id", folderId);
              if (activeFolder === folderId) setActiveFolder(null);
              fetchData();
            },
          },
        ]
      );
    }
  };

  const pickAndUploadFile = async () => {
    setUploading(true);
    try {
      if (Platform.OS === "web") {
        const file = await new Promise<File | null>((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*,application/pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx";
          input.style.display = "none";
          document.body.appendChild(input);
          input.addEventListener("change", () => {
            resolve(input.files?.[0] || null);
            document.body.removeChild(input);
          });
          input.addEventListener("cancel", () => {
            resolve(null);
            document.body.removeChild(input);
          });
          input.click();
        });
        if (!file) { setUploading(false); return; }

        const ts = Date.now();
        const storagePath = `documents/${projectId}/${ts}_${sanitizeFileName(file.name)}`;
        console.log("[Upload] Picker uploading:", file.name, "size:", file.size, "type:", file.type, "to folder:", activeFolder);

        const { error: uploadErr } = await supabase.storage
          .from("project-files")
          .upload(storagePath, file, { contentType: file.type || "application/octet-stream" });
        if (uploadErr) {
          console.error("[Upload] Storage error:", uploadErr);
          showAlert("Upload-Fehler", uploadErr.message);
          setUploading(false);
          return;
        }
        console.log("[Upload] Storage OK, inserting DB record...");

        const fileType = file.type?.startsWith("image/") ? "photo" : file.type === "application/pdf" ? "pdf" : "document";
        const { error: dbErr } = await supabase.from("project_files").insert({
          project_id: projectId,
          file_type: fileType,
          file_name: file.name,
          mime_type: file.type,
          file_size_bytes: file.size,
          storage_path: storagePath,
          folder_id: activeFolder,
        });
        if (dbErr) {
          console.error("[Upload] DB insert error:", dbErr);
          showAlert("DB-Fehler", dbErr.message);
          setUploading(false);
          return;
        }
        console.log("[Upload] DB OK. Done!");
      } else {
        const ImagePicker = require("expo-image-picker");
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          base64: true,
        });
        if (result.canceled || !result.assets?.length) { setUploading(false); return; }

        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        const storagePath = `documents/${projectId}/${Date.now()}_${sanitizeFileName(fileName)}`;
        const base64 = asset.base64;
        if (!base64) { setUploading(false); return; }

        const { decode } = require("base64-arraybuffer");
        const { error: uploadErr } = await supabase.storage
          .from("project-files")
          .upload(storagePath, decode(base64), { contentType: "image/jpeg" });
        if (uploadErr) { showAlert("Upload-Fehler", uploadErr.message); setUploading(false); return; }

        const { error: dbErr } = await supabase.from("project_files").insert({
          project_id: projectId,
          file_type: "photo",
          file_name: fileName,
          mime_type: "image/jpeg",
          file_size_bytes: Math.round(base64.length * 0.75),
          storage_path: storagePath,
          folder_id: activeFolder,
        });
        if (dbErr) { showAlert("DB-Fehler", dbErr.message); setUploading(false); return; }
      }

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchData();
    } catch (err: any) {
      console.error("[Upload] Catch error:", err);
      showAlert("Fehler", err.message || "Upload fehlgeschlagen");
    }
    setUploading(false);
  };

  const capturePhoto = async () => {
    setUploading(true);
    try {
      let storagePath: string;
      let fileName: string;
      let fileSize = 0;

      if (Platform.OS === "web") {
        const file = await new Promise<File | null>((resolve) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.capture = "environment";
          input.style.display = "none";
          document.body.appendChild(input);
          input.addEventListener("change", () => { resolve(input.files?.[0] || null); document.body.removeChild(input); });
          input.addEventListener("cancel", () => { resolve(null); document.body.removeChild(input); });
          input.click();
        });
        if (!file) { setUploading(false); return; }
        fileName = file.name || `foto_${Date.now()}.jpg`;
        storagePath = `documents/${projectId}/${Date.now()}_${sanitizeFileName(fileName)}`;
        fileSize = file.size;
        const { error: uploadErr } = await supabase.storage
          .from("project-files")
          .upload(storagePath, file, { contentType: file.type || "image/jpeg" });
        if (uploadErr) { console.error("[CapturePhoto] Storage error:", uploadErr); showAlert("Fehler", uploadErr.message); setUploading(false); return; }
      } else {
        const ImagePicker = require("expo-image-picker");
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") { showAlert("Kamera-Zugriff benötigt"); setUploading(false); return; }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
        if (result.canceled || !result.assets?.length) { setUploading(false); return; }
        const base64 = result.assets[0].base64;
        if (!base64) { setUploading(false); return; }
        fileName = `foto_${Date.now()}.jpg`;
        storagePath = `documents/${projectId}/${Date.now()}_${sanitizeFileName(fileName)}`;
        fileSize = Math.round(base64.length * 0.75);
        const { decode } = require("base64-arraybuffer");
        const { error: uploadErr } = await supabase.storage
          .from("project-files")
          .upload(storagePath, decode(base64), { contentType: "image/jpeg" });
        if (uploadErr) { console.error("[CapturePhoto] Storage error:", uploadErr); showAlert("Fehler", uploadErr.message); setUploading(false); return; }
      }

      console.log("[CapturePhoto] Storage OK, inserting DB...");
      const { error: dbErr } = await supabase.from("project_files").insert({
        project_id: projectId,
        file_type: "photo",
        file_name: fileName,
        mime_type: "image/jpeg",
        file_size_bytes: fileSize,
        storage_path: storagePath,
        folder_id: activeFolder,
      });
      if (dbErr) { console.error("[CapturePhoto] DB error:", dbErr); showAlert("DB-Fehler", dbErr.message); setUploading(false); return; }

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchData();
    } catch (err: any) {
      console.error("[CapturePhoto] Catch error:", err);
      showAlert("Fehler", err.message);
    }
    setUploading(false);
  };

  const openFile = async (file: FileData) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { data } = await supabase.storage.from("project-files").createSignedUrl(file.storage_path, 300);
    if (data?.signedUrl) Linking.openURL(data.signedUrl);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
    return `${bytes} B`;
  };

  const visibleFiles = activeFolder
    ? files.filter((f) => f.folder_id === activeFolder)
    : files;

  const autoDocCount = sagaOrders.length + offers.length + inspections.filter((i) => i.finalized_at || i.status === "completed").length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        ref={dropContainerRef}
        style={[dmStyles.container, dragOver && dmStyles.dragOverContainer]}
        {...(Platform.OS === "web" ? { dataSet: { dropzone: "doc-manager" } } : {})}
      >
        {dragOver && (
          <View style={dmStyles.dragOverlay}>
            <Ionicons name="cloud-upload-outline" size={48} color={Colors.raw.amber500} />
            <Text style={dmStyles.dragOverlayText}>Dateien hier ablegen</Text>
            <Text style={dmStyles.dragOverlayHint}>PDF, Bilder, Aufmaß, Pläne...</Text>
          </View>
        )}
        <View style={[dmStyles.header, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={onClose} style={dmStyles.headerBtn}>
            <Ionicons name="close" size={24} color={Colors.raw.white} />
          </Pressable>
          <Text style={dmStyles.headerTitle}>Dokumente</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={capturePhoto}
              disabled={uploading}
              style={({ pressed }) => [dmStyles.headerAction, { opacity: pressed || uploading ? 0.6 : 1 }]}
            >
              <Ionicons name="camera" size={20} color={Colors.raw.amber500} />
            </Pressable>
            <Pressable
              onPress={pickAndUploadFile}
              disabled={uploading}
              style={({ pressed }) => [dmStyles.headerAction, { opacity: pressed || uploading ? 0.6 : 1 }]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={Colors.raw.amber500} />
              ) : (
                <Ionicons name="cloud-upload" size={20} color={Colors.raw.amber500} />
              )}
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={dmStyles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.raw.amber500} />
          </View>
        ) : (
          <ScrollView ref={scrollRef} style={dmStyles.scroll} contentContainerStyle={dmStyles.scrollContent}>
            {/* Auto-generated docs */}
            {autoDocCount > 0 && (
              <View style={dmStyles.section}>
                <Text style={dmStyles.sectionTitle}>Automatische Dokumente</Text>
                {sagaOrders.map((order) => (
                  <DocumentRow
                    key={`order-${order.id}`}
                    name={`Auftrag ${order.external_ref || "—"}`}
                    subtitle={order.address || undefined}
                    externalUrl={order.pdf_file_url || order.pdf_url}
                    icon="briefcase"
                  />
                ))}
                {offers.map((offer) => (
                  <DocumentRow
                    key={offer.offer_number}
                    name={`Angebot ${offer.offer_number}`}
                    subtitle={`${offer.status === "ACCEPTED" ? "Angenommen" : offer.status === "DRAFT" ? "Entwurf" : offer.status ?? "—"}${offer.total_net ? ` · €${Number(offer.total_net).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ""}`}
                    onPress={() => router.push({ pathname: "/angebot/editor", params: { offerId: offer.id } })}
                    onLongPress={() => handleDeleteOffer(offer.id, offer.offer_number)}
                    rightIcon="navigate"
                    icon="document-text"
                  />
                ))}
                {inspections
                  .filter((i) => i.finalized_at || i.status === "completed")
                  .map((ins) => (
                    <DocumentRow
                      key={`proto-${ins.id}`}
                      name={`Protokoll ${ins.protocol_type}`}
                      subtitle={ins.finalized_at ? new Date(ins.finalized_at).toLocaleDateString("de-DE") : undefined}
                      storagePath={ins.pdf_storage_path}
                      icon="clipboard"
                    />
                  ))}
              </View>
            )}

            {/* Folders - Grid Layout */}
            <View style={dmStyles.section}>
              <View style={dmStyles.sectionHeader}>
                <Text style={dmStyles.sectionTitle}>Ordner</Text>
                <Pressable
                  onPress={() => setShowNewFolder(true)}
                  style={({ pressed }) => [dmStyles.addFolderBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Ionicons name="add" size={18} color={Colors.raw.amber500} />
                  <Text style={dmStyles.addFolderText}>Neu</Text>
                </Pressable>
              </View>

              {showNewFolder && (
                <View style={dmStyles.newFolderRow}>
                  <TextInput
                    style={dmStyles.newFolderInput}
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    placeholder="Ordnername..."
                    placeholderTextColor={Colors.raw.zinc600}
                    autoFocus
                    onSubmitEditing={createFolder}
                  />
                  <Pressable onPress={createFolder} style={dmStyles.newFolderSave}>
                    <Ionicons name="checkmark" size={20} color="#000" />
                  </Pressable>
                  <Pressable onPress={() => { setShowNewFolder(false); setNewFolderName(""); }} style={dmStyles.newFolderCancel}>
                    <Ionicons name="close" size={20} color={Colors.raw.zinc400} />
                  </Pressable>
                </View>
              )}

              {/* 3-Column Grid */}
              <View style={dmStyles.folderGrid}>
                {/* "Alle Dateien" tile */}
                <Pressable
                  onPress={() => { setActiveFolder(null); setOpenFolderId("__all__"); }}
                  style={({ pressed }) => [dmStyles.folderTile, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <Ionicons name="folder" size={64} color={files.length > 0 ? "#22c55e" : "#a855f7"} />
                  <Text style={dmStyles.folderTileName} numberOfLines={2}>Alle Dateien</Text>
                </Pressable>

                {/* Folder tiles */}
                {folders.map((folder) => (
                  <Pressable
                    key={folder.id}
                    onPress={() => { setActiveFolder(folder.id); setOpenFolderId(folder.id); }}
                    onLongPress={() => deleteFolder(folder.id, folder.name)}
                    style={({ pressed }) => [dmStyles.folderTile, { opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Ionicons name="folder" size={64} color={folder.file_count > 0 ? "#22c55e" : "#a855f7"} />
                    <Text style={dmStyles.folderTileName} numberOfLines={2}>{folder.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Bottom Sheet for Folder Contents */}
        <Modal
            visible={!!openFolderId}
            transparent
            animationType="slide"
            onRequestClose={() => setOpenFolderId(null)}
          >
            <Pressable style={dmStyles.sheetOverlay} onPress={() => setOpenFolderId(null)}>
              <Pressable style={dmStyles.sheetContent} onPress={(e) => e.stopPropagation()}>
                <View style={dmStyles.sheetHandle} />
                <View style={dmStyles.sheetHeader}>
                  <Text style={dmStyles.sheetTitle}>
                    {openFolderId === "__all__" ? "Alle Dateien" : folders.find(f => f.id === openFolderId)?.name || "Ordner"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => { pickAndUploadFile(); }}
                      disabled={uploading}
                      style={({ pressed }) => [dmStyles.sheetAction, { opacity: pressed || uploading ? 0.6 : 1 }]}
                    >
                      {uploading ? (
                        <ActivityIndicator size="small" color={Colors.raw.amber500} />
                      ) : (
                        <Ionicons name="cloud-upload" size={20} color={Colors.raw.amber500} />
                      )}
                    </Pressable>
                    <Pressable onPress={() => setOpenFolderId(null)} style={dmStyles.sheetClose}>
                      <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
                    </Pressable>
                  </View>
                </View>

                <ScrollView style={dmStyles.sheetScroll} contentContainerStyle={dmStyles.sheetScrollContent}>
                  {(() => {
                    const sheetFiles = openFolderId === "__all__"
                      ? files
                      : files.filter(f => f.folder_id === openFolderId);

                    if (sheetFiles.length === 0) {
                      return (
                        <Pressable onPress={pickAndUploadFile} disabled={uploading} style={dmStyles.emptyDropZoneSmall}>
                          <Ionicons name="cloud-upload-outline" size={32} color={Colors.raw.zinc600} />
                          <Text style={dmStyles.emptyText}>Ordner ist leer</Text>
                          <Text style={dmStyles.dropHint}>
                            {Platform.OS === "web" ? "Drag & Drop oder Klick" : "Tippen zum Hochladen"}
                          </Text>
                        </Pressable>
                      );
                    }

                    return sheetFiles.map((file) => (
                      <Pressable
                        key={file.id}
                        onPress={() => openFile(file)}
                        style={({ pressed }) => [dmStyles.fileRow, { opacity: pressed ? 0.8 : 1 }]}
                      >
                        <Ionicons
                          name={
                            file.mime_type?.startsWith("image/") ? "image" :
                            file.mime_type === "application/pdf" ? "document-text" : "document"
                          }
                          size={20}
                          color={Colors.raw.amber500}
                        />
                        <View style={dmStyles.fileInfo}>
                          <Text style={dmStyles.fileName} numberOfLines={1}>{file.file_name}</Text>
                          <Text style={dmStyles.fileMeta}>
                            {formatSize(file.file_size_bytes)}
                            {file.created_at ? ` · ${new Date(file.created_at).toLocaleDateString("de-DE")}` : ""}
                          </Text>
                        </View>
                        <Feather name="download" size={16} color={Colors.raw.zinc500} />
                      </Pressable>
                    ));
                  })()}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
      </View>
    </Modal>
  );
}

const dmStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  dragOverContainer: { borderWidth: 3, borderColor: Colors.raw.amber500, borderStyle: "dashed" as any },
  dragOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
    backgroundColor: Colors.raw.zinc950 + "F0",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  dragOverlayText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.amber500,
  },
  dragOverlayHint: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.raw.white },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.amber500 + "18",
    borderRadius: 10,
  },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.zinc300,
    marginBottom: 12,
  },
  addFolderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.raw.amber500 + "18",
    borderRadius: 8,
  },
  addFolderText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 },
  newFolderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  newFolderInput: {
    flex: 1,
    backgroundColor: Colors.raw.zinc900,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.white,
  },
  newFolderSave: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.amber500,
    borderRadius: 10,
  },
  newFolderCancel: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  folderActive: { backgroundColor: Colors.raw.amber500 + "10" },
  folderName: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.raw.zinc300 },
  folderBadge: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 10,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginRight: 4,
  },
  folderBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#000",
  },
  folderCountEmpty: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.raw.zinc700, marginRight: 4 },
  folderContent: {
    backgroundColor: Colors.raw.zinc900,
    marginLeft: 20,
    marginBottom: 4,
    borderLeftWidth: 2,
    borderLeftColor: Colors.raw.amber500 + "30",
    paddingLeft: 12,
  },
  emptyDropZoneSmall: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    borderStyle: "dashed" as any,
    borderRadius: 12,
    gap: 4,
    marginVertical: 8,
  },
  fileRowIndented: {
    paddingLeft: 4,
  },
  uploadInFolderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: Colors.raw.amber500 + "10",
  },
  uploadInlineBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  emptyDropZone: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    borderWidth: 2,
    borderColor: Colors.raw.zinc800,
    borderStyle: "dashed" as any,
    borderRadius: 16,
    gap: 6,
    marginTop: 8,
  },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc600, textAlign: "center" },
  dropHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc700, textAlign: "center" },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  fileInfo: { flex: 1 },
  fileName: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.raw.zinc300 },
  fileMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.raw.zinc600, marginTop: 2 },

  // Grid Layout
  folderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 8,
  },
  folderTile: {
    width: "30%",
    alignItems: "center",
    paddingVertical: 12,
  },
  folderTileName: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.raw.zinc300,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 14,
  },

  // Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.raw.zinc700,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  sheetTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  sheetAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.amber500 + "18",
    borderRadius: 10,
  },
  sheetClose: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
});

// --- Skeleton ---

function ProjektDetailSkeleton() {
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <SkeletonLine width="60%" />
      <SkeletonLine width="40%" />
      <SkeletonBox height={120} borderRadius={12} />
      <SkeletonBox height={120} borderRadius={12} />
      <SkeletonBox height={120} borderRadius={12} />
    </View>
  );
}

// --- Main Screen ---

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
    refetch: refetchProject,
  } = useProjectDetail(id);
  const [clientName, setClientName] = useState<string>("—");
  const [offers, setOffers] = useState<OfferData[]>([]);
  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [sagaOrders, setSagaOrders] = useState<SagaOrderData[]>([]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [totalCosts, setTotalCosts] = useState<number>(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [docFileCount, setDocFileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBegehungPicker, setShowBegehungPicker] = useState(false);
  const [begehungType, setBegehungType] = useState<string | null>(null);
  const [showOfferPicker, setShowOfferPicker] = useState(false);
  const [showAngebotPicker, setShowAngebotPicker] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showDocManager, setShowDocManager] = useState(false);
  const [autoPlanLoading, setAutoPlanLoading] = useState(false);
  const [pipelineRun, setPipelineRun] = useState<{ status: string; agents_completed: string[]; current_agent: string | null; completed_at: string | null } | null>(null);
  const { isOnline, addToSyncQueue } = useOffline();

  const handleCapturePhoto = useCallback(async () => {
    if (!id || photoUploading) return;
    setPhotoUploading(true);
    try {
      const result = await captureAndUploadPhoto({
        projectId: id,
        inspectionType: "erstbegehung",
        isOnline,
        queueOfflineUpload: ({ label, detail, data }) => {
          addToSyncQueue({ type: "photo", label, detail, data });
        },
      });
      if (result) {
        setPhotoCount((c) => c + 1);
        if (Platform.OS === "web") {
          window.alert(result.queued ? "Foto offline gespeichert. Upload folgt automatisch." : "Foto erfolgreich hochgeladen!");
        }
      }
    } finally {
      setPhotoUploading(false);
    }
  }, [id, photoUploading, isOnline, addToSyncQueue]);

  // ── Angebot löschen (Soft-Delete) ──
  const handleDeleteOffer = useCallback(async (offerId: string, offerNumber: string) => {
    const doDelete = async () => {
      try {
        const { error } = await supabase
          .from("offers")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", offerId);
        if (error) throw error;

        await supabase
          .from("offer_positions")
          .update({ deleted_at: new Date().toISOString() })
          .eq("offer_id", offerId)
          .is("deleted_at", null);

        setOffers(prev => prev.filter(o => o.id !== offerId));
      } catch (err: any) {
        if (Platform.OS === "web") {
          window.alert(err.message || "Angebot konnte nicht gelöscht werden");
        }
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Angebot ${offerNumber} wirklich löschen?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Angebot löschen",
        `Angebot ${offerNumber} wirklich löschen?`,
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Löschen", style: "destructive", onPress: doDelete },
        ]
      );
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const [offersRes, messagesRes, costsRes, inspectionsRes, photosCountRes, sagaOrdersRes, docFilesCountRes] = await Promise.all([
      supabase
        .from("offers")
        .select("id, offer_number, total_net, status, pdf_storage_path, internal_notes")
        .eq("project_id", id)
        .is("deleted_at", null),
      supabase
        .from("project_messages")
        .select("id, message_type, text, sender_id, created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("purchase_invoices")
        .select("total_net")
        .eq("project_id", id),
      supabase
        .from("inspection_protocols")
        .select("id, protocol_type, status, inspection_date, finalized_at, created_at, pdf_storage_path, offer_id, catalog_label")
        .eq("project_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("inspection_photos")
        .select("id", { count: "exact", head: true })
        .eq("project_id", id),
      supabase
        .from("saga_orders")
        .select("id, external_ref, address, pdf_url, pdf_file_url, status, created_at")
        .eq("project_id", id),
      supabase
        .from("project_files")
        .select("id", { count: "exact", head: true })
        .eq("project_id", id),
    ]);

    setOffers(offersRes.data ?? []);
    setMessages(messagesRes.data ?? []);
    setInspections(inspectionsRes.data ?? []);
    setSagaOrders(sagaOrdersRes.data ?? []);
    setPhotoCount(photosCountRes.count ?? 0);
    setDocFileCount(docFilesCountRes.count ?? 0);

    const costs = (costsRes.data ?? []).reduce((sum, inv) => sum + (Number(inv.total_net) || 0), 0);
    setTotalCosts(costs);

    // Pipeline-Status laden (letzte Autoplanung)
    const { data: lastRun } = await supabase
      .from("pipeline_runs")
      .select("status, agents_completed, current_agent, completed_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setPipelineRun(lastRun ?? null);

    setLoading(false);
  }, [id]);

  const handleAutoPlan = useCallback(async () => {
    if (!id || autoPlanLoading) return;
    setAutoPlanLoading(true);
    try {
      const { data: result, error } = await supabase.rpc("auto_plan_full", { p_project_id: id });
      if (error) {
        showAlert("Fehler", error.message);
        return;
      }
      const r = result as any;
      if (!r?.success) {
        showAlert("Fehler", r?.error || "Planung fehlgeschlagen");
        return;
      }
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const sched = r.schedule || {};
      const mat = r.material || {};
      const lines = [
        sched.phases_created ? `${sched.phases_created} Phasen` : null,
        mat.needs_created ? `${mat.needs_created} Material-Bedarfe` : null,
        "\nFreigaben im Freigabecenter prüfen.",
      ].filter(Boolean);
      showAlert("Planung erstellt", lines.join("\n"));
      void refetchProject();
      void fetchData();
    } catch (e: any) {
      showAlert("Fehler", e.message || "Auto-Planung fehlgeschlagen");
    } finally {
      setAutoPlanLoading(false);
    }
  }, [id, autoPlanLoading, refetchProject, fetchData]);

  useEffect(() => {
    const loadClientName = async () => {
      if (!project?.client_id) {
        setClientName("—");
        return;
      }

      const { data } = await supabase
        .from("clients")
        .select("company_name")
        .eq("id", project.client_id)
        .single();

      setClientName(data?.company_name || "—");
    };

    void loadClientName();
  }, [project?.client_id]);

  useFocusEffect(
    useCallback(() => {
      void refetchProject();
      void fetchData();
    }, [fetchData, refetchProject])
  );

  useEffect(() => {
    if (projectError) {
      setError(projectError instanceof Error ? projectError.message : "Projekt konnte nicht geladen werden.");
      setLoading(false);
    }
  }, [projectError]);

  if (loading || projectLoading) {
    return (
      <View style={styles.container}>
        <ScreenState kind="loading" skeleton={<ProjektDetailSkeleton />} />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.container}>
        <ScreenState
          kind="error"
          detail={error ?? "Projekt konnte nicht geladen werden"}
          onRetry={() => {
            void refetchProject();
            void fetchData();
          }}
        />
      </View>
    );
  }

  // Fortschritt dynamisch aus Begehungen ableiten (überschreibt DB-Wert)
  const ebDoneAll = inspections.some(
    (i) => i.protocol_type === "erstbegehung" && (i.finalized_at || i.status === "completed")
  );
  const zbDoneAll = inspections.some(
    (i) => i.protocol_type === "zwischenbegehung" && (i.finalized_at || i.status === "completed")
  );
  const abDoneAll = inspections.some(
    (i) => i.protocol_type === "abnahme" && (i.finalized_at || i.status === "completed")
  );
  const dynamicProgress = abDoneAll ? 100 : zbDoneAll ? 66 : ebDoneAll ? 33 : (project.progress_percent ?? 0);

  // Compute financials
  const angebotValue = offers.reduce((sum, o) => sum + (Number(o.total_net) || 0), 0);
  const ergebnisValue = angebotValue - totalCosts;
  const marginPercent = angebotValue > 0 ? Math.round((ergebnisValue / angebotValue) * 100) : 0;
  const marginColor = marginPercent >= 20 ? "#22C55E" : marginPercent >= 10 ? "#F59E0B" : "#EF4444";

  const addressLine = [
    project.object_street,
    project.object_floor,
  ].filter(Boolean).join("\n");

  const unreadMessages = messages.length;

  return (
    <View style={styles.container}>
      <View style={[styles.backRow, { paddingTop: topInset + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
        </Pressable>
        <Text style={styles.projectCode}>{project.project_number}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 64,
            paddingBottom: bottomInset + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroStatusRow}>
            {(() => {
              const mapped = mapDbStatus(project.status);
              const cfg = PROJECT_STATUS_CONFIG[mapped];
              return (
                <View style={[styles.heroStatusPill, { backgroundColor: cfg.color + "18" }]}>
                  <View style={[styles.heroStatusDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.heroStatusText, { color: cfg.color }]}>
                    {DB_STATUS_LABEL[project.status ?? ""] ?? cfg.label}
                  </Text>
                </View>
              );
            })()}
            {/* Planung starten: nur nach abgeschlossener Erstbegehung */}
            {(project.status === "PLANNING" || project.status === "ACTIVE") &&
              inspections.some((i) => i.protocol_type === "erstbegehung" && (i.finalized_at || i.status === "completed")) && (
              <Pressable
                onPress={handleAutoPlan}
                disabled={autoPlanLoading}
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: Colors.raw.amber500 + "18",
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    marginLeft: 8,
                  },
                  { opacity: autoPlanLoading ? 0.5 : pressed ? 0.7 : 1 },
                ]}
              >
                {autoPlanLoading ? (
                  <ActivityIndicator size="small" color={Colors.raw.amber500} />
                ) : (
                  <Ionicons name="flash" size={16} color={Colors.raw.amber500} />
                )}
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.raw.amber500 }}>
                  Planung starten
                </Text>
              </Pressable>
            )}
            {/* Pipeline-Status Badge */}
            {pipelineRun && (
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: pipelineRun.status === "completed" ? Colors.raw.emerald500 + "18" : pipelineRun.status === "running" ? Colors.raw.amber500 + "18" : Colors.raw.rose500 + "18",
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginLeft: 8,
              }}>
                <Ionicons
                  name={pipelineRun.status === "completed" ? "checkmark-circle" : pipelineRun.status === "running" ? "sync" : "alert-circle"}
                  size={14}
                  color={pipelineRun.status === "completed" ? Colors.raw.emerald500 : pipelineRun.status === "running" ? Colors.raw.amber500 : Colors.raw.rose500}
                />
                <Text style={{
                  fontFamily: "Inter_500Medium", fontSize: 11,
                  color: pipelineRun.status === "completed" ? Colors.raw.emerald500 : pipelineRun.status === "running" ? Colors.raw.amber500 : Colors.raw.rose500,
                }}>
                  {pipelineRun.status === "completed"
                    ? `${pipelineRun.agents_completed?.length ?? 0}/5 Agenten`
                    : pipelineRun.status === "running"
                    ? `${pipelineRun.current_agent ?? "..."}`
                    : "Pipeline gestoppt"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.heroAddress}>
            {addressLine || project.display_name || project.name}
          </Text>
          <Text style={styles.heroClient}>
            {clientName}
          </Text>
          {/* Katalog-Badges */}
          {project.price_catalog && (
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              {project.price_catalog.includes("WABS") && (
                <View style={{ backgroundColor: Colors.raw.amber500, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: "#000", fontSize: 11, fontWeight: "700" }}>WABS</Text>
                </View>
              )}
              {project.price_catalog.includes("AV") && (
                <View style={{ backgroundColor: "#6366f1", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>AV</Text>
                </View>
              )}
            </View>
          )}

          {/* Progress */}
          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${dynamicProgress}%`,
                    backgroundColor: PROJECT_STATUS_CONFIG[mapDbStatus(project.status)].color,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                { color: PROJECT_STATUS_CONFIG[mapDbStatus(project.status)].color },
              ]}
            >
              {dynamicProgress}%
            </Text>
          </View>

          {/* Zeitplan */}
          {(project.planned_start || project.planned_end) && (
            <View style={styles.zeitplanRow}>
              {project.planned_start && (
                <View style={styles.zeitplanItem}>
                  <Feather name="play-circle" size={14} color={Colors.raw.zinc500} />
                  <Text style={styles.zeitplanLabel}>Start</Text>
                  <Text style={styles.zeitplanDate}>{formatDate(project.planned_start)}</Text>
                </View>
              )}
              {project.planned_end && (
                <View style={styles.zeitplanItem}>
                  <Feather name="flag" size={14} color={Colors.raw.zinc500} />
                  <Text style={styles.zeitplanLabel}>Ende</Text>
                  <Text style={styles.zeitplanDate}>{formatDate(project.planned_end)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <SectionCard>
          <View style={styles.marginBreakdown}>
            <View style={styles.marginCol}>
              <Text style={styles.marginLabel}>Angebot</Text>
              <Text style={styles.marginValue}>
                {angebotValue > 0
                  ? `\u20AC${Math.round(angebotValue).toLocaleString("de-DE")}`
                  : "—"}
              </Text>
            </View>
            <View style={styles.marginCol}>
              <Text style={styles.marginLabel}>Marge</Text>
              <Text style={[styles.marginValueLarge, { color: angebotValue > 0 ? marginColor : Colors.raw.zinc500 }]}>
                {angebotValue > 0 ? `${marginPercent}%` : "—"}
              </Text>
            </View>
            <View style={styles.marginCol}>
              <Text style={styles.marginLabel}>Ergebnis</Text>
              <Text style={[styles.marginValue, { color: angebotValue > 0 ? marginColor : Colors.raw.zinc500 }]}>
                {angebotValue > 0
                  ? `\u20AC${Math.round(ergebnisValue).toLocaleString("de-DE")}`
                  : "—"}
              </Text>
            </View>
          </View>
        </SectionCard>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.qaRow}
          style={styles.qaScroll}
        >
          <QuickAction
            icon={<Ionicons name="document-text" size={24} color={Colors.raw.amber500} />}
            label="Angebot"
            onPress={() => {
              if (offers.length === 0) {
                router.push({ pathname: "/angebot/editor", params: { projectId: id || "" } });
              } else {
                setShowAngebotPicker(true);
              }
            }}
          />
          <QuickAction
            icon={<Ionicons name="clipboard" size={24} color={Colors.raw.amber500} />}
            label="Auftrag"
            onPress={() => router.push({ pathname: "/auftrag/[id]", params: { id: id || "1" } })}
          />
          <QuickAction
            icon={<MaterialCommunityIcons name="package-variant" size={24} color={Colors.raw.amber500} />}
            label="Material"
            onPress={() => router.push({ pathname: "/begehung/[type]", params: { type: "erstbegehung", tab: "material", projectId: id || "" } })}
          />
          <QuickAction
            icon={<Ionicons name="people" size={24} color={Colors.raw.amber500} />}
            label="Team"
            onPress={() => router.push("/project/team" as any)}
          />
          <QuickAction
            icon={<Ionicons name="camera" size={24} color={photoUploading ? Colors.raw.zinc600 : Colors.raw.amber500} />}
            label={photoUploading ? "Lädt..." : "Foto"}
            onPress={handleCapturePhoto}
          />
          <QuickAction
            icon={<Ionicons name="chatbubbles" size={24} color={Colors.raw.amber500} />}
            label="Chat"
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: id || "1" } })}
          />
        </ScrollView>

        {/* Begehungen */}
        <SectionCard>
          <View style={shStyles.row}>
            <Text style={shStyles.title}>Begehungen</Text>
            <Pressable
              onPress={() => setShowBegehungPicker(true)}
              style={({ pressed }) => [styles.begehungAddBtn, { opacity: pressed ? 0.7 : 1 }]}
              testID="begehung-add-btn"
            >
              <Ionicons name="add" size={18} color={Colors.raw.zinc950} />
            </Pressable>
          </View>
          {(() => {
            // Group inspections by offer_id
            const inspByOffer = new Map<string, InspectionData[]>();
            const noOfferInsps: InspectionData[] = [];
            inspections.forEach((ins) => {
              if (!ins.offer_id) { noOfferInsps.push(ins); return; }
              if (!inspByOffer.has(ins.offer_id)) inspByOffer.set(ins.offer_id, []);
              inspByOffer.get(ins.offer_id)!.push(ins);
            });

            // Wenn genau ein Angebot und Begehungen ohne offer_id → diesem Angebot zuweisen
            // (Begehungen die vor dem offer_id-Feature erstellt wurden)
            if (offers.length === 1 && noOfferInsps.length > 0 && inspByOffer.size === 0) {
              inspByOffer.set(offers[0].id, noOfferInsps);
              noOfferInsps.length = 0;
            }

            // Derive catalog label from offer internal_notes (e.g. "WABS · ..." or "AV-2024 · ...")
            const labelFromOffer = (offer: OfferData): string | null => {
              if (!offer.internal_notes) return null;
              const notes = offer.internal_notes.toUpperCase();
              if (notes.includes("WABS")) return "WABS";
              if (notes.includes("AV")) return "AV";
              return null;
            };

            const rows: React.ReactNode[] = [];

            // Loop through offers: show full cascade or EB prompt
            for (const offer of offers) {
              const groupIns = inspByOffer.get(offer.id) || [];
              const eb = groupIns.find((i) => i.protocol_type === "erstbegehung");
              const zb = groupIns.find((i) => i.protocol_type === "zwischenbegehung");
              const ab = groupIns.find((i) => i.protocol_type === "abnahme");
              const label = eb?.catalog_label || zb?.catalog_label || ab?.catalog_label || labelFromOffer(offer);
              const ebDone = eb && (eb.finalized_at || eb.status === "completed");
              const zbDone = zb && (zb.finalized_at || zb.status === "completed");

              if (!eb) {
                rows.push(
                  <NextBegehungPrompt key={`eb-${offer.id}`} type="erstbegehung" catalogLabel={label || ""} projectId={id!} offerId={offer.id} />
                );
              } else {
                rows.push(
                  <BegehungRow
                    key={eb.id}
                    name="Erstbegehung"
                    status={mapInspectionStatus(eb.status, eb.finalized_at)}
                    date={eb.finalized_at ? formatDate(eb.finalized_at) : formatDate(eb.inspection_date)}
                    projectId={id!}
                    protocolId={eb.id}
                    catalogLabel={label}
                  />
                );
                if (ebDone) {
                  if (zb) {
                    rows.push(
                      <BegehungRow
                        key={zb.id}
                        name="Zwischenbegehung"
                        status={mapInspectionStatus(zb.status, zb.finalized_at)}
                        date={zb.finalized_at ? formatDate(zb.finalized_at) : formatDate(zb.inspection_date)}
                        projectId={id!}
                        protocolId={zb.id}
                        catalogLabel={label}
                        indent
                      />
                    );
                    if (zbDone) {
                      if (ab) {
                        rows.push(
                          <BegehungRow
                            key={ab.id}
                            name="Abnahme"
                            status={mapInspectionStatus(ab.status, ab.finalized_at)}
                            date={ab.finalized_at ? formatDate(ab.finalized_at) : formatDate(ab.inspection_date)}
                            projectId={id!}
                            protocolId={ab.id}
                            catalogLabel={label}
                            indent
                          />
                        );
                      } else {
                        rows.push(
                          <NextBegehungPrompt key={`ab-${offer.id}`} type="abnahme" catalogLabel={label || ""} projectId={id!} offerId={zb.offer_id || eb.offer_id || undefined} />
                        );
                      }
                    }
                  } else {
                    rows.push(
                      <NextBegehungPrompt key={`zb-${offer.id}`} type="zwischenbegehung" catalogLabel={label || ""} projectId={id!} offerId={eb.offer_id || undefined} />
                    );
                  }
                }
              }
            }

            // Inspections with no offer_id (legacy / manual)
            noOfferInsps.forEach((ins) => {
              rows.push(
                <BegehungRow
                  key={ins.id}
                  name={mapBegehungType(ins.protocol_type)}
                  status={mapInspectionStatus(ins.status, ins.finalized_at)}
                  date={ins.finalized_at ? formatDate(ins.finalized_at) : formatDate(ins.inspection_date)}
                  projectId={id!}
                  protocolId={ins.id}
                  catalogLabel={ins.catalog_label}
                />
              );
            });

            if (rows.length === 0) {
              return <Text style={styles.emptySection}>Keine Begehungen vorhanden</Text>;
            }
            return <>{rows}</>;
          })()}
        </SectionCard>

        {/* Fotos */}
        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <SectionHeader
              title="Fotos"
              badge={photoCount > 0 ? String(photoCount) : undefined}
            />
            {photoCount > 0 && (
              <Pressable
                onPress={handleCapturePhoto}
                style={({ pressed }) => [styles.begehungAddBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                {photoUploading ? (
                  <ActivityIndicator size={14} color={Colors.raw.zinc950} />
                ) : (
                  <Ionicons name="add" size={18} color={Colors.raw.zinc950} />
                )}
              </Pressable>
            )}
          </View>
          {photoCount > 0 ? (
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPhotoGallery(true);
              }}
              style={({ pressed }) => [styles.photoRow, { opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={styles.photoPreviewRow}>
                <Ionicons name="images" size={32} color={Colors.raw.amber500} />
                <View style={styles.photoTextCol}>
                  <Text style={styles.photoTitle}>{photoCount} {photoCount === 1 ? "Foto" : "Fotos"} vorhanden</Text>
                  <Text style={styles.photoSubtitle}>Tippen zum Anzeigen</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc600} />
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleCapturePhoto}
              style={({ pressed }) => [styles.photoRow, { opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={styles.photoPreviewRow}>
                <Ionicons name="camera-outline" size={32} color={photoUploading ? Colors.raw.amber500 : Colors.raw.zinc600} />
                <View style={styles.photoTextCol}>
                  <Text style={styles.photoSubtitle}>{photoUploading ? "Wird hochgeladen..." : "Noch keine Fotos"}</Text>
                  <Text style={styles.photoSubtitle}>{photoUploading ? "Bitte warten" : "Tippen um Foto aufzunehmen"}</Text>
                </View>
                <Pressable
                  onPress={handleCapturePhoto}
                  disabled={photoUploading}
                  style={({ pressed }) => [styles.begehungAddBtn, { opacity: pressed || photoUploading ? 0.6 : 1 }]}
                >
                  {photoUploading ? (
                    <ActivityIndicator size={14} color={Colors.raw.zinc950} />
                  ) : (
                    <Ionicons name="add" size={18} color={Colors.raw.zinc950} />
                  )}
                </Pressable>
              </View>
            </Pressable>
          )}
        </SectionCard>

        {/* Nachrichten */}
        <SectionCard>
          <SectionHeader
            title="Nachrichten"
            badge={unreadMessages > 0 ? String(unreadMessages) : undefined}
          />
          {messages.length > 0 ? (
            messages.map((msg, i) => (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  i < messages.length - 1 && styles.msgBorder,
                ]}
              >
                <View style={[styles.msgIcon, { backgroundColor: Colors.raw.amber500 + "18" }]}>
                  <Ionicons
                    name={msg.message_type === "photo" ? "camera" : "chatbubble"}
                    size={16}
                    color={Colors.raw.amber500}
                  />
                </View>
                <View style={styles.msgBody}>
                  <Text style={styles.msgSender}>{msg.message_type}</Text>
                  <Text style={styles.msgText} numberOfLines={1}>
                    {msg.text || "(Kein Text)"}
                  </Text>
                </View>
                <Text style={styles.msgTime}>{formatTime(msg.created_at)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptySection}>Keine Nachrichten</Text>
          )}
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.push({ pathname: "/chat/[id]", params: { id: id || "1" } });
            }}
            style={({ pressed }) => [
              styles.allMessagesBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.allMessagesText}>Alle Nachrichten</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.raw.amber500} />
          </Pressable>
        </SectionCard>

        {/* Dokumente */}
        <SectionCard>
          <SectionHeader
            title="Dokumente"
            badge={(() => { const c = sagaOrders.length + offers.length + inspections.filter((i) => i.finalized_at || i.status === "completed").length + docFileCount; return c > 0 ? String(c) : undefined; })()}
          />
          {sagaOrders.map((order) => (
            <DocumentRow
              key={`order-${order.id}`}
              name={`Auftrag ${order.external_ref || "—"}`}
              subtitle={order.address || undefined}
              externalUrl={order.pdf_file_url || order.pdf_url}
              icon="briefcase"
            />
          ))}
          {offers.map((offer) => (
            <DocumentRow
              key={offer.offer_number}
              name={`Angebot ${offer.offer_number}`}
              subtitle={`${offer.status === "ACCEPTED" ? "Angenommen" : offer.status === "DRAFT" ? "Entwurf" : offer.status ?? "—"}${offer.total_net ? ` · €${Number(offer.total_net).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ""}`}
              onPress={() => router.push({ pathname: "/angebot/editor", params: { offerId: offer.id } })}
              onLongPress={() => handleDeleteOffer(offer.id, offer.offer_number)}
              rightIcon="navigate"
              icon="document-text"
            />
          ))}
          {inspections
            .filter((i) => i.finalized_at || i.status === "completed")
            .map((ins) => (
              <DocumentRow
                key={`proto-${ins.id}`}
                name={`Protokoll ${mapBegehungType(ins.protocol_type)}`}
                subtitle={formatDate(ins.finalized_at || ins.inspection_date)}
                storagePath={ins.pdf_storage_path}
                icon="clipboard"
              />
            ))}
          {sagaOrders.length === 0 && offers.length === 0 && inspections.filter((i) => i.finalized_at || i.status === "completed").length === 0 && docFileCount === 0 && (
            <Text style={styles.emptySection}>Keine Dokumente</Text>
          )}
          {docFileCount > 0 && (
            <Text style={[styles.emptySection, { color: Colors.raw.zinc500 }]}>+ {docFileCount} Dateien in der Ablage</Text>
          )}
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowDocManager(true);
            }}
            style={({ pressed }) => [styles.allMessagesBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.allMessagesText}>Alle Dokumente verwalten</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.raw.amber500} />
          </Pressable>
        </SectionCard>
      </ScrollView>

      <Modal
        visible={showBegehungPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBegehungPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowBegehungPicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Begehung erstellen</Text>
            <Text style={styles.modalSubtitle}>Art der Begehung w{"\u00E4"}hlen</Text>
            {[
              { key: "baustellenaufnahme", label: "Baustellenaufnahme", icon: "scan", desc: "Neue Baustelle erfassen (ohne Angebot)" },
              { key: "erstbegehung", label: "Erstbegehung", icon: "eye", desc: "Erstmalige Begutachtung vor Ort" },
              { key: "zwischenbegehung", label: "Zwischenbegehung", icon: "sync", desc: "Kontrolle w\u00E4hrend der Bauphase" },
              { key: "abnahme", label: "Abnahme", icon: "checkmark-circle", desc: "Finale Abnahme nach Fertigstellung" },
            ].map((item) => (
              <Pressable
                key={item.key}
                style={({ pressed }) => [styles.modalOption, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowBegehungPicker(false);
                  if (item.key === "baustellenaufnahme") {
                    router.push({ pathname: "/begehung/baustellenaufnahme", params: { projectId: id || "" } });
                  } else if (offers.length > 1) {
                    setBegehungType(item.key);
                    setShowOfferPicker(true);
                  } else {
                    router.push({ pathname: "/begehung/[type]", params: { type: item.key, projectId: id || "", offerId: offers[0]?.id || "" } });
                  }
                }}
                testID={`begehung-option-${item.key}`}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.raw.amber500} />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionLabel}>{item.label}</Text>
                  <Text style={styles.modalOptionDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.modalCancel, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setShowBegehungPicker(false)}
            >
              <Text style={styles.modalCancelText}>Abbrechen</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Offer picker for Begehung (when multiple offers exist) */}
      <Modal
        visible={showOfferPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOfferPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowOfferPicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Angebot w{"\u00E4"}hlen</Text>
            <Text style={styles.modalSubtitle}>F{"\u00FC"}r welches Angebot soll die Begehung durchgef{"\u00FC"}hrt werden?</Text>
            {offers.map((offer) => (
              <Pressable
                key={offer.id}
                style={({ pressed }) => [styles.modalOption, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowOfferPicker(false);
                  router.push({ pathname: "/begehung/[type]", params: { type: begehungType || "erstbegehung", projectId: id || "", offerId: offer.id } });
                }}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="document-text" size={20} color={Colors.raw.amber500} />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionLabel}>{offer.offer_number}</Text>
                  <Text style={styles.modalOptionDesc}>
                    {offer.status === "DRAFT" ? "Entwurf" : offer.status === "ACCEPTED" ? "Beauftragt" : offer.status || "—"}
                    {offer.total_net ? ` · €${Number(offer.total_net).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.modalCancel, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setShowOfferPicker(false)}
            >
              <Text style={styles.modalCancelText}>Abbrechen</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Angebot picker (when Angebot QuickAction clicked and offers exist) */}
      <Modal
        visible={showAngebotPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAngebotPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAngebotPicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Angebot w{"\u00E4"}hlen</Text>
            <Text style={styles.modalSubtitle}>Bestehendes Angebot {"\u00F6"}ffnen oder neues erstellen</Text>
            {offers.map((offer) => (
              <Pressable
                key={offer.id}
                style={({ pressed }) => [styles.modalOption, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAngebotPicker(false);
                  router.push({ pathname: "/angebot/editor", params: { offerId: offer.id } });
                }}
              >
                <View style={styles.modalOptionIcon}>
                  <Ionicons name="document-text" size={20} color={Colors.raw.amber500} />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={styles.modalOptionLabel}>{offer.offer_number}</Text>
                  <Text style={styles.modalOptionDesc}>
                    {offer.status === "DRAFT" ? "Entwurf" : offer.status === "ACCEPTED" ? "Beauftragt" : offer.status || "—"}
                    {offer.total_net ? ` · €${Number(offer.total_net).toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.modalOption, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAngebotPicker(false);
                router.push({ pathname: "/angebot/editor", params: { projectId: id || "", forceNew: "true" } });
              }}
            >
              <View style={styles.modalOptionIcon}>
                <Ionicons name="add-circle" size={20} color={Colors.raw.amber500} />
              </View>
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionLabel}>Neues Angebot erstellen</Text>
                <Text style={styles.modalOptionDesc}>Leeres Angebot anlegen</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.raw.zinc600} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.modalCancel, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setShowAngebotPicker(false)}
            >
              <Text style={styles.modalCancelText}>Abbrechen</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {showPhotoGallery && (
        <PhotoGalleryModal
          projectId={id!}
          visible={showPhotoGallery}
          onClose={() => setShowPhotoGallery(false)}
        />
      )}

      {showDocManager && (
        <DocumentManagerModal
          projectId={id!}
          visible={showDocManager}
          onClose={() => setShowDocManager(false)}
          offers={offers}
          inspections={inspections}
          sagaOrders={sagaOrders}
        />
      )}
    </View>
  );
}

// --- Photo Gallery Modal ---

interface InspectionPhoto {
  id: string;
  storage_path: string;
  room_name: string | null;
  position_title: string | null;
  inspection_type: string;
  created_at: string;
}

// Thumb size is computed inside PhotoGalleryModal using useWindowDimensions

function PhotoGalleryModal({
  projectId,
  visible,
  onClose,
}: {
  projectId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { width: screenWidth } = useWindowDimensions();
  const thumbSize = Math.floor((screenWidth - 60) / 2);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [fullscreenUri, setFullscreenUri] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("inspection_photos")
        .select("id, storage_path, room_name, position_title, inspection_type, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (cancelled || error) { setLoading(false); return; }
      setPhotos(data || []);

      // Generate signed URLs — try batch first, fall back to individual
      const paths = (data || []).map((p) => p.storage_path);
      if (paths.length > 0) {
        const urlMap: Record<string, string> = {};
        const { data: urlData, error: urlErr } = await supabase.storage
          .from("project-files")
          .createSignedUrls(paths, 3600);
        if (!urlErr && urlData) {
          urlData.forEach((u, i) => {
            if (u.signedUrl) urlMap[paths[i]] = u.signedUrl;
          });
        } else {
          // Fallback: generate individually
          for (const path of paths) {
            if (cancelled) break;
            const { data: singleUrl } = await supabase.storage
              .from("project-files")
              .createSignedUrl(path, 3600);
            if (singleUrl?.signedUrl) urlMap[path] = singleUrl.signedUrl;
          }
        }
        if (!cancelled) setSignedUrls(urlMap);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [visible, projectId]);

  const groupedPhotos = useMemo(() => {
    const groups: Record<string, InspectionPhoto[]> = {};
    photos.forEach((p) => {
      const key = p.room_name || "Allgemein";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups);
  }, [photos]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={pgStyles.container}>
        <View style={[pgStyles.header, { paddingTop: topInset + 8 }]}>
          <Text style={pgStyles.title}>Fotos ({photos.length})</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [pgStyles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="close" size={24} color={Colors.raw.white} />
          </Pressable>
        </View>

        {loading ? (
          <View style={pgStyles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.raw.amber500} />
          </View>
        ) : photos.length === 0 ? (
          <View style={pgStyles.loadingWrap}>
            <Ionicons name="images-outline" size={48} color={Colors.raw.zinc700} />
            <Text style={pgStyles.emptyText}>Keine Fotos vorhanden</Text>
          </View>
        ) : (
          <ScrollView style={pgStyles.scroll} contentContainerStyle={pgStyles.scrollContent}>
            {groupedPhotos.map(([roomName, roomPhotos]) => (
              <View key={roomName} style={pgStyles.group}>
                <Text style={pgStyles.groupTitle}>{roomName}</Text>
                <View style={pgStyles.grid}>
                  {roomPhotos.map((photo) => {
                    const uri = signedUrls[photo.storage_path];
                    return (
                      <Pressable
                        key={photo.id}
                        onPress={() => {
                          if (uri) {
                            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setFullscreenUri(uri);
                          }
                        }}
                        style={({ pressed }) => [{ width: thumbSize }, { opacity: pressed ? 0.8 : 1 }]}
                      >
                        {uri ? (
                          <Image source={{ uri }} style={{ width: thumbSize, height: thumbSize, borderRadius: 12, backgroundColor: Colors.raw.zinc800 }} />
                        ) : (
                          <View style={{ width: thumbSize, height: thumbSize, borderRadius: 12, backgroundColor: Colors.raw.zinc800, alignItems: "center", justifyContent: "center" }}>
                            <ActivityIndicator size="small" color={Colors.raw.zinc600} />
                          </View>
                        )}
                        <Text style={pgStyles.thumbLabel} numberOfLines={1}>
                          {photo.position_title || photo.inspection_type}
                        </Text>
                        <Text style={pgStyles.thumbDate}>
                          {new Date(photo.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Fullscreen overlay */}
        {fullscreenUri && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setFullscreenUri(null)}>
            <View style={pgStyles.fullscreenBg}>
              <Pressable style={[pgStyles.fullscreenClose, { top: topInset + 12 }]} onPress={() => setFullscreenUri(null)}>
                <Ionicons name="close-circle" size={36} color={Colors.raw.white} />
              </Pressable>
              <Image source={{ uri: fullscreenUri }} style={pgStyles.fullscreenImg} resizeMode="contain" />
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const pgStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc600,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.zinc300,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.raw.zinc300,
    marginTop: 6,
  },
  thumbDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc600,
    marginTop: 2,
  },
  fullscreenBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenClose: {
    position: "absolute",
    right: 16,
    zIndex: 10,
  },
  fullscreenImg: {
    width: "100%",
    height: "80%",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  backRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  projectCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc500,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroStatusRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  heroStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  heroAddress: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    lineHeight: 34,
    marginBottom: 8,
  },
  heroClient: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.raw.zinc800,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 16,
    minWidth: 42,
    textAlign: "right",
  },
  zeitplanRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 14,
  },
  zeitplanItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zeitplanLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  zeitplanDate: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc300,
  },
  marginBreakdown: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  marginCol: {
    flex: 1,
    alignItems: "center",
  },
  marginLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.raw.zinc500,
    marginBottom: 4,
  },
  marginValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
  },
  marginValueLarge: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 20,
  },
  qaScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  qaRow: {
    paddingHorizontal: 20,
    gap: 12,
    flexDirection: "row",
  },
  emptySection: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc600,
    paddingVertical: 12,
  },
  photoRow: {
    paddingVertical: 12,
  },
  photoPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  photoTextCol: {
    flex: 1,
  },
  photoTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  photoSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  begehungAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.raw.amber500,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  msgRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  msgBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  msgIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  msgBody: {
    flex: 1,
  },
  msgSender: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  msgText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  msgTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc600,
  },
  allMessagesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    marginTop: 4,
  },
  allMessagesText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "web" ? 34 : 40,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
    gap: 14,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  modalOptionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginTop: 2,
  },
  modalCancel: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  modalCancelText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc500,
  },
});
