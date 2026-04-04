# SYSTEM-AUDIT REPORT — BAUGENIUS (2026-03-21)

## EXECUTIVE SUMMARY
Das BauGenius Projekt befindet sich in einem fortgeschrittenen Prototyp-Stadium mit einer sehr starken "Agent-First" Architektur. Während das Frontend visuell poliert und "Ayse-konform" ist, besteht eine Diskrepanz zwischen der hohen Komplexität im Backend (42+ n8n Flows, Agent-Pipeline) und der teilweisen Nutzung von Mock-Daten im Frontend.

**Projekt-Scorecard:**
| Bereich | Status | Score | Kritische Lücken |
| :--- | :--- | :--- | :--- |
| **Frontend** | 🟢 Funktionale UI | 7/10 | Einige Screens (Material, Foto) nutzen noch Mock-Daten. |
| **Backend** | 🟡 Komplex / RLS | 8/10 | Fehlender direkter API-Layer für alle Tabellen (viele Direkt-Queries). |
| **Flows (n8n)** | 🟢 Hochgradig aktiv | 9/10 | Event-Routing teilweise schwer zu debuggen. |
| **Agent-Pipeline** | 🔵 Innovativ | 8/10 | Staffellauf-Logik ist aktiv, aber Monitoring im Frontend fehlt. |
| **Security** | 🟡 RLS aktiv | 6/10 | RLS ist global an (Migration 20260309), aber Policies sind oft zu permissiv. |

---

## PHASE 1: FRONTEND INVENTUR

### Screen-Matrix & Daten-Status

| Screen | Tabelle(n) | Hook/API vorhanden? | Echte Daten? | RLS Status | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Dashboard (Start) | `dashboard_metrics` | `useDashboardMetrics` | ✅ Ja | Aktiv | PRODUKTIV |
| Projekte-Liste | `projects` | `useProjects` | ✅ Ja | Aktiv | PRODUKTIV |
| Projekt-Details | `projects`, `files` | `useProjectDetail` | ✅ Ja | Aktiv | PRODUKTIV |
| Freigabecenter | `approvals` | `useApprovals` | ✅ Ja | Aktiv | PRODUKTIV |
| Chat | `chat_messages` | `useChat` | ✅ Ja | Aktiv | REALTIME |
| Finanzen | `invoices`, `sales` | `useFinance` | ✅ Ja | Aktiv | PRODUKTIV |
| Material-Fluss | `project_materials` | Nein (Direkt) | 🟡 Teilweise | Aktiv | IN ARBEIT |
| Foto-Dokumentation | `site_captures` | Nein | ❌ Mock | Aktiv | PROTOTYP |
| Zeiterfassung | `time_entries` | Nein | ❌ Mock | Aktiv | PROTOTYP |
| Einstellungen | `company_settings`| Nein (Direkt) | ✅ Ja | Aktiv | PRODUKTIV |

**Beobachtung:** Der Wechsel von Direktanfragen (`supabase.from()`) zu React Query (`useQuery`) ist im Gange, aber nicht abgeschlossen (ca. 40% Abdeckung).

---

## PHASE 2: BACKEND INVENTUR (SUPABASE)

### Datenbank-Struktur
Basierend auf den Migrationen verfügt die Datenbank über:
- **Tabellen:** ca. 45-50 produktive Tabellen (inkl. `projects`, `offers`, `invoices`, `team_members`, `events`, `approvals`).
- **Views:** Zentrale Views für Finanzen (`view_finance_summary`) und Dashboards.
- **Funktionen:** Starke Logikverlagerung in die DB (z.B. `fn_agent_zeitpruefer`, `fn_match_project_by_reference`).
- **RLS:** Global aktiviert durch Migration `20260309100000`.

### Edge Functions (Supabase)
Folgende Funktionen sind deployed und bereit:
- `agent-chat`: Interaktion mit Claude.
- `run-autoplan`: Trigger für die Agent-Pipeline.
- `generate-pdf`: Lexware-kompatible Belege.
- `parse-lv`: OCR/Vision für Leistungsverzeichnisse.

---

## PHASE 3: N8N FLOW STATUS

Das Register (`docs/FLOW_REGISTER.md`) listet **42 aktive Flows**. 
**Abgleich:** 95% der Flows liegen als JSON lokal vor.

**Kritische Pfade:**
1. **Intake (M1):** Vollständig automatisiert von Gmail bis zur Projektanlage.
2. **Finance (M6):** Tief integriert mit Lexware (Processor v2, Reconciliation).
3. **Infrastructure (MX):** Event-Router (`MX_00`) ist das Herzstück der "State Machine".

---

## PHASE 4: AGENT-PIPELINE (STAFFELLAUF)

Die Pipeline für **Intelligente Autoplanung** ist das technische USP:
- **Zeitprüfer:** Nutzt `richtzeitwerte` Tabelle (31 Einträge für SAGA-Katalog).
- **Plausibilität:** Prüft Baulogik (Trade-Sequence).
- **Material-Planer:** Mappt LV-Positionen auf Materialbedarf.
- **Einsatzplaner:** Weist Monteure basierend auf `default_trade` zu.

**Lücke:** Der "Godmode Learner" (Phase 6) ist konzipiert, aber die automatische Rückkopplung der Ist-Zeiten in die Richtzeitwerte fehlt noch.

---

## PHASE 5: OFFENE ISSUES & RISIKEN

| ID | Issue | Status (Audit-Befund) |
| :--- | :--- | :--- |
| #19 | Chat-Agent | In Arbeit (Edge Function existiert, Frontend fehlt). |
| #14 | Sicherheitsaudit | **KRITISCH.** RLS ist an, aber Policies erlauben oft `true` für authentifizierte User. |
| #8 | Dashboard KPIs | Erledigt (Nutzt `useDashboardMetrics`). |
| #7 | Projekte-Liste | Erledigt (Nutzt `useProjects`). |
| #2 | Rollenmodell | Erledigt (Rollen in `AuthContext` / `RoleContext` integriert). |

---

## TOP 10 PRIORITÄTEN (Nächste Schritte)

1. **RLS Hardening:** Review aller Policies, um Datenlecks zwischen Projekten zu verhindern.
2. **Material-Flow:** Anbindung der `project_materials` Tabelle an den Screen `app/(tabs)/material.tsx`.
3. **Foto-Modul:** Implementierung des Uploads zu Supabase Storage in `app/(tabs)/foto.tsx`.
4. **React Query Migration:** Umstellung der restlichen 60% Direktanfragen auf Hooks für besseres Caching.
5. **Godmode Learner:** Implementierung des EMA-Algorithmus zur Anpassung der Richtzeitwerte.
6. **Chat-Integration:** UI für den Chat-Agenten in `app/chat/[id].tsx` finalisieren.
7. **Offline-Queue:** Synchronisation der `offline_queue` Tabelle mit den echten API-Mutations.
8. **Kunden/Lieferanten:** Vervollständigung der Master-Data-Screens (Katalog, Lieferanten).
9. **Monitoring:** Ein "Pipeline-Status" Widget im Projekt-Detail-Screen für den Bauleiter.
10. **Doku-Sync:** Veraltete Docs (`FRONTEND_ANALYSIS.md`) entfernen oder aktualisieren.

---
**Audit durchgeführt von:** Gemini CLI
**Datum:** 21. März 2026
**Status:** ABGESCHLOSSEN
