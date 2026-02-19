# HANDOVER 2026-01-25: MagicPlan Pipeline Fix

## Problem
MagicPlan CSV-Daten flossen nicht in `project_room_measurements`.
Schwentnerring 13c hatte keine m²-Daten obwohl CSV mehrfach gesendet wurde.

## Root Cause
MX_05 speichert Files mit generischem Namen (`file_1769267478612`) statt Original.
M4_10 filterte nach `.csv` Extension → kein Match.

## Fix
**M4_10_MagicPlan_Parser** → Node **🔀 Filter CSV Files**

```javascript
// Neu: Bei MAGICPLAN alle Files nehmen (Filename geht bei Superchat-Download verloren)
const csvFiles = extractData.doc_type === 'MAGICPLAN'
  ? extractData.files
  : extractData.files.filter(f => 
      f.mime_type === 'text/csv' || 
      f.name?.endsWith('.csv') ||
      f.storage_path?.endsWith('.csv')
    );
```

## Ergebnis
Schwentnerring 13c hat jetzt 6 Räume in `project_room_measurements`:
- Flur: 5,52 m²
- Küche: 7,83 m²
- Schlafzimmer: 13,02 m²
- Bad: 2,98 m²
- Wohnzimmer: 17,35 m²
- Kinderzimmer: 10,94 m²

**Gesamt:** 57,64 m² Bodenfläche

## Pipeline jetzt komplett
```
Mail mit CSV 
  → DOC_CLASSIFIED_MAGICPLAN 
  → MX_05 (Download to Storage)
  → ATTACHMENTS_STORED
  → M4_10 (Parse → project_room_measurements) ✓
```

## Offene Punkte (nice-to-have)
- MX_05 sollte Original-Filename behalten (für alle Dokument-Typen nützlich)

## Nächste Schritte
- M4-01 Materialberechnung bauen (GitHub Issue #19)
- EB → Positionen × m² → Materialliste
