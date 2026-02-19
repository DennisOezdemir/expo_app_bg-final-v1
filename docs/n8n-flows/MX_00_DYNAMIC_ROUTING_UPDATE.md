# MX_00 Event Router - Dynamic Multi-Route Update

**Datum:** 2026-01-17
**Status:** 🔄 Update Required

---

## Problem

1. `Lookup Routing` hat `LIMIT 1` → nur erste Route wird geholt
2. `Switch Event Type` ist hardcoded → neue Event-Types müssen manuell hinzugefügt werden
3. Multi-Route Events (z.B. `INSPECTION_PROTOCOL_COMPLETED` mit 2 Handlern) funktionieren nicht

---

## Lösung: Dynamic Routing

### 1. Lookup Routing - LIMIT entfernen

**Aktuelle Query:**
```sql
SELECT target_workflow, webhook_url
FROM event_routing
WHERE event_type = '...'
LIMIT 1;  -- ❌ Problem
```

**Neue Query:**
```sql
SELECT target_workflow, webhook_url
FROM event_routing
WHERE event_type = '{{ $('Transform Webhook Payload').item.json.event_type }}'
  AND is_active = true;
-- Kein LIMIT → alle Routes
```

### 2. Switch Node durch Code Node ersetzen

**Neuer Node: "Dynamic Route Dispatcher"**

Position: Nach "Has Routing?" (ersetzt Switch + alle Call-Nodes)

```javascript
// Dynamic Route Dispatcher
// Iteriert über ALLE aktiven Routes für den Event-Type

const event = $('Transform Webhook Payload').first()?.json 
           || $('Merge Routing Info').first()?.json
           || $input.first()?.json;

const routes = $input.all();

if (!routes || routes.length === 0) {
  console.log('No routes for event:', event?.event_type);
  return [{ json: { status: 'no_routes', event_type: event?.event_type } }];
}

const results = [];

for (const route of routes) {
  const webhookUrl = route.json.webhook_url;
  const targetWorkflow = route.json.target_workflow;
  
  if (!webhookUrl) {
    console.log('No webhook_url for:', targetWorkflow);
    continue;
  }
  
  try {
    const response = await this.helpers.httpRequest({
      method: 'POST',
      url: webhookUrl,
      body: {
        event_id: event.id,
        event_type: event.event_type,
        project_id: event.project_id,
        payload: event.payload
      },
      json: true,
      timeout: 30000
    });
    
    results.push({
      json: {
        target_workflow: targetWorkflow,
        status: 'dispatched',
        response: response
      }
    });
    
    console.log(`✅ Dispatched to ${targetWorkflow}`);
  } catch (error) {
    results.push({
      json: {
        target_workflow: targetWorkflow,
        status: 'error',
        error: error.message
      }
    });
    
    console.error(`❌ Error dispatching to ${targetWorkflow}:`, error.message);
  }
}

return results.length > 0 ? results : [{ json: { status: 'no_routes_called' } }];
```

### 3. Vereinfachte Flow-Struktur

**Vorher:**
```
Webhook → Transform → Lookup (LIMIT 1) → Merge → Has Routing?
                                                      ↓
Sweeper → Fetch Events ────────────────────────> Switch Event Type
                                                      ↓
                                   ┌─────────────────────────────────┐
                                   │ Call M1_04a │ Call M1_04b │ ... │
                                   └─────────────────────────────────┘
                                                      ↓
                                              Mark as Processed
```

**Nachher:**
```
Webhook → Transform → Lookup ALL Routes → Merge → Has Routing?
                                                       ↓
Sweeper → Fetch Events ────────────────────────> Dynamic Route Dispatcher
                                                       ↓
                                               Mark as Processed
```

---

## Manuelle Schritte in n8n

1. **Öffne MX_00_Event_Router**

2. **"Lookup Routing" Node ändern:**
   - Query: `LIMIT 1` entfernen

3. **Neuen Code Node erstellen:**
   - Name: `Dynamic Route Dispatcher`
   - Position: Nach "Has Routing?"
   - Code: siehe oben

4. **Folgende Nodes löschen:**
   - Switch Event Type
   - Call M1_04a
   - Call M1_04b
   - Call M1_04c
   - Call M1_05
   - Call MX_01
   - Call MX_02
   - Call M1_02
   - Call M1_03
   - Call M4_01
   - Log Unhandled

5. **Connections neu verdrahten:**
   - Has Routing? → Dynamic Route Dispatcher
   - Dynamic Route Dispatcher → Mark as Processed

6. **Speichern + Aktivieren**

---

## Test

```bash
curl -X POST https://n8n.srv1045913.hstgr.cloud/webhook/event-router \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-multi-route",
    "event_type": "INSPECTION_PROTOCOL_COMPLETED",
    "project_id": null,
    "payload": { "protocol_id": "2f4af76a-f8f6-41ac-b7ef-2e4b583fd45b" }
  }'
```

**Erwartetes Ergebnis:**
- M2_01_Sync_ZB_Progress wird aufgerufen
- M2_02_Generate_Protocol_PDF wird aufgerufen
- Beide Webhooks in Execution Log sichtbar

---

## Vorteile

1. **Keine manuellen Switch-Cases mehr** → neue Events automatisch geroutet
2. **Multi-Route Support** → ein Event triggert mehrere Workflows
3. **Wartungsarm** → nur noch event_routing Tabelle pflegen
4. **Debugging** → alle Dispatches im Log sichtbar
