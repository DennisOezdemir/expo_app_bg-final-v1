# HANDOVER: Nachtrags-System Gang 2 Complete

**Datum:** 2026-01-19 23:15 CET
**Status:** Frontend fertig, DB-Migration pending
**Commit:** 17bf8febac44573b5ef244a5bb2d00a26ca46fa3

---

## ZUSAMMENFASSUNG

Gang 2 der Nachtrags-System Implementation wurde abgeschlossen. Das Frontend ist vollständig funktionsfähig, wartet aber auf die korrigierte DB-Migration.

---

## GEPUSHTE DATEIEN

| Datei | Zweck |
|-------|-------|
| `migrations/028_nachtrag_system_extension.sql` | Status-Enum, outbound_emails Tabelle |
| `src/components/baustelle/NachtraegeTab.tsx` | Liste aller Nachträge mit Status-Badges |
| `src/components/baustelle/NeuerNachtragDialog.tsx` | Nachtrag erstellen mit Katalog-Suche |
| `src/components/nachtrag/EmailPreviewDialog.tsx` | Mail-Vorschau + Freigabe/Ablehnung |
| `src/components/nachtrag/PendingApprovalsCard.tsx` | Chef-Inbox für ausstehende Freigaben |
| `src/components/project/ProjectDashboard.tsx` | Integration PendingApprovalsCard |
| `src/integrations/supabase/types.ts` | TypeScript Types aktualisiert |

---

## IMPLEMENTIERTE FEATURES

### 1. NeuerNachtragDialog.tsx
- Katalog-Suche über `catalog_positions_v2`
- Manuelle Eingabe wenn nicht im Katalog
- **Idempotency-Key Pattern:** `co_{projectId}_{timestamp}_{random}`
- Startet im Status `DRAFT` → triggert n8n Mail-Vorbereitung

### 2. EmailPreviewDialog.tsx
- Zeigt generierte Mail zur Vorschau
- **Freigeben:** 
  - `change_orders.status` → `APPROVED`
  - `outbound_emails.status` → `approved`
  - Event `EMAIL_APPROVED` mit `change_order_id`
- **Ablehnen:**
  - `change_orders.status` → `REJECTED`
  - `outbound_emails.status` → `rejected`
  - Event `EMAIL_REJECTED`

### 3. NachtraegeTab.tsx
- Status-Badges:
  - 📝 DRAFT - Entwurf
  - ⏳ PENDING_APPROVAL - Warte auf Freigabe
  - ✅ APPROVED - Freigegeben
  - 📤 SUBMITTED - Gesendet
  - ⏳ PENDING_CUSTOMER - Warte auf Kunde
  - ✅ APPROVED_BY_CUSTOMER - Beauftragt
  - ❌ REJECTED_BY_CUSTOMER - Abgelehnt
  - ❌ REJECTED - Intern abgelehnt
  - 💰 INVOICED - Abgerechnet
- **Kunden-Antwort Buttons** (nur bei PENDING_CUSTOMER):
  - "✅ Beauftragt" → Bucht Positionen mit `source: 'change_order'`
  - "❌ Abgelehnt" → Status-Update

### 4. PendingApprovalsCard.tsx
- Zeigt ausstehende Mails zur Freigabe
- Query: `outbound_emails WHERE status='pending_approval' AND project_id=?`
- Öffnet EmailPreviewDialog bei Klick

---

## BEKANNTE ISSUES

### ⚠️ Migration 028 Konflikt
```
028_bank_transactions_matching.sql  ← existierte vorher
028_nachtrag_system_extension.sql   ← AG's neue Migration (DOPPELT!)
029_fix_clients_vs_catalogs.sql     ← existiert
```

**Lösung erforderlich:**
1. `028_nachtrag_system_extension.sql` → umbenennen zu `030_nachtrag_system_extension.sql`
2. Neue Migration `031_nachtrag_hardening.sql` für:
   - `idempotency_key TEXT UNIQUE` auf `change_orders`
   - `idempotency_key TEXT UNIQUE` auf `outbound_emails`
   - `project_id UUID` auf `outbound_emails` (für denormalized filtering)
   - Event-Types registrieren in `event_routing`

### Fehlende Event-Types
Müssen in `event_routing` registriert werden:
- `CHANGE_ORDER_CREATED`
- `CHANGE_ORDER_SUBMITTED`
- `CHANGE_ORDER_CUSTOMER_APPROVED`
- `CHANGE_ORDER_CUSTOMER_REJECTED`
- `EMAIL_PENDING_APPROVAL`
- `EMAIL_APPROVED`
- `EMAIL_REJECTED`
- `EMAIL_SENT`

---

## AUSSTEHENDE ARBEITEN

### DB-Migrationen (Prompt 1)
1. Migration 028 umbenennen → 030
2. Migration 031 erstellen (Hardening)
3. Supabase ausführen

### n8n Flows (Prompt 2)
1. `N1_01_Email_Prep`: CHANGE_ORDER_CREATED → Mail via AI generieren
2. `N1_02_Email_Send`: EMAIL_APPROVED → SMTP/Gmail versenden

---

## EVENT-FLOW ARCHITEKTUR

```
[Frontend: NeuerNachtragDialog]
    │
    ▼ INSERT change_orders (status=DRAFT)
    ▼ INSERT events (CHANGE_ORDER_CREATED)
    │
[n8n: N1_01_Email_Prep]
    │
    ▼ Generiert Mail-Text via AI
    ▼ INSERT outbound_emails (status=pending_approval)
    ▼ UPDATE change_orders (status=PENDING_APPROVAL)
    │
[Frontend: PendingApprovalsCard]
    │
    ▼ Chef sieht Mail-Vorschau
    ▼ Klickt "Freigeben"
    │
[Frontend: EmailPreviewDialog]
    │
    ▼ UPDATE outbound_emails (status=approved)
    ▼ UPDATE change_orders (status=APPROVED)
    ▼ INSERT events (EMAIL_APPROVED)
    │
[n8n: N1_02_Email_Send]
    │
    ▼ Sendet Mail via SMTP/Gmail
    ▼ UPDATE outbound_emails (status=sent)
    ▼ UPDATE change_orders (status=SUBMITTED)
```

---

## DATEIEN ZUM LÖSCHEN (Cleanup)

Diese Mockup-Dateien können entfernt werden:
- `src/components/nachtrag/NachtragCreateDialog.tsx` (redundant)
- `src/components/nachtrag/NachtragDetectionAlert.tsx` (nicht verwendet)

---

## TESTPLAN

1. **Nachtrag erstellen:** Dialog öffnen → Katalog durchsuchen → Position auswählen → Speichern
2. **Event prüfen:** `SELECT * FROM events WHERE event_type = 'CHANGE_ORDER_CREATED' ORDER BY created_at DESC LIMIT 1`
3. **Mail-Generierung:** n8n Flow triggert → outbound_emails Entry prüfen
4. **Chef-Freigabe:** PendingApprovalsCard zeigt Mail → Freigeben klicken
5. **Mail-Versand:** n8n Flow triggert → Mail wird gesendet
6. **Kunden-Antwort:** "Beauftragt" klicken → Position wird eingebucht
