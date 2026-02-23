# STABILITY PLAN — E2E Tests & Stabilität
## Baugenius Audit & Fahrplan

> **Stand:** 23.02.2026
> **Scope:** Codebase Audit, E2E-Test-Strategie, Monitoring, Bugfixes
> **Priorität:** Stabilität vor Features

---

## 1. AUDIT-ERGEBNISSE

### 1.1 Bekannte Bugs (nach Severity)

| # | Severity | Modul | Problem | Impact | Fix |
|---|----------|-------|---------|--------|-----|
| B1 | MEDIUM | MX_06 | Supabase Logging gibt HTTP 400 — `continueOnFail` schluckt den Fehler | Keine AI-Logs in DB | Payload-Format prüfen, Tabelle `ai_logs` Schema checken |
| B2 | MEDIUM | MX_03 | V1 noch aktiv parallel zu V2 — potenziell doppelte Classifications | Duplicate Events | V1 deaktivieren sobald V2 stabil (Handover 28.01.) |
| B3 | LOW | M2_11 | `AI Translate` + `Save Translations` sind Stubs — keine echte AI-Integration | Feature nicht nutzbar | Claude API anbinden oder Feature entfernen |
| B4 | LOW | M4_07 | `Send Order Email` ist Stub — loggt nur, sendet nicht | Bestellungen werden nicht verschickt | SMTP/SendGrid integrieren |
| B5 | LOW | Event Routing | `PURCHASE_INVOICE_CREATED` hat kein Routing-Ziel (`is_active: false`) | Eingangsrechnungen erzeugen Events die niemand verarbeitet | Ziel-Flow definieren oder Event-Typ deaktivieren |

### 1.2 TypeScript-Gesundheit

**`tsc --noEmit` Ergebnis: ~48 Fehler**

Die meisten sind Dependency-Probleme (fehlende Type-Deklarationen weil `node_modules` nicht installiert):

| Kategorie | Anzahl | Ursache | Fix |
|-----------|--------|---------|-----|
| Missing `@types/node` | ~15 | server/ nutzt Node APIs ohne Types | `npm i -D @types/node` |
| Missing module declarations | ~10 | Deps nicht installiert | `npm install` |
| Implicit `any` in server/ | ~12 | Express-Handler ohne Typen | Typen hinzufügen |
| `tsconfig.json` base missing | 1 | `expo/tsconfig.base` nicht gefunden | Nach `npm install` gelöst |

**Empfehlung:** Separate `tsconfig.server.json` für Server-Code mit eigenen `lib`-Settings.

### 1.3 Test-Infrastruktur: NICHT VORHANDEN

| Kategorie | Status |
|-----------|--------|
| Unit Tests | Keine |
| Integration Tests | Keine |
| E2E Tests | Keine |
| CI/CD Pipeline | Keine |
| `npm test` Script | Nicht definiert |
| Linting | ESLint konfiguriert (aber `eslint` Modul fehlt ohne `npm install`) |
| n8n Workflow Tests | Nur manuell via Chat Trigger |
| DB Migration Tests | Keine |

### 1.4 n8n Workflow Health

| Aspekt | Score | Details |
|--------|-------|---------|
| Error Handling | 9/10 | Alle Flows nutzen MX_01_Error_Handler |
| Event-Driven Pattern | 9/10 | Sauber über `events` Tabelle |
| Idempotenz | 7/10 | M2_11 fehlt `claim_workflow_step` |
| Konfiguration | 5/10 | Hardcoded Telegram Token, Chat ID, URLs |
| Git-Coverage | 6/10 | 6 M1-Flows nicht im Repo (nur in n8n Prod) |

### 1.5 Sicherheit

| Issue | Severity | Detail |
|-------|----------|--------|
| Telegram Bot Token im Git | HIGH | Sichtbar in `docs/n8n-flows/M2_01*.json` und `M2_02*.json` |
| Hardcoded Chat ID | MEDIUM | `6088921678` in 10 Workflows |
| Supabase URL in Flows | MEDIUM | Direkte URLs in JSON-Exports |

