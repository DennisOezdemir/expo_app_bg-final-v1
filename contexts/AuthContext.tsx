import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextValue {
  isAuthenticated: boolean;
  splashSeen: boolean;
  isLoading: boolean;
  user: { name: string; email: string; role: string; gewerk?: string } | null;
  isInvite: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  socialLogin: (provider: "google" | "apple") => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  markSplashSeen: () => Promise<void>;
  setInviteMode: (invite: boolean) => void;
  completeInvite: (name: string, password: string) => Promise<{ success: boolean }>;
  sendMagicLink: (email: string) => Promise<{ success: boolean }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SPLASH_KEY = "baugenius_splash_seen";
const AUTH_KEY = "baugenius_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [splashSeen, setSplashSeen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [isInvite, setIsInvite] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [splashFlag, authData] = await Promise.all([
          AsyncStorage.getItem(SPLASH_KEY),
          AsyncStorage.getItem(AUTH_KEY),
        ]);
        if (splashFlag === "true") setSplashSeen(true);
        if (authData) {
          const parsed = JSON.parse(authData);
          setUser(parsed);
          setIsAuthenticated(true);
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const markSplashSeen = async () => {
    setSplashSeen(true);
    await AsyncStorage.setItem(SPLASH_KEY, "true");
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 1200));
    if (password.length < 8) {
      return { success: false, error: "Email oder Passwort falsch" };
    }
    const userData = { name: "Dennis Müller", email, role: "GF" };
    setUser(userData);
    setIsAuthenticated(true);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    return { success: true };
  };

  const socialLogin = async (provider: "google" | "apple"): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 1000));
    const providerEmail = provider === "google" ? "dennis@gmail.com" : "dennis@icloud.com";
    const userData = { name: "Dennis Müller", email: providerEmail, role: "GF" };
    setUser(userData);
    setIsAuthenticated(true);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    return { success: true };
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    await AsyncStorage.removeItem(AUTH_KEY);
    await AsyncStorage.removeItem(SPLASH_KEY);
    setSplashSeen(false);
  };

  const setInviteMode = (invite: boolean) => setIsInvite(invite);

  const completeInvite = async (name: string, password: string): Promise<{ success: boolean }> => {
    await new Promise(r => setTimeout(r, 1000));
    const userData = { name, email: "monteur@bauloewen.de", role: "Monteur", gewerk: "Maler" };
    setUser(userData);
    setIsAuthenticated(true);
    setIsInvite(false);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    return { success: true };
  };

  const sendMagicLink = async (email: string): Promise<{ success: boolean }> => {
    await new Promise(r => setTimeout(r, 800));
    return { success: true };
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean }> => {
    await new Promise(r => setTimeout(r, 800));
    return { success: true };
  };

  const value = useMemo(() => ({
    isAuthenticated,
    splashSeen,
    isLoading,
    user,
    isInvite,
    login,
    socialLogin,
    logout,
    markSplashSeen,
    setInviteMode,
    completeInvite,
    sendMagicLink,
    sendPasswordReset,
  }), [isAuthenticated, splashSeen, isLoading, user, isInvite]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
