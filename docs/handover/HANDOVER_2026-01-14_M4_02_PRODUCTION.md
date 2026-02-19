# HANDOVER: M4_02 Mail Invoice Scanner — Production-Ready

**Datum:** 2026-01-14  
**Status:** ✅ Fertig & Produktiv  
**Flow:** M4_02_Mail_Invoice_Scanner_V2_MX02  
**n8n ID:** a0tUjmuVkjxfZpCE

---

## Architektur-Änderung

### Alt (problematisch)
```
info@deine-bauloewen.de
├── Blacklist: 15 Begriffe
├── Whitelist: 4 Begriffe
└── Problem: Edge Cases, falsche Mails verarbeitet
```

### Neu (sauber)
```
invoice@deine-bauloewen.de
├── Dediziertes Rechnungs-Postfach
├── Alles was reinkommt = Rechnung
└── Kein Filter nötig
```

---

## Implementierte Komponenten

### 1. Gmail Setup
- **Postfach:** invoice@deine-bauloewen.de
- **OAuth Client:** Webanwendung (nicht Desktop!)
- **n8n Credential:** Invoice@

### 2. Label-System
| Label | Bedeutung |
|-------|-----------|
| 01_NEU | Unverarbeitet, wartet auf Flow |
| 02_VERARBEITET | Erfolgreich gescannt |
| 03_FEHLER | 3x fehlgeschlagen, manuelle Prüfung |

### 3. Error Branch (3x Retry)

```
Claude Vision (Error)
    │
    ▼
📊 Track Attempt (Code Node)
    │
    ▼
🔄 Upsert Retry (Postgres)
    │
    ▼
❓ Aufgeben? (IF: attempts >= 3)
    │
    ├── NEIN → (Ende, nächster Poll versucht erneut)
    │
    └── JA → 🏷️ Add 03_FEHLER
             🗑️ Remove 01_NEU
             ✅ Mark Read
             📱 Telegram Alert
```

### 4. Migration (bereits ausgeführt)

```sql
CREATE TABLE IF NOT EXISTS email_processing_attempts (
  email_message_id TEXT PRIMARY KEY,
  attempts INT DEFAULT 1,
  last_error TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, FAILED, SUCCESS
  last_attempt_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_attempts_status 
ON email_processing_attempts(status);
```

---

## Node-Konfigurationen

### 📊 Track Attempt (Code)

```javascript
const emailInfo = $('📋 Extract Email Info').first().json;
const errorMsg = $input.first().error?.message || 'Unknown Claude error';
const cleanError = errorMsg.substring(0, 500).replace(/'/g, "''");

return {
  json: {
    email_message_id: emailInfo.email_message_id,
    message_id: emailInfo.message_id,
    email_from: (emailInfo.email_from || '').substring(0, 100),
    email_subject: (emailInfo.email_subject || '').substring(0, 100),
    error: cleanError
  }
};
```

### 🔄 Upsert Retry (Postgres)

```sql
INSERT INTO email_processing_attempts (email_message_id, last_error)
VALUES ('{{ $json.email_message_id }}', '{{ $json.error }}')
ON CONFLICT (email_message_id) DO UPDATE SET
  attempts = email_processing_attempts.attempts + 1,
  last_error = EXCLUDED.last_error,
  last_attempt_at = now()
RETURNING attempts;
```

### 📱 Telegram Fehler

```
⚠️ *Rechnung fehlgeschlagen (3x)*

📧 Von: {{ $('📊 Track Attempt').first().json.email_from }}
📋 Betreff: {{ $('📊 Track Attempt').first().json.email_subject }}
❌ Fehler: {{ $('📊 Track Attempt').first().json.error.substring(0, 200) }}

→ Manuell prüfen: Label 03_FEHLER
```

**Parse Mode:** Markdown (legacy)

---

## Lieferanten-Status

20 Lieferanten angeschrieben (BCC) mit Deadline 01.02.2026:
- REESA, Würth, Peter Jensen, Farbe Fertig Los, Benthack
- Bauhaus, GC Gruppe, MEGA, Fliesen Alfers, Ullmann Farben
- Schlau Großhandel, Bauwelt, Bautrocknerverleih, Elektrikshop24
- Elektroland24, Pleikies, Filter Direkt, Schleiftitan, RHD Bremen, CWS

---

## Offene Punkte

- [ ] info@ Weiterleitungsregeln für Übergangsphase
- [ ] Online-Shops manuell umstellen

---

## Test

```bash
# Rechnung an invoice@ senden
# Flow sollte automatisch triggern
# Bei Erfolg: 02_VERARBEITET Label
# Bei 3x Fehler: 03_FEHLER Label + Telegram
```
