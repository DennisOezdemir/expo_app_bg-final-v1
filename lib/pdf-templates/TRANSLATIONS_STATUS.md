# Katalog-Übersetzungen Status

## Aktueller Stand (2026-03-18)

| Sprache | Spalte | Übersetzt | Gesamt | Prozent |
|---------|--------|-----------|--------|---------|
| Türkisch | `title_tr` | 627 | 1833 | 34% |
| Russisch | `title_ru` | 0 | 1833 | 0% |
| Polnisch | `title_pl` | 0 | 1833 | 0% |
| Rumänisch | `title_ro` | 0 | 1833 | 0% |

## Empfehlung

### Kurzfristig: TR-Lücken schließen (1206 Einträge)
- Batch-Übersetzung via n8n + Claude API
- Kosten ca. 2-3 € bei 1206 × ~15 Tokens
- Priorität: DBL-2026 Katalog (774 Positionen, 9 Gewerke)

### Mittelfristig: RU aktivieren
- Russisch hat größte Nachfrage bei Monteuren
- Batch via n8n: `SELECT id, title FROM catalog_positions_v2 WHERE title_ru IS NULL LIMIT 500`
- DeepL API als Alternative zu Claude (günstiger, schneller für Übersetzungen)

### Langfristig: PL/RO
- Polnisch und Rumänisch nach Bedarf
- Kann Community-geführt werden (Monteure korrigieren Übersetzungen)

## Monteurauftrag PDF — Sprachstatus

Im Frontend (`app/project/[id].tsx`) ist eine Sprachauswahl implementiert:
- **DE** (Deutsch): Vollständig verfügbar ✅
- **TR** (Türkisch): 34% der Positionen übersetzt — `title_tr` Spalte vorhanden
- **RU** (Russisch): Noch nicht verfügbar — Info-Hinweis wird angezeigt

## SQL: Offene Übersetzungen finden

```sql
-- TR-Lücken
SELECT id, catalog_code, title
FROM catalog_positions_v2
WHERE title_tr IS NULL OR title_tr = ''
ORDER BY catalog_code;

-- Statistik pro Katalog
SELECT c.label, COUNT(*) as total,
  COUNT(cp.title_tr) as translated_tr,
  ROUND(COUNT(cp.title_tr)::numeric / COUNT(*) * 100, 1) as pct_tr
FROM catalog_positions_v2 cp
JOIN catalogs c ON c.id = cp.catalog_id
GROUP BY c.label
ORDER BY c.label;
```

## n8n Batch-Übersetzungs-Flow (Konzept)

```
[Trigger: Manual]
  → [Supabase: SELECT 100 ohne title_tr]
  → [Claude API: Übersetze title ins Türkische, Baugewerbe-Kontext]
  → [Supabase: UPDATE catalog_positions_v2 SET title_tr = ?]
  → [Loop bis alle übersetzt]
```
