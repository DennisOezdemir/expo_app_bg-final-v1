# BAUGENIUS FLOW-REGISTER

> **Stand:** 2026-03-17 (konsolidiert aus v2.4 + Live-API-Dump 27.02.)
> **n8n:** `https://n8n.srv1045913.hstgr.cloud`
> **Architektur:** Event-Driven State Machine
> **Flows:** 42 aktiv | 62 inaktiv/archiviert | 104 gesamt

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

### M1: Intake (6 Flows)

| Flow | ID | Letztes Update |
|------|----|----------------|
| **M1_02_PDF_Parser_Vision** | `8KDtJKgrTI` | 2026-02-11 |
| **M1_03_Position_Extractor_V3** | `eVbTku3Jsy` | 2026-01-19 |
| **M1_04a_Prepare_Drive** | `kdXetd4FMC` | 2026-01-13 |
| **M1_04b_Create_Project_Tree** | `P0ETfL7Zoz` | 2026-01-03 |
| **M1_04c_Sync_Initial_Files** | `RNifQ36Twy` | 2026-01-03 |
| **M1_05_Notification** | `ixnrOVeJhF` | 2026-01-03 |

### M2: Baustelle (7 Flows)

| Flow | ID | Letztes Update |
|------|----|----------------|
| **M2_01_Monteur_Auftrag_PDF** | `v2b5w05D-C` | 2026-01-17 |
| **M2_02_Sync_ZB_Progress** | `TQoWuDki_q` | 2026-02-20 |
| **M2_03_Generate_Protocol_PDF** | `lDrZnW4bYM` | 2026-02-20 |
| **M2_04_Inspection_Finalize** | `fkP3zcOg0W` | 2026-02-11 |
| **M2_10_Sub_Order_Generator** | `Kqp7EajcP0` | 2026-01-17 |
| **M2_10a_Schedule_Approve** | `t3HR7lIWYU` | 2026-02-20 |
| **M2_10b_Schedule_Notification** | `DKR3TSn8J7` | 2026-02-20 |

### M4: Material (10 Flows)

| Flow | ID | Letztes Update |
|------|----|----------------|
| **M4_01_Material_Planner** | `tywkXZoNvD` | 2026-01-28 |
| **M4_01a_Receipt_Intake** | `sw2yaCHpua` | 2026-02-02 |
| **M4_01b_Receipt_Processor_V2_MX02** | `WSy5sWWXY2` | 2026-02-02 |
| **M4_03a_Order_Approve** | `INJkwNIVjA` | 2026-02-23 |
| **M4_03b_Order_Suggester** | `UlyBjJpyUs` | 2026-02-23 |
| **M4_05_Material_List_Generator** | `S5gFkRmPiZ` | 2026-02-11 |
| **M4_06_Order_Agent** | `fPY6wSReqQ` | 2026-02-23 |
| **M4_07_Order_Send** | `BOkKFTEUCy` | 2026-02-23 |
| **M4_08_Schedule_Order_Trigger** | `Ycs3lFXe5J` | 2026-02-23 |
| **M4_10_MagicPlan_Parser** | `Tjbz4nIiHl` | 2026-01-25 |

### M5: Freigabe (1 Flow)

| Flow | ID | Letztes Update |
|------|----|----------------|
| **M5_01_Approval_Dispatcher** | `zCs5Hwy9Nm` | 2026-02-11 |

### M6: Finance (8 aktiv, 3 deaktiviert, 1 neu)

