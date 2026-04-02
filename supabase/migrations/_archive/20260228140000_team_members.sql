-- Team-Stammdaten: Mitarbeiter bearbeitbar (Einstellungen → Team)

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Monteur' CHECK (role IN ('GF', 'Bauleiter', 'Monteur')),
  role_label TEXT,
  gewerk TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fehlende Spalten nachziehen, falls Tabelle schon mit älterem Schema existiert
-- (INSERT unten nutzt: name, email, role, role_label, gewerk, active, sort_order)
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role_label TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS gewerk TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (true);
CREATE POLICY "team_members_insert" ON team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "team_members_update" ON team_members FOR UPDATE USING (true);
CREATE POLICY "team_members_delete" ON team_members FOR DELETE USING (true);

-- Seed mit bestehenden Demo-Daten (nur wenn Tabelle leer)
INSERT INTO team_members (name, email, role, role_label, gewerk, active, sort_order)
SELECT 'Dennis', 'dennis@bauloewen.de', 'GF', 'Geschäftsführer', NULL, true, 0
WHERE NOT EXISTS (SELECT 1 FROM team_members);
INSERT INTO team_members (name, email, role, role_label, gewerk, active, sort_order)
SELECT 'Ayse', 'ayse@bauloewen.de', 'Bauleiter', 'Projektleiterin', NULL, true, 1
WHERE NOT EXISTS (SELECT 1 FROM team_members);
INSERT INTO team_members (name, email, role, role_label, gewerk, active, sort_order)
SELECT 'Mehmet', 'mehmet@bauloewen.de', 'Monteur', 'Maler', 'Maler', true, 2
WHERE NOT EXISTS (SELECT 1 FROM team_members);
INSERT INTO team_members (name, email, role, role_label, gewerk, active, sort_order)
SELECT 'Ali', 'ali@bauloewen.de', 'Monteur', 'Fliesenleger', 'Fliesen', true, 3
WHERE NOT EXISTS (SELECT 1 FROM team_members);

COMMENT ON TABLE team_members IS 'Mitarbeiter/Team für Einstellungen → Team (Stammdaten)';
