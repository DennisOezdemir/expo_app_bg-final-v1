import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useRef } from "react";

export type LogType = "api" | "event" | "error" | "auth" | "ai" | "realtime";

export interface DebugLogEntry {
  id: string;
  type: LogType;
  timestamp: number;
  method?: string;
  endpoint?: string;
  status?: number;
  latency?: number;
  rowCount?: number;
  message?: string;
  detail?: string;
  payload?: unknown;
  request?: unknown;
  response?: unknown;
  eventType?: string;
  project?: string;
  user?: string;
  role?: string;
  component?: string;
  stack?: string;
  tokensIn?: number;
  tokensOut?: number;
  query?: string;
  channel?: string;
}

export type LogFilter = "all" | LogType;

interface DebugLogContextValue {
  logs: DebugLogEntry[];
  errorCount: number;
  addLog: (entry: Omit<DebugLogEntry, "id" | "timestamp">) => void;
  clearLogs: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
}

const DebugLogContext = createContext<DebugLogContextValue | null>(null);

let nextId = 1;

export function DebugLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const logsRef = useRef<DebugLogEntry[]>([]);

  const addLog = useCallback((entry: Omit<DebugLogEntry, "id" | "timestamp">) => {
    const newEntry: DebugLogEntry = {
      ...entry,
      id: String(nextId++),
      timestamp: Date.now(),
    };
    logsRef.current = [newEntry, ...logsRef.current].slice(0, 200);
    setLogs(logsRef.current);
  }, []);

  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setLogs([]);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const errorCount = useMemo(() => logs.filter((l) => l.type === "error" || (l.type === "api" && l.status && l.status >= 400)).length, [logs]);

  const value = useMemo(() => ({
    logs,
    errorCount,
    addLog,
    clearLogs,
    isOpen,
    setIsOpen,
    toggleOpen,
  }), [logs, errorCount, addLog, clearLogs, isOpen, setIsOpen, toggleOpen]);

  return (
    <DebugLogContext.Provider value={value}>
      {children}
    </DebugLogContext.Provider>
  );
}

export function useDebugLog() {
  const context = useContext(DebugLogContext);
  if (!context) {
    throw new Error("useDebugLog must be used within a DebugLogProvider");
  }
  return context;
}
