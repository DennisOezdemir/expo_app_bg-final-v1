# HANDOVER: Subcontractor System & GitHub Issues

**Datum:** 2026-01-22
**Status:** ✅ SUBCONTRACTOR SYSTEM FINISHED

---

## ERLEDIGT

1.  **GitHub Connection**: Token geprüft, Zugriff hergestellt.
2.  **Issue #6 (Nachtrag)**: Code geprüft (`NachtragCreateDialog`), Feature ist vollständig implementiert. Issue kann geschlossen werden.
3.  **Subcontractor PDF**:
    - "Auftrag PDF" Button in `SubunternehmerTab` eingebaut.
    - `MonteurAuftragDialog` erweitert.
    - Backend-Migration `033_get_monteur_auftrag_data.sql` erstellt.

## OFFEN / NEXT STEPS

### 1. n8n Update (Muss manuell erfolgen!)

Der Workflow `M2_10_Monteur_Auftrag` muss aktulisiert werden, um die neue SQL-Funktion zu nutzen:

```sql
SELECT * FROM get_monteur_auftrag_data(
  $1::uuid,   -- project_id
  $2::uuid,   -- subcontractor_id (Input aus Webhook)
  $3::boolean,-- hide_prices
  $4::text    -- language
);
```

### 2. GitHub Issue #1 (Inspection Protocol)

- Pull Request #1 "Inspection Protocol System" ist noch offen.
- Das Feature ist aber im Code (Tab `Erstbegehung`, `NeuesProtokollDialog`) bereits weit fortgeschritten.
- **Nächstes Ziel:** PR #1 mergen oder finalisieren.

---

**Dateien:**

- `src/components/baustelle/SubunternehmerTab.tsx`
- `src/components/baustelle/MonteurAuftragDialog.tsx`
- `supabase/migrations/033_get_monteur_auftrag_data.sql`
