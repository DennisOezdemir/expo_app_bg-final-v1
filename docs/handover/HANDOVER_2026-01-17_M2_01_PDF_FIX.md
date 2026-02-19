# HANDOVER: M2_01 Monteur Auftrag PDF Fix

**Datum:** 2026-01-17
**Modul:** M2 Baustelle / Sub-Auftragssystem
**Status:** ✅ DONE

---

## Problem

PDF-Generierung hatte zwei Bugs:
1. **Adresse:** Zeigte `undefined undefined` statt korrekter Adresse
2. **Fertigstellungsdatum:** Wurde nicht angezeigt

### Ursachen

| Bug | Ursache |
|-----|---------|
| Adresse | SQL lieferte `address` als String, n8n Code erwartete `street`, `zip_code`, `city` einzeln |
| Datum | SQL lieferte kein `deadline`, n8n wartete auf `due_date` vom Webhook |

---

## Lösung

### 1. SQL-Funktion `get_monteur_auftrag_data()` erweitert

```sql
-- Vorher (project-Objekt)
'address', CONCAT_WS(', ', p.object_street, CONCAT(p.object_zip, ' ', p.object_city))

-- Nachher (einzelne Felder + deadline)
'street', p.object_street,
'zip_code', p.object_zip,
'city', p.object_city,
'deadline', p.planned_end,
```

### 2. n8n "Build HTML" Node angepasst

```javascript
// Vorher - Datum aus Webhook
const dueDate = webhookData.due_date 
  ? new Date(webhookData.due_date).toLocaleDateString('de-DE') 
  : '';

// Nachher - Datum aus SQL/DB
const dueDate = project.deadline 
  ? new Date(project.deadline).toLocaleDateString('de-DE') 
  : '';
```

```javascript
// Adresse - bleibt gleich, aber SQL liefert jetzt korrekt
const projectAddress = [
  project.street, 
  [project.zip_code, project.city].filter(Boolean).join(' ')
].filter(Boolean).join(', ') || '-';
```

---

## Test

```bash
curl -X POST https://n8n.srv1045913.hstgr.cloud/webhook/monteur-auftrag \
  -H "Content-Type: application/json" \
  -d '{"project_id": "641bc6fd-4cf5-4f75-8130-60826a3c9c9a", "language": "tr"}'
```

### Ergebnis

| Feld | Vorher | Nachher |
|------|--------|---------|
| Adres | `undefined undefined` | `Butjadinger Weg 4, 21129 Hamburg` |
| Teslim Tarihi | (fehlte) | `24.1.2026` |

---

## Betroffene Komponenten

| Komponente | Location | Änderung |
|------------|----------|----------|
| SQL-Funktion | `get_monteur_auftrag_data()` | Einzelne Adressfelder + deadline |
| n8n Flow | `M2_01_Monteur_Auftrag_PDF` | Build HTML Node Code |

---

## Offene Punkte

1. **Frontend aktivieren** — `MonteurAuftragDialog.tsx` Webhook-Code einkommentieren
2. **TR-Übersetzungen** — Einige SAGA-Positionen haben keine türkischen Texte
3. **Trade-Mapping** — Falsche Gewerk-Zuordnungen im Katalog korrigieren

---

## Referenzen

- Notion: [M2_SUB: Monteur/Sub-Auftragssystem](https://www.notion.so/2ea8205ff60981639068e409abcc50a1)
- n8n Flow ID: `v2b5w05D-CR5WxCsbbmAi`
- Webhook: `POST https://n8n.srv1045913.hstgr.cloud/webhook/monteur-auftrag`
