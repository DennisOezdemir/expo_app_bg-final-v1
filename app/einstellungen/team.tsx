import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useTeamMembers } from "@/hooks/queries/useSettings";
import { useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from "@/hooks/mutations/useSettingsMutations";
import type { TeamMember } from "@/lib/api/settings";

const ROLES = [
  { key: "GF", label: "GF", icon: "briefcase" as const },
  { key: "Bauleiter", label: "Bauleiter", icon: "clipboard" as const },
  { key: "Monteur", label: "Monteur", icon: "construct" as const },
];

const GEWERKE = ["Sanitär", "Maler", "Elektro", "Fliesen", "Trockenbau", "Sonstiges"];

function getRoleIcon(role: string): string {
  if (role === "GF") return "briefcase";
  if (role === "Bauleiter") return "clipboard";
  return "construct";
}

const DEFAULT_ROLE_LABELS: Record<string, string> = {
  GF: "Geschäftsführer",
  Bauleiter: "Projektleiterin",
  Monteur: "Monteur",
};

export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: members = [], isLoading: loading } = useTeamMembers();
  const createMutation = useCreateTeamMember();
  const updateMutation = useUpdateTeamMember();
  const deleteMutation = useDeleteTeamMember();
  const saving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [selectedRole, setSelectedRole] = useState("GF");
  const [selectedGewerk, setSelectedGewerk] = useState("");

  const resetForm = () => {
    setEditingMember(null);
    setName("");
    setEmail("");
    setTelefon("");
    setSelectedRole("GF");
    setSelectedGewerk("");
  };

  const openNew = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setEmail(member.email ?? "");
    setTelefon(member.phone ?? "");
    setSelectedRole(member.role);
    setSelectedGewerk(member.gewerk ?? "");
    setModalVisible(true);
  };

  const getRoleLabel = () => {
    if (selectedRole === "Monteur" && selectedGewerk) return selectedGewerk;
    return DEFAULT_ROLE_LABELS[selectedRole] ?? selectedRole;
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Fehler", "Name ist Pflicht.");
      return;
    }
    const roleLabel = getRoleLabel();
    const onSuccess = () => {
      resetForm();
      setModalVisible(false);
    };
    const onError = (error: Error) => Alert.alert("Fehler", error.message);

    if (editingMember) {
      updateMutation.mutate(
        {
          id: editingMember.id,
          name: trimmedName,
          email: email.trim() || null,
          phone: telefon.trim() || null,
          role: selectedRole,
          role_label: roleLabel,
          gewerk: selectedRole === "Monteur" ? selectedGewerk || null : null,
        },
        { onSuccess, onError }
      );
    } else {
      createMutation.mutate(
        {
          name: trimmedName,
          email: email.trim() || null,
          phone: telefon.trim() || null,
          role: selectedRole,
          role_label: roleLabel,
          gewerk: selectedRole === "Monteur" ? selectedGewerk || null : null,
          active: true,
          sort_order: members.length,
        },
        { onSuccess, onError }
      );
    }
  };

  const handleDelete = () => {
    if (!editingMember) return;
    Alert.alert(
      "Mitarbeiter entfernen",
      `"${editingMember.name}" wirklich aus dem Team entfernen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Entfernen",
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(editingMember.id, {
              onSuccess: () => {
                resetForm();
                setModalVisible(false);
              },
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 20, paddingBottom: bottomInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.raw.white} />
        </Pressable>

        <Text style={styles.title}>Team</Text>
        <Text style={styles.subtitle}>{members.length} Mitarbeiter</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.raw.amber500} />
          </View>
        ) : (
          <View style={styles.card}>
            {members.map((member, i) => (
              <Pressable
                key={member.id}
                onPress={() => openEdit(member)}
                style={({ pressed }) => [styles.memberRowWrap, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.memberRow}>
                  <View style={styles.memberLeft}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={20} color={Colors.raw.amber500} />
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberEmail}>{member.email ?? "—"}</Text>
                    </View>
                  </View>
                  <View style={styles.memberRight}>
                    <View style={styles.roleBadge}>
                      <Ionicons
                        name={getRoleIcon(member.role) as any}
                        size={12}
                        color={Colors.raw.amber500}
                      />
                      <Text style={styles.roleBadgeText}>{member.role_label ?? member.role}</Text>
                    </View>
                    {member.active && <View style={styles.activeDot} />}
                  </View>
                </View>
                {i < members.length - 1 && <View style={styles.divider} />}
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={openNew}
          style={({ pressed }) => [styles.inviteBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="invite-button"
        >
          <Ionicons name="add-circle" size={22} color={Colors.raw.amber500} />
          <Text style={styles.inviteBtnText}>Mitarbeiter hinzufügen</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: bottomInset + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMember ? "Mitarbeiter bearbeiten" : "Mitarbeiter hinzufügen"}
              </Text>
              <Pressable
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
                testID="close-modal"
              >
                <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name eingeben"
                placeholderTextColor={Colors.raw.zinc600}
                selectionColor={Colors.raw.amber500}
              />

              <Text style={styles.inputLabel}>E-Mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="E-Mail eingeben"
                placeholderTextColor={Colors.raw.zinc600}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor={Colors.raw.amber500}
              />

              <Text style={styles.inputLabel}>Telefon</Text>
              <TextInput
                style={styles.input}
                value={telefon}
                onChangeText={setTelefon}
                placeholder="Telefonnummer eingeben"
                placeholderTextColor={Colors.raw.zinc600}
                keyboardType="phone-pad"
                selectionColor={Colors.raw.amber500}
              />

              <Text style={styles.inputLabel}>Rolle:</Text>
              <View style={styles.toggleGroup}>
                {ROLES.map((r) => {
                  const isActive = selectedRole === r.key;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => {
                        setSelectedRole(r.key);
                        if (r.key !== "Monteur") setSelectedGewerk("");
                      }}
                      style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
                    >
                      <Ionicons
                        name={r.icon as any}
                        size={16}
                        color={isActive ? "#000" : Colors.raw.zinc400}
                      />
                      <Text style={[styles.toggleBtnText, isActive && styles.toggleBtnTextActive]}>
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedRole === "Monteur" && (
                <>
                  <Text style={styles.inputLabel}>Gewerk:</Text>
                  <View style={styles.toggleGroup}>
                    {GEWERKE.map((g) => {
                      const isActive = selectedGewerk === g;
                      return (
                        <Pressable
                          key={g}
                          onPress={() => setSelectedGewerk(g)}
                          style={[styles.toggleBtn, isActive && styles.toggleBtnActive]}
                        >
                          <Text style={[styles.toggleBtnText, isActive && styles.toggleBtnTextActive]}>
                            {g}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [styles.sendBtn, { opacity: saving || pressed ? 0.7 : 1 }]}
                testID="send-invite"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.sendBtnText}>{editingMember ? "Speichern" : "Hinzufügen"}</Text>
                )}
              </Pressable>
              {editingMember && (
                <Pressable
                  onPress={handleDelete}
                  disabled={saving}
                  style={({ pressed }) => [styles.deleteBtn, { opacity: saving || pressed ? 0.7 : 1 }]}
                >
                  <Text style={styles.deleteBtnText}>Mitarbeiter entfernen</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.raw.zinc950 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc900,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 30,
    color: Colors.raw.white,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.zinc400,
    marginBottom: 24,
  },

  card: {
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: Colors.raw.zinc800 },

  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
  memberRowWrap: {},
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  memberLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.raw.amber500 + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.white,
    marginBottom: 2,
  },
  memberEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  memberRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.raw.zinc300,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.raw.emerald500,
  },

  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.raw.zinc900,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.raw.zinc800,
    paddingVertical: 16,
  },
  inviteBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.amber500,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.raw.zinc900,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 22,
    color: Colors.raw.white,
  },

  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
  },

  toggleGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
  },
  toggleBtnActive: {
    backgroundColor: Colors.raw.amber500,
  },
  toggleBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  toggleBtnTextActive: {
    color: "#000",
    fontFamily: "Inter_700Bold",
  },

  sendBtn: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
    marginBottom: 10,
  },
  sendBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
  deleteBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.rose500,
  },
});