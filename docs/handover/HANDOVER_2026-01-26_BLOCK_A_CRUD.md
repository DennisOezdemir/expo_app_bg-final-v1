# HANDOVER: Block A — FE ↔ BE CRUD Sync

**Datum:** 2026-01-26  
**Session:** Block A Session 3  
**Status:** ✅ INTEGRATION DONE

---

## Was wurde gebaut

### 1. Backend: Migration 053 — update_project
```sql
-- RPC: update_project
-- Erlaubt Editieren der wichtigsten Projektfelder
-- Feuert EVENT: PROJECT_UPDATED
```
**Funktion:** `update_project(p_project_id, p_name, p_status, ...)`  
**Status:** ✅ Deployed

### 2. Backend: Migration 054 — update_section
```sql
-- RPC: update_section
-- Erlaubt Editieren einer Angebotssektion
-- Feuert EVENT: SECTION_UPDATED
```
**Funktion:** `update_section(p_section_id, p_title, p_trade, p_section_number)`  
**Status:** ✅ Deployed

### 3. Backend: Migration 055 — update_position
```sql
-- RPC: update_position
-- Erlaubt Editieren einer Angebotsposition
-- Berechnet total_price automatisch
-- Feuert EVENT: POSITION_UPDATED
```
**Funktion:** `update_position(p_position_id, p_title, p_description, p_unit, p_unit_price, p_quantity, p_trade, p_is_optional, p_position_number, p_internal_note)`  
**Status:** ✅ Deployed

### 4. Frontend: EditProjectDialog
**Pfad:** `src/components/project/EditProjectDialog.tsx`  
**Status:** ✅ DONE + integrated in ProjektDetail.tsx

### 5. Frontend: EditSectionDialog
**Pfad:** `src/components/project/EditSectionDialog.tsx`  
**Status:** ✅ DONE + integrated via OfferPositionsView

Features:
- react-hook-form + zod Validation
- Felder: Titel, Gewerk (Select), Reihenfolge
- TRADES Dropdown (11 Optionen aus catalog_positions_v2)
- Supabase RPC Call
- Cache Invalidation via react-query
- Toast Feedback
- Read-only Summe Anzeige

### 6. Frontend: EditPositionDialog
**Pfad:** `src/components/project/EditPositionDialog.tsx`  
**Status:** ✅ DONE + integrated via OfferPositionsView

Features:
- react-hook-form + zod Validation
- Felder: Titel, Beschreibung, Menge, Einheit, Einzelpreis, Gewerk, Optional-Flag, Position #, Interne Notiz
- UNITS Dropdown (8 gängige Einheiten)
- TRADES Dropdown (11 Optionen)
- Live-Berechnung Gesamtpreis
- Switch für optionale Positionen
- Supabase RPC Call
- Cache Invalidation via react-query
- Toast Feedback

### 7. Frontend: OfferPositionsView (NEU)
**Pfad:** `src/components/project/OfferPositionsView.tsx`  
**Status:** ✅ DONE + integrated in ProjektDetail.tsx

Features:
- Collapsible Sections mit Position-Tabellen
- Edit-Buttons pro Section und Position
- Live-Summen pro Section und Gesamt
- Status-Badges (Offen/Bestätigt/Korrektur)
- Optional-Flag Anzeige
- Unassigned Positions Bereich
- Integration beider Edit-Dialoge

### 8. Integration: ProjektDetail.tsx
**Status:** ✅ DONE

Änderungen:
- Import OfferPositionsView
- Neuer Tab "Positionen" mit ClipboardList Icon
- Tab zwischen Dashboard und Baustelle eingefügt

---

## Commits

| SHA | Message |
|-----|---------|
| `915d80d` | feat(block-a): Add EditProjectDialog for CRUD operations |
| `d782fa5` | feat(block-a): Add Edit button to ProjektDetail header |
| `cd9060b` | feat(block-a): Add EditSectionDialog for CRUD operations |
| `db07955` | feat(block-a): Add EditPositionDialog for CRUD operations |
| `3a65aa6` | feat(block-a): Add OfferPositionsView with Edit integration |
| `eb271a8` | feat(block-a): Integrate OfferPositionsView as new "Positionen" tab |

---

## Block A Roadmap

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | EditProjectDialog | ✅ DONE |
| 2 | EditSectionDialog | ✅ DONE |
| 3 | EditPositionDialog | ✅ DONE |
| 4 | OfferPositionsView | ✅ DONE |
| 5 | Tab-Integration | ✅ DONE |
| 6 | CreateProjectDialog | 🔲 TODO |
| 7 | CreateClientDialog | 🔲 TODO |
| 8 | Supabase Realtime | 🔲 TODO |

---

## Test

```bash
# 1. Projekt öffnen (z.B. BL-2026-007)
# 2. Tab "Positionen" anklicken
# 3. Section aufklappen
# 4. Edit-Button bei Section → Dialog öffnet
# 5. Edit-Button bei Position → Dialog öffnet
# 6. Änderungen speichern → Toast + Refresh
```

---

## Parallel: Block C (AntiGravity)

AntiGravity kann parallel Block C (Quote Calculator) starten:
- UI Components mit Mock-Data
- Supabase Calls als TODO markieren
- Wartet auf Block A CRUD für echte DB-Anbindung

**Issue:** https://github.com/Deine-Baulowen/baugenius-mockup/issues/29

---

## Offene Items

1. **Briefpapier PDF** — Dennis muss uploaden (Block C + D braucht es)
2. **FastBill Account** — Credentials für Block D
3. **RLS Policies** — Noch nicht getestet ob Updates durchgehen
4. **CreateProjectDialog** — Neues Projekt erstellen
5. **CreateClientDialog** — Neuen Auftraggeber erstellen

---

## Relevante Issues

- #27: Block A - FE ↔ BE Sync
- #28: Block B - Private Customer Workflow  
- #29: Block C - Quote Calculator
- #30: Block D - Outgoing Invoices

---

## Nächste Session

**Option A:** CreateProjectDialog + CreateClientDialog (mehr CRUD)
**Option B:** Supabase Realtime für Live-Updates
**Option C:** Block C Quote Calculator starten
