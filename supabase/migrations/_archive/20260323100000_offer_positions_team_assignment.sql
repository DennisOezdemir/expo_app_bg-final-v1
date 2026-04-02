-- Team/NU-Zuweisung: 3 neue Spalten auf offer_positions
ALTER TABLE offer_positions
  ADD COLUMN IF NOT EXISTS assigned_team_member_id UUID REFERENCES team_members(id),
  ADD COLUMN IF NOT EXISTS assigned_subcontractor_id UUID REFERENCES subcontractors(id),
  ADD COLUMN IF NOT EXISTS assignment_type TEXT CHECK (assignment_type IN ('eigen', 'fremd'));

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_offer_positions_team_member ON offer_positions(assigned_team_member_id) WHERE assigned_team_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offer_positions_subcontractor ON offer_positions(assigned_subcontractor_id) WHERE assigned_subcontractor_id IS NOT NULL;
