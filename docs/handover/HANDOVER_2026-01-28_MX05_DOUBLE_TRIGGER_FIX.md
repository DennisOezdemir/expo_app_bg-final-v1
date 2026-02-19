# HANDOVER: MX_05 Double-Trigger Bug Fix

> **Datum:** 2026-01-28
> **Status:** FIX DOKUMENTIERT - UMSETZUNG PENDING
> **Kritikalität:** HOCH (Duplikate in Produktion)

---

## Problem

Jede eingehende Email erzeugt 3x Projekte statt 1x.

**Beispiel aus Event-Log:**
```
20:12:25.073  DOC_CLASSIFIED_PROJECT_ORDER  (MX_03)  ← 1x korrekt
20:12:26.297  PROJECT_FILES_READY           (MX_05)  ← 1. Trigger
20:12:26.546  PROJECT_FILES_READY           (MX_05)  ← 2. Trigger  
20:12:26.553  PROJECT_FILES_READY           (MX_05)  ← 3. Trigger
20:12:34-35  3x PROJECT_CREATED                      ← 3 Projekte!
```

---

## Root Cause

**MX_05_Attachment_Processor** (ID: `qAiKaCpDUF3yQUvcZA2rd`) verletzt Event-Only Architektur.

Der Workflow macht BEIDES:
1. `INSERT events (PROJECT_FILES_READY)` → MX_00 Router → M1_02
2. `HTTP Request` direkt an M1_02

= **Double-Trigger per Design**

---

## Betroffene Nodes in MX_05

| Node | Typ | Problem |
|------|-----|---------|  
| `🔀 Route by DocType` | Switch | Routet zu HTTP statt Event |
| `📤 Call M1_02 Project` | HTTP Request | Direktaufruf (verboten) |
| `📤 Call M6_01 Invoice` | HTTP Request | Direktaufruf (verboten) |
| `📤 Call M6_01 Credit` | HTTP Request | Direktaufruf (verboten) |
| `📤 Call M4_10 MagicPlan` | HTTP Request | Direktaufruf (verboten) |
| `⏭️ Unknown DocType` | NoOp | Orphaned nach Fix |

---

## Fix-Anleitung

### Schritt 1: Connection löschen
- Node `✅ Mark Complete` → Ausgehende Linie zu `🔀 Route by DocType` löschen

### Schritt 2: Neue Connection
- `✅ Mark Complete` → direkt zu `✅ Respond Success`

### Schritt 3: Alte Nodes löschen
1. `🔀 Route by DocType`
2. `📤 Call M6_01 Invoice (HTTP Request)`
3. `📤 Call M6_01 Credit (HTTP Request)`
4. `📤 Call M4_10 MagicPlan (HTTP Request)`
5. `📤 Call M1_02 Project (HTTP Request)`
6. `⏭️ Unknown DocType`

### Schritt 4: Speichern

---

## Vorher/Nachher

**Vorher (kaputt):**
```
📢 Event ATTACHMENTS_STORED
        ↓
✅ Mark Complete → 🔀 Route by DocType → 📤 HTTP Requests → ✅ Respond
        ↓                    ↓
   (Event-System)      (Direktaufruf)
        ↓                    ↓
      M1_02               M1_02
        ↓                    ↓
     Projekt             Projekt    ← DUPLIKAT!
```

**Nachher (korrekt):**
```
📢 Event ATTACHMENTS_STORED
        ↓
✅ Mark Complete → ✅ Respond Success
        ↓
   (Event-System via MX_00)
        ↓
      M1_02
        ↓
     Projekt    ← NUR 1x
```

---

## Event Routing (bereits korrekt konfiguriert)

```sql
SELECT event_type, target_workflow FROM event_routing 
WHERE event_type IN ('PROJECT_FILES_READY', 'DOC_CLASSIFIED_INVOICE_IN');
```

| event_type | target_workflow |
|------------|----------------|
| PROJECT_FILES_READY | M1_02_PDF_Parser_Vision |
| DOC_CLASSIFIED_INVOICE_IN | M6_01_Invoice_Processor |
| DOC_CLASSIFIED_CREDIT_NOTE | M6_01_Invoice_Processor |

Routing funktioniert - die HTTP-Calls sind redundant.

---

## Test nach Fix

1. Test-Email senden mit PROJECT_ORDER Klassifizierung
2. Event-Log prüfen:
   - 1x `DOC_CLASSIFIED_PROJECT_ORDER` ✓
   - 1x `PROJECT_FILES_READY` ✓
   - 1x `PROJECT_CREATED` ✓

---

## Cleanup SQL (nach erfolgreichem Test)

```sql
-- Duplikate vom 28.01.2026 entfernen
DELETE FROM projects 
WHERE project_number IN ('BL-2026-013', 'BL-2026-014')
AND created_at::date = '2026-01-28';
```

---

## Architektur-Regel (Reminder)

> **HARD RULE: Event-Only**
> 
> Flows kommunizieren NUR über die `events` Tabelle.
> Kein Execute Workflow. Keine direkten HTTP-Calls zu anderen Flows.

---

*Erstellt: 2026-01-28 22:15 UTC*