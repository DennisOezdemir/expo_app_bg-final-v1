# 🦁 BAUGENIUS FLOW-REGISTER v2.4

> **Stand:** 18.01.2026  
> **Version:** 2.4  
> **Architektur:** Event-Driven State Machine  
> **Update:** MX_00 v2 Dynamic Router ✅ | Migrations 026/027 ✅

---

## 🏗️ ARCHITEKTUR-PRINZIPIEN

### Event-Driven (Kernprinzip)

```
┌─────────────────────────────────────────────────────────────────┐
│  Flows kommunizieren NUR über die events Tabelle                │
│  Kein Execute Workflow! Keine direkten Abhängigkeiten!          │
└─────────────────────────────────────────────────────────────────┘

Flow A ──► INSERT events (TYPE_X) ──► MX_00_Router ──► Flow B
```

### Belt & Suspenders

| Primär                          | Backup             |
| ------------------------------- | ------------------ |
| Supabase Webhook → n8n (sofort) | Sweeper alle 5 Min |

### One Task per Flow

Jeder Flow macht EINE Aufgabe, dann Event für den nächsten.

---

## 📧 GMAIL-ROUTING (NEU 28.12.)

### Label-Struktur

```
Gmail Labels/
├── 01_Eingang                    ← Catch-All
├── 02_Geschaeft_Projekte
│   └── Auftraege                 ← M1_01 hört hier! (NEU)
├── 03_Finanzen                   ← M4_02 hört hier
│   └── Verarbeitet
├── 04_Tools_Systeme
├── 05_Marketing_Info
└── 06_Wichtig_Action
```

### Routing-Regeln

| Email-Quelle                      | Gmail-Filter   | Label                             | n8n Flow  |
| --------------------------------- | -------------- | --------------------------------- | --------- |
| `th.larsen@topteam2000.de` (SAGA) | Absender       | `02_Geschaeft_Projekte/Auftraege` | **M1_01** |
| Test mit "auftrag" im Betreff     | Betreff        | `02_Geschaeft_Projekte/Auftraege` | **M1_01** |
| Bekannte Lieferanten              | Absender-Liste | `03_Finanzen`                     | **M4_02** |
| Unbekannt + "Rechnung/MwSt/IBAN"  | Keywords       | `03_Finanzen`                     | **M4_02** |

### Dokumentation

→ Siehe `EMAIL_ROUTING_FIX.md` für Setup-Anleitung

---

## 📦 MODUL 1: INTAKE (Auftragseingang)

> **Status:** 🟢 100% FERTIG 🎉  
> **Ziel:** SAGA-Mail → Projekt in DB → Drive-Ordner → Telegram-Notification

### Event-Kette (KOMPLETT)

```
📧 Email kommt an (Label: 02_Geschaeft_Projekte/Auftraege)
       ↓
┌──────────────────────┐
│ M1_01_Email_Trigger  │ Gmail Poll (5 Min)
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ M1_02_PDF_Parser     │ Claude Vision → Kopfdaten extrahieren
└──────────┬───────────┘
           ↓ INSERT events (PROJECT_CREATED)
           ↓
┌──────────────────────┐
│ MX_00_Event_Router   │ Zentraler Dispatcher (v2 Dynamic)
└──────────┬───────────┘
           ↓ Webhook an M1_04a
           ↓
┌──────────────────────┐
│ M1_04a_Prepare_Drive │ Jahresordner prüfen/erstellen        ✅
└──────────┬───────────┘
           ↓ INSERT events (DRIVE_YEAR_READY)
           ↓
┌──────────────────────┐
│ M1_04b_Create_Tree   │ Projektordner + 9 Subfolders         ✅
└──────────┬───────────┘
           ↓ INSERT events (DRIVE_TREE_CREATED)
           ↓
┌──────────────────────┐
│ M1_04c_Sync_Files    │ PDF aus Storage → Drive              ✅
└──────────┬───────────┘
           ↓ INSERT events (DRIVE_SETUP_COMPLETE)
           ↓
┌──────────────────────┐
│ M1_05_Notification   │ Telegram: "Neuer Auftrag!"           ✅
└──────────┬───────────┘
           ↓ INSERT events (NOTIFICATION_SENT)
           ↓
       📱 FERTIG!
```

### Flow-Status Modul 1

