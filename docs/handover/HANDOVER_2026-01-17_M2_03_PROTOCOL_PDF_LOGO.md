# HANDOVER: M2_03 Protocol PDF — Logo-Integration

**Datum:** 2026-01-17  
**Modul:** M2 Baustelle / Inspection Protocols  
**Status:** ⏸️ PAUSED — Wartet auf Frontend  
**Workflow:** M2_03Generate_Protocol_PDF (`lDrZnW4bYMCpumiTbmkKl`)

---

## Zusammenfassung

PDF-Generierung für Inspection Protocols (EB/ZB/AB) funktioniert grundsätzlich. Logo-Einbettung scheiterte an n8n Binary-Handling. Entscheidung: Logo-Upload ins Frontend verlagern, alle Flows nutzen dann `company_settings.logo_base64`.

---

## Was funktioniert

| Komponente | Status |
|------------|--------|
| Gotenberg PDF-Generierung | ✅ |
| Template-Loading aus DB | ✅ |
| Placeholder-Ersetzung | ✅ |
| Progress-Berechnung | ✅ |
| Items nach Gewerk gruppiert | ✅ |
| Telegram-Notification | ✅ |

---

## Was nicht funktioniert

### 1. Logo-Einbettung

**Problem:** Gotenberg läuft im Container, kann keine externen URLs fetchen. Logo muss als Base64 Data-URI eingebettet werden.

**Versucht:**
- HTTP Request Node → Fetch Logo von Supabase Storage ✅ (funktioniert)
- Binary an Build HTML übergeben ❌ (n8n verliert Binary bei Node-Referenz)
- `$('Fetch Logo').first().binary.data` ❌ (Struktur anders als erwartet)
- `$input.first().binary.data` ❌ (gleicher Fehler)

**Root Cause:** n8n Binary-Handling ist inkonsistent. `binary.data.data` sollte Base64 sein, wird aber nicht korrekt gelesen.

### 2. Adresse zeigt Placeholders

**Anzeige:** `%Stammdaten.Strasse% %Stammdaten.Hausnummer%...`

**Ursache:** Diese Placeholders kommen aus dem Original-Auftrags-PDF (SAGA-Format). Die Adresse wird nicht aus dem PDF extrahiert.

**Lösung:** Beauftragungsmaske im Frontend, die Adressdaten beim Projektanlegen erfasst.

---

## Entscheidung: Logo ins Frontend

**Warum:**
1. Logo ändert sich selten
2. Kein HTTP-Request pro PDF nötig
3. Alle Flows (Monteurauftrag, Sub-Auftrag, Protokolle) nutzen gleiche Quelle
4. Saubere Lösung mit `company_settings` Tabelle

---

## Durchgeführte Änderungen

### 1. company_settings erweitert

```sql
-- Migration: company_settings_extend_v2
ALTER TABLE company_settings ALTER COLUMN value DROP NOT NULL;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS setting_type text DEFAULT 'text';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS updated_by text;

INSERT INTO company_settings (key, value, setting_type, description) VALUES
  ('company_name', 'Deine Baulöwen', 'text', 'Firmenname für Dokumente'),
  ('logo_base64', NULL, 'base64', 'Logo als Base64 Data-URI für PDFs'),
  ('address_street', NULL, 'text', 'Straße'),
  ('address_zip', NULL, 'text', 'PLZ'),
  ('address_city', 'Hamburg', 'text', 'Stadt'),
  ('phone', NULL, 'text', 'Telefon'),
  ('email', NULL, 'text', 'E-Mail'),
  ('tax_id', NULL, 'text', 'Steuernummer'),
  ('vat_id', NULL, 'text', 'USt-IdNr.')
ON CONFLICT (key) DO NOTHING;

-- Helper Function
CREATE OR REPLACE FUNCTION get_company_setting(p_key text)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT value FROM company_settings WHERE key = p_key;
$$;
```

### 2. Logo in Storage vorhanden

```
Bucket: assets (public)
Datei: LOGO DBL.webp
Größe: 192 KB
URL: https://yetwntwayhmzmhhgdkli.supabase.co/storage/v1/object/public/assets/LOGO%20DBL.webp
```

---

## Nächste Schritte

### Frontend (Priorität 1)

