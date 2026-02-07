import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
  runOnJS,
} from "react-native-reanimated";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type Step = "select_project" | "camera" | "review";

interface Project {
  id: string;
  code: string;
  name: string;
  address: string;
}

const PROJECTS: Project[] = [
  { id: "1", code: "BL-2026-003", name: "Schwentnerring 13c", address: "80339 M\u00FCnchen" },
  { id: "2", code: "BL-2026-007", name: "Haferweg 22", address: "80331 M\u00FCnchen" },
  { id: "3", code: "BL-2026-012", name: "Dachauer Str. 114", address: "80335 M\u00FCnchen" },
];

const TAGS = [
  { key: "fortschritt", label: "Fortschritt", icon: "camera", color: Colors.raw.emerald500 },
  { key: "mangel", label: "Mangel", icon: "warning", color: Colors.raw.rose500 },
  { key: "nachtrag", label: "Nachtrag", icon: "create", color: Colors.raw.amber500 },
  { key: "frage", label: "Frage", icon: "help-circle", color: "#3b82f6" },
  { key: "lieferung", label: "Lieferung", icon: "cube", color: Colors.raw.zinc400 },
];

const ROOMS = [
  "K\u00FCche", "Bad", "Wohnzimmer", "Schlafzimmer",
  "Flur", "Kinderzimmer", "Au\u00DFen", "Keller",
];

const URGENCY = [
  { key: "normal", label: "Normal", color: Colors.raw.emerald500 },
  { key: "wichtig", label: "Wichtig", color: Colors.raw.amber500 },
  { key: "dringend", label: "Dringend", color: Colors.raw.rose500 },
];

function ProjectCard({
  project,
  onPress,
  isRecent,
}: {
  project: Project;
  onPress: () => void;
  isRecent?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          scale.value = withSequence(
            withTiming(0.97, { duration: 80 }),
            withSpring(1, { damping: 15, stiffness: 300 })
          );
          onPress();
        }}
        style={[selectStyles.projectCard, isRecent && selectStyles.projectCardRecent]}
      >
        <View style={selectStyles.projectIcon}>
          <Ionicons name="business" size={20} color={Colors.raw.amber500} />
        </View>
        <View style={selectStyles.projectInfo}>
          <Text style={selectStyles.projectCode}>{project.code}</Text>
          <Text style={selectStyles.projectName}>{project.name}</Text>
          <Text style={selectStyles.projectAddress}>{project.address}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.raw.zinc600} />
      </Pressable>
    </Animated.View>
  );
}

const selectStyles = StyleSheet.create({
  projectCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 18,
    marginBottom: 10,
  },
  projectCardRecent: {
    borderColor: Colors.raw.zinc700,
  },
  projectIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.raw.amber500 + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  projectInfo: {
    flex: 1,
  },
  projectCode: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc500,
    marginBottom: 2,
  },
  projectName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  projectAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
});

