-- =============================================================
-- Migration: Trades-Tabelle um fehlende Gewerke erweitern
-- Quelle: WABS/WBS Katalog-Analyse + trade_material_types
-- =============================================================

INSERT INTO trades (id, name, color, icon, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Boden',     'amber',  '🏗️', 6,  true),
  (gen_random_uuid(), 'Tischler',  'brown',  '🪚', 7,  true),
  (gen_random_uuid(), 'Heizung',   'red',    '🔥', 8,  true),
  (gen_random_uuid(), 'Abbruch',   'stone',  '💥', 9,  true),
  (gen_random_uuid(), 'Reinigung', 'cyan',   '🧹', 10, true)
ON CONFLICT (name) DO NOTHING;
