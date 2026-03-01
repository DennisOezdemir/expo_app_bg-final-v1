-- =============================================================
-- Migration: trade_id auf schedule-Tabellen + team_members
-- =============================================================

-- Fehlende Rollen-Aliases (aus team_members Analyse)
INSERT INTO trade_aliases (alias, trade_id, source) VALUES
  ('Sanitärinstallateur', (SELECT id FROM trades WHERE name = 'Sanitär'),    'system'),
  ('Sanitär-Fachfrau',    (SELECT id FROM trades WHERE name = 'Sanitär'),    'system'),
  ('Azubi Elektro',       (SELECT id FROM trades WHERE name = 'Elektro'),    'system')
ON CONFLICT (alias) DO NOTHING;

-- =====================================================
-- team_members: trade_id + Backfill aus role-Text
-- =====================================================
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id) ON DELETE SET NULL;

-- Backfill: role-Text über Alias-System auflösen
-- NUR für Monteur-artige Rollen (nicht GF, Bauleiter, Polier)
UPDATE team_members tm
SET trade_id = resolve_trade_id(tm.role)
WHERE tm.trade_id IS NULL
  AND tm.role IS NOT NULL
  AND tm.role NOT IN ('GF', 'Bauleiter', 'Bauleiterin', 'Polier');

-- Auch gewerk backfill (für Legacy-Kompatibilität)
UPDATE team_members tm
SET gewerk = t.name
FROM trades t
WHERE t.id = tm.trade_id
  AND tm.gewerk IS NULL
  AND tm.trade_id IS NOT NULL;

-- =====================================================
-- schedule_defaults: trade_id + neue Defaults
-- =====================================================
ALTER TABLE schedule_defaults
  ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id) ON DELETE SET NULL;

-- Backfill bestehende Rows
UPDATE schedule_defaults sd
SET trade_id = resolve_trade_id(sd.trade)
WHERE sd.trade_id IS NULL;

-- Neue Defaults für erweiterte Trades
INSERT INTO schedule_defaults (trade, trade_id, default_phase_order, avg_duration_days) VALUES
  ('Abbruch',   (SELECT id FROM trades WHERE name = 'Abbruch'),   0,  2),
  ('Boden',     (SELECT id FROM trades WHERE name = 'Boden'),     7,  4),
  ('Tischler',  (SELECT id FROM trades WHERE name = 'Tischler'),  8,  3),
  ('Heizung',   (SELECT id FROM trades WHERE name = 'Heizung'),   9,  3),
  ('Reinigung', (SELECT id FROM trades WHERE name = 'Reinigung'), 10, 1)
ON CONFLICT (trade) DO NOTHING;

-- trade_id für gerade eingefügte Rows
UPDATE schedule_defaults sd
SET trade_id = resolve_trade_id(sd.trade)
WHERE sd.trade_id IS NULL;

-- =====================================================
-- schedule_phases + schedule_learning: trade_id
-- =====================================================
ALTER TABLE schedule_phases
  ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id) ON DELETE SET NULL;

ALTER TABLE schedule_learning
  ADD COLUMN IF NOT EXISTS trade_id UUID REFERENCES trades(id) ON DELETE SET NULL;

-- Backfill bestehende Daten
UPDATE schedule_phases sp
SET trade_id = resolve_trade_id(sp.trade)
WHERE sp.trade IS NOT NULL AND sp.trade_id IS NULL;

UPDATE schedule_learning sl
SET trade_id = resolve_trade_id(sl.trade)
WHERE sl.trade IS NOT NULL AND sl.trade_id IS NULL;