function RoomSelectorModal({
  visible,
  selectedRoom,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedRoom: string;
  onSelect: (room: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={roomModalStyles.overlay}>
        <View style={roomModalStyles.sheet}>
          <View style={roomModalStyles.handle} />
          <Text style={roomModalStyles.title}>Raum w\u00E4hlen</Text>
          {ROOMS.map((room) => (
            <Pressable
              key={room}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync();
                }
                onSelect(room);
              }}
              style={({ pressed }) => [
                roomModalStyles.roomRow,
                selectedRoom === room && roomModalStyles.roomRowActive,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text
                style={[
                  roomModalStyles.roomText,
                  selectedRoom === room && roomModalStyles.roomTextActive,
                ]}
              >
                {room}
              </Text>
              {selectedRoom === room && (
                <Ionicons name="checkmark" size={20} color={Colors.raw.amber500} />
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const roomModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
    marginBottom: 16,
  },
  roomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  roomRowActive: {
    backgroundColor: Colors.raw.amber500 + "14",
  },
  roomText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.raw.zinc300,
  },
  roomTextActive: {
    fontFamily: "Inter_700Bold",
    color: Colors.raw.amber500,
  },
});

export default function FotoScreen() {
  const params = useLocalSearchParams<{ projectId?: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const hasPreselectedProject = !!params.projectId;
  const preselectedProject = PROJECTS.find((p) => p.id === params.projectId);

  const [step, setStep] = useState<Step>(
    hasPreselectedProject ? "camera" : "select_project"
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    preselectedProject || null
  );
  const [selectedTag, setSelectedTag] = useState("fortschritt");
  const [selectedRoom, setSelectedRoom] = useState("K\u00FCche");
  const [selectedUrgency, setSelectedUrgency] = useState("normal");
  const [description, setDescription] = useState("");
  const [photoCount, setPhotoCount] = useState(0);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [flashOn, setFlashOn] = useState(false);

  const captureScale = useSharedValue(1);
  const captureAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureScale.value }],
  }));

  const successOpacity = useSharedValue(0);
  const successScale = useSharedValue(0.5);
  const successAnimStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }],
  }));

  const filteredProjects = searchQuery
    ? PROJECTS.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : PROJECTS;

  const selectProject = (project: Project) => {
    setSelectedProject(project);
    setStep("camera");
  };

  const capturePhoto = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    captureScale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    setPhotoCount((c) => c + 1);
    setTimeout(() => setStep("review"), 300);
  };

  const savePhoto = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowSuccess(true);
    successOpacity.value = withTiming(1, { duration: 200 });
    successScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    setTimeout(() => {
      successOpacity.value = withTiming(0, { duration: 300 });
      successScale.value = withTiming(0.5, { duration: 300 });
      setTimeout(() => setShowSuccess(false), 350);
    }, 1500);
  };

  const takeAnother = () => {
    setDescription("");
    setStep("camera");
  };

  const finish = () => {
    router.back();
  };

  if (step === "select_project") {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: topInset + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            testID="back-button"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topInset + 64, paddingBottom: bottomInset + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.stepTitle}>Projekt w\u00E4hlen</Text>
          <Text style={styles.stepSub}>
            W\u00E4hle das Projekt f\u00FCr deine Fotos
          </Text>

          <View style={styles.searchField}>
            <Ionicons name="search" size={18} color={Colors.raw.zinc500} />
            <TextInput
              style={styles.searchInput}
              placeholder="Projekt suchen..."
              placeholderTextColor={Colors.raw.zinc600}
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="project-search"
            />
          </View>

          <Text style={styles.sectionLabel}>Letzte Projekte</Text>
          {filteredProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onPress={() => selectProject(p)}
              isRecent
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (step === "camera") {
    const activeTag = TAGS.find((t) => t.key === selectedTag)!;
    return (
      <View style={styles.cameraContainer}>
        <View style={styles.cameraPreview}>
          <View style={styles.cameraPlaceholderInner}>
            <Ionicons name="camera" size={64} color={Colors.raw.zinc700} />
            <Text style={styles.cameraPlaceholderText}>Kamera-Vorschau</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setFlashOn(!flashOn)}
          style={({ pressed }) => [
            styles.flashBtn,
            { top: topInset + 12, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons
            name={flashOn ? "flash" : "flash-off"}
            size={22}
            color={Colors.raw.white}
          />
        </Pressable>

        <Pressable
          onPress={() => {
            if (hasPreselectedProject) {
              router.back();
            } else {
              setStep("select_project");
            }
          }}
          style={({ pressed }) => [
            styles.cameraBackBtn,
            { top: topInset + 12, opacity: pressed ? 0.7 : 1 },
          ]}
          testID="camera-back"
        >
          <Ionicons name="close" size={26} color={Colors.raw.white} />
        </Pressable>

        <View style={[styles.cameraOverlay, { paddingBottom: bottomInset + 16 }]}>
          {selectedProject && (
            <Pressable
              onPress={() => {
                if (!hasPreselectedProject) setStep("select_project");
              }}
              style={({ pressed }) => [
                styles.projectBadge,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="clipboard" size={14} color={Colors.raw.amber500} />
              <Text style={styles.projectBadgeText} numberOfLines={1}>
                {selectedProject.code} {selectedProject.name}
              </Text>
              {!hasPreselectedProject && (
                <Ionicons name="chevron-down" size={14} color={Colors.raw.zinc400} />
              )}
            </Pressable>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagScrollContent}
            style={styles.tagScroll}
          >
            {TAGS.map((tag) => (
              <Pressable
                key={tag.key}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                  setSelectedTag(tag.key);
                }}
                style={[
                  styles.tagChip,
                  selectedTag === tag.key && { backgroundColor: Colors.raw.amber500 },
                ]}
              >
                <Ionicons
                  name={tag.icon as any}
                  size={14}
                  color={selectedTag === tag.key ? "#000" : tag.color}
                />
                <Text
                  style={[
                    styles.tagChipText,
                    selectedTag === tag.key && { color: "#000" },
                  ]}
                >
                  {tag.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.captureRow}>
            <Pressable
              style={({ pressed }) => [
                styles.galleryBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.galleryThumb}>
                <Ionicons name="images" size={20} color={Colors.raw.zinc400} />
              </View>
              {photoCount > 0 && (
                <View style={styles.photoCountBadge}>
                  <Text style={styles.photoCountText}>{photoCount}</Text>
                </View>
              )}
            </Pressable>

            <Animated.View style={captureAnimStyle}>
              <Pressable
                onPress={capturePhoto}
                style={({ pressed }) => [
                  styles.captureBtn,
                  pressed && styles.captureBtnPressed,
                ]}
                testID="capture-btn"
              >
                <View style={styles.captureBtnInner} />
              </Pressable>
            </Animated.View>

            <View style={styles.captureRightSpace}>
              {photoCount > 0 && (
                <Text style={styles.photosToday}>{photoCount} heute</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (step === "review") {
    const activeTag = TAGS.find((t) => t.key === selectedTag)!;
    return (
      <View style={styles.container}>
        <View style={styles.reviewPhotoArea}>
          <View style={styles.reviewPhotoPlaceholder}>
            <Ionicons name="image" size={64} color={Colors.raw.zinc600} />
            <Text style={styles.reviewPhotoLabel}>Aufgenommenes Foto</Text>
          </View>

          <Pressable
            onPress={() => setStep("camera")}
            style={({ pressed }) => [
              styles.reviewBackBtn,
              { top: topInset + 12, opacity: pressed ? 0.7 : 1 },
            ]}
            testID="review-back"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.raw.white} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.reviewSheet}
          contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.reviewHandle} />

          <View style={styles.reviewTagRow}>
            <View style={styles.reviewTagDisplay}>
              <Ionicons name={activeTag.icon as any} size={16} color={activeTag.color} />
              <Text style={[styles.reviewTagLabel, { color: activeTag.color }]}>
                {activeTag.label}
              </Text>
            </View>
            <Pressable
              onPress={() => setStep("camera")}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={styles.changeLink}>\u00E4ndern</Text>
            </Pressable>
          </View>

          <Text style={styles.reviewFieldLabel}>Raum</Text>
          <Pressable
            onPress={() => setShowRoomModal(true)}
            style={({ pressed }) => [
              styles.roomSelector,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            testID="room-selector"
          >
            <Text style={styles.roomSelectorText}>{selectedRoom}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.raw.zinc400} />
          </Pressable>

          <Text style={styles.reviewFieldLabel}>Beschreibung</Text>
          <TextInput
            style={styles.descInput}
            placeholder="Was ist auf dem Foto zu sehen?"
            placeholderTextColor={Colors.raw.zinc600}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            testID="description-input"
          />

          <Text style={styles.reviewFieldLabel}>Dringlichkeit</Text>
          <View style={styles.urgencyRow}>
            {URGENCY.map((u) => (
              <Pressable
                key={u.key}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.selectionAsync();
                  }
                  setSelectedUrgency(u.key);
                }}
                style={[
                  styles.urgencyChip,
                  {
                    backgroundColor:
                      selectedUrgency === u.key
                        ? u.color + "20"
                        : Colors.raw.zinc800,
                    borderColor:
                      selectedUrgency === u.key ? u.color : Colors.raw.zinc700,
                  },
                ]}
              >
                <View
                  style={[styles.urgencyDot, { backgroundColor: u.color }]}
                />
                <Text
                  style={[
                    styles.urgencyText,
                    {
                      color:
                        selectedUrgency === u.key ? u.color : Colors.raw.zinc400,
                    },
                  ]}
                >
                  {u.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={takeAnother}
            style={({ pressed }) => [
              styles.anotherPhotoBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="camera" size={18} color={Colors.raw.amber500} />
            <Text style={styles.anotherPhotoText}>Weiteres Foto</Text>
          </Pressable>

          <Pressable
            onPress={savePhoto}
            style={({ pressed }) => [
              styles.saveBtn,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            testID="save-btn"
          >
            <Ionicons name="checkmark-circle" size={20} color="#000" />
            <Text style={styles.saveBtnText}>Speichern</Text>
          </Pressable>

          {showSuccess && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.successOverlay}
            >
              <Animated.View style={[styles.successCircle, successAnimStyle]}>
                <Ionicons name="checkmark" size={40} color="#000" />
              </Animated.View>
              <Text style={styles.successText}>Foto gespeichert</Text>
              <View style={styles.successActions}>
                <Pressable
                  onPress={takeAnother}
                  style={({ pressed }) => [
                    styles.successNextBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  testID="next-photo-btn"
                >
                  <Ionicons name="camera" size={18} color={Colors.raw.amber500} />
                  <Text style={styles.successNextText}>N\u00E4chstes Foto</Text>
                </Pressable>
                <Pressable
                  onPress={finish}
                  style={({ pressed }) => [
                    styles.successDoneBtn,
                    { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                  testID="done-btn"
                >
                  <Ionicons name="checkmark" size={18} color="#000" />
                  <Text style={styles.successDoneText}>Fertig</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        <RoomSelectorModal
          visible={showRoomModal}
          selectedRoom={selectedRoom}
          onSelect={(room) => {
            setSelectedRoom(room);
            setShowRoomModal(false);
          }}
          onClose={() => setShowRoomModal(false)}
        />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.white,
    marginBottom: 6,
  },
  stepSub: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.raw.zinc500,
    marginBottom: 24,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 28,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc500,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  cameraPlaceholderInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  cameraPlaceholderText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.raw.zinc600,
  },
  flashBtn: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  cameraBackBtn: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(24,24,27,0.85)",
    paddingTop: 18,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  projectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  projectBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.white,
    maxWidth: 220,
  },
  tagScroll: {
    marginBottom: 20,
  },
  tagScrollContent: {
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
  },
  tagChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.zinc300,
  },
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  galleryBtn: {
    position: "relative",
  },
  galleryThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.raw.zinc700,
  },
  photoCountBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.raw.amber500,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  photoCountText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#000",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.raw.white,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  captureBtnPressed: {
    borderColor: Colors.raw.amber500,
  },
  captureBtnInner: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    backgroundColor: Colors.raw.white,
  },
  captureRightSpace: {
    width: 48,
    alignItems: "center",
  },
  photosToday: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc400,
    textAlign: "center",
  },

  reviewPhotoArea: {
    height: 280,
    backgroundColor: Colors.raw.zinc950,
    position: "relative",
  },
  reviewPhotoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.raw.zinc900,
    gap: 8,
  },
  reviewPhotoLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.raw.zinc500,
  },
  reviewBackBtn: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  reviewSheet: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  reviewHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc700,
    alignSelf: "center",
    marginBottom: 20,
  },
  reviewTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  reviewTagDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewTagLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
  changeLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.amber500,
  },
  reviewFieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 8,
  },
  roomSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 18,
  },
  roomSelectorText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.white,
  },
  descInput: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    padding: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    minHeight: 90,
    marginBottom: 18,
  },
  urgencyRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  urgencyChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  urgencyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  anotherPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  anotherPhotoText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.amber500,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.emerald500,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  saveBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(9,9,11,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.raw.emerald500,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
    marginBottom: 32,
  },
  successActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  successNextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  successNextText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.amber500,
  },
  successDoneBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.emerald500,
    borderRadius: 14,
    paddingVertical: 16,
  },
  successDoneText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#000",
  },
});
