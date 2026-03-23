# BAUGENIUS FLOW-REGISTER

> **Stand:** 2026-03-23 (Forensische Bereinigung — 16 tote Flows deaktiviert)
> **n8n:** `https://n8n.srv1045913.hstgr.cloud`
> **Architektur:** Event-Driven State Machine
> **Flows:** 28 aktiv | 93 inaktiv/archiviert | 121 gesamt

---

## ARCHITEKTUR-PRINZIPIEN

### Event-Driven (Kernprinzip)

```
Flows kommunizieren NUR ueber die events Tabelle.
Kein Execute Workflow! Keine direkten Abhaengigkeiten!

Flow A --> INSERT events (TYPE_X) --> MX_00_Router --> Flow B
```

### Belt & Suspenders

| Primaer | Backup |
|---------|--------|
| Supabase Webhook -> n8n (sofort) | MX_04 Dispatch Doctor (15 Min) |

### One Task per Flow

Jeder Flow macht EINE Aufgabe, dann Event fuer den naechsten.

---

## GMAIL-ROUTING

```
Gmail Labels/
+-- 01_Eingang                     <-- Catch-All
+-- 02_Geschaeft_Projekte
|   +-- Auftraege                  <-- MX_03 Superchat Intake
+-- 03_Finanzen                    <-- M4_01b / M6_01
|   +-- Verarbeitet
+-- 04_Tools_Systeme
+-- 05_Marketing_Info
+-- 06_Wichtig_Action
```

---

## AKTIVE FLOWS

### M1: Intake (2 aktiv, 4 deaktiviert)

| Flow | ID | Letztes Update | Status |
|------|----|----------------|--------|
| **M1_02_PDF_Parser_Vision** | `8KDtJKgrTIOV8LTw` | 2026-03-23 | aktiv |
| **M1_03_Position_Extractor_V3** | `eVbTku3Jsyf0dFdQ` | 2026-01-19 | aktiv (ACHTUNG: nie geroutet, PDF_PARSED → Nirgendwo) |
| ~~M1_04a_Prepare_Drive~~ | `kdXetd4FMCISdE4J` | 2026-01-13 | **deaktiviert 2026-03-23** (ersetzt: DB-Trigger `create_default_project_folders`) |
| ~~M1_04b_Create_Project_Tree~~ | `P0ETfL7ZozQKEeM6` | 2026-01-03 | **deaktiviert 2026-03-23** (ersetzt: gleicher DB-Trigger) |
| ~~M1_04c_Sync_Initial_Files~~ | `RNifQ36TwyKqKxOJ` | 2026-01-03 | **deaktiviert 2026-03-23** (ersetzt: `fn_file_intake_to_folder()`) |
| **M1_05_Notification** | `ixnrOVeJhF3veYwJ` | 2026-01-03 | aktiv (OFFER_ATTACHED Route aktiv, Events feuern nicht) |

### M2: Baustelle (4 aktiv, 3 deaktiviert)

| Flow | ID | Letztes Update | Status |
|------|----|----------------|--------|
| **M2_01_Monteur_Auftrag_PDF** | `v2b5w05D-CR5WxCsbbmAi` | 2026-02-27 | aktiv |
| **M2_02_Sync_ZB_Progress** | `TQoWuDki_q9IDVIJCHcHE` | 2026-02-20 | aktiv |
| **M2_03_Generate_Protocol_PDF** | `lDrZnW4bYMCpumiTbmkKl` | 2026-02-20 | aktiv |
| ~~M2_04_Inspection_Finalize~~ | `fkP3zcOg0WCCSmz3I-ivp` | 2026-02-11 | **deaktiviert 2026-03-23** (Feature nicht implementiert) |
| ~~M2_10_Sub_Order_Generator~~ | `Kqp7EajcP0ZmJ-A1-PJUI` | 2026-01-17 | **deaktiviert 2026-03-23** (Sub-Auftraege nicht implementiert) |
| **M2_10a_Schedule_Approve** | `t3HR7lIWYUjx52F2` | 2026-02-27 | aktiv |
| ~~M2_10b_Schedule_Notification~~ | `DKR3TSn8J7sa01m3` | 2026-02-27 | **deaktiviert 2026-03-23** (ersetzt: M2_10a macht beides) |

#### M2 DB-Funktionen (kein n8n noetig):
- `auto_plan_project()` — Phasen generieren + Monteur zuweisen (3-Tier Matching)
- `fn_approve_schedule()` + `confirm_proposed_phases()` — proposed → planned
- `fn_learn_schedule()` — Lernender Trigger: nach 3x gleicher Monteur → Default

### M4: Material (5 aktiv, 5 deaktiviert)

