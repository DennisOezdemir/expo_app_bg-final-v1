# BauGenius Flow-Analyse Report
> **Datum:** 2026-02-27 | **Quelle:** n8n API (42 aktive Flows) + Handover-Docs

---

## GESAMT-ÜBERSICHT

| Kategorie | Zahl |
|-----------|------|
| **Aktive Flows** | 42 |
| **Inaktive/Archivierte** | 62 |
| **Gesamt in n8n** | 104 |
| **Module** | M1-M6 + MX |

---

## M1: INTAKE — 6 Flows (100%)

### Event-Kette
```
Email (Gmail) → MX_03 klassifiziert
  → MX_05 speichert Anhänge
  → M1_02 parst PDF (Claude Vision)
  → PROJECT_CREATED
    ├→ M1_03 extrahiert Positionen → POSITIONS_EXTRACTED → M4_01
    └→ M1_04a → M1_04b → M1_04c (Drive Setup) → M1_05 (Telegram)
```

| Flow | Nodes | Output Event | Update |
|------|-------|--------------|--------|
| M1_02_PDF_Parser_Vision | 17 | PROJECT_CREATED | 2026-02-11 |
| M1_03_Position_Extractor_V3 | 20 | POSITIONS_EXTRACTED | 2026-01-19 |
| M1_04a_Prepare_Drive | 22 | DRIVE_YEAR_READY | 2026-01-13 |
| M1_04b_Create_Project_Tree | 25 | DRIVE_TREE_CREATED | 2026-01-03 |
| M1_04c_Sync_Initial_Files | 29 | DRIVE_SETUP_COMPLETE | 2026-01-03 |
| M1_05_Notification | 13 | NOTIFICATION_SENT | 2026-01-03 |

---

## M2: BAUSTELLE — 7 Flows (100%)

| Flow | Nodes | Trigger | Update |
|------|-------|---------|--------|
| M2_01_Monteur_Auftrag_PDF | 7 | Manual Webhook | 2026-01-17 |
| M2_02_Sync_ZB_Progress | 12 | INSPECTION_PROTOCOL_COMPLETED | 2026-02-20 |
| M2_03_Generate_Protocol_PDF | 13 | INSPECTION_PROTOCOL_COMPLETED | 2026-02-20 |
| M2_04_Inspection_Finalize | 16 | Manual/Event | 2026-02-11 |
| M2_10_Sub_Order_Generator | 7 | Manual Webhook | 2026-01-17 |
| M2_10a_Schedule_Approve | 9 | Approval Event | 2026-02-20 |
| M2_10b_Schedule_Notification | 11 | Approval Success | 2026-02-20 |

---

## M4: MATERIAL & ORDER AGENT — 10 Flows (100%)

### Event-Kette
```
POSITIONS_EXTRACTED → M4_01 (Material Planner)
  → MATERIALS_PLANNED → M4_05 (List Generator)
  → MATERIALS_CALCULATED
    ├→ M4_06 Order Agent (Telegram Approve/Reject)
    ├→ M4_10 MagicPlan Parser
    └→ M4_07 Order Send (on approval)
        → M4_08 Schedule Order Trigger (Daily JIT Cron)
```

| Flow | Nodes | Trigger | Update | NEU? |
|------|-------|---------|--------|------|
| M4_01_Material_Planner | 10 | POSITIONS_EXTRACTED | 2026-01-28 | |
| M4_01a_Receipt_Intake | 4 | Drive Watch | 2026-02-02 | |
| M4_01b_Receipt_Processor_V2 | 27 | Schedule 30s | 2026-02-02 | |
| M4_03a_Order_Approve | 9 | Manual | 2026-02-23 | ✅ |
| M4_03b_Order_Suggester | 13 | Manual | 2026-02-23 | ✅ |
| M4_05_Material_List_Generator | 18 | MATERIALS_PLANNED | 2026-02-11 | |
| M4_06_Order_Agent | 13 | MATERIALS_CALCULATED | 2026-02-23 | ✅ |
| M4_07_Order_Send | 13 | Approval Button | 2026-02-23 | ✅ |
| M4_08_Schedule_Order_Trigger | 6 | Daily Cron | 2026-02-23 | ✅ |
| M4_10_MagicPlan_Parser | 14 | MagicPlan Webhook | 2026-01-25 | |

---

## M5: FREIGABE — 1 Flow (100%)

| Flow | Nodes | Trigger | Update |
|------|-------|---------|--------|
| M5_01_Approval_Dispatcher | 21 | APPROVAL_REQUEST | 2026-02-11 |

Zentraler Approval-Hub für alle HITL-Entscheidungen via Telegram Buttons.

---

## M6: FINANCE & LEXWARE — 9 Flows (100%)

### Event-Kette
```
Eingangsrechnung → M6_01 (Claude Vision)
  → PURCHASE_INVOICE_CREATED
  → M6_02a (Lexware Prepare) → M6_02b (Contact Sync) → M6_02c (Push Voucher)

Lexware → BG:
  M6_03 (Pull Sales, 4h Schedule)
  M6_04a (Webhook Router) → M6_04b/c/d (Payment/Invoice/Voucher Handler)
```

| Flow | Nodes | Trigger | Update |
|------|-------|---------|--------|
| M6_01_Invoice_Processor | 34 | DOC_CLASSIFIED_INVOICE_IN | 2026-02-10 |
| M6_02a_Lexware_Push_Prepare | 15 | PURCHASE_INVOICE_CREATED | 2026-02-18 |
| M6_02b_Lexware_Contact_Sync | 14 | LEXWARE_PUSH_READY | 2026-02-18 |
| M6_02c_Lexware_Push_Voucher | 15 | LEXWARE_PUSH_READY | 2026-02-19 |
| M6_03_Lexware_Pull_Sales | 14 | Schedule 4h | 2026-02-18 |
| M6_04a_Lexware_Webhook_Router | 7 | Lexware Webhook | 2026-02-18 |
| M6_04b_Lexware_Payment_Handler | 16 | Router Dispatch | 2026-02-18 |
| M6_04c_Lexware_Invoice_Sync | 13 | Router Dispatch | 2026-02-18 |
| M6_04d_Lexware_Voucher_Status | 13 | Router Dispatch | 2026-02-18 |

---

## MX: INFRASTRUCTURE — 8 Flows (100%)

| Flow | Nodes | Trigger | Funktion |
|------|-------|---------|----------|
| MX_00_Event_Router v2 | 14 | Webhook + 5-Min Sweeper | Zentrale Event-Weiche |
| MX_01_Error_Handler_v2 | 12 | n8n Error Trigger | Logs + Telegram |
| MX_02_Folder_Manager | 30 | Webhook | Drive Folder Ops |
| MX_03_V2_Superchat_Intake | 27 | Gmail Poll | Email-Klassifizierung (Claude) |
| MX_04_Dispatch_Doctor | 29 | Schedule 15 Min | Error Retry + Dead Letter |
| MX_05_Attachment_Processor | 13 | Webhook | File Download + Storage |
| MX_07_Flow_Monitor | 14 | Schedule 15m/4h/daily | Health Checks |
| MX_AI_Analyze_With_Fallback | 10 | Webhook | Claude → Gemini → GPT |

---

## EVENT ROUTING (60 aktive Routen)

Siehe `docs/FLOW_REGISTER_LIVE.md` für vollständige Routing-Tabelle.

---

## KEINE DUPLIKATE

Alle 42 aktiven Flows haben einzigartige Zwecke. 62 inaktive Flows sind korrekt deprecated.

---

*Generiert: 2026-02-27 | Agent: flow-analyst*
