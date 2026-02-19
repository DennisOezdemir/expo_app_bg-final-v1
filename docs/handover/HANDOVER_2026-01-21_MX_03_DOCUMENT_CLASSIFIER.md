# HANDOVER: MX_03_Document_Classifier v2

**Datum:** 2026-01-21  
**Status:** ✅ PRODUCTION  
**Workflow ID:** sDg2E6zWCqoT0234xaNoM

---

## ZWECK

Automatische Klassifizierung eingehender Emails für Bauunternehmen. Erkennt Dokumenttypen (Aufträge, Rechnungen, Mängellisten, etc.) und routet sie via Events an nachgelagerte Module.

---

## TRIGGER

| Typ | Config |
|-----|--------|
| Gmail Poll | Jede Minute, nur ungelesene |
| Chat Trigger | Für manuelles Testing |

---

## FLOW-STRUKTUR

```
Gmail Poll (1 min)
    ↓
Already Classified? (DB Check)
    ↓
New Email? ─── Nein → SKIP
    ↓ Ja
Extract Metadata
    ↓
Supplier Check (supplier_aliases JOIN)
    ↓
Known Supplier? ─┬─ JA → Force INVOICE_IN (confidence: 1.0)
                 └─ NEIN → Claude Classify → Parse Response
                            ↓
                    Save Classification
                            ↓
                    Switch (doc_type) ─┬─ SKIP → Mark Read
                                       ├─ M1 (PROJECT_ORDER) → Event → Label "Auftraege"
                                       ├─ M6_INVOICE → Event → Label "Finanzen"
                                       ├─ M6_CREDIT → Event → Label "Finanzen"
                                       ├─ ARCHIVE → Label "Archiv"
                                       ├─ DEFECT → Event + Telegram → Label "Wichtig"
                                       ├─ SUPPLEMENT → Event + Telegram → Label "Wichtig"
                                       ├─ M6_URGENT (REMINDER) → Event + Telegram → Label "Finanzen"
                                       └─ REVIEW (fallback) → Event DOC_NEEDS_REVIEW
```

---

## DOC-TYPES & ROUTING

| doc_type | routed_to | Event | Telegram | Gmail Label |
|----------|-----------|-------|----------|-------------|
| PAYMENT_REMINDER | SKIP | ❌ | ❌ | Mark Read only |
| PROJECT_ORDER | M1 | `DOC_CLASSIFIED_PROJECT_ORDER` | ❌ | Auftraege |
| INVOICE_IN | M6 | `DOC_CLASSIFIED_INVOICE_IN` | ❌ | Finanzen |
| CREDIT_NOTE | M6_CREDIT | `DOC_CLASSIFIED_CREDIT_NOTE` | ❌ | Finanzen |
| DELIVERY_NOTE | ARCHIVE | ❌ | ❌ | Archiv |
| ORDER_CONFIRMATION | ARCHIVE | ❌ | ❌ | Archiv |
| INFO_ONLY | ARCHIVE | ❌ | ❌ | Archiv |
| CATALOG | ARCHIVE | ❌ | ❌ | Archiv |
| DEFECT_LIST | DEFECT | `DOC_CLASSIFIED_DEFECT_LIST` | ✅ | Wichtig |
| SUPPLEMENT | SUPPLEMENT | `DOC_CLASSIFIED_SUPPLEMENT` | ✅ | Wichtig |
| REMINDER | M6_URGENT | `DOC_CLASSIFIED_REMINDER` | ✅ | Finanzen |
| OTHER | REVIEW | `DOC_NEEDS_REVIEW` | ❌ | - |

---

## KEY NODES

### 🔍 Already Classified?

```sql
SELECT EXISTS(
  SELECT 1 FROM classified_emails 
  WHERE gmail_message_id = '{{ $json.id }}'
) AS already_classified;
```

### 🔧 Extract Metadata

```javascript
const email = $('📧 Gmail Poll').first().json;

return {
  json: {
    gmail_message_id: email.id,
    gmail_thread_id: email.threadId,
    from_address: email.From || '',
    to_address: email.To || '',
    subject: email.Subject || '(kein Betreff)',
    body_snippet: (email.snippet || '').trim().replace(/'/g, "''"),
    attachment_names: (email.attachments || []).map(a => a.filename || a.name || 'unnamed'),
    received_at: email.internalDate 
      ? new Date(parseInt(email.internalDate)).toISOString() 
      : new Date().toISOString(),
    gmail_label: '01_Eingang'
  }
};
```

