# HANDOVER: M2 Inspection Protocol Flows

**Datum:** 2026-01-17
**Status:** 🔄 Flows definiert, MX_00 Update pending

---

## Erledigt

### 1. DB-Änderungen (Applied)

```sql
-- pdf_storage_path Spalte
ALTER TABLE inspection_protocols 
ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;

-- event_routing Multi-Route Support
ALTER TABLE event_routing DROP CONSTRAINT event_routing_pkey;
ALTER TABLE event_routing ADD PRIMARY KEY (event_type, target_workflow);

-- Event-Typ
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'ZB_PROGRESS_SYNCED';
```

### 2. Event Routing (Aktiv)

| Event | Workflow | Webhook |
|-------|----------|--------|
| INSPECTION_PROTOCOL_COMPLETED | M2_01_Sync_ZB_Progress | `/webhook/m2-01-sync-zb-progress` |
| INSPECTION_PROTOCOL_COMPLETED | M2_02_Generate_Protocol_PDF | `/webhook/m2-02-generate-protocol-pdf` |
| INSPECTION_PROTOCOL_CREATED | M2_02_Protocol_Notification | `/webhook/m2-protocol-notification` |

### 3. Flow Definitionen

#### M2_01_Sync_ZB_Progress
**Trigger:** `INSPECTION_PROTOCOL_COMPLETED` (nur Zwischenbegehung)

**Logik:**
1. Claim workflow_step (Idempotenz: `m2_01:{event_id}`)
2. Check protocol_type = 'zwischenbegehung' → sonst skip
3. Load inspection_protocol_items
4. UPDATE offer_positions SET progress_percent, progress_updated_at, last_inspection_id
5. Telegram: "✅ ZB-{nummer} synced: {n} Positionen, Ø {avg}%"
6. Fire event: ZB_PROGRESS_SYNCED
7. Complete workflow_step

#### M2_02_Generate_Protocol_PDF
**Trigger:** `INSPECTION_PROTOCOL_COMPLETED` ODER manueller Webhook

**Logik:**
1. Claim workflow_step (Idempotenz: `m2_02:{event_id}`)
2. `get_inspection_protocol_details(protocol_id)` laden
3. Template Key: `inspection_zb` oder `inspection_eb_ab`
4. Template aus document_templates laden
5. Variables ersetzen, items_html generieren
6. Gotenberg: HTML → PDF
7. Upload: `/protocols/{project_number}/{protocol_number}.pdf`
8. UPDATE inspection_protocols SET pdf_storage_path
9. Telegram mit Download-Link
10. Complete workflow_step

---

## ⚠️ KRITISCH: MX_00 Update Required

### Problem
- `Lookup Routing` hat `LIMIT 1` → nur erste Route wird geholt
- `Switch Event Type` kennt `INSPECTION_PROTOCOL_COMPLETED` nicht

### Lösung: Dynamic Routing

1. **Lookup Routing ändern:** LIMIT 1 entfernen
2. **Switch + Call-Nodes ersetzen** durch Code Node "Dynamic Route Dispatcher"
3. **Code iteriert über alle Routes** und ruft jeden Webhook auf

**Neuer Code Node:**
```javascript
const event = $('Transform Webhook Payload').first()?.json || $input.first()?.json;
const routes = $input.all();

for (const route of routes) {
  if (!route.json.webhook_url) continue;
  
  await this.helpers.httpRequest({
    method: 'POST',
    url: route.json.webhook_url,
    body: {
      event_id: event.id,
      event_type: event.event_type,
      project_id: event.project_id,
      payload: event.payload
    },
    json: true,
    timeout: 30000
  });
}
```

---

## Offen

1. **MX_00 Dynamic Routing implementieren** (nächste Session)
2. **M2_01 + M2_02 in n8n importieren**
3. **End-to-End Test:**
   - Protokoll auf status='completed' setzen
   - Prüfen: Beide Flows triggern
   - Prüfen: offer_positions.progress_percent updated (nur bei ZB)
   - Prüfen: PDF in Storage

---

## Test-Daten

| Element | Wert |
|---------|------|
| Protokoll | EB-001 für BL-2026-003 |
| Protocol ID | `2f4af76a-f8f6-41ac-b7ef-2e4b583fd45b` |
| Items | 40 |
| Templates | `inspection_zb`, `inspection_eb_ab` |

---

## Flow JSON Files

Siehe: `docs/n8n-flows/`
- `M2_01_Sync_ZB_Progress.json`
- `M2_02_Generate_Protocol_PDF.json`
