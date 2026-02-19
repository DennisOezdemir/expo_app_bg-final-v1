# BUGFIX: complete_erstbegehung Function

**Datum:** 2026-01-25
**Status:** ✅ RESOLVED

---

## Symptom

"Protokoll konnte nicht festgeschrieben werden" beim Klick auf "Protokoll Festschreiben" in BaustelleTab.

---

## Root Causes (2 Bugs)

### Bug 1: Fehlende Spalte
```
ERROR: column "completed_at" does not exist
```

Funktion `complete_erstbegehung` schreibt `completed_at`, aber Spalte existierte nicht in `inspection_protocols`.

**Fix:**
```sql
ALTER TABLE inspection_protocols 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
```

### Bug 2: Enum Case Mismatch
```
ERROR: invalid input value for enum project_status: "in_progress"
```

Funktion setzte `'in_progress'` (lowercase), aber Enum definiert `'IN_PROGRESS'` (uppercase).

**Fix:**
```sql
-- In complete_erstbegehung function:
UPDATE projects
SET status = 'IN_PROGRESS', updated_at = NOW()  -- uppercase!
WHERE id = p_project_id;
```

---

## Betroffene Files

| Location | Type |
|----------|------|
| `inspection_protocols.completed_at` | DB Column (added) |
| `complete_erstbegehung()` | DB Function (fixed) |
| `src/components/baustelle/BaustelleTab.tsx` | Frontend (unchanged) |

---

## Verification

Projekt `56404c9c-3e55-4cd5-9ea4-40ebde77c58c`:
- ✅ EB-Protokoll #1 erstellt (status=completed)
- ✅ 96 Positionen → phase=zwischenbegehung
- ✅ Project status → IN_PROGRESS

---

## Lessons Learned

1. **Enum values are case-sensitive** - immer DB checken
2. **Function vs Schema drift** - Funktionen können Spalten referenzieren die nicht existieren
3. **Error messages helfen** - Frontend sollte immer die echte Error Message zeigen
