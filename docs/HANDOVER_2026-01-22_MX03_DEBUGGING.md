# HANDOVER: MX_03 Document Classifier Debugging

**Datum:** 2026-01-22  
**Status:** 🔴 KRITISCH — Metadata Extraction kaputt

---

## SYMPTOME

1. **90% der Emails haben leere Metadata**
   - `from_address: ""`
   - `subject: "(kein Betreff)"`
   - `confidence: 0.50` (Fallback-Wert)
   - Alles wird `OTHER` klassifiziert

2. **Henri Benthack Mahnung nicht erkannt**
   - Gmail zeigt: "Pamela Mausolf - 1031660 Mahnung der Henri Benthack GmbH"
   - Nicht in `classified_emails` → wurde nie verarbeitet ODER mit leeren Feldern

3. **Sporadisch funktioniert es**
   - Superchat: korrekt extrahiert
   - AHB-Griffe: korrekt extrahiert
   - Rest: leer

---

## DB-DIAGNOSE (22.01.2026 15:00)

```sql
SELECT gmail_message_id, from_address, subject, doc_type, confidence
FROM classified_emails ORDER BY created_at DESC LIMIT 10;
```

**Ergebnis:**
| gmail_message_id | from_address | subject | doc_type | confidence |
|------------------|--------------|---------|----------|------------|
| 19be5cbb906b4658 | "" | "(kein Betreff)" | OTHER | 0.50 |
| 19be5b4e64f63f89 | "" | "(kein Betreff)" | OTHER | 0.50 |
| 19be5907d81143d1 | Superchat | "Neue Nachricht" | OTHER | 0.90 |
| 19be5657d887e439 | no-reply@ahb-griffe.de | "AHB-Türgriffe..." | DELIVERY_NOTE | 0.90 |

→ Manche Emails werden korrekt extrahiert, die meisten nicht.

---

## ROOT CAUSE HYPOTHESE

**Gmail Poll "Simplify" Option ist AN** (Screenshot bestätigt)

Gmail API mit Simplify gibt anderes Format zurück:
```javascript
// Erwartet (ohne Simplify):
$json.payload.headers.find(h => h.name === 'From').value

// Tatsächlich (mit Simplify):
$json.From  // oder $json.from oder ganz anders
```

**Beweis:** 
- Screenshot zeigt Gmail Poll Output mit `payload.mimeType`, `From: "Superchat <notifications@superchat.com>"`
- Das Format variiert je nach Email-Typ

---

## WORKFLOW DETAILS

**MX_03_Document_Classifier v2**
- n8n ID: `sDg2E6zWCqoT0234xaNoM`
- Trigger: Gmail Poll (every minute, unread, Simplify=ON)
- Problem-Node: `🔧 Extract Metadata`

**Kritischer Code:**
```javascript
// VERMUTLICH FALSCH:
let fromAddress = email.From || '';
let subject = email.Subject || '(kein Betreff)';

// SOLLTE SEIN (je nach Simplify-Format):
let fromAddress = $json.From || $json.from || '';
let subject = $json.Subject || $json.subject || '(kein Betreff)';
```

---

## SOFORT-MASSNAHMEN

### 1. Debug Metadata Node
```
1. n8n → MX_03 → Executions
2. Eine Execution mit leerem from_address öffnen
3. Gmail Poll Node Output prüfen
4. Dokumentieren welches Feld den From-Header enthält
```

### 2. Fix Code in Extract Metadata
Nach Analyse das richtige Feld verwenden.

### 3. Kaputte Einträge löschen (für Re-Processing)
```sql
DELETE FROM classified_emails 
WHERE from_address = '' 
  AND created_at > '2026-01-22 00:00:00';
```

### 4. Label-Filter aktivieren
Gmail Poll nur auf `01_Eingang` (Label_8237576157910072573) filtern.
→ Superchat, GitHub etc. nicht mehr verarbeiten.

---

## CONTEXT: M4_02 UMBAU

**Ursprüngliches Ziel:** M4_02 von Gmail-Trigger auf Webhook umstellen.

**Status:** PAUSIERT bis MX_03 stabil.

**Geplante Events:**
- `DOC_CLASSIFIED_INVOICE_IN` → M4_02
- `DOC_CLASSIFIED_CREDIT_NOTE` → M4_02
- `DOC_CLASSIFIED_REMINDER` → M4_02

---

## REFERENZEN

| Resource | Link/ID |
|----------|---------|
| MX_03 Workflow | `sDg2E6zWCqoT0234xaNoM` |
| Gmail Label 01_Eingang | `Label_8237576157910072573` |
| Supabase Project | `krtxhxajrphymrzuinna` |
| Phase 2 Handover | `docs/HANDOVER_2026-01-20_MX03_CLASSIFIER_PHASE2.md` |

---

## FRESH CHAT PROMPT

Kopiere das für neuen Chat:

```
## KONTEXT
MX_03 Document Classifier hat kritischen Bug: Metadata Extraction kaputt.

**Problem:**
- 90% der Emails: from_address="" und subject="(kein Betreff)"
- Henri Benthack Mahnung wird nicht erkannt
- Am 20.01 funktionierte es, seit 22.01 nicht mehr

**Handover:** 
GitHub `Deine-Baulowen/baugenius-mockup` → `docs/HANDOVER_2026-01-22_MX03_DEBUGGING.md`

**Workflow:** 
MX_03_Document_Classifier v2: `sDg2E6zWCqoT0234xaNoM`

**Aufgabe:**
1. Gmail Poll Node Output analysieren (welches Feld hat From-Header?)
2. Extract Metadata Code fixen
3. Kaputte DB-Einträge löschen
4. Label-Filter aktivieren
5. Test mit Mahnung

**Supabase:** krtxhxajrphymrzuinna
```
