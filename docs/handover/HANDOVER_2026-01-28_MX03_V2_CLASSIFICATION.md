# HANDOVER: MX_03_V2 Email Classification System

**Datum:** 2026-01-28  
**Session:** MX_05 Crash Analysis → MX_03_V2 Neuaufbau  
**Status:** MX_03_V2 Flow erstellt, bereit zum Import

---

## 🎯 PROBLEM-ANALYSE

### Symptome (aus Telegram Screenshots)
1. **Duplikate:** Gleiche Rechnung mehrfach als Telegram-Nachricht
2. **Fehlklassifikation:** Lieferscheine als INVOICE_IN erfasst (0,00€)
3. **MX_05 Crashes:** `No file_ids in payload` und ENUM-Cast-Fehler

### Root Causes

| Problem | Ursache | Modul |
|---------|---------|-------|
| Lieferschein → INVOICE_IN | Known Supplier = FORCE doc_type (blind) | MX_03 |
| Spam als PROJECT_ORDER | auftrag.jetzt "Neuer Auftrag" im Betreff | MX_03 |
| MX_05 Crash (file_ids) | Events ohne Attachments erzeugt | MX_03 |
| MX_05 Crash (ENUM) | CASE ohne ::event_type Cast | MX_05 |
| Telegram Duplikate | Kein Check auf `is_new_record` nach UPSERT | M4_01b |

---

## ✅ ERLEDIGTE FIXES

### 1. MX_05 ENUM-Fix (erledigt)

Node `📢 Event ATTACHMENTS_STORED` - Query geändert:

```sql
INSERT INTO events (event_type, payload, source_system, source_flow)
VALUES (
  (CASE 
    WHEN '{{ $json.doc_type }}' = 'PROJECT_ORDER' THEN 'PROJECT_FILES_READY'
    ELSE 'ATTACHMENTS_STORED'
  END)::event_type,  -- ← CAST hinzugefügt
  ...
)
```

---

## 🆕 MX_03_V2 ARCHITEKTUR

### Kernprinzipien

1. **Immer Claude** — Supplier-Info als Context-Hint, nie als Override
2. **Nur Events mit Attachments** — file_ids prüfen vor Event-Erzeugung
3. **Spam-Filter** — bekannte Spam-Domains früh rausfiltern
4. **Dedupe** — `dedupe_key` auf Events verhindert Duplikate

### Flow-Struktur

```
⚡ Webhook (POST /mx-03-superchat-intake-v2)
       ↓
📋 Extract Metadata (Message-ID, Files, Domain, Spam-Check)
       ↓
🚫 Spam? ──────────────────→ 🚫 Spam Response (Ende)
       ↓ (kein Spam)
🔍 Already Classified? (DB Check)
       ↓
❓ Is New? ─────────────────→ ⏭️ Already Exists (Ende)
       ↓ (neue Message)
🏢 Supplier Lookup (Context für Claude)
       ↓
🤖 Claude Classify (mit Supplier-Hint im System-Prompt)
       ↓
📋 Parse Response (Validierung, Routing-Logik)
       ↓
💾 Save Classification (UPSERT)
       ↓
❓ Needs Event? ────────────→ ✅ Respond No Event (Ende)
       ↓ (ja + hat Attachments)
📢 Create Event (mit dedupe_key)
       ↓
📱 Telegram
       ↓
✅ Respond Success
```

### Spam-Domains (hardcoded)

```javascript
const SPAM_DOMAINS = [
  'linkedin.com',
  'onepage.io',
  'mobbin.com',
  'skool.com',
  'auftrag.jetzt',    // ← Der Übeltäter
  'primus-personal.de',
  'email.contorion.de',
  'baumarkt.toom.de',
  'xing.com'
];
```

### Claude System-Prompt (Highlights)

```
BEKANNTE ABSENDER-INFO:
{{ supplier_name ? 'Bekannter Lieferant: ...' : 'Nicht in DB' }}

WICHTIG: Die Absender-Info ist nur ein HINWEIS. 
Klassifiziere nach INHALT, nicht nach Absender!

LIEFERSCHEIN vs RECHNUNG:
- "Lieferschein" im Betreff = DELIVERY_NOTE
- Betrag 0,00€ = wahrscheinlich DELIVERY_NOTE
- Rechnungsnummer + Betrag > 0 = INVOICE_IN
```

### Event-Erzeugung (Attachment-Check)

```javascript
// Event types that REQUIRE attachments
const NEEDS_ATTACHMENTS = ['PROJECT_ORDER', 'MAGICPLAN'];
const needsEvent = ROUTES[doc_type] !== null;
const hasRequiredAttachments = !NEEDS_ATTACHMENTS.includes(doc_type) || has_attachments;

// Nur Event erzeugen wenn:
needs_event = needsEvent && hasRequiredAttachments;
```

---

## 📁 DATEIEN

| Datei | Beschreibung |
|-------|--------------|
| `MX_03_V2_Superchat_Intake.json` | n8n Workflow JSON zum Import |

---

## 🔜 NÄCHSTE SCHRITTE

### Sofort (Dennis)

1. **MX_03_V2 importieren** in n8n
2. **Credentials zuweisen:**
   - Postgres → Supabase
   - Anthropic → API Key
   - Telegram → Bot Token
3. **Parallel testen** (alter MX_03 bleibt aktiv)
4. **Superchat Webhook umstellen** wenn V2 stabil

### Ausstehend

1. **M4_01b Duplikat-Fix:** IF-Node für `is_new_record` nach `📄 Create Invoice`
2. **MX_03 alt deaktivieren** nach V2-Validierung
3. **Spam-Domain-Tabelle** statt hardcoded Liste (optional)

---

## 🧪 TEST-SZENARIEN

| Test | Erwartung |
|------|-----------|
| Email von auftrag.jetzt | → Spam, kein Event |
| Lieferschein von stark-deutschland.de | → DELIVERY_NOTE, kein Event |
| Rechnung von reesa.de | → INVOICE_IN, Event zu M4 |
| MagicPlan Export | → MAGICPLAN, Event nur mit Attachments |
| Duplikat (gleiche Message-ID) | → Skip, "already_classified" |

---

## 📊 DB-ÄNDERUNGEN

Keine Migration nötig. Bestehende Tabellen:
- `classified_emails` — UNIQUE auf `superchat_message_id`
- `events` — UNIQUE auf `dedupe_key`
- `suppliers` / `supplier_aliases` — Read-only für Context

---

## 🔗 REFERENZEN

- Workflow JSON: `/docs/workflows/MX_03_V2_Superchat_Intake.json`
- Alter MX_03: Workflow ID `IdxGMYvUAQEcFyt9WijlN`
- MX_05: Workflow ID `qAiKaCpDUF3yQUvcZA2rd`
