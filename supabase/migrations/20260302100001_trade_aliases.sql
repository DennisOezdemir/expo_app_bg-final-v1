-- =============================================================
-- Migration: Trade-Alias-System
-- Mappt beliebige Trade-Texte (Katalog, Rollen, Legacy) auf trades.id
-- =============================================================

-- 1. Alias-Tabelle
CREATE TABLE IF NOT EXISTS trade_aliases (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias      TEXT NOT NULL,
  trade_id   UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  source     TEXT NOT NULL DEFAULT 'system',  -- system, catalog, user
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(alias)
);

ALTER TABLE trade_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trade_aliases_read"  ON trade_aliases FOR SELECT USING (true);
CREATE POLICY "trade_aliases_write" ON trade_aliases FOR ALL    USING (true);

-- 2. Kanonische Aliases: jeder Trade-Name mappt auf sich selbst
INSERT INTO trade_aliases (alias, trade_id, source)
SELECT t.name, t.id, 'system'
FROM trades t
WHERE t.is_active = true
ON CONFLICT (alias) DO NOTHING;

-- 3. Katalog-Synonyme (aus WABS/WBS Analyse)
INSERT INTO trade_aliases (alias, trade_id, source) VALUES
  ('Fliesenleger', (SELECT id FROM trades WHERE name = 'Fliesen'), 'catalog'),
  ('Bodenleger',   (SELECT id FROM trades WHERE name = 'Boden'),   'catalog')
ON CONFLICT (alias) DO NOTHING;

-- 4. Rollen-Synonyme (häufige deutsche Berufsbezeichnungen)
INSERT INTO trade_aliases (alias, trade_id, source) VALUES
  ('Elektriker',      (SELECT id FROM trades WHERE name = 'Elektro'),    'system'),
  ('Elektroinstallateur', (SELECT id FROM trades WHERE name = 'Elektro'), 'system'),
  ('Installateur',    (SELECT id FROM trades WHERE name = 'Sanitär'),    'system'),
  ('Klempner',        (SELECT id FROM trades WHERE name = 'Sanitär'),    'system'),
  ('SHK',             (SELECT id FROM trades WHERE name = 'Sanitär'),    'system'),
  ('Schreiner',       (SELECT id FROM trades WHERE name = 'Tischler'),   'system'),
  ('Zimmermann',      (SELECT id FROM trades WHERE name = 'Tischler'),   'system'),
  ('Trockenbauer',    (SELECT id FROM trades WHERE name = 'Trockenbau'), 'system'),
  ('Malermeister',    (SELECT id FROM trades WHERE name = 'Maler'),      'system'),
  ('Anstreicher',     (SELECT id FROM trades WHERE name = 'Maler'),      'system')
ON CONFLICT (alias) DO NOTHING;

-- 5. resolve_trade_id(): Text → UUID mit Sonstiges-Fallback
CREATE OR REPLACE FUNCTION resolve_trade_id(p_trade_text TEXT)
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT trade_id FROM trade_aliases WHERE alias = p_trade_text LIMIT 1),
    (SELECT id FROM trades WHERE name = 'Sonstiges' LIMIT 1)
  );
$$;

COMMENT ON FUNCTION resolve_trade_id IS
  'Löst Trade-Text zu trades.id auf, mit Sonstiges als Fallback';

-- 6. Auto-Alias Trigger: neue Trades bekommen automatisch kanonischen Alias
CREATE OR REPLACE FUNCTION fn_trades_auto_alias()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO trade_aliases (alias, trade_id, source)
  VALUES (NEW.name, NEW.id, 'system')
  ON CONFLICT (alias) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trades_auto_alias ON trades;
CREATE TRIGGER trg_trades_auto_alias
  AFTER INSERT ON trades
  FOR EACH ROW EXECUTE FUNCTION fn_trades_auto_alias();

-- 7. Index für schnelle Alias-Suche
CREATE INDEX IF NOT EXISTS idx_trade_aliases_alias ON trade_aliases(alias);
