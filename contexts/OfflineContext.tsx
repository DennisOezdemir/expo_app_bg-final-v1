import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export type SyncItemType = "photo" | "timestamp" | "chat" | "checklist" | "begehung";

export interface SyncQueueItem {
  id: string;
  type: SyncItemType;
  label: string;
  detail: string;
  createdAt: number;
  status: "pending" | "syncing" | "done" | "failed";
  retryCount: number;
  data?: unknown;
}

export interface CacheEntry {
  key: string;
  data: unknown;
  cachedAt: number;
  expiresIn?: number;
}

interface OfflineContextValue {
  isOnline: boolean;
  syncQueue: SyncQueueItem[];
  syncProgress: { current: number; total: number } | null;
  isSyncing: boolean;
  lastSyncAt: number | null;
  addToSyncQueue: (item: Omit<SyncQueueItem, "id" | "createdAt" | "status" | "retryCount">) => void;
  syncNow: () => Promise<void>;
  removeSyncItem: (id: string) => void;
  getCached: <T>(key: string) => Promise<T | null>;
  setCache: (key: string, data: unknown, expiresIn?: number) => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheAge: (key: string) => string | null;
  showSyncToast: SyncToast | null;
  dismissSyncToast: () => void;
}

export type SyncToast = {
  type: "progress" | "success" | "conflict" | "error";
  message: string;
  conflictAction?: () => void;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

const SYNC_QUEUE_KEY = "baugenius_sync_queue";
const CACHE_PREFIX = "baugenius_cache_";
const CACHE_INDEX_KEY = "baugenius_cache_index";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function formatAge(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "gerade eben";
  if (mins < 60) return `vor ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  return `vor ${days}d`;
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [showSyncToast, setShowSyncToast] = useState<SyncToast | null>(null);
  const [cacheTimestamps, setCacheTimestamps] = useState<Record<string, number>>({});
  const syncingRef = useRef(false);
  const queueRef = useRef<SyncQueueItem[]>([]);

  useEffect(() => {
    const loadQueue = async () => {
      try {
        const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as SyncQueueItem[];
          const pending = parsed.filter(i => i.status !== "done");
          setSyncQueue(pending);
          queueRef.current = pending;
        }
      } catch {}
    };

    const loadCacheIndex = async () => {
      try {
        const stored = await AsyncStorage.getItem(CACHE_INDEX_KEY);
        if (stored) setCacheTimestamps(JSON.parse(stored));
      } catch {}
    };

    loadQueue();
    loadCacheIndex();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(prev => {
        if (!prev && online && queueRef.current.length > 0) {
          setTimeout(() => syncNow(), 500);
        }
        return online;
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState: string) => {
      if (nextState === "active") {
        NetInfo.fetch().then((s: any) => {
          const online = !!(s.isConnected && s.isInternetReachable !== false);
          setIsOnline(online);
          if (online && queueRef.current.length > 0) {
            syncNow();
          }
        });
      }
    });
    return () => sub.remove();
  }, []);

  const persistQueue = useCallback(async (items: SyncQueueItem[]) => {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const addToSyncQueue = useCallback((item: Omit<SyncQueueItem, "id" | "createdAt" | "status" | "retryCount">) => {
    const newItem: SyncQueueItem = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
      status: "pending",
      retryCount: 0,
    };
    const updated = [newItem, ...queueRef.current];
    queueRef.current = updated;
    setSyncQueue(updated);
    persistQueue(updated);
  }, [persistQueue]);

  const removeSyncItem = useCallback((id: string) => {
    const updated = queueRef.current.filter(i => i.id !== id);
    queueRef.current = updated;
    setSyncQueue(updated);
    persistQueue(updated);
  }, [persistQueue]);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    const pending = queueRef.current.filter(i => i.status === "pending" || i.status === "failed");
    if (pending.length === 0) {
      syncingRef.current = false;
      setIsSyncing(false);
      return;
    }

    setSyncProgress({ current: 0, total: pending.length });
    setShowSyncToast({ type: "progress", message: `Synchronisiere... 0/${pending.length}` });

    let completed = 0;

    for (const item of pending) {
      const updated = queueRef.current.map(i =>
        i.id === item.id ? { ...i, status: "syncing" as const } : i
      );
      queueRef.current = updated;
      setSyncQueue([...updated]);

      await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

      completed++;
      setSyncProgress({ current: completed, total: pending.length });
      setShowSyncToast({ type: "progress", message: `Synchronisiere... ${completed}/${pending.length}` });

      const done = queueRef.current.map(i =>
        i.id === item.id ? { ...i, status: "done" as const } : i
      );
      queueRef.current = done;
      setSyncQueue([...done]);
    }

    await persistQueue(queueRef.current);

    setTimeout(() => {
      const cleaned = queueRef.current.filter(i => i.status !== "done");
      queueRef.current = cleaned;
      setSyncQueue(cleaned);
      persistQueue(cleaned);
    }, 2000);

    setLastSyncAt(Date.now());
    setSyncProgress(null);
    setShowSyncToast({ type: "success", message: "Alles synchronisiert" });
    setTimeout(() => setShowSyncToast(null), 3000);

    syncingRef.current = false;
    setIsSyncing(false);
  }, [persistQueue]);

  const setCache = useCallback(async (key: string, data: unknown, expiresIn?: number) => {
    try {
      const entry: CacheEntry = { key, data, cachedAt: Date.now(), expiresIn };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
      const newTimestamps = { ...cacheTimestamps, [key]: Date.now() };
      setCacheTimestamps(newTimestamps);
      await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(newTimestamps));
    } catch {}
  }, [cacheTimestamps]);

  const getCached = useCallback(async <T,>(key: string): Promise<T | null> => {
    try {
      const stored = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!stored) return null;
      const entry: CacheEntry = JSON.parse(stored);
      if (entry.expiresIn && Date.now() - entry.cachedAt > entry.expiresIn) {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data as T;
    } catch {
      return null;
    }
  }, []);

  const getCacheAge = useCallback((key: string): string | null => {
    const ts = cacheTimestamps[key];
    if (!ts) return null;
    return formatAge(Date.now() - ts);
  }, [cacheTimestamps]);

  const clearCache = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove([...cacheKeys, CACHE_INDEX_KEY]);
      setCacheTimestamps({});
    } catch {}
  }, []);

  const dismissSyncToast = useCallback(() => {
    setShowSyncToast(null);
  }, []);

  const value = useMemo(() => ({
    isOnline,
    syncQueue,
    syncProgress,
    isSyncing,
    lastSyncAt,
    addToSyncQueue,
    syncNow,
    removeSyncItem,
    getCached,
    setCache,
    clearCache,
    getCacheAge,
    showSyncToast,
    dismissSyncToast,
  }), [isOnline, syncQueue, syncProgress, isSyncing, lastSyncAt, addToSyncQueue, syncNow, removeSyncItem, getCached, setCache, clearCache, getCacheAge, showSyncToast, dismissSyncToast]);

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error("useOffline must be used within OfflineProvider");
  return ctx;
}
