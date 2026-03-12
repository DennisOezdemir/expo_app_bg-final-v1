# Security Guide — BauGenius

## Grundregel

**RLS ist auf allen public-Tabellen aktiviert.** Jede neue Tabelle braucht RLS Policies.

---

## Supabase-spezifisch

### Row Level Security (RLS)

- RLS ist Pflicht auf jeder Tabelle mit User-Daten
- Policies testen: SELECT, INSERT, UPDATE, DELETE separat
- `auth.uid()` für User-Identifikation in Policies
- Service Role Key **nur** serverseitig (Express, n8n)
- Anon Key hat minimale Berechtigungen

### DB-Funktionen

- Pattern: `SECURITY DEFINER` + `RETURNS JSONB`
- Row-Locking mit `FOR UPDATE` bei konkurrierenden Zugriffen
- Check Constraint Beispiel: `chk_decision_requires_feedback` (APPROVED/REJECTED braucht `feedback_category`)

### Storage

- Binaries immer in Supabase Storage
- Nur `storage_path` in Events/DB, nie Base64 in der DB
- Storage Policies für Bucket-Zugriff prüfen

---

## Event-System Security

### Idempotenz

```sql
-- IMMER idempotency_key verwenden
INSERT INTO events (event_type, payload, idempotency_key)
VALUES ('TYPE', '{}'::jsonb, 'unique-key')
ON CONFLICT (idempotency_key) DO NOTHING;
```

### n8n Flows

- Webhook-URLs nicht öffentlich teilen
- API Keys in n8n Credentials, nicht in Flow-Nodes
- Service Role Key nur in n8n, nie im Frontend
- Event-Routing über `event_routing` Tabelle, nicht hardcoded

---

## Frontend Security

### Keine Secrets im Client

- Supabase Anon Key ist OK (öffentlich, RLS schützt)
- Service Role Key NIEMALS im Frontend
- API Keys nur in `.env.local` und serverseitig
- Keine Secrets in Git committen

### Input Validation

- Zod-Schemas für alle Formulareingaben
- Server-seitige Validierung zusätzlich zur Client-Validierung
- SQL Injection: Supabase Client nutzt parametrisierte Queries
- XSS: React Native escaped per Default

### Auth

- Supabase Auth für User Management
- Protected Routes prüfen `session` vor Render
- Token-Refresh automatisch durch Supabase Client

---

## Checkliste (jede Änderung)

### Quick Scan

- [ ] RLS aktiv auf neuen/geänderten Tabellen?
- [ ] Service Role nur wo nötig (Server/n8n)?
- [ ] Keine Secrets in Code oder Git?
- [ ] Input validiert (Zod)?
- [ ] Fehlermeldungen leaken keine Interna?
- [ ] DB-Queries filtern nach User-Ownership?

### n8n Flows

- [ ] Idempotency Key vorhanden?
- [ ] Webhook nicht öffentlich erreichbar ohne Auth?
- [ ] API Keys in Credentials, nicht in Nodes?
- [ ] Error-Handling: Keine Secrets in Error-Logs?

### Neue Tabellen

- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- [ ] SELECT Policy definiert
- [ ] INSERT/UPDATE/DELETE Policies definiert
- [ ] Policy testet `auth.uid()` Zugehörigkeit

---

## Red Team Checks

1. **Kann ich andere User-Daten sehen?** → RLS Policies testen
2. **Kann ich ohne Login auf die API?** → Auth-Gate prüfen
3. **Kann ich Events für fremde Projekte feuern?** → project_id Ownership
4. **Kann ich Storage-Dateien anderer User laden?** → Storage Policies
5. **Leaken Error-Messages DB-Struktur?** → Generic Errors im Frontend

---

## Bekannte Security-Entscheidungen

- `SECURITY DEFINER` Funktionen: `fn_approve_intake`, `fn_reject_intake` — bewusst mit erhöhten Rechten für HITL-Freigabe
- Events-Tabelle: RLS aktiv, User sieht nur eigene Projekt-Events
- Storage Bucket `project-files`: Zugriff über RLS + Storage Policies