### 🏭 Supplier Check

```sql
SELECT s.id as supplier_id, s.name as supplier_name, s.default_expense_category
FROM supplier_aliases sa
JOIN suppliers s ON sa.supplier_id = s.id
WHERE 
  LOWER('{{ from_address }}') LIKE '%' || LOWER(sa.alias_name)
  OR LOWER('{{ from_address }}') = LOWER(sa.alias_name)
LIMIT 1;
```

**Logik:** Bekannter Lieferant → sofort `INVOICE_IN` mit confidence 1.0, kein Claude-Call.

### 🤖 Claude Classify

**Model:** claude-sonnet-4-20250514

**System Prompt:**
```
Du bist ein Dokumentenklassifizierer. Du antwortest AUSSCHLIESSLICH mit validem JSON. 
Kein Text davor oder danach. Nur das JSON-Objekt.
```

**User Prompt:**
```
Klassifiziere diese Email für ein Bauunternehmen:

Von: {{ from_address }}
An: {{ to_address }}
Betreff: {{ subject }}
Text: {{ body_snippet }}

TYPES:
- PROJECT_ORDER = Neuer Bauauftrag/Leistungsverzeichnis von Wohnungsgesellschaft (SAGA, GWG, Vonovia) oder Vermittler (TopTeam2000)
- DEFECT_LIST = Mängelliste, Nacharbeiten, Restarbeiten
- SUPPLEMENT = Nachtrag zu bestehendem Auftrag
- INVOICE_IN = Eingangsrechnung von Lieferant
- CREDIT_NOTE = Gutschrift von Lieferant
- REMINDER = Zahlungserinnerung/Mahnung VON LIEFERANT an uns
- DELIVERY_NOTE = Lieferschein (keine Preise)
- ORDER_CONFIRMATION = Auftragsbestätigung (AB)
- PAYMENT_REMINDER = Zahlungserinnerung von eigener Software - IGNORIEREN
- INFO_ONLY = Newsletter, Werbung
- CATALOG = Preisliste, Katalog
- OTHER = Unklar

Antworte NUR mit JSON: {"type": "...", "confidence": 0.0-1.0, "reason": "..."}
```

### 📋 Parse Response

```javascript
const claudeResponse = $input.first().json;
const metadata = $('🔧 Extract Metadata').first().json;

let responseText = claudeResponse.content?.[0]?.text || claudeResponse.text || '';

let parsed;
try {
  let clean = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  parsed = JSON.parse(clean);
} catch (e) {
  parsed = { type: 'OTHER', confidence: 0.5, reason: 'Parse error: ' + e.message };
}

const routingMap = {
  'PROJECT_ORDER': 'M1',
  'DEFECT_LIST': 'DEFECT',
  'SUPPLEMENT': 'SUPPLEMENT',
  'INVOICE_IN': 'M6',
  'CREDIT_NOTE': 'M6_CREDIT',
  'REMINDER': 'M6_URGENT',
  'DELIVERY_NOTE': 'ARCHIVE',
  'ORDER_CONFIRMATION': 'ARCHIVE',
  'PAYMENT_REMINDER': 'SKIP',
  'INFO_ONLY': 'ARCHIVE',
  'CATALOG': 'ARCHIVE',
  'OTHER': 'REVIEW'
};

return {
  json: {
    ...metadata,
    doc_type: parsed.type || 'OTHER',
    confidence: parsed.confidence || 0.5,
    reason: (parsed.reason || '').replace(/'/g, "''"),
    routed_to: routingMap[parsed.type] || 'REVIEW'
  }
};
```

### 💾 Save Classification

```sql
INSERT INTO classified_emails (
  gmail_message_id, gmail_thread_id, from_address, to_address,
  subject, body_snippet, attachment_names, received_at,
  gmail_label, doc_type, confidence, reason, routed_to
) VALUES (...)
ON CONFLICT (gmail_message_id) DO NOTHING
RETURNING id::text, doc_type, routed_to;
```