---

## 2. E2E-TEST-STRATEGIE

### 2.1 M1 Intake Chain — Vollständiger E2E-Test

**Kette:** Email → M1_01 → M1_02 → MX_00 → M1_04a → M1_04b → M1_04c → M1_05 → Telegram

#### Voraussetzungen
- [ ] Test-Email vorbereiten (SAGA-Format mit PDF-Anhang)
- [ ] Test-Gmail-Label `02_Geschaeft_Projekte/Auftraege` bestätigen
- [ ] Supabase DB Zugang für Monitoring
- [ ] n8n Execution-Log Zugang

#### Test-Schritte

```
SCHRITT 1: Test-Email senden
├── An: Gmail (konfiguriertes Konto)
├── Format: SAGA-Auftrag mit PDF
├── Betreff: "[TEST] Auftrag Musterstraße 12"
└── Erwartung: Label wird automatisch gesetzt

SCHRITT 2: M1_01 Email Trigger (max 5 Min warten)
├── Check: n8n Execution erfolgreich?
├── Check: Email erkannt und weitergeleitet?
└── Erwartung: M1_02 wird getriggert

SCHRITT 3: M1_02 PDF Parser
├── Check: Claude Vision extrahiert Kopfdaten?
├── Check: Projekt in `projects` Tabelle angelegt?
├── Check: Event `PROJECT_CREATED` in `events` Tabelle?
├── Check: `idempotency_key` gesetzt?
└── Erwartung: Event hat payload mit project_id

SCHRITT 4: MX_00 Event Router
├── Check: Event von Webhook empfangen?
├── Check: Routing zu M1_04a korrekt?
├── Check: Keine Einträge in `dispatch_errors`?
└── Erwartung: M1_04a wird aufgerufen

SCHRITT 5: M1_04a Prepare Drive
├── Check: Jahresordner existiert/erstellt?
├── Check: Event `DRIVE_YEAR_READY` erstellt?
└── Erwartung: Weiter zu M1_04b

SCHRITT 6: M1_04b Create Project Tree
├── Check: Projektordner + 9 Subfolders erstellt?
├── Check: `drive_folder_id` in projects gespeichert?
├── Check: Event `DRIVE_TREE_CREATED` erstellt?
└── Erwartung: Weiter zu M1_04c

SCHRITT 7: M1_04c Sync Initial Files
├── Check: PDF aus Supabase Storage nach Drive kopiert?
├── Check: Event `DRIVE_SETUP_COMPLETE` erstellt?
└── Erwartung: Weiter zu M1_05

SCHRITT 8: M1_05 Notification
├── Check: Telegram-Nachricht empfangen?
├── Check: Nachricht enthält Projekt-Infos?
├── Check: Event `NOTIFICATION_SENT` erstellt?
└── Erwartung: Kette komplett ✅
```

#### Validierung nach E2E-Test

```sql
-- Alle Events der Kette prüfen
SELECT event_type, processed_at, source_flow, created_at
FROM events
WHERE project_id = '<test_project_id>'
ORDER BY created_at;

-- Erwartetes Ergebnis:
-- PROJECT_CREATED       | processed | M1_02_PDF_Parser
-- DRIVE_YEAR_READY      | processed | M1_04a_Prepare_Drive
-- DRIVE_TREE_CREATED    | processed | M1_04b_Create_Project_Tree
-- DRIVE_SETUP_COMPLETE  | processed | M1_04c_Sync_Initial_Files
-- NOTIFICATION_SENT     | processed | M1_05_Notification

-- Projekt korrekt angelegt?
SELECT project_number, client_name, status, drive_folder_id
FROM projects
WHERE id = '<test_project_id>';

-- Keine Dispatch-Fehler?
SELECT * FROM dispatch_errors
WHERE created_at > now() - INTERVAL '1 hour';

-- Keine unverarbeiteten Events?
SELECT * FROM events
WHERE processed_at IS NULL
  AND created_at > now() - INTERVAL '1 hour';
```

#### Fehlerszenarien testen

