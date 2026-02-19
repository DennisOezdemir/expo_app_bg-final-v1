# Core Flow API — EB → ZB → AB

> **Status:** DB-Migrations + Functions DONE ✅  
> **Date:** 2026-01-19

---

## Overview

```
Erstbegehung (EB) → "Festschreiben" → Zwischenbegehung (ZB) → 100% → Abnahme (AB)
```

All logic is encapsulated in PostgreSQL functions. Frontend just calls `supabase.rpc()`.

---

## Database Schema

### offer_positions (relevant columns)

| Column | Type | Description |
|--------|------|-------------|
| `phase` | VARCHAR(20) | `'erstbegehung'` → `'zwischenbegehung'` → `'abnahme'` |
| `progress_percent` | INTEGER | 0-100, default 0 |
| `completed_at` | TIMESTAMPTZ | Set when progress hits 100% |
| `inspection_status` | TEXT | `'pending'`, `'confirmed'`, `'pending_correction'` |

### inspection_protocols (relevant columns)

| Column | Type | Description |
|--------|------|-------------|
| `protocol_type` | TEXT | `'erstbegehung'`, `'zwischenbegehung'`, `'abnahme'` |
| `protocol_number` | TEXT | Fortlaufend pro Typ (1, 2, 3...) |
| `status` | TEXT | `'in_progress'`, `'completed'` |
| `signature_path` | TEXT | Storage path for Abnahme signature PNG |

---

## RPC Functions

### 1. `complete_erstbegehung`

**When:** User clicks "Protokoll Festschreiben" in EB tab.

**What it does:**
- Creates `inspection_protocol` with type `erstbegehung`
- Moves all `confirmed` positions from `phase='erstbegehung'` → `phase='zwischenbegehung'`
- Sets project status to `in_progress`

```typescript
const { data, error } = await supabase.rpc('complete_erstbegehung', {
  p_project_id: projektId,
  p_inspector_name: 'Dennis' // optional
});

// Response
{
  success: true,
  protocol_id: "uuid",
  protocol_number: 1,
  positions_moved: 17
}
```

---

### 2. `update_position_progress`

**When:** User moves slider or clicks "Fertig" (100%) in ZB tab.

**What it does:**
- Updates `progress_percent` on position
- If 100% → sets `phase='abnahme'` and `completed_at=NOW()`
- If <100% → keeps `phase='zwischenbegehung'`

```typescript
const { data, error } = await supabase.rpc('update_position_progress', {
  p_position_id: positionId,
  p_progress_percent: 80 // 0-100
});

// Response
{
  success: true,
  position_id: "uuid",
  progress_percent: 80,
  phase: "zwischenbegehung" // or "abnahme" if 100%
}
```

---

### 3. `get_or_create_zb_protocol`

**When:** ZB tab loads — get current ZB number or create new one.

**What it does:**
- Returns existing `in_progress` ZB protocol if exists
- Otherwise creates new one with incremented number

```typescript
const { data, error } = await supabase.rpc('get_or_create_zb_protocol', {
  p_project_id: projektId,
  p_inspector_name: 'Dennis' // optional
});

// Response
{
  success: true,
  protocol_id: "uuid",
  protocol_number: 3, // ZB #3
  created: false // true if new protocol was created
}
```

---

### 4. `complete_abnahme`

**When:** User signs and clicks "Abnahme bestätigen" in AB tab.

**What it does:**
- Validates ALL positions are in `phase='abnahme'`
- Creates `inspection_protocol` with type `abnahme` + signature path
- Sets project status to `completed`

```typescript
const { data, error } = await supabase.rpc('complete_abnahme', {
  p_project_id: projektId,
  p_signature_path: 'signatures/abc123/def456.png',
  p_inspector_name: 'Dennis' // optional
});

// Response (success)
{
  success: true,
  protocol_id: "uuid",
  protocol_number: 1
}

// Response (error - positions not ready)
{
  success: false,
  error: "Not all positions are at 100%",
  pending_positions: 3
}
```

---

## Storage

**Bucket:** `project-files` (private)

**Signature Path Pattern:**
```
signatures/{project_id}/{protocol_id}.png
```

**Upload Example:**
```typescript
const signatureBlob = await canvasRef.current.toBlob();
const path = `signatures/${projektId}/${protocolId}.png`;

const { error } = await supabase.storage
  .from('project-files')
  .upload(path, signatureBlob, {
    contentType: 'image/png',
    upsert: true
  });
```

---

## Counter Logic (Frontend)

```typescript
const counts = {
  erstbegehung: positions.filter(p => 
    p.phase === 'erstbegehung' && !p.deleted_at
  ).length,
  
  zwischenbegehung: positions.filter(p => 
    p.phase === 'zwischenbegehung' && !p.deleted_at
  ).length,
  
  abnahme: positions.filter(p => 
    p.phase === 'abnahme' && !p.deleted_at
  ).length
};
```

---

## UI Button Mapping

| Old Button | New Button | Action |
|------------|------------|--------|
| ❌ Materialbestellungen Tab | — | Remove |
| ❌ Monteur-Auftrag | — | Remove |
| ❌ Neues Protokoll | — | Remove |
| — | 📦 Material nachbestellen | Open material order dialog |
| — | 📝 Nachtrag erstellen | Open change order dialog |
| ✅ Foto | ✅ Foto | Keep |
| ✅ Schnellnotiz | ✅ Schnellnotiz | Keep |

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ERSTBEGEHUNG (EB)                        │
│  • Positionen mit Ja/Nein bestätigen                        │
│  • inspection_status = 'confirmed' | 'pending_correction'   │
│  • Button: "Protokoll Festschreiben"                        │
│            ↓ complete_erstbegehung()                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  ZWISCHENBEGEHUNG (ZB)                      │
│  • Slider 0-100% pro Position                               │
│  • Foto-Upload pro Position                                 │
│  • "Fertig" Button = 100%                                   │
│  • update_position_progress() bei jeder Änderung            │
│  • Bei 100% → Position springt automatisch zu AB            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      ABNAHME (AB)                           │
│  • Readonly Liste aller 100% Positionen                     │
│  • Unterschrift-Canvas                                      │
│  • Button: "Abnahme bestätigen"                             │
│            ↓ complete_abnahme()                             │
│  • Projekt-Status → 'completed'                             │
└─────────────────────────────────────────────────────────────┘
```
