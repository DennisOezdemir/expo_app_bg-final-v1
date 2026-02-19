# HANDOVER: M2_03 Generate Protocol PDF

**Datum:** 2026-01-17
**Status:** 🔧 FIX NEEDED
**Workflow:** M2_03Generate_Protocol_PDF (lDrZnW4bYMCpumiTbmkKl)

---

## Aufgabe

M2_03 fixable machen. Flow existiert und ist aktiviert, crasht aber bei Aufruf.

---

## Bekannte Bugs (zu fixen)

### 1. "Unused Respond to Webhook" Error
**Identisch mit M2_02 Bug**
```
Error: Unused Respond to Webhook node found in the workflow
```
**Fix:** Webhook Node → Settings → Respond: **"Using 'Respond to Webhook' Node"**

### 2. Webhook URL bereits korrigiert
```sql
-- event_routing ist korrekt:
-- webhook_url: https://n8n.srv1045913.hstgr.cloud/webhook/m2-02-generate-protocol-pdf

-- n8n Webhook Path ist: m2-02-generate-protocol-pdf ✓
```

---

## Flow Struktur (existiert)

```
INSPECTION_PROTOCOL_COMPLETED Event
  → MX_00 Router
  → M2_03 Webhook (/webhook/m2-02-generate-protocol-pdf)
  → Claim Step
  → IF Claimed
  → Load Protocol Details
  → Determine Template Key
  → Load Template
  → Build HTML
  → Gotenberg PDF
  → Upload to Storage
  → Update Protocol PDF Path
  → Telegram
  → Mark Processed + Complete
  → Response OK
```

---

## Offene Fragen

### 1. Document Templates
Existieren die Templates in der DB?
```sql
SELECT template_key, version FROM document_templates 
WHERE template_key IN ('inspection_zb', 'inspection_eb_ab');
```

### 2. Gotenberg erreichbar?
```
URL: http://gotenberg:3000/forms/chromium/convert/html
```

### 3. Supabase Storage Bucket
Existiert `documents/protocols/` Pfad?

---

## Test-Daten (vorhanden)

Gleiche wie M2_02:
```sql
-- Projekt: BL-2026-010 (56404c9c-3e55-4cd5-9ea4-40ebde77c58c)
-- Protokoll: ZB-2026-010-001 (fedb60fd-c6fe-4636-beac-7df0cb2fff2b)
-- Typ: zwischenbegehung

-- Test Event:
INSERT INTO events (event_type, project_id, payload, source_system, source_flow)
VALUES (
  'INSPECTION_PROTOCOL_COMPLETED',
  '56404c9c-3e55-4cd5-9ea4-40ebde77c58c',
  '{"protocol_id": "fedb60fd-c6fe-4636-beac-7df0cb2fff2b", "protocol_type": "zwischenbegehung", "protocol_number": "ZB-2026-010-001"}'::jsonb,
  'test',
  'manual_test'
);
```

---

## Relevante Files im Projekt

```
/mnt/project/026_inspection_protocols.sql  -- Schema
/mnt/project/HANDOVER_2026-01-14_INSPECTION_PROTOCOLS_sql.md
```

---

## Nächste Schritte

1. Webhook Fix (Respond Mode ändern)
2. Check Document Templates existieren
3. Check Gotenberg Connection
4. Check Supabase Storage Bucket
5. Test durchführen
6. Bei Erfolg: Telegram verifizieren

---

## n8n Workflow ID

```
lDrZnW4bYMCpumiTbmkKl
```

Kann via MCP abgerufen werden:
```
n8n:get_workflow_details workflowId="lDrZnW4bYMCpumiTbmkKl"
```
