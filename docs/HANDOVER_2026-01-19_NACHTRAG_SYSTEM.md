# HANDOVER: Nachtrags-System (Change Order) - Stand 2026-01-19

## STATUS: Frontend ✅ | DB Migration ⚠️ | n8n Flows ❌

---

## 1. WAS WURDE ERLEDIGT

### Frontend (Gang 2 - Gepusht)
| Datei | Status | Funktion |
|-------|--------|----------|
| `src/components/baustelle/NeuerNachtragDialog.tsx` | ✅ | Nachtrag erstellen mit Katalog-Suche, Idempotency-Key |
| `src/components/baustelle/NachtraegeTab.tsx` | ✅ | Liste mit Status-Badges, Kunden-Response-Buttons |
| `src/components/nachtrag/EmailPreviewDialog.tsx` | ✅ | Mail-Vorschau, Freigabe/Ablehnung |
| `src/components/nachtrag/PendingApprovalsCard.tsx` | ✅ | Chef-Inbox für Project Dashboard |
| `src/components/project/ProjectDashboard.tsx` | ✅ | Integration der PendingApprovalsCard |

### Commit
```
17bf8febac44573b5ef244a5bb2d00a26ca46fa3
feat: implement and refine Change Order (Nachtrag) system (Gang 2)
```

---

## 2. MIGRATIONS-PROBLEM

### Ist-Zustand (Konflikt!)
```
migrations/
├── 027_change_orders.sql              # Basis-Tabellen (existiert)
├── 028_bank_transactions_matching.sql # Bank-Matching (existiert)
├── 028_nachtrag_system_extension.sql  # ⚠️ DOPPELTE NUMMER!
└── 029_fix_clients_vs_catalogs.sql    # Clients Fix (existiert)
```

### Soll-Zustand
```
migrations/
├── 027_change_orders.sql
├── 028_bank_transactions_matching.sql
├── 029_fix_clients_vs_catalogs.sql
├── 030_nachtrag_system_extension.sql  # Umbenennen!
└── 031_nachtrag_hardening.sql         # NEU erstellen!
```

---

## 3. NOCH ZU ERLEDIGEN

### A) DB Migrations (Prompt 1)
1. `028_nachtrag_system_extension.sql` → `030_nachtrag_system_extension.sql` umbenennen
2. `031_nachtrag_hardening.sql` erstellen:
   - `idempotency_key TEXT UNIQUE` auf `change_orders`
   - `idempotency_key TEXT UNIQUE` auf `outbound_emails`
   - `project_id UUID` auf `outbound_emails` (für denormalized filtering)
   - Event-Types in `event_routing` registrieren
3. Migrationen in Supabase ausführen

### B) n8n Flows (Prompt 2)
1. `N1_01_Email_Prep` - Trigger: CHANGE_ORDER_CREATED
   - Lade Nachtrag + Projekt + Kunde
   - AI generiert Mail-Text
   - INSERT in outbound_emails mit status='pending_approval'
   - Fire EVENT: EMAIL_PENDING_APPROVAL

2. `N1_02_Email_Send` - Trigger: EMAIL_APPROVED
   - Lade Mail aus outbound_emails
   - Sende via Gmail API
   - UPDATE status='sent'
   - UPDATE change_orders status='PENDING_CUSTOMER'

---

## 4. ARCHITEKTUR-ÜBERSICHT

### Event-Flow
```
[Frontend]                    [n8n]                      [DB]
    │                           │                          │
    ├─ Nachtrag erstellen ─────►│                          │
    │   status=DRAFT            │                          │
    │   fire CHANGE_ORDER_CREATED                          │
    │                           │                          │
    │                           ├─ N1_01_Email_Prep ──────►│
    │                           │   INSERT outbound_email  │
    │                           │   status=pending_approval│
    │                           │                          │
    ├─ Chef sieht Freigabe ◄────┼──────────────────────────┤
    │                           │                          │
    ├─ Chef klickt "Freigeben" ►│                          │
    │   UPDATE email approved   │                          │
    │   fire EMAIL_APPROVED     │                          │
    │                           │                          │
    │                           ├─ N1_02_Email_Send ──────►│
    │                           │   Gmail API send         │
    │                           │   UPDATE email sent      │
    │                           │   UPDATE CO pending_cust │
    │                           │                          │
    ├─ Kunde antwortet (manuell)│                          │
    │   "Beauftragt" klicken    │                          │
    │   INSERT offer_positions  │                          │
    │   source='change_order'   │                          │
```