| Flow                           | n8n ID             | Trigger                                  | Output Event           | Status |
| ------------------------------ | ------------------ | ---------------------------------------- | ---------------------- | ------ |
| **M1_01_Email_Trigger**        | -                  | Gmail: `02_Geschaeft_Projekte/Auftraege` | → M1_02 (Execute)      | ✅     |
| **M1_02_PDF_Parser**           | -                  | Execute von M1_01                        | `PROJECT_CREATED`      | ✅     |
| **M1_04a_Prepare_Drive**       | -                  | `PROJECT_CREATED`                        | `DRIVE_YEAR_READY`     | ✅     |
| **M1_04b_Create_Project_Tree** | -                  | `DRIVE_YEAR_READY`                       | `DRIVE_TREE_CREATED`   | ✅     |
| **M1_04c_Sync_Initial_Files**  | `RNifQ36TwyKqKxOJ` | `DRIVE_TREE_CREATED`                     | `DRIVE_SETUP_COMPLETE` | ✅     |
| **M1_05_Notification**         | `ixnrOVeJhF3veYwJ` | `DRIVE_SETUP_COMPLETE`                   | `NOTIFICATION_SENT`    | ✅     |

### Webhook URLs (Modul 1)

| Flow   | Production URL                                                          |
| ------ | ----------------------------------------------------------------------- |
| M1_04a | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-04a-prepare-drive`       |
| M1_04b | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-04b-create-project-tree` |
| M1_04c | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-04c-sync-initial-files`  |
| M1_05  | `https://n8n.srv1045913.hstgr.cloud/webhook/m1-05-notification`         |

---

## 📦 MODUL 4: MATERIAL & BELEGE

> **Status:** 🟢 Kern-Flows VERIFIZIERT  
> **Ziel:** Belege scannen, kategorisieren, Lieferanten-Preise tracken

### Flow-Status Modul 4

| Flow                           | Trigger              | Output Event               | Status                |
| ------------------------------ | -------------------- | -------------------------- | --------------------- |
| **M4_01_Receipt_Scanner**      | Drive Trigger        | `PURCHASE_INVOICE_CREATED` | ✅ Verifiziert 28.12. |
| **M4_02_Mail_Invoice_Scanner** | Gmail: `03_Finanzen` | `PURCHASE_INVOICE_CREATED` | ✅ Fertig             |
| M4_03_Order_Suggester          | Manual               | -                          | 🔲 TODO               |

### M4_02 Attachment-Filter (09.01.2026)

**Problem:** E-Mails enthalten Signaturbilder + Wiegescheine → Claude Vision crashte.

**Lösung:** Blacklist/Whitelist Filter in `📋 Extract Email Info`:

| Filter                    | Begriffe                                                |
| ------------------------- | ------------------------------------------------------- |
| **Blacklist (ignoriert)** | wiegenote, wiegeschein, lieferschein, receipt, quittung |
| **Whitelist (Prio)**      | rechnung, invoice, faktura                              |
| **Ignoriert**             | Alle Bilder (JPG, PNG, WebP)                            |

**Output:** Immer `attachment_0` (hardcoded) → `🔧 Prepare Upload` erwartet fixen Key.

### Verifizierung M4_01 (28.12.2024)

```sql
-- Test-Ergebnis:
{
  "invoice_number": "50004.0024.10",
  "supplier_code": "SAGA",
  "supplier_name": "SAGA Unternehmensgruppe",
  "total_gross": "5381.56",
  "expense_category": "SUBCONTRACTOR",
  "positionen": 20
}
```

**Schreibt korrekt in:**

- ✅ `purchase_invoices` (Header)
- ✅ `purchase_invoice_items` (20 Positionen)
- ✅ `suppliers` (Matching/Auto-Create)
- ✅ `events` (PURCHASE_INVOICE_CREATED)

**Dokumentation:** `SESSION_2025-12-28_M4_01_VERIFIED.md`

---

## 📦 MODUL 6: FINANCE (NEU 18.01.2026)

> **Status:** 🟢 Schema deployed  
> **Ziel:** Ausgangsrechnungen, Nachträge, Margenberechnung

### Tabellen (Migration 026 + 027)

| Tabelle                 | Zweck                                | Status  |
| ----------------------- | ------------------------------------ | ------- |
| `sales_invoices`        | Ausgangsrechnungen (R-YYYY-NNN)      | ✅ Live |
| `sales_invoice_items`   | Rechnungspositionen                  | ✅ Live |
| `change_orders`         | Nachträge VOB §2 Abs. 5 (N-YYYY-NNN) | ✅ Live |
| `change_order_items`    | Nachtragspositionen                  | ✅ Live |
| `change_order_evidence` | Beweisfotos mit GPS                  | ✅ Live |

### Views

| View                      | Berechnung                             |
| ------------------------- | -------------------------------------- |
| `v_project_financials`    | Angebot + Rechnungen + Kosten → Marge  |
| `v_project_change_orders` | Approved/Pending Nachträge pro Projekt |

