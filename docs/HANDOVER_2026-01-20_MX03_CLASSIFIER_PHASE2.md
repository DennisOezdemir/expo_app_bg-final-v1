# HANDOVER: MX_03 Document Classifier Phase 2

**Datum:** 2026-01-20
**Status:** ✅ PHASE 2 COMPLETE — Classification funktioniert

---

## WAS WURDE GEBAUT

### MX_03_Document_Classifier v2
**n8n Workflow ID:** `GppS6IEk3xbrXRdo`

Zentraler Email-Klassifikator für info@deine-bauloewen.de. Ersetzt alle separaten Gmail-Trigger.

### Unterstützte Dokumenttypen

| doc_type | routed_to | Event | Gmail Label |
|----------|-----------|-------|-------------|
| PROJECT_ORDER | M1 | DOC_CLASSIFIED_PROJECT_ORDER | 02_Auftraege |
| INVOICE_IN | M6 | DOC_CLASSIFIED_INVOICE_IN | 03_Finanzen |
| CREDIT_NOTE | M6_CREDIT | DOC_CLASSIFIED_CREDIT_NOTE | 03_Finanzen |
| REMINDER | M6_URGENT | DOC_CLASSIFIED_REMINDER | 03_Finanzen + Telegram |
| DELIVERY_NOTE | ARCHIVE | - | 04_Archive |
| ORDER_CONFIRMATION | ARCHIVE | - | 04_Archive |
| DEFECT_LIST | DEFECT | DOC_CLASSIFIED_DEFECT_LIST | 06_Wichtig + Telegram |
| SUPPLEMENT | SUPPLEMENT | DOC_CLASSIFIED_SUPPLEMENT | 06_Wichtig + Telegram |
| INFO_ONLY | ARCHIVE | - | 04_Archive |
| CATALOG | ARCHIVE | - | 04_Archive |
| PAYMENT_REMINDER | SKIP | - | Mark as Read |
| OTHER | REVIEW | DOC_NEEDS_REVIEW | - |

### Flow-Architektur

```
Gmail Poll (1 min, unread)
    ↓
Extract Metadata (From, To, Subject, snippet)
    ↓
Supplier Check (supplier_aliases lookup)
    ↓
[Known?] → Force Supplier Type
    ↓
Claude Classify (Anthropic node, claude-sonnet-4-20250514)
    ↓
Parse Response (routing logic)
    ↓
Save Classification (classified_emails)
    ↓
Switch (9 outputs)
    ↓
[Events + Labels per Type]
```

---

## VALIDIERTE KLASSIFIKATIONEN

| Absender | Betreff | doc_type | confidence |
|----------|---------|----------|------------|
| Contorion | Rechnung zu deiner Bestellung... | INVOICE_IN | 0.95 |
| Farbe-Fertig-Los | Gutschrift. | CREDIT_NOTE | 0.95 |
| Adolf Würth | Lieferschein... | DELIVERY_NOTE | 0.90 |

---

## DATABASE CHANGES

### Neue Event Types (ENUM erweitert)
```sql
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'DOC_CLASSIFIED_INVOICE_IN';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'DOC_CLASSIFIED_CREDIT_NOTE';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'DOC_CLASSIFIED_REMINDER';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'DOC_CLASSIFIED_PROJECT_ORDER';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'DOC_CLASSIFIED_DEFECT_LIST';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'DOC_CLASSIFIED_SUPPLEMENT';
```

### Event Routing (vorbereitet, INAKTIV)
```sql
-- Werden aktiviert wenn M4_02 Webhook ready
INSERT INTO event_routing (event_type, target_workflow, webhook_url, is_active)
VALUES 
  ('DOC_CLASSIFIED_INVOICE_IN', 'M4_02_Invoice_Consumer', '...', false),
  ('DOC_CLASSIFIED_CREDIT_NOTE', 'M4_02_Invoice_Consumer', '...', false),
  ('DOC_CLASSIFIED_REMINDER', 'M4_02_Invoice_Consumer', '...', false);
```

---

## KRITISCHE FIXES (Session)

### 1. Gmail API Field Names
**Problem:** Gmail API gibt `From`, `To`, `Subject` (capitalized), Code erwartete lowercase.
**Fix:** Extract Metadata Node auf capitalized umgestellt.

### 2. Claude JSON Output
**Problem:** HTTP Request Node → Claude antwortete auf Deutsch statt JSON.
**Fix:** Anthropic "Message a Model" Node mit System Message:
```
Du antwortest AUSSCHLIESSLICH mit validem JSON. Kein Text davor oder danach.
```

---

## OFFENE PUNKTE (Phase 3)

### M4_02 Webhook Conversion
Flow `M4_02_Mail_Invoice_Scanner_V2_MX02` muss von Gmail-Trigger auf Webhook umgebaut werden:

1. Gmail Trigger → Webhook Trigger `/webhook/m4-02-invoice-consumer`
2. Event-Payload parsen (gmail_message_id)
3. Gmail Message laden
4. Rest des Flows unverändert

### Nach Umbau aktivieren:
```sql
UPDATE event_routing 
SET is_active = true 
WHERE target_workflow = 'M4_02_Invoice_Consumer';
```

### Cleanup:
- M1_01 Flow deaktivieren (Dennis)
- Gmail auto-forward info@ → invoice@ deaktivieren

---

## GMAIL LABEL IDs

```
01_Eingang:        Label_8237576157910072573
02_Auftraege:      Label_7909878196447199844
03_Finanzen:       Label_6704789340071866339
04_Archive:        Label_4875411081284910275
06_Wichtig_Action: Label_7053400877052907655
```

---

## NÄCHSTE SESSION

**Thema wählen:**
1. M4_02 Webhook Conversion (komplettiert MX_03 Integration)
2. Anderes Modul

**Kontext laden:**
- Dieses Handover
- Bei M4_02: Flow `a0tUjmuVkjxfZpCE` analysieren