| Szenario | Wie testen | Erwartung |
|----------|-----------|-----------|
| Doppelte Email | Gleiche Email nochmal senden | `idempotency_key` verhindert Duplikat |
| PDF ohne Kopfdaten | Email ohne Anhang senden | Graceful Error, MX_01 loggt |
| Drive API Down | (schwer zu simulieren) | Event bleibt unprocessed, Sweeper retried |
| Telegram Down | Bot Token temporär invalidieren | Error in events, Rest der Kette ok |

### 2.2 Weitere E2E-Tests (nach M1)

| Kette | Priorität | Flows |
|-------|-----------|-------|
| M4 Eingangsrechnung | Hoch | M4_01/M4_02 → Event → ? |
| M2 Inspection Protocol | Mittel | Tally Webhook → M2_01 → M2_02/M2_03 |
| M6 Lexware Sync | Mittel | M6_01 → M6_02 → Lexware API |
| MX_03 Document Classification | Niedrig | Superchat → MX_03_V2 → Routing |

---

## 3. MONITORING & OBSERVABILITY

### 3.1 Sofort umsetzbar (mit bestehenden Tools)

#### Event-Health-Dashboard (SQL View)

```sql
CREATE OR REPLACE VIEW v_event_health AS
SELECT
  date_trunc('hour', created_at) AS hour,
  event_type,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE processed_at IS NOT NULL) AS processed,
  COUNT(*) FILTER (WHERE processed_at IS NULL) AS pending,
  COUNT(*) FILTER (
    WHERE processed_at IS NULL
    AND created_at < now() - INTERVAL '10 minutes'
  ) AS stuck,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) AS avg_processing_seconds
FROM events
WHERE created_at > now() - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;
```

#### Stuck-Events Alert (n8n Cron Flow)

```
Neuer Flow: MX_05_Health_Monitor
├── Trigger: Cron alle 15 Min
├── Query: SELECT * FROM events WHERE processed_at IS NULL AND created_at < now() - INTERVAL '15 minutes'
├── IF count > 0:
│   └── Telegram Alert: "⚠️ {count} Events stuck seit >15 Min: {event_types}"
└── Query: SELECT * FROM dispatch_errors WHERE created_at > now() - INTERVAL '15 minutes'
    └── IF count > 0:
        └── Telegram Alert: "🔴 {count} Dispatch-Fehler: {details}"
```

#### Flow Execution Log (n8n View)

```sql
-- Täglicher Health-Check
CREATE OR REPLACE VIEW v_daily_flow_health AS
SELECT
  date_trunc('day', created_at) AS day,
  source_flow,
  COUNT(*) AS executions,
  COUNT(*) FILTER (WHERE error_log IS NOT NULL) AS errors,
  ROUND(
    COUNT(*) FILTER (WHERE error_log IS NOT NULL)::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS error_rate_pct
FROM events
WHERE created_at > now() - INTERVAL '30 days'
  AND source_flow IS NOT NULL
GROUP BY 1, 2
ORDER BY 1 DESC, error_rate_pct DESC;
```

### 3.2 Mittelfristig (nächster Sprint)

| Maßnahme | Aufwand | Nutzen |
|----------|---------|--------|
| Supabase Dashboard mit v_event_health | Klein | Echtzeit-Überblick |
| n8n Error-Rate Alerting via Telegram | Klein | Sofort wissen wenn was bricht |
| Frontend: Admin-Page mit Event-Monitor | Mittel | Kein DB-Zugang nötig |
| Structured Logging in allen Flows | Mittel | Bessere Fehleranalyse |

---

## 4. PRIORISIERTER AKTIONSPLAN

### Phase 1: Sofort (diese Woche)

| # | Aktion | Typ | Aufwand |
|---|--------|-----|---------|
| 1 | **M1 E2E-Test durchführen** (siehe Abschnitt 2.1) | Test | Mittel |
| 2 | **Telegram Bot Token aus Git entfernen** | Security | Klein |
| 3 | **MX_03 V1 deaktivieren** (V2 läuft seit 28.01.) | Stability | Klein |
| 4 | **v_event_health View deployen** | Monitoring | Klein |
| 5 | **MX_05_Health_Monitor Flow erstellen** | Monitoring | Klein |