---

## 📦 MODUL X: CORE (Utilities)

> **Status:** 🟢 MX_00 v2 LIVE  
> **Ziel:** Zentrale Infrastruktur-Flows

### Flow-Status Modul X

| Flow                      | Trigger           | Was macht er?           | Status               |
| ------------------------- | ----------------- | ----------------------- | -------------------- |
| **MX_00_Event_Router v2** | Webhook + Sweeper | Dynamic Dispatcher      | ✅ Live (17.01.2026) |
| **MX_01_Error_Handler**   | Error Trigger     | Fehler in events loggen | ✅                   |

### MX_00 v2 Features (17.01.2026)

**Komplett neu gebaut** — alte Bugs gefixt:

| Feature                  | Beschreibung                                                   |
| ------------------------ | -------------------------------------------------------------- |
| **5 Payload-Formate**    | Supabase Webhook, Direct POST, n8n Body, Wrapped, Event Object |
| **Dynamic Routing**      | Liest `webhook_url` aus `event_routing` Tabelle                |
| **Multi-Route Support**  | Ein Event kann mehrere Ziele haben                             |
| **Error Logging**        | Schreibt in `dispatch_errors` Tabelle                          |
| **Code-basierter Merge** | Kein Merge-Node mehr (alter Bug)                               |

**n8n ID:** `eNHx0TACVcF6MIdAYIKSl`  
**Webhook:** `https://n8n.srv1045913.hstgr.cloud/webhook/event-router`

### ~~MX_00 Bekannte Bugs~~ (RESOLVED)

~~Problem 1: Merge Node~~ → ✅ Durch Code Node ersetzt  
~~Problem 2: Transform erkennt nur 1 Format~~ → ✅ 5 Formate unterstützt

---

## 🗄️ EVENT ROUTING TABELLE

```sql
SELECT event_type, target_workflow, is_active FROM event_routing;
```

| event_type                 | target_workflow            | is_active |
| -------------------------- | -------------------------- | --------- |
| `PROJECT_CREATED`          | M1_04a_Prepare_Drive       | ✅        |
| `DRIVE_YEAR_READY`         | M1_04b_Create_Project_Tree | ✅        |
| `DRIVE_TREE_CREATED`       | M1_04c_Sync_Initial_Files  | ✅        |
| `DRIVE_SETUP_COMPLETE`     | M1_05_Notification         | ✅        |
| `PURCHASE_INVOICE_CREATED` | _(noch kein Ziel)_         | ❌        |

---

## 🔧 WICHTIGE IDS & CREDENTIALS

### Google Drive

| Resource                    | ID                                  |
| --------------------------- | ----------------------------------- |
| Shared Drive "Baugenius"    | `0ABWttM9wIDiBUk9PVA`               |
| Projekte-Ordner             | `1vUEFxFpeCtDWgD75HE9PYsmlcCMWIwy3` |
| 2025-Ordner                 | `1S3F0S5xre4FCgP3Xo1NqHaFyGaxfMYlM` |
| VERARBEITET-Ordner (Belege) | `1TysnhyH-VIWEsJUfr0E6w7NvLeSKTLrC` |

### Telegram

| Resource       | ID                              |
| -------------- | ------------------------------- |
| Bot Credential | `HV1wc491unUQKfmd` (BabyAgiBot) |
| Chat ID        | `6088921678`                    |

### n8n Credentials

| Typ                 | Credential ID      | Name                 |
| ------------------- | ------------------ | -------------------- |
| Google Drive OAuth2 | `aYft6Y1rBlcl2pcf` | Google Drive account |
| Supabase Postgres   | `qXZ2ZjK31ZDrPoDG` | Supabase Postgres    |
| Telegram            | `HV1wc491unUQKfmd` | BabyAgiBot           |

### n8n Instance

- URL: `https://n8n.srv1045913.hstgr.cloud`
- Error Workflow: `apmJoMCbOchwfqTp`

---

## 📊 DATABASE SCHEMA (Event-System)

### events Tabelle

```sql
events (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  event_type event_type NOT NULL,  -- ENUM!
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,  -- NULL = unverarbeitet
  source_system TEXT,
  source_flow TEXT
)
```

### event_routing Tabelle

```sql
event_routing (
  event_type TEXT PRIMARY KEY,
  target_workflow TEXT NOT NULL,
  webhook_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true
)
```

### dispatch_errors Tabelle (NEU)

