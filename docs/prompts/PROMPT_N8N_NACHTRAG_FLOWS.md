# TASK: n8n Flows für Nachtrags-System

## KONTEXT

Das Nachtrags-System Frontend ist fertig. Jetzt fehlen die **n8n Flows** die:
1. Bei neuem Nachtrag automatisch eine Mail generieren (AI)
2. Bei Chef-Freigabe die Mail versenden (Gmail)

**Supabase Project:** `krtxhxajrphymrzuinna`
**n8n Instance:** `n8n.srv1045913.hstgr.cloud`

---

## ARCHITEKTUR-ÜBERSICHT

```
[Frontend]                     [n8n]                       [DB]
    │                            │                           │
    ├─► INSERT change_order ────►│                           │
    │   status=DRAFT             │                           │
    ├─► INSERT event ───────────►│                           │
    │   CHANGE_ORDER_CREATED     │                           │
    │                            │                           │
    │                      N1_01_Email_Prep                  │
    │                            │                           │
    │                            ├─► Lade Nachtrag + Projekt │
    │                            ├─► AI generiert Mail-Text  │
    │                            ├─► INSERT outbound_email   │
    │                            │   status=pending_approval │
    │                            ├─► UPDATE change_order     │
    │                            │   status=PENDING_APPROVAL │
    │                            │                           │
    │◄─ Chef sieht Freigabe ─────┼───────────────────────────┤
    │                            │                           │
    ├─► UPDATE outbound_email ──►│                           │
    │   status=approved          │                           │
    ├─► INSERT event ───────────►│                           │
    │   EMAIL_APPROVED           │                           │
    │                            │                           │
    │                      N1_02_Email_Send                  │
    │                            │                           │
    │                            ├─► Lade Mail aus DB        │
    │                            ├─► Sende via Gmail API     │
    │                            ├─► UPDATE outbound_email   │
    │                            │   status=sent             │
    │                            ├─► UPDATE change_order     │
    │                            │   status=PENDING_CUSTOMER │
```

---

## FLOW 1: N1_01_Email_Prep

### Trigger
- **Typ:** Supabase Webhook (Realtime) ODER Event-Sweeper
- **Event:** `CHANGE_ORDER_CREATED`
- **Tabelle:** `events` WHERE `event_type = 'CHANGE_ORDER_CREATED'` AND `processed_at IS NULL`

### Nodes

**1. Trigger/Sweeper**
```
Interval: 1 min (Backup)
Query: SELECT * FROM events 
       WHERE event_type = 'CHANGE_ORDER_CREATED' 
       AND processed_at IS NULL 
       AND created_at < now() - interval '30 seconds'
       LIMIT 5
```

**2. Lade Nachtrag + Projekt + Kunde**
```sql
SELECT 
  co.*,
  p.name as project_name,
  p.address as project_address,
  c.name as client_name,
  c.email as client_email,
  c.contact_person
FROM change_orders co
JOIN projects p ON co.project_id = p.id
JOIN clients c ON p.client_id = c.id
WHERE co.id = '{{ $json.payload.change_order_id }}'
```

**3. AI: Mail-Text generieren**
```
Prompt:
Du bist Assistent für ein Bauunternehmen. Erstelle eine professionelle E-Mail an den Kunden für einen Nachtrag.

Projekt: {{ project_name }}
Adresse: {{ project_address }}
Kunde: {{ client_name }}
Ansprechpartner: {{ contact_person }}

Nachtrag:
- Titel: {{ title }}
- Beschreibung: {{ description }}
- Begründung: {{ justification }}
- Menge: {{ quantity }} {{ unit }}
- Einzelpreis: {{ unit_price }}€
- Gesamt: {{ total }}€

Schreibe eine höfliche, professionelle Mail die:
1. Den Nachtrag erklärt
2. Die Begründung nennt
3. Den Preis transparent darstellt
4. Um Freigabe/Beauftragung bittet

Format: JSON mit { "subject": "...", "body": "..." }
```

**4. INSERT outbound_emails**
```sql
INSERT INTO outbound_emails (
  project_id,
  entity_type,
  entity_id,
  recipient,
  subject,
  body,
  status
) VALUES (
  '{{ project_id }}',
  'change_order',
  '{{ change_order_id }}',
  '{{ client_email }}',
  '{{ ai_subject }}',
  '{{ ai_body }}',
  'pending_approval'
)
RETURNING id
```

