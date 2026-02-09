import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  gewerk?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  splashSeen: boolean;
  isLoading: boolean;
  user: AppUser | null;
  isInvite: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  socialLogin: (provider: "google" | "apple") => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  markSplashSeen: () => Promise<void>;
  setInviteMode: (invite: boolean) => void;
  completeInvite: (name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SPLASH_KEY = "baugenius_splash_seen";

function mapSupabaseUser(user: User): AppUser {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    name: meta.full_name || meta.name || user.email?.split("@")[0] || "Benutzer",
    email: user.email || "",
    role: meta.role || "GF",
    gewerk: meta.gewerk,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [splashSeen, setSplashSeen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isInvite, setIsInvite] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SPLASH_KEY).then((val) => {
      if (val === "true") setSplashSeen(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const markSplashSeen = async () => {
    setSplashSeen(true);
    await AsyncStorage.setItem(SPLASH_KEY, "true");
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message === "Invalid login credentials"
        ? "Email oder Passwort falsch"
        : error.message };
    }
    return { success: true };
  };

  const socialLogin = async (provider: "google" | "apple"): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(SPLASH_KEY);
    setSplashSeen(false);
  };

  const setInviteMode = (invite: boolean) => setIsInvite(invite);

  const completeInvite = async (name: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.updateUser({
      password,
      data: { full_name: name },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    setIsInvite(false);
    return { success: true };
  };

  const sendMagicLink = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return { success: false, error: error.message };
    }
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