```sql
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

### workflow_steps Tabelle (Idempotenz)

```sql
workflow_steps (
  step_key TEXT PRIMARY KEY,
  project_id UUID,
  step_type TEXT,
  status workflow_step_status,  -- PENDING, IN_PROGRESS, DONE, FAILED
  payload JSONB,
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
)
```

### Helper Functions

- `claim_workflow_step(key, project_id, type)` → Atomares Claiming
- `complete_workflow_step(key, payload)` → Step abschließen
- `find_or_create_client(company_name, email_domain)` → Client Matching
- `find_or_create_supplier(...)` → Supplier Matching

---

## 📁 ORDNERSTRUKTUR IN N8N

```
n8n Workflows/
├── 📁 M1_Intake/
│   ├── M1_01_Email_Trigger         ✅
│   ├── M1_02_PDF_Parser            ✅
│   ├── M1_04a_Prepare_Drive        ✅
│   ├── M1_04b_Create_Project_Tree  ✅
│   ├── M1_04c_Sync_Initial_Files   ✅
│   └── M1_05_Notification          ✅  🎉 KOMPLETT!
│
├── 📁 M4_Material/
│   ├── M4_01_Receipt_Scanner       ✅ Verifiziert 28.12.
│   └── M4_02_Mail_Invoice_Scanner  ✅
│
└── 📁 MX_Core/
    ├── MX_00_Event_Router v2       ✅ Live 17.01.2026
    └── MX_01_Error_Handler         ✅
```

---

## 📊 STATUS-LEGENDE

| Symbol | Bedeutung                 |
| ------ | ------------------------- |
| ✅     | Fertig & getestet         |
| ⚠️     | Bug bekannt / Fix pending |
| 🟡     | In Arbeit                 |
| 🔲     | TODO                      |
| ❌     | Deaktiviert               |

---

## 🔄 MIGRATIONS-LISTE

| Nr      | Datei                            | Beschreibung                              | Status        |
| ------- | -------------------------------- | ----------------------------------------- | ------------- |
| 001-009 | ...                              | Basis-Schema                              | ✅            |
| 010     | event_system.sql                 | Event-System                              | ✅            |
| 011     | workflow_steps.sql               | Workflow State Machine                    | ✅            |
| 012     | suppliers_expense_categories.sql | Kostenkategorien                          | ✅            |
| 013     | email_source_fields.sql          | Email-Quellfelder                         | ✅            |
| 014     | m1_04b_project_tree.sql          | Event Routing M1_04b                      | ✅            |
| 015     | m1_04c_sync_files.sql            | Event Routing M1_04c                      | ✅            |
| ...     | ...                              | ...                                       | ✅            |
| 026     | sales_invoices.sql               | Ausgangsrechnungen + v_project_financials | ✅ 18.01.2026 |
| 027     | change_orders.sql                | Nachträge VOB + Evidence                  | ✅ 18.01.2026 |

---

## 📄 SESSION-DOKUMENTATIONEN

| Datei                                          | Datum  | Inhalt                     |
| ---------------------------------------------- | ------ | -------------------------- |
| `SESSION_2025-12-23_M1_02_REBUILD.md`          | 23.12. | PDF Parser Rebuild         |
| `SESSION_2025-12-24_WORKFLOW_STATE_MACHINE.md` | 24.12. | State Machine Architektur  |
| `SESSION_2025-12-27_M4_02_MAIL_SCANNER.md`     | 27.12. | Mail Invoice Scanner       |
| `SESSION_2025-12-28_M1_04b.md`                 | 28.12. | Project Tree Flow          |
| `SESSION_2025-12-28_M1_04c.md`                 | 28.12. | Sync Files Flow            |
| `SESSION_2025-12-28_M1_05.md`                  | 28.12. | Notification Flow          |
| `SESSION_2025-12-28_E2E_TEST_DEBUGGING.md`     | 28.12. | E2E Test + Router Bug      |
| `SESSION_2025-12-28_M4_01_VERIFIED.md`         | 28.12. | M4_01 Schema-Verifizierung |
| `EMAIL_ROUTING_FIX.md`                         | 28.12. | Gmail-Filter Setup         |

---

## 🎯 NÄCHSTE SCHRITTE

| Prio | Task                                               | Blocker? |
| ---- | -------------------------------------------------- | -------- |
| 1    | Frontend: Realtime Updates für Projekte/Positionen | -        |
| 2    | M5 Freigabe-Center (Chef-Inbox für Belege)         | -        |
| 3    | M1 E2E Test durchführen                            | -        |
| 4    | Nachtragsmanagement (Change Orders) UI             | -        |

---

_Zuletzt aktualisiert: 01.02.2026_