| Flow | ID | Letztes Update | Status |
|------|----|----------------|--------|
| **M4_01_Material_Planner** | `tywkXZoNvDf624tB1Qh6R` | 2026-01-28 | aktiv |
| **M4_01a_Receipt_Intake** | `sw2yaCHpuaGHSKdE` | 2026-02-02 | aktiv |
| **M4_01b_Receipt_Processor_V2_MX02** | `WSy5sWWXY29bW93b` | 2026-02-02 | aktiv (trotz Name: ruft MX_02 NICHT auf) |
| ~~M4_03a_Order_Approve~~ | `INJkwNIVjAn8TKox` | 2026-02-27 | **deaktiviert 2026-03-23** (nie verdrahtet) |
| ~~M4_03b_Order_Suggester~~ | `UlyBjJpyUsCi2rSs` | 2026-02-27 | **deaktiviert 2026-03-23** (Upstream-Event fehlt) |
| ~~M4_05_Material_List_Generator~~ | `S5gFkRmPiZ0OZYAt_Ap7T` | 2026-02-11 | **deaktiviert 2026-03-23** (Upstream M4_01 laeuft nie) |
| ~~M4_06_Order_Agent~~ | `fPY6wSReqQ4ksxlG` | 2026-02-27 | **deaktiviert 2026-03-23** (Duplikat M4_03b) |
| ~~M4_07_Order_Send~~ | `BOkKFTEUCyKagfC0` | 2026-02-27 | **deaktiviert 2026-03-23** (Approval-Kette tot) |
| **M4_08_Schedule_Order_Trigger** | `Ycs3lFXe5JCFDIo1` | 2026-02-27 | aktiv |
| **M4_10_MagicPlan_Parser** | `Tjbz4nIiHlav6Y7hr7yld` | 2026-01-25 | aktiv |

#### M4 DB-Funktionen (kein n8n noetig):
- `auto_plan_materials()` — Materialbedarf aus Angebotspositionen berechnen
- `fn_approve_material_order()` — planned → ordered Statuswechsel
- Bestellung-Screen braucht nur DB-Query statt Dummy-Daten

### M5: Freigabe (1 Flow)

| Flow | ID | Letztes Update |
|------|----|----------------|
| **M5_01_Approval_Dispatcher** | `zCs5Hwy9NmUhodI6KiyS3` | 2026-02-11 |

### M6: Finance (11 aktiv, 4 deaktiviert)

| Flow | ID | Letztes Update | Status |
|------|----|----------------|--------|
| **M6_01a_Extract_Invoice** | `DIIMg0WHbNePR19K` | 2026-03-23 | aktiv |
| **M6_01b_Match_Create** | `lu5eDVGkt2Kw1AcH` | 2026-03-23 | aktiv |
| **M6_01c_Lexware_Forward** | `JP2jpaevZAnZtKqT` | 2026-03-23 | aktiv |
| **M6_01d_Notify** | `Avyj2V3rpi5k3dPC` | 2026-03-23 | aktiv |
| ~~M6_01e_Folder_Route~~ | `RCBLxz6jItpRNO8Z` | 2026-03-23 | **deaktiviert 2026-03-23** (ersetzt: MX_08 File Router) |
| ~~M6_01_Invoice_Processor v2~~ | `gV76hOPVjNXPqZdT` | 2026-03-23 | deaktiviert (ersetzt durch M6_01a-e Staffellauf) |
| ~~M6_02a_Lexware_Push_Prepare~~ | `B4IOCwfxNg` | 2026-02-18 | deaktiviert |
| ~~M6_02b_Lexware_Contact_Sync~~ | `ilYyrjOQoG` | 2026-02-18 | deaktiviert |
| ~~M6_02c_Lexware_Push_Voucher~~ | `6C8MshufHT` | 2026-02-19 | deaktiviert |
| **M6_03_Lexware_Pull_Sales** | `AjRF0GnZVaLeckOu` | 2026-02-27 | aktiv |
| ~~M6_04a_Lexware_Webhook_Router~~ | `RbUQUOpAzYQ4Lsae` | 2026-02-27 | **deaktiviert 2026-03-23** (Pull-Modell: M6_03 + M6_10) |
| ~~M6_04b_Lexware_Payment_Handler~~ | `ORyFbRUD5EpA6uh0` | 2026-02-27 | **deaktiviert 2026-03-23** (ersetzt: M6_10 Reconciliation) |
| ~~M6_04c_Lexware_Invoice_Sync~~ | `HK788ajphACicmwL` | 2026-02-27 | **deaktiviert 2026-03-23** (ersetzt: M6_03 Pull Sales) |
| ~~M6_04d_Lexware_Voucher_Status~~ | `pkJmfUhp9VcOHwb8` | 2026-02-27 | deaktiviert (Lexware Webhooks nie konfiguriert) |
| **M6_10_Lexware_Reconciliation** | `D7IYZ6HXEo4lFO03` | 2026-03-20 | aktiv |

#### M6_01 Staffellauf-Refactoring (2026-03-23):
Alter 41-Node-Monolith aufgespalten in 5 Flows nach Staffellauf-Prinzip:
- **M6_01a** Extract Invoice (27 Nodes): Intake → Claude/Gemini Extraktion → Validierung → `INVOICE_EXTRACTED` Event
- **M6_01b** Match & Create (11 Nodes): Supplier Match → Project Match → DB Insert → Positionen → `PURCHASE_INVOICE_CREATED` Event
- **M6_01c** Lexware Forward (8 Nodes): PDF Download → Email an `bauloewen@inbox.lexware.email` (mit storage_path Guard)
- **M6_01d** Notify (4 Nodes): Telegram-Benachrichtigung
- ~~M6_01e Folder Route~~ (deaktiviert 2026-03-23, ersetzt durch MX_08)

#### M6_10 Reconciliation (NEU 2026-03-20):
- Cron taeglich 06:00 — Lexware API Pull → DB Abgleich → Status-Sync
- Lexware = Source of Truth fuer payment_status, paid_amount, due_date
- Fehlende Belege werden erneut an Lexware gemailt (max 5/Tag)
- Telegram-Report mit Statistiken

### MX: Infrastructure (10 Flows)

| Flow | ID | Letztes Update |
|------|----|----------------|
| **MX_00_Event_Router v2** | `eNHx0TACVcF6MIdAYIKSl` | 2026-03-08 |
| **MX_01_Agent_Dispatcher** | `aEI4OkO36SyQFZlS` | 2026-03-14 |
| **MX_01_Error_Handler_v2** | `zAFieMcnwATMcHhY` | 2026-02-27 |
| ~~MX_02_Folder_Manager~~ | `ZcAhUCdouxnfP4HB` | 2026-01-03 | **deaktiviert 2026-03-23** (Drive tot, ersetzt: project_folders DB) |
| **MX_03_V2_Superchat_Intake** | `9eBOez2Q0vBNuQov` | 2026-03-04 |
| **MX_04_Dispatch_Doctor** | `wT9ubypWwaOmZhkYSKpm1` | 2026-03-20 |
| **MX_05_Attachment_Processor** | `qAiKaCpDUF3yQUvcZA2rd` | 2026-01-28 |
| **MX_07_Flow_Monitor** | `GBkSxBPeJUy5JqPJ` | 2026-03-08 |
| **MX_08_File_Router** | `c4nlSzH5dOVfyblR` | 2026-03-20 |
| **MX_AI_Analyze_With_Fallback** | `FuXYPv6JtvGgOWu3XUU-3` | 2026-02-27 |

### Sonstige (3 Flows)

| Flow | ID | Letztes Update |
|------|----|----------------|
| **DBL_Chatbot_Agent** | `nf5oOUfeVuWyHRJS` | 2026-03-07 |
| **Daily_KI-Briefing** | `2KFqqgMucXKOt04T` | 2026-03-14 |
| **Flow 2: Offer Sender TEST** | `us00SoDXhBZGu3eq` | 2025-11-13 |

---

## EVENT-ROUTING

| Event | Ziel-Flow | Aktiv |
|-------|-----------|-------|
| `DOC_CLASSIFIED_PROJECT_ORDER` | MX_05 Attachment Processor + M1_02 PDF Parser | Ja |
| `DOC_CLASSIFIED_INVOICE_IN` | M6_01a Extract Invoice | Ja |
| `DOC_CLASSIFIED_CREDIT_NOTE` | M6_01a Extract Invoice | Ja |
| `INVOICE_EXTRACTED` | M6_01b Match Create | Ja |
| `PURCHASE_INVOICE_CREATED` | M6_01c Lexware + M6_01d Notify | Ja |
| `PURCHASE_INVOICE_CREATED` | ~~M6_01e Folder Route~~ | **Nein** (deaktiviert 2026-03-23) |
| `PROJECT_FILES_READY` | M1_02 PDF Parser | Ja |
| `PROJECT_CREATED` | ~~M1_04a Prepare Drive~~ | **Nein** (deaktiviert, DB-Trigger uebernimmt) |
| `PROJECT_CREATED` | M1_05 Notification | Ja (Events feuern aber nicht) |
| ~~`DRIVE_YEAR_READY`~~ | ~~M1_04b Create Tree~~ | **Nein** (deaktiviert 2026-03-23) |
| ~~`DRIVE_TREE_CREATED`~~ | ~~M1_04c Sync Files~~ | **Nein** (deaktiviert 2026-03-23) |
| ~~`DRIVE_SETUP_COMPLETE`~~ | ~~M1_05 Notification~~ | **Nein** (deaktiviert 2026-03-23) |
| ~~`LEXWARE_*_CHANGED`~~ | ~~M6_04a/b/c/d~~ | **Nein** (deaktiviert, Pull-Modell aktiv) |
| `POSITIONS_EXTRACTED` | M4_01 Material Planner | Ja |
| `MATERIALS_CALCULATED` | M4_06 Order Agent | **Nein** (deaktiviert, Event kommt nie) |
| `RECONCILIATION_COMPLETED` | (Event-Log only) | Ja |
| `MONTEUR_AUFTRAG_CREATED` | M2_01 Monteur PDF | Ja |