### Status-Enum (change_orders)
```sql
'DRAFT'                 -- Gerade erstellt, wartet auf Mail-Prep
'PENDING_APPROVAL'      -- Mail fertig, wartet auf Chef
'SUBMITTED'             -- Freigegeben (interner Status)
'APPROVED'              -- Chef hat Mail freigegeben
'PENDING_CUSTOMER'      -- Mail gesendet, wartet auf Kunde
'APPROVED_BY_CUSTOMER'  -- Kunde hat beauftragt
'REJECTED_BY_CUSTOMER'  -- Kunde hat abgelehnt
'REJECTED'              -- Chef hat abgelehnt
'INVOICED'              -- Abgerechnet
'CANCELLED'             -- Storniert
```

### Idempotency-Key Format
```
co_{projectId}_{timestamp}_{random6}
Beispiel: co_abc123_1737323456789_x7k2m9
```

---

## 5. KRITISCHE CODE-STELLEN

### NeuerNachtragDialog.tsx - Idempotency
```typescript
const idempotencyKey = `co_${projectId}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

const { data, error } = await supabase
  .from('change_orders')
  .insert({
    ...formData,
    idempotency_key: idempotencyKey,
    status: 'DRAFT'  // Wichtig: DRAFT triggert n8n
  })
  .select()
  .single();

// Event feuern
await supabase.from('events').insert({
  event_type: 'CHANGE_ORDER_CREATED',
  entity_type: 'change_order',
  entity_id: data.id,
  payload: { change_order_id: data.id }
});
```

### EmailPreviewDialog.tsx - Freigabe
```typescript
const handleApprove = async () => {
  // 1. Email updaten
  await supabase.from('outbound_emails')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', email.id);
  
  // 2. Change Order updaten
  await supabase.from('change_orders')
    .update({ status: 'APPROVED' })
    .eq('id', email.entity_id);
  
  // 3. Event feuern für n8n
  await supabase.from('events').insert({
    event_type: 'EMAIL_APPROVED',
    entity_type: 'outbound_email',
    entity_id: email.id,
    payload: { email_id: email.id, change_order_id: email.entity_id }
  });
};
```

### NachtraegeTab.tsx - Kunde beauftragt → Position buchen
```typescript
const handleCustomerApproved = async (changeOrder) => {
  // 1. Status updaten
  await supabase.from('change_orders')
    .update({ status: 'APPROVED_BY_CUSTOMER' })
    .eq('id', changeOrder.id);
  
  // 2. Position ins Angebot buchen
  await supabase.from('offer_positions').insert({
    offer_id: changeOrder.offer_id,
    section_id: changeOrder.section_id,
    title: changeOrder.title,
    quantity: changeOrder.quantity,
    unit: changeOrder.unit,
    unit_price: changeOrder.unit_price,
    total: changeOrder.total,
    source: 'change_order',
    change_order_id: changeOrder.id,
    phase: 'erstbegehung',
    inspection_status: 'confirmed'
  });
};
```

---

## 6. OFFENE FRAGEN (für nächsten Chat klären)

1. **Katalog-Tabelle:** `catalog_positions_v2` existiert? Oder `wbs_catalog_items`?
2. **Email-Empfänger:** `projects → clients → email` oder `projects.contact_email`?
3. **Foto-Upload Bucket:** `change-order-evidence` oder bestehend?

---

## 7. DATEIEN ZUM LÖSCHEN (Cleanup)

```
src/components/nachtrag/NachtragCreateDialog.tsx  # Altes Mockup, ignorieren
```

---

## QUICK-REFERENCE

### GitHub Repo
```
Deine-Baulowen/baugenius-mockup
Branch: main
```

### Supabase Project
```
krtxhxajrphymrzuinna
```

### Relevante Issues
```
#6 - feat: Nachtrags-System (Erstellung → Mail → Freigabe → Einbuchung)
```
