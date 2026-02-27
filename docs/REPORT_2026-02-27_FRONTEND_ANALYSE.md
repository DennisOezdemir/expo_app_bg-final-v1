# BauGenius Frontend-Analyse Report
> **Datum:** 2026-02-27 | **Stack:** Expo + React Native + TypeScript

---

## EXECUTIVE SUMMARY

**Frontend Status: ~40% Completion**

| Bereich | Status |
|---------|--------|
| Navigation | 95% |
| Auth | 100% |
| Screens | 50% (34 vorhanden, meist Gerüst) |
| Daten-Integration | **10%** (nur projekte.tsx hat echte Daten) |
| React Query | **0%** (installiert, nirgends genutzt) |
| Realtime | **0%** |
| Design-Compliance | 85% |

---

## KRITISCHE FINDINGS

### 1. React Query NICHT GENUTZT
- `@tanstack/react-query ^5.83.0` ist installiert
- QueryClientProvider wraps Root
- **Kein einziger useQuery() oder useMutation() im ganzen App**

### 2. Nur 1 Screen mit echten Daten
- `projekte.tsx` macht Supabase Query (einziger Screen!)
- Alle anderen 33 Screens: Mock oder keine Daten

### 3. Keine Realtime Subscriptions
- supabase.realtime nicht genutzt
- Daten werden nicht live aktualisiert

### 4. Offline-Integration unvollständig
- OfflineContext existiert, aber kein Screen nutzt es

---

## SCREEN-STATUS (34 Screens)

### FERTIG (echte Daten, funktional)
| Screen | Details |
|--------|---------|
| /login | Supabase Auth (Social, Magic Links) |
| /splash | OnBoarding komplett |
| (tabs)/projekte | Supabase Query, Status-Filter, Budget |

### TEILWEISE (UI da, Daten teilweise)
| Screen | Details |
|--------|---------|
| (tabs)/material | Projekte geladen, Items hardcoded |
| (tabs)/finanzen | HeroCards da, keine Berechnungen |

### MOCK (Fake-Daten)
| Screen | Details |
|--------|---------|
| (tabs)/index (Home) | 100% Mock-Zahlen |
| (tabs)/freigaben | 4 hardcoded Approvals |
| (tabs)/meinjob | Tasks hardcoded |
| (tabs)/foto | 3 Mock-Fotos |
| (tabs)/zeiten | Mock Times |
| /angebote | Mock |

### GERÜST (nur Layout)
| Screen | Details |
|--------|---------|
| (tabs)/profil | Minimal |
| /project/[id] | 30% UI |
| /chat/[id] | Gerüst |
| /begehung | Gerüst |
| /planung | Gerüst |
| /bestellung | Gerüst |
| /rechnung/[id] | Gerüst |
| /freigabe/[id] | Gerüst |
| /einstellungen/* (6x) | Gerüst |

---

## KOMPONENTEN (9 — alle funktional)

TopBar, OfflineBanner, BGAssistant (KI FAB), ErrorBoundary, ErrorFallback, DebugConsole, DebugLogSeeder, SyncQueuePanel, KeyboardAwareScrollViewCompat

**Fehlend:** PageShell, DataList, shadcn/ui Library

---

## CONTEXTS (4 — alle korrekt)

1. **AuthContext** — Supabase Auth, Magic Links, Social Login
2. **RoleContext** — Impersonation, Permissions, Views (GF/BL/Monteur)
3. **OfflineContext** — Sync Queue, Cache, NetInfo
4. **DebugLogContext** — Logging für Dev

---

## DATEN-ARCHITEKTUR: IST vs. SOLL

**IST:** Direkte useState + useEffect + supabase.from().select()
**SOLL:** React Query Hooks (useProjects, useOffers, useFreigaben, useProjectDetail)

---

## NÄCHSTE SCHRITTE

| Prio | Aktion |
|------|--------|
| 1 | React Query Hooks schreiben (useProjects, useOffers, etc.) |
| 2 | Alle Screens mit echten Daten verbinden |
| 3 | Realtime Subscriptions aktivieren |
| 4 | Error/Loading/Empty States konsistent machen |
| 5 | Offline-Sync Integration |
| 6 | M3 Nachträge Frontend |

---

*Generiert: 2026-02-27 | Agent: frontend-analyst*
