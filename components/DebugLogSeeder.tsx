import { useEffect, useRef } from "react";
import { useDebugLog } from "@/contexts/DebugLogContext";
import { setDebugLogFn } from "@/lib/query-client";
import { useRole } from "@/contexts/RoleContext";
import { useOffline } from "@/contexts/OfflineContext";

export function DebugLogSeeder() {
  const { addLog, logs } = useDebugLog();
  const { role } = useRole();
  const { addToSyncQueue, syncQueue } = useOffline();
  const seeded = useRef(false);
  const syncSeeded = useRef(false);

  useEffect(() => {
    setDebugLogFn((entry) => {
      addLog(entry as any);
    });
    return () => setDebugLogFn(null);
  }, [addLog]);

  useEffect(() => {
    if (syncSeeded.current || syncQueue.length > 0) return;
    syncSeeded.current = true;

    const demoSync = [
      { type: "photo" as const, label: "Foto", detail: "Schwentnerring Bad" },
      { type: "timestamp" as const, label: "Einstempeln 07:15", detail: "Schwentnerring 14" },
      { type: "chat" as const, label: '"Fliesen sind da"', detail: "Projekt BL-2026-003" },
      { type: "checklist" as const, label: "Begehung Punkt 3", detail: "Schwentnerring Keller" },
    ];

    demoSync.forEach((item, i) => {
      setTimeout(() => addToSyncQueue(item), 200 + i * 100);
    });
  }, [addToSyncQueue, syncQueue.length]);

  useEffect(() => {
    if (seeded.current || logs.length > 0) return;
    seeded.current = true;

    const now = Date.now();

    const demoLogs = [
      {
        type: "auth" as const,
        message: "login",
        user: "dennis@bauloewen.de",
        role: "gf",
        timestamp: now - 120000,
      },
      {
        type: "api" as const,
        method: "GET",
        endpoint: "/api/projects",
        status: 200,
        latency: 142,
        rowCount: 12,
      },
      {
        type: "api" as const,
        method: "GET",
        endpoint: "/api/project_materials",
        status: 200,
        latency: 89,
        rowCount: 160,
      },
      {
        type: "api" as const,
        method: "GET",
        endpoint: "/api/search_products",
        status: 200,
        latency: 340,
        message: '"vliesraufaser"',
      },
      {
        type: "api" as const,
        method: "POST",
        endpoint: "/api/approvals",
        status: 403,
        latency: 45,
        message: "RLS policy blocked",
        payload: { user: "monteur_mehmet" },
      },
      {
        type: "event" as const,
        eventType: "MATERIAL_ASSIGNED",
        project: "BL-2026-003",
        message: "Erfurt Vlies Rauhfaser",
      },
      {
        type: "ai" as const,
        latency: 2100,
        tokensIn: 1240,
        tokensOut: 380,
        query: 'Thermostatk\u00F6pfe f\u00FCr Fu\u00DFbodenheizung...',
      },
      {
        type: "realtime" as const,
        channel: "project:BL-2026-003",
        message: "Material update broadcast",
      },
      {
        type: "error" as const,
        message: "TypeError: Cannot read property 'price' of undefined",
        component: "MaterialRow",
        stack: "at MaterialRow (components/MaterialRow.tsx:45)\nat ProjectDetail (app/project/[id].tsx:120)",
      },
      {
        type: "api" as const,
        method: "GET",
        endpoint: "/api/invoices",
        status: 200,
        latency: 210,
        rowCount: 8,
      },
    ];

    demoLogs.forEach((log, i) => {
      setTimeout(() => addLog(log), i * 80);
    });
  }, [addLog, logs.length]);

  return null;
}