**5. UPDATE change_order**
```sql
UPDATE change_orders 
SET status = 'PENDING_APPROVAL'
WHERE id = '{{ change_order_id }}'
```

**6. Mark Event Processed**
```sql
UPDATE events 
SET processed_at = now()
WHERE id = '{{ event_id }}'
```

---

## FLOW 2: N1_02_Email_Send

### Trigger
- **Event:** `EMAIL_APPROVED`
- **Tabelle:** `events` WHERE `event_type = 'EMAIL_APPROVED'` AND `processed_at IS NULL`

### Nodes

**1. Trigger/Sweeper**
```
Query: SELECT * FROM events 
       WHERE event_type = 'EMAIL_APPROVED' 
       AND processed_at IS NULL 
       LIMIT 5
```

**2. Lade Mail**
```sql
SELECT * FROM outbound_emails
WHERE id = '{{ $json.payload.email_id }}'
```

**3. Gmail Node**
- **To:** `{{ recipient }}`
- **Subject:** `{{ subject }}`
- **Body:** `{{ body }}`
- **From:** `info@deine-baulowen.de` (konfigurierter Account)

**4. UPDATE outbound_email**
```sql
UPDATE outbound_emails 
SET status = 'sent', sent_at = now()
WHERE id = '{{ email_id }}'
```

**5. UPDATE change_order**
```sql
UPDATE change_orders 
SET status = 'PENDING_CUSTOMER'
WHERE id = '{{ $json.payload.change_order_id }}'
```

**6. Mark Event Processed**
```sql
UPDATE events 
SET processed_at = now()
WHERE id = '{{ event_id }}'
```

**7. Error Handler (Optional)**
Bei Gmail-Fehler:
```sql
UPDATE outbound_emails 
SET status = 'failed', error_message = '{{ error }}'
WHERE id = '{{ email_id }}'
```

---

## EVENT PAYLOAD STRUKTUR

### CHANGE_ORDER_CREATED
```json
{
  "event_type": "CHANGE_ORDER_CREATED",
  "entity_type": "change_order",
  "entity_id": "uuid-of-change-order",
  "payload": {
    "change_order_id": "uuid-of-change-order"
  }
}
```

### EMAIL_APPROVED
```json
{
  "event_type": "EMAIL_APPROVED",
  "entity_type": "outbound_email",
  "entity_id": "uuid-of-email",
  "payload": {
    "email_id": "uuid-of-email",
    "change_order_id": "uuid-of-change-order"
  }
}
```

---

## ERFOLGSKRITERIEN

1. ✅ Flow `N1_01_Email_Prep` aktiv
2. ✅ Flow `N1_02_Email_Send` aktiv
3. ✅ Bei `CHANGE_ORDER_CREATED` → Mail wird generiert, status=pending_approval
4. ✅ Bei `EMAIL_APPROVED` → Mail wird gesendet, status=sent
5. ✅ Gmail OAuth konfiguriert für `info@deine-baulowen.de`

---

## TESTPLAN

1. **Manueller Test N1_01:**
   ```sql
   INSERT INTO events (event_type, entity_type, entity_id, payload)
   VALUES ('CHANGE_ORDER_CREATED', 'change_order', 
           'existing-co-uuid', 
           '{"change_order_id": "existing-co-uuid"}');
   ```
   → Prüfen: `SELECT * FROM outbound_emails ORDER BY created_at DESC LIMIT 1`

2. **Manueller Test N1_02:**
   ```sql
   INSERT INTO events (event_type, entity_type, entity_id, payload)
   VALUES ('EMAIL_APPROVED', 'outbound_email', 
           'existing-email-uuid', 
           '{"email_id": "existing-email-uuid", "change_order_id": "existing-co-uuid"}');
   ```
   → Prüfen: Mail im Postausgang

---

## REFERENZ

- Event-System Doku: Projekt-Datei `010_EVENT_SYSTEM_DOCS.md`
- Vollständige Handover: `docs/HANDOVER_2026-01-19_NACHTRAG_GANG2.md`
- Flow-Pattern Beispiel: `MX_00_Event_Router` (bereits in Produktion)