### Phase 2: Nächste Woche

| # | Aktion | Typ | Aufwand |
|---|--------|-----|---------|
| 6 | **MX_06 Logging-Bug fixen** (Supabase 400) | Bugfix | Klein |
| 7 | **PURCHASE_INVOICE_CREATED Routing klären** | Config | Klein |
| 8 | **M1-Flows aus n8n exportieren und ins Repo legen** | Docs | Mittel |
| 9 | **n8n Global Variables für hardcoded Werte** | Config | Mittel |
| 10 | **TypeScript: `@types/node` + separate Server-Config** | DX | Klein |

### Phase 3: Danach

| # | Aktion | Typ | Aufwand |
|---|--------|-----|---------|
| 11 | **CI/CD Pipeline** (GitHub Actions: lint + typecheck) | Infra | Mittel |
| 12 | **M2_11 Stub implementieren oder entfernen** | Feature/Cleanup | Mittel |
| 13 | **M4_07 Email-Versand implementieren** | Feature | Mittel |
| 14 | **Idempotenz für M2_11 nachrüsten** | Stability | Klein |
| 15 | **Migration-Audit** (048/049 ins Repo, Audit-Trail) | Docs | Klein |

---

## 5. E2E-TEST CHECKLISTE (zum Abhaken)

### M1 Intake Chain

- [ ] Test-Email vorbereitet
- [ ] Email gesendet
- [ ] M1_01 hat getriggert
- [ ] M1_02 hat PDF geparst
- [ ] Projekt in DB angelegt
- [ ] `PROJECT_CREATED` Event erstellt
- [ ] MX_00 hat geroutet
- [ ] M1_04a: Jahresordner ok
- [ ] M1_04b: Projektordner + 9 Subfolder ok
- [ ] M1_04c: PDF in Drive ok
- [ ] M1_05: Telegram-Nachricht erhalten
- [ ] Alle Events `processed_at` gesetzt
- [ ] Keine Einträge in `dispatch_errors`
- [ ] Duplikat-Test: Zweite Email wird ignoriert
- [ ] Test-Projekt aufräumen (oder als Referenz behalten)

### Post-Test Validierung

- [ ] `v_event_health` zeigt alle Events als processed
- [ ] Kein stuck Event älter als 15 Min
- [ ] Drive-Ordnerstruktur korrekt (9 Subfolders)
- [ ] Projekt-Status in DB korrekt

---

## 6. GIT-HYGIENE

### Fehlende Exports (n8n → Git)

Diese Flows existieren in n8n Production, aber nicht im Repository:

| Flow | n8n Status | Git Status | Aktion |
|------|-----------|-----------|--------|
| M1_01_Email_Trigger | Live | Fehlt | Exportieren |
| M1_02_PDF_Parser | Live | Fehlt | Exportieren |
| M1_04a_Prepare_Drive | Live | Fehlt | Exportieren |
| M1_04b_Create_Project_Tree | Live | Fehlt | Exportieren |
| M1_04c_Sync_Initial_Files | Live | Fehlt | Exportieren |
| M1_05_Notification | Live | Fehlt | Exportieren |
| M4_01_Receipt_Scanner | Live | Fehlt | Exportieren |
| M4_02_Mail_Invoice_Scanner | Live | Fehlt | Exportieren |
| MX_00_Event_Router v2 | Live | Fehlt | Exportieren |
| MX_01_Error_Handler | Live | Fehlt | Exportieren |

### Fehlende Migrationen

| Migration | Erwähnt in | Git Status |
|-----------|-----------|-----------|
| 048 (fix_project_materials_unique) | HANDOVER_2026-01-27 | Fehlt |
| 049 (classified_emails.updated_at + flow_logs) | HANDOVER_2026-01-28 | Fehlt |

---

*Erstellt: 23.02.2026 — Audit durch Codebase-Analyse*