---

## GMAIL LABELS

| Label ID | Name |
|----------|------|
| Label_7909878196447199844 | Auftraege |
| Label_6704789340071866339 | Finanzen |
| Label_4875411081284910275 | Archiv |
| Label_7053400877052907655 | Wichtig |

---

## EVENTS ERZEUGT

| Event Type | Trigger |
|------------|---------|
| `DOC_CLASSIFIED_PROJECT_ORDER` | Neuer Bauauftrag erkannt |
| `DOC_CLASSIFIED_INVOICE_IN` | Eingangsrechnung erkannt |
| `DOC_CLASSIFIED_CREDIT_NOTE` | Gutschrift erkannt |
| `DOC_CLASSIFIED_DEFECT_LIST` | Mängelliste erkannt |
| `DOC_CLASSIFIED_SUPPLEMENT` | Nachtrag erkannt |
| `DOC_CLASSIFIED_REMINDER` | Mahnung erkannt |
| `DOC_NEEDS_REVIEW` | Unklar, manuelle Prüfung |

**Event Payload Struktur:**
```json
{
  "doc_type": "PROJECT_ORDER",
  "gmail_message_id": "...",
  "gmail_thread_id": "...",
  "from_address": "...",
  "subject": "...",
  "confidence": 0.95,
  "routed_to": "M1"
}
```

---

## TELEGRAM ALERTS

Nur bei kritischen Dokumenten:
- 🔧 DEFECT_LIST → "MÄNGELLISTE EINGEGANGEN"
- 📝 SUPPLEMENT → "NACHTRAG EINGEGANGEN"
- 🚨 REMINDER → "MAHNUNG EINGEGANGEN - SOFORT PRÜFEN"

**Chat ID:** 6088921678

---

## DATENBANK

### Tabelle: classified_emails

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| gmail_message_id | TEXT | UNIQUE |
| gmail_thread_id | TEXT | |
| from_address | TEXT | |
| to_address | TEXT | |
| subject | TEXT | |
| body_snippet | TEXT | max 500 chars |
| attachment_names | TEXT[] | |
| received_at | TIMESTAMPTZ | |
| gmail_label | TEXT | |
| doc_type | TEXT | |
| confidence | NUMERIC | 0.0-1.0 |
| reason | TEXT | |
| routed_to | TEXT | |
| created_at | TIMESTAMPTZ | |

### Tabelle: supplier_aliases (für Fast-Path)

| Column | Type |
|--------|------|
| id | UUID |
| supplier_id | UUID FK |
| alias_name | TEXT |

---

## IDEMPOTENZ

1. **Pre-Check:** `SELECT EXISTS(...)` vor Verarbeitung
2. **Upsert:** `ON CONFLICT (gmail_message_id) DO NOTHING`
3. **Gmail Label:** Nur bei Success gesetzt

---

## ERROR HANDLING

- **Error Workflow:** `apmJoMCbOchwfqTp`
- **Claude Parse Error:** Fallback zu `type: 'OTHER', confidence: 0.5`
- **DB Error:** Wird an Error Workflow weitergeleitet

---

## ABHÄNGIGKEITEN

- Gmail Credentials (OAuth)
- Postgres Credentials (Supabase)
- Anthropic API Key
- Telegram Bot Token

---

## TESTING

```bash
# Email manuell als ungelesen markieren, dann warten
# Oder Chat Trigger nutzen für isolierte Tests
```

---

## BEKANNTE LIMITIERUNGEN

1. **Keine Attachment-Analyse** - nur Metadaten (filename), kein Content
2. **Snippet-Limit** - max 500 chars body
3. **Single-Language** - Prompt nur Deutsch optimiert

---

## NÄCHSTE SCHRITTE

1. **M1_01** muss `DOC_CLASSIFIED_PROJECT_ORDER` Event konsumieren
2. **M6** muss Invoice-Events verarbeiten
3. **Attachment-Parsing** für PDFs (Optional)

---

## REFERENZEN

- Workflow: https://n8n.srv1045913.hstgr.cloud/workflow/sDg2E6zWCqoT0234xaNoM
- Error Workflow: https://n8n.srv1045913.hstgr.cloud/workflow/apmJoMCbOchwfqTp
