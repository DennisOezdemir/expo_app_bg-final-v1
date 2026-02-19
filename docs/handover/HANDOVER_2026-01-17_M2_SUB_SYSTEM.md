# HANDOVER: M2_SUB Subunternehmer-Auftrag System

**Datum:** 2026-01-17  
**Status:** In Arbeit  
**Nächster Schritt:** n8n Flow M2_10_Sub_Order_Generator erstellen

---

## 🎯 Ziel

Subunternehmer-Aufträge generieren — ähnlich M2_01 Monteur, aber:
- Positionsauswahl per Checkboxen (nicht alle)
- Keine Preise anzeigen (Pauschale wird separat verhandelt)
- Pauschale-Feld (einzeiliges Textfeld)
- Lieferanten-Dropdown (nur SUBCONTRACTOR)
- PDF-Download (manuelles Weiterleiten, Automatisierung später)

---

## ✅ Abgeschlossen

### 1. Supplier Seeding

**Migration:** `seed_subcontractors_coem_dla`

| Code | Firma | Kontakt | Gewerke |
|------|-------|---------|---------|
| COEM | Co & Em GmbH | Emrah Coban, coemgmbh@gmail.com | Abbruch, Maler, Boden, Fliesen |
| DLA | DLA Trockenbau | Adel Ismail, DLA-Trockenbau-u-Innenausbau@outlook.de | Trockenbau, Innenbau |

**Fix:** SAGA/GWG von SUBCONTRACTOR → OTHER geändert (sind Kunden, keine Subs)

### 2. SQL Function: `get_sub_auftrag_data()`

```sql
get_sub_auftrag_data(
  p_project_id UUID,
  p_position_ids UUID[],
  p_supplier_id UUID,
  p_language TEXT DEFAULT 'de'
) RETURNS JSONB
```

**Rückgabe:**
```json
{
  "project": { "name", "project_number", "address" },
  "supplier": { "company_name", "contact_person", "email", "phone", "address" },
  "sections": [
    {
      "group_label": "Fliesen",
      "positions": [
        { "code", "title", "description", "quantity", "unit" }
      ]
    }
  ]
}
```

**Schema-Erkenntnisse:**
- `projects` → `offers` → `offer_positions` (via offer_id, nicht direkt)
- `projects.object_street/zip/city` (nicht street/zip/city)
- `clients.company_name` (nicht name)
- Fallback-Chain für Titel: description → title → catalog → wbs

### 3. M2_01 Monteur Flow gefunden

```
ID: v2b5w05D-CR5WxCsbbmAi
Name: M2_01_Monteur_Auftrag_PDF
Endpoint: POST https://n8n.srv1045913.hstgr.cloud/webhook/monteur-auftrag
Status: Aktiv
```

**Flow-Struktur:**
1. Webhook (POST)
2. Load Project Data (SQL: get_monteur_auftrag_data)
3. Build HTML (Code Node)
4. Gotenberg PDF
5. Upload Supabase Storage
6. Insert DB Reference (project_files)
7. Respond Success

---

## 🔨 Nächste Schritte

### 1. n8n Flow: M2_10_Sub_Order_Generator

Clone von M2_01 mit Anpassungen:

| Komponente | M2_01 | M2_10 |
|------------|-------|-------|
| SQL Function | `get_monteur_auftrag_data()` | `get_sub_auftrag_data()` |
| Input | `project_id, language` | `project_id, position_ids[], supplier_id, language, lump_sum` |
| Header | Nur Projekt | Projekt + Supplier-Info |
| Positionen | Alle | Nur ausgewählte |
| Preise | Keine | Keine + Pauschale-Feld |
| Storage Path | `monteurauftraege/` | `sub_auftraege/` |
| file_type | `MONTEUR_AUFTRAG` | `SUB_AUFTRAG` |

**Webhook Endpoint:** `POST /webhook/sub-auftrag`

**Request Body:**
```json
{
  "project_id": "uuid",
  "position_ids": ["uuid", "uuid"],
  "supplier_id": "uuid",
  "language": "de",
  "lump_sum": "5.000 € pauschal"
}
```

### 2. Frontend: SubAuftragDialog.tsx

```
┌─────────────────────────────────────────┐
│ Subunternehmer-Auftrag erstellen        │
├─────────────────────────────────────────┤
│ Subunternehmer: [Dropdown v]            │
│                                         │
│ Positionen:                             │
│ ☑ 2.1 Fliesen Küche (12 m²)            │
│ ☐ 2.2 Fliesen Bad (8 m²)               │
│ ☑ 2.3 Sockelleisten (15 lfm)           │
│                                         │
│ Pauschale: [________________]           │
│                                         │
│ Sprache: ◉ DE  ○ TR                    │
│                                         │
│         [Abbrechen]  [PDF erstellen]    │
└─────────────────────────────────────────┘
```

**Queries:**
- Supplier: `WHERE default_expense_category = 'SUBCONTRACTOR' AND is_active = true`
- Positions: `offer_positions WHERE offer_id IN (SELECT id FROM offers WHERE project_id = ?)`

### 3. Storage

- Bucket: `project-files`
- Path: `sub_auftraege/{project_number}_{supplier_code}_{lang}.pdf`

---

## 📁 Dateien

| Datei | Status | Beschreibung |
|-------|--------|--------------|
| `get_sub_auftrag_data()` | ✅ Live | SQL Function in Supabase |
| `M2_10_Sub_Order_Generator` | ⏳ Pending | n8n Workflow |
| `SubAuftragDialog.tsx` | ⏳ Pending | Frontend Component |

---

## 🔗 Referenzen

- **M2_01 Flow ID:** `v2b5w05D-CR5WxCsbbmAi`
- **Gotenberg Internal:** `http://gotenberg:3000`
- **Gotenberg External:** `https://gotenberg.srv1045913.hstgr.cloud`
- **Supabase Project:** `yetwntwayhmzmhhgdkli`

---

## ⚠️ Offene Fragen

1. Pauschale-Feld: Einzeilig oder Textarea? → **Entscheidung: Einzeilig, später erweiterbar**
2. PDF per Mail automatisch? → **Entscheidung: Nein, erst wenn Team da ist**
3. Bankdaten speichern? → **Entscheidung: Nein, separat verwaltet**