---

## EVENT-SYSTEM SCHEMA

```sql
events (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,  -- NULL = unverarbeitet
  idempotency_key TEXT UNIQUE,
  source_system TEXT,
  source_flow TEXT,
  error_log TEXT
)

event_routing (
  event_type TEXT PRIMARY KEY,
  target_workflow TEXT NOT NULL,
  webhook_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true
)

dispatch_errors (
  id UUID PRIMARY KEY,
  event_id UUID,
  event_type TEXT,
  target_workflow TEXT,
  webhook_url TEXT,
  error_message TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

---

## MODUL-ZUSAMMENFASSUNG

| Modul | Aktiv | Deaktiviert (23.03.) | Grund |
|-------|:-----:|:--------------------:|-------|
| M1: Intake | 3 | 3 | Drive-Flows → DB-Trigger |
| M2: Baustelle | 4 | 3 | Scaffolding + Duplikat |
| M4: Material | 5 | 5 | Unfertige Event-Kette |
| M5: Freigabe | 1 | 0 | - |
| M6: Finance | 6 | 5 | M6_01e (Drive) + M6_04 (Webhooks nie aktiv) |
| MX: Infrastructure | 9 | 1 | MX_02 (Drive) |
| **Gesamt** | **28** | **16** | |

### DB vs n8n — Was braucht noch Flows?

| Feature | DB-Funktionen vorhanden | n8n noetig? |
|---------|:-----------------------:|:-----------:|
| Materialberechnung | `auto_plan_materials()` | Nein |
| Material-Approval | `fn_approve_material_order()` | Nein |
| Monteur-Planung | `auto_plan_project()` (V2, 3-Tier Matching) | Nein |
| Zeitplanung-Approval | `fn_approve_schedule()` + `confirm_proposed_phases()` | Nein |
| Lernender Planer | `fn_learn_schedule()` Trigger | Nein |
| Bestellungen an Lieferanten | - | **Ja** (Email-Versand) |
| Lieferbestaetigungen | - | **Ja** (Webhook von Lieferant) |
| Monteur-Benachrichtigung | - | **Ja** (SMS/Push) |
| PDF-Extraktion (Rechnungen) | - | **Ja** (Claude/Gemini Vision) |

---

## GIT-VERSIONIERUNG

Alle 44 aktiven Flows sind als JSON in `n8n-workflows/` versioniert.
6 deaktivierte/ersetzte Flows liegen in `n8n-workflows/_archive/`.

### Export-Befehle

Einzelner Flow:
```bash
curl -s "https://n8n.srv1045913.hstgr.cloud/api/v1/workflows/{ID}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" > n8n-workflows/{NAME}.json
```

Alle aktiven Flows:
```bash
curl -s "https://n8n.srv1045913.hstgr.cloud/api/v1/workflows?active=true&limit=200" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" | python3 -c "
import json, sys, re
data = json.load(sys.stdin)
for wf in data.get('data', []):
    name = re.sub(r'[^a-zA-Z0-9_-]', '_', wf['name'])
    with open(f'n8n-workflows/{name}.json', 'w') as f:
        json.dump(wf, f)
    print(f'  {name}.json ({wf[\"id\"]})')
"
```

### API-Zugang

- **REST API** erfordert `X-N8N-API-KEY` Header (nicht identisch mit MCP JWT)
- API-Key erstellen: n8n UI > Settings > API > Create API Key
- Aktueller Key: Umgebungsvariable `$N8N_API_KEY` setzen (laeuft 2026-03-28 ab)
- MCP JWT (in `.claude/mcp.json`) funktioniert NUR fuer den MCP Server, NICHT fuer REST

---

*Zuletzt aktualisiert: 2026-03-23 (Forensische Bereinigung, Issue #48)*