| Flow | ID | Letztes Update | Status |
|------|----|----------------|--------|
| **M6_01_Invoice_Processor v2** | `NKVnbTeEpf` | 2026-03-20 | aktiv |
| ~~M6_02a_Lexware_Push_Prepare~~ | `B4IOCwfxNg` | 2026-02-18 | deaktiviert (ersetzt durch Email-Forward in M6_01) |
| ~~M6_02b_Lexware_Contact_Sync~~ | `ilYyrjOQoG` | 2026-02-18 | deaktiviert |
| ~~M6_02c_Lexware_Push_Voucher~~ | `6C8MshufHT` | 2026-02-19 | deaktiviert |
| **M6_03_Lexware_Pull_Sales** | `AjRF0GnZVa` | 2026-02-18 | aktiv |
| **M6_04a_Lexware_Webhook_Router** | `RbUQUOpAzY` | 2026-02-18 | aktiv |
| **M6_04b_Lexware_Payment_Handler** | `ORyFbRUD5E` | 2026-02-18 | aktiv |
| **M6_04c_Lexware_Invoice_Sync** | `HK788ajphA` | 2026-02-18 | aktiv |
| **M6_04d_Lexware_Voucher_Status** | `pkJmfUhp9V` | 2026-02-18 | aktiv |
| **M6_10_Lexware_Reconciliation** | NEU | 2026-03-20 | aktiv |

#### M6_01 v2 Aenderungen (2026-03-20):
- Multi-Attachment: Loop ueber alle file_ids statt nur [0]
- Gutschrift-Erkennung: besser zuhause / Betreff "Gutschrift" → CREDIT_NOTE
- Projektzuordnung: Claude Vision extrahiert BL-Nummer + Adresse → fn_match_project_by_reference
- Email-Forward: PDF automatisch an bauloewen@inbox.lexware.email

#### M6_10 Reconciliation (NEU 2026-03-20):
- Cron taeglich 06:00 — Lexware API Pull → DB Abgleich → Status-Sync
- Lexware = Source of Truth fuer payment_status, paid_amount, due_date
- Fehlende Belege werden erneut an Lexware gemailt (max 5/Tag)
- Telegram-Report mit Statistiken

### MX: Infrastructure (8 Flows)

| Flow | ID | Letztes Update |
|------|----|----------------|
| **MX_00_Event_Router v2** | `eNHx0TACVc` | 2026-01-17 |
| **MX_01_Error_Handler_v2** | `zAFieMcnwA` | 2026-02-26 |
| **MX_02_Folder_Manager** | `ZcAhUCdoux` | 2026-01-03 |
| **MX_03_V2_Superchat_Intake** | `9eBOez2Q0v` | 2026-02-23 |
| **MX_04_Dispatch_Doctor** | `wT9ubypWwa` | 2026-02-11 |
| **MX_05_Attachment_Processor** | `qAiKaCpDUF` | 2026-01-28 |
| **MX_07_Flow_Monitor** | `GBkSxBPeJU` | 2026-02-23 |
| **MX_AI_Analyze_With_Fallback** | `FuXYPv6Jtv` | 2026-02-23 |

---

## EVENT-ROUTING

| Event | Ziel-Flow | Aktiv |
|-------|-----------|-------|
| `DOC_CLASSIFIED_PROJECT_ORDER` | MX_05 Attachment Processor | Ja |
| `DOC_CLASSIFIED_INVOICE_IN` | M6_01 Invoice Processor | Ja |
| `PROJECT_FILES_READY` | M1_02 PDF Parser | Ja |
| `PROJECT_CREATED` | M1_04a Prepare Drive + M1_03 Positionen | Ja |
| `DRIVE_YEAR_READY` | M1_04b Create Tree | Ja |
| `DRIVE_TREE_CREATED` | M1_04c Sync Files | Ja |
| `DRIVE_SETUP_COMPLETE` | M1_05 Notification | Ja |
| `POSITIONS_EXTRACTED` | M4_01 Material Planner | Ja |
| `PURCHASE_INVOICE_CREATED` | ~~M6_02a Lexware Push~~ | Nein (ersetzt durch Email-Forward in M6_01) |
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

| Modul | Aktiv | Inaktiv |
|-------|-------|---------|
| M1: Intake | 6 | 3 |
| M2: Baustelle | 7 | 1 |
| M4: Material | 10 | 2 |
| M5: Freigabe | 1 | 0 |
| M6: Finance | 9 | 5 |
| MX: Infrastructure | 8 | 4 |
| Sonstige | 1 | 47 |

---

*Zuletzt aktualisiert: 2026-03-17*
