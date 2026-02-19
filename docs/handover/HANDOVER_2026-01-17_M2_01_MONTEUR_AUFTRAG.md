# HANDOVER: M2_01 Monteur-Auftrag PDF
**Datum:** 2026-01-17

---

## ✅ ERLEDIGT

### PDF-Generierung für Monteur-Aufträge

**Features:**
- Zweisprachig: Deutsch (DE) / Türkisch (TR)
- Preise optional ausblendbar
- Professionelles Layout mit Firmenbranding
- Checkbox pro Position für Monteur-Abzeichnung
- Unterschriftsfeld am Ende

**Komponenten:**
- SQL Function: `generate_monteur_auftrag_html()`
- n8n Flow: M2_01_Monteur_Auftrag_PDF
- Gotenberg: HTML → PDF Konvertierung
- Storage: Supabase `monteurauftraege/` Bucket

**Webhook:**
```
POST https://n8n.srv1045913.hstgr.cloud/webhook/monteur-auftrag
Body: { "project_id": "uuid", "language": "tr", "hide_prices": true }
```

---

## 📄 PDF LAYOUT

```
┌─────────────────────────────────────────┐
│ ██ MONTAJ SİPARİŞİ                      │
│    Deine Baulöwen                       │
├─────────────────────────────────────────┤
│ Proje:  Butjadinger Weg 4               │
│ Adres:  Butjadinger Weg 4, 21129 HH     │
│ Tarih:  17.1.2026                       │
├─────────────────────────────────────────┤
│ ELEKTRO                                 │
│ ☐ Elektrik tesisatı kontrolü    1 psch  │
│   Notlar: ________________________      │
├─────────────────────────────────────────┤
│ MALER                                   │
│ ☐ Nikotin duvarları boyamak     1 psch  │
│   Notlar: ________________________      │
├─────────────────────────────────────────┤
│ Unterschrift: _______________           │
│ Datum: _______________                  │
└─────────────────────────────────────────┘
```

---

## 🔧 TECHNISCHE DETAILS

### SQL Function
```sql
generate_monteur_auftrag_html(
  p_project_id UUID,
  p_language TEXT DEFAULT 'de',
  p_hide_prices BOOLEAN DEFAULT true
)
RETURNS TEXT
```

### Gotenberg Endpoint
- Internal: `http://gotenberg:3000`
- External: `https://gotenberg.srv1045913.hstgr.cloud`

### Storage Path
`monteurauftraege/{project_number}_{language}_{timestamp}.pdf`

---

## ⏳ NOCH OFFEN

1. **Frontend aktivieren** — Dialog mit Webhook verbinden
2. **Trade-Mapping** — Reinigung ≠ Sanitär korrigieren
3. **Weitere TR-Übersetzungen** — Bei Bedarf erweitern

---

## 🧪 TEST

```bash
curl -X POST https://n8n.srv1045913.hstgr.cloud/webhook/monteur-auftrag \
  -H "Content-Type: application/json" \
  -d '{"project_id": "PROJECT_UUID", "language": "tr", "hide_prices": true}'
```