1. **Settings-Seite erstellen** mit Logo-Upload
2. **FileReader API** für Base64-Konvertierung:
   ```typescript
   const reader = new FileReader();
   reader.onload = async () => {
     const base64 = reader.result as string; // ist bereits data:image/...;base64,...
     await supabase
       .from('company_settings')
       .update({ value: base64 })
       .eq('key', 'logo_base64');
   };
   reader.readAsDataURL(file);
   ```
3. **Preview** des hochgeladenen Logos

### n8n Flows anpassen (nach Frontend)

**Alle PDF-Flows müssen angepasst werden:**

| Flow | Workflow ID |
|------|-------------|
| M2_01 Monteur Auftrag | `v2b5w05D-CR5WxCsbbmAi` |
| M2_10 Sub Order | ? |
| M2_03 Protocol PDF | `lDrZnW4bYMCpumiTbmkKl` |

**Änderung in Build HTML Node:**

```javascript
// ALT: HTTP Fetch Logo (entfernen)
// const logoBinary = $('Fetch Logo').first().binary?.data;

// NEU: Logo aus DB laden (via vorherigem SQL Node)
const logoBase64 = $('Load Company Settings').first().json.logo_base64 || '';

// In Template einsetzen
html = html.replace(/\{\{logo_url\}\}/g, logoBase64);
```

**Neuer SQL Node vor Build HTML:**

```sql
SELECT value as logo_base64 
FROM company_settings 
WHERE key = 'logo_base64';
```

---

## Aktueller Flow-Stand (M2_03)

```
Webhook → Claim Step → IF Claimed → Load Protocol Details → Determine Template Key 
→ Load Template → [Fetch Logo - DEAKTIVIERT] → Build HTML → Gotenberg PDF 
→ Upload to Storage → Update Protocol PDF Path → Send Telegram → Mark Processed
```

**Fetch Logo Node:** Kann gelöscht oder deaktiviert werden bis Frontend fertig.

**Build HTML:** Logo-Code auskommentiert, `logoDataUri = ''` als Fallback.

---

## Test-Daten

```sql
-- Projekt
SELECT * FROM projects WHERE project_number = 'BL-2026-010';
-- ID: 56404c9c-3e55-4cd5-9ea4-40ebde77c58c

-- Protokoll
SELECT * FROM inspection_protocols WHERE protocol_number = 'ZB-2026-010-001';
-- ID: fedb60fd-c6fe-4636-beac-7df0cb2fff2b

-- Event triggern (für echten Test)
INSERT INTO events (event_type, project_id, payload, source_system)
VALUES (
  'INSPECTION_PROTOCOL_COMPLETED',
  '56404c9c-3e55-4cd5-9ea4-40ebde77c58c',
  '{"protocol_id": "fedb60fd-c6fe-4636-beac-7df0cb2fff2b", "protocol_type": "zwischenbegehung", "protocol_number": "ZB-2026-010-001"}'::jsonb,
  'test'
)
RETURNING id;
```

---

## Bekannte Probleme

### Mark Processed Node

Fehler bei manuellem Test: `invalid input syntax for type uuid: "test-direct-001"`

**Ursache:** Manueller Webhook-Test mit Fake-ID statt echtem Event.

**Lösung:** Immer über Event-System testen, nicht manuell mit Fake-Daten.

### Upload to Storage

URL war unvollständig — muss sein:
```
https://yetwntwayhmzmhhgdkli.supabase.co/storage/v1/object/project-files/protocols/{{project_number}}/{{protocol_number}}.pdf
```

---

## Lessons Learned

1. **n8n Binary-Handling ist unzuverlässig** — besser DB oder Storage nutzen
2. **Logo-Fetch pro Request ist Overhead** — einmal in DB speichern
3. **Manuelle Tests mit Fake-IDs** scheitern an UUID-Validierung
4. **Gotenberg braucht inline Assets** — keine externen URLs

---

## Referenzen

- n8n Workflow: `lDrZnW4bYMCpumiTbmkKl`
- Templates: `document_templates` (keys: `inspection_zb`, `inspection_eb_ab`)
- Settings: `company_settings` (key: `logo_base64`)
- Storage: `assets` bucket (Logo), `project-files` bucket (PDFs)
