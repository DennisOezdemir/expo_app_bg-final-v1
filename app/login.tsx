import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  FadeIn,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

type Screen = "login" | "magic" | "invite" | "biometric";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, sendMagicLink, sendPasswordReset, completeInvite, isInvite } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [screen, setScreen] = useState<Screen>(isInvite ? "invite" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const [resetVisible, setResetVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteConfirm, setInviteConfirm] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const shakeX = useSharedValue(0);
  const successFlash = useSharedValue(0);

  const passwordRef = useRef<TextInput>(null);

  const validateEmail = (value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value) && value.length > 0) {
      setEmailError("Ungültige Email-Adresse");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value: string) => {
    if (value.length > 0 && value.length < 8) {
      setPasswordError("Mindestens 8 Zeichen");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const isFormValid = email.length > 0 && password.length >= 8 && !emailError;

  const formShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: successFlash.value,
  }));

  const handleLogin = async () => {
    if (!isFormValid || loading) return;
    setLoginError("");
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      setSuccess(true);
      successFlash.value = withSequence(
        withTiming(0.3, { duration: 200 }),
        withTiming(0, { duration: 300 })
      );
      setTimeout(() => {
        router.replace("/(tabs)" as any);
      }, 600);
    } else {
      setLoading(false);
      setLoginError(result.error || "Email oder Passwort falsch");
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }
  };

  const handleMagicLink = async () => {
    if (!magicEmail || magicLoading) return;
    setMagicLoading(true);
    await sendMagicLink(magicEmail);
    setMagicLoading(false);
    setMagicSent(true);
  };

  const handleReset = async () => {
    if (!resetEmail || resetLoading) return;
    setResetLoading(true);
    await sendPasswordReset(resetEmail);
    setResetLoading(false);
    setResetSent(true);
  };

  const handleInvite = async () => {
    if (invitePassword.length < 8) {
      setInviteError("Mindestens 8 Zeichen");
      return;
    }
    if (invitePassword !== inviteConfirm) {
      setInviteError("Passwörter stimmen nicht überein");
      return;
    }
    if (!inviteName.trim()) {
      setInviteError("Bitte gib deinen Namen ein");
      return;
    }
    setInviteError("");
    setInviteLoading(true);
    await completeInvite(inviteName, invitePassword);
    setTimeout(() => {
      router.replace("/(tabs)" as any);
    }, 500);
  };

  const renderLoginForm = () => (
    <Animated.View style={formShakeStyle}>
      <View style={styles.inputWrap}>
        <Ionicons name="mail-outline" size={18} color={Colors.raw.zinc500} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.raw.zinc500}
          value={email}
          onChangeText={(t) => { setEmail(t); setLoginError(""); if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) setEmailError(""); }}
          onBlur={() => validateEmail(email)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={Colors.raw.amber500}
          testID="login-email"
        />
      </View>
      {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <Ionicons name="lock-closed-outline" size={18} color={Colors.raw.zinc500} style={styles.inputIcon} />
        <TextInput
          ref={passwordRef}
          style={styles.input}
          placeholder="Passwort"
          placeholderTextColor={Colors.raw.zinc500}
          value={password}
          onChangeText={(t) => { setPassword(t); setLoginError(""); if (t.length >= 8) setPasswordError(""); }}
          onBlur={() => validatePassword(password)}
          secureTextEntry={!showPassword}
          selectionColor={Colors.raw.amber500}
          testID="login-password"
        />
        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.raw.zinc500} />
        </Pressable>
      </View>
      {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

      {loginError ? (
        <View style={styles.loginErrorWrap}>
          <Ionicons name="alert-circle" size={16} color={Colors.raw.rose400} />
          <Text style={styles.loginErrorText}>{loginError}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.loginBtn, !isFormValid && styles.loginBtnDisabled]}
        onPress={handleLogin}
        disabled={!isFormValid || loading}
        testID="login-submit"
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#000" />
            <Text style={styles.loginBtnText}>Anmelden...</Text>
          </View>
        ) : (
          <Text style={styles.loginBtnText}>ANMELDEN</Text>
        )}
      </Pressable>

      <Pressable onPress={() => { setResetVisible(true); setResetSent(false); setResetEmail(""); }} style={styles.forgotBtn}>
        <Text style={styles.forgotText}>Passwort vergessen?</Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>oder</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={styles.magicBtn}
        onPress={() => { setScreen("magic"); setMagicSent(false); setMagicEmail(""); }}
        testID="login-magic-link"
      >
        <Ionicons name="key-outline" size={18} color={Colors.raw.zinc300} />
        <Text style={styles.magicBtnText}>Mit Zugangslink anmelden</Text>
      </Pressable>
    </Animated.View>
  );

  const renderMagicLink = () => (
    <View>
      <Text style={styles.magicTitle}>Zugangslink anfordern</Text>
      <Text style={styles.magicSub}>Wir senden dir einen Anmeldelink per Email.</Text>

      {!magicSent ? (
        <>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={Colors.raw.zinc500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Deine Email-Adresse"
              placeholderTextColor={Colors.raw.zinc500}
              value={magicEmail}
              onChangeText={setMagicEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              selectionColor={Colors.raw.amber500}
              testID="magic-email"
            />
          </View>
          <Pressable
            style={[styles.loginBtn, !magicEmail && styles.loginBtnDisabled, { marginTop: 16 }]}
            onPress={handleMagicLink}
            disabled={!magicEmail || magicLoading}
            testID="magic-send"
          >
            {magicLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="mail-outline" size={18} color="#000" />
                <Text style={styles.loginBtnText}>Link an {magicEmail || "..."} senden</Text>
              </View>
            )}
          </Pressable>
        </>
      ) : (
        <View style={styles.sentConfirm}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.raw.emerald500} />
          <Text style={styles.sentTitle}>Link gesendet!</Text>
          <Text style={styles.sentSub}>Prüfe deine Emails.</Text>
        </View>
      )}

      <Pressable onPress={() => setScreen("login")} style={styles.backToLogin}>
        <Ionicons name="arrow-back" size={16} color={Colors.raw.zinc400} />
        <Text style={styles.backToLoginText}>Zurück zur Anmeldung</Text>
      </Pressable>
    </View>
  );

  const renderInvite = () => (
    <View>
      <Text style={styles.inviteWelcome}>Willkommen bei Deine Baulöwen!</Text>
      <Text style={styles.inviteSub}>Dennis hat dich eingeladen.</Text>

      <View style={styles.inputWrap}>
        <Ionicons name="person-outline" size={18} color={Colors.raw.zinc500} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Dein Name"
          placeholderTextColor={Colors.raw.zinc500}
          value={inviteName}
          onChangeText={setInviteName}
          selectionColor={Colors.raw.amber500}
          testID="invite-name"
        />
      </View>

      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <Ionicons name="lock-closed-outline" size={18} color={Colors.raw.zinc500} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Passwort festlegen"
          placeholderTextColor={Colors.raw.zinc500}
          value={invitePassword}
          onChangeText={setInvitePassword}
          secureTextEntry
          selectionColor={Colors.raw.amber500}
          testID="invite-password"
        />
      </View>

      <View style={[styles.inputWrap, { marginTop: 12 }]}>
        <Ionicons name="lock-closed-outline" size={18} color={Colors.raw.zinc500} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Passwort bestätigen"
          placeholderTextColor={Colors.raw.zinc500}
          value={inviteConfirm}
          onChangeText={setInviteConfirm}
          secureTextEntry
          selectionColor={Colors.raw.amber500}
          testID="invite-confirm"
        />
      </View>

      <View style={styles.inviteRole}>
        <Text style={styles.inviteRoleLabel}>Deine Rolle:</Text>
        <View style={styles.inviteRoleBadge}>
          <Ionicons name="construct-outline" size={14} color={Colors.raw.amber500} />
          <Text style={styles.inviteRoleText}>Monteur</Text>
        </View>
      </View>
      <View style={styles.inviteRole}>
        <Text style={styles.inviteRoleLabel}>Gewerk:</Text>
        <Text style={styles.inviteRoleValue}>Maler</Text>
      </View>

      {inviteError ? (
        <View style={styles.loginErrorWrap}>
          <Ionicons name="alert-circle" size={16} color={Colors.raw.rose400} />
          <Text style={styles.loginErrorText}>{inviteError}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.loginBtn, { marginTop: 20 }]}
        onPress={handleInvite}
        disabled={inviteLoading}
        testID="invite-submit"
      >
        {inviteLoading ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={styles.loginBtnText}>LOS GEHT'S</Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Animated.View style={[styles.successFlash, flashStyle]} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoSection}>
            <View style={styles.logoWrap}>
              <Ionicons name="construct" size={44} color={Colors.raw.amber500} />
            </View>
            <Text style={styles.logoText}>BAUGENIUS</Text>
            <Text style={styles.tagline}>Von Sklave zu Chef.</Text>
          </View>

          <View style={styles.formSection}>
            {screen === "login" && renderLoginForm()}
            {screen === "magic" && renderMagicLink()}
            {screen === "invite" && renderInvite()}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerCopy}>&copy; 2026 Deine Baulöwen GmbH</Text>
            <View style={styles.footerLinks}>
              <Pressable><Text style={styles.footerLink}>Impressum</Text></Pressable>
              <Text style={styles.footerDot}>&bull;</Text>
              <Pressable><Text style={styles.footerLink}>Datenschutz</Text></Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={resetVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setResetVisible(false)}
      >
        <View style={[styles.resetContainer, { paddingTop: topPad }]}>
          <View style={styles.resetHeader}>
            <Pressable onPress={() => setResetVisible(false)} style={styles.resetClose}>
              <Ionicons name="close" size={24} color={Colors.raw.zinc400} />
            </Pressable>
            <Text style={styles.resetTitle}>Passwort zurücksetzen</Text>
          </View>

          <View style={styles.resetContent}>
            {!resetSent ? (
              <>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={Colors.raw.zinc500} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Deine Email-Adresse"
                    placeholderTextColor={Colors.raw.zinc500}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    selectionColor={Colors.raw.amber500}
                    testID="reset-email"
                  />
                </View>
                <Pressable
                  style={[styles.loginBtn, !resetEmail && styles.loginBtnDisabled, { marginTop: 16 }]}
                  onPress={handleReset}
                  disabled={!resetEmail || resetLoading}
                  testID="reset-send"
                >
                  {resetLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <View style={styles.loadingRow}>
                      <Ionicons name="mail-outline" size={18} color="#000" />
                      <Text style={styles.loginBtnText}>Link senden</Text>
                    </View>
                  )}
                </Pressable>
              </>
            ) : (
              <View style={styles.sentConfirm}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.raw.emerald500} />
                <Text style={styles.sentTitle}>Reset-Link gesendet</Text>
                <Text style={styles.sentSub}>Prüfe deine Emails.</Text>
                <Pressable onPress={() => setResetVisible(false)} style={[styles.loginBtn, { marginTop: 20, width: "100%" }]}>
                  <Text style={styles.loginBtnText}>Schließen</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  successFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.raw.emerald500,
    zIndex: 100,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 48,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoText: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 28,
    color: Colors.raw.amber500,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginTop: 6,
  },
  formSection: {
    flex: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.raw.white,
    paddingVertical: 16,
  },
  eyeBtn: {
    padding: 6,
  },
  fieldError: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.rose400,
    marginTop: 6,
    marginLeft: 4,
  },
  loginErrorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  loginErrorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.rose400,
  },
  loginBtn: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  loginBtnDisabled: {
    backgroundColor: Colors.raw.zinc700,
  },
  loginBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#000",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  forgotBtn: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 6,
  },
  forgotText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc400,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.raw.zinc800,
  },
  dividerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.zinc600,
  },
  magicBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.raw.zinc700,
    paddingVertical: 16,
    gap: 10,
  },
  magicBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.raw.zinc300,
  },
  magicTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
    marginBottom: 6,
  },
  magicSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
    marginBottom: 20,
  },
  sentConfirm: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
  sentTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.raw.white,
  },
  sentSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  backToLogin: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
    paddingVertical: 10,
  },
  backToLoginText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
  },
  inviteWelcome: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
    textAlign: "center",
    marginBottom: 4,
  },
  inviteSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc400,
    textAlign: "center",
    marginBottom: 24,
  },
  inviteRole: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingHorizontal: 4,
  },
  inviteRoleLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.raw.zinc500,
  },
  inviteRoleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.zinc800,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inviteRoleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.raw.amber500,
  },
  inviteRoleValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.raw.white,
  },
  footer: {
    alignItems: "center",
    paddingTop: 40,
    gap: 6,
  },
  footerCopy: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc600,
  },
  footerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
  },
  footerDot: {
    fontSize: 11,
    color: Colors.raw.zinc700,
  },
  resetContainer: {
    flex: 1,
    backgroundColor: Colors.raw.zinc950,
  },
  resetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  resetClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.raw.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  resetTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.raw.white,
  },
  resetContent: {
    paddingHorizontal: 28,
    paddingTop: 20,
  },
});
