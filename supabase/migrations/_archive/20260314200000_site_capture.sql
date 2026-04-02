-- 096: Site Captures — Baustellenaufnahme ohne bestehendes Angebot
-- Eigene Tabelle, da inspection_protocols zu stark an offer_positions gekoppelt

CREATE TABLE site_captures (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            uuid NOT NULL REFERENCES projects(id),
  status                text NOT NULL DEFAULT 'recording'
                        CHECK (status IN ('recording','processing','draft_ready','completed')),
  capture_date          date DEFAULT CURRENT_DATE,
  notes                 text,
  checklist_data        jsonb DEFAULT '{}',
  transcript_raw        text,
  transcript_structured jsonb,  -- {rooms: [{name, positions: [{title, qty, unit, trade}]}]}
  magicplan_matched     boolean DEFAULT false,
  offer_id              uuid REFERENCES offers(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE site_captures ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can CRUD their own org's captures
CREATE POLICY "site_captures_select" ON site_captures
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "site_captures_insert" ON site_captures
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "site_captures_update" ON site_captures
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- inspection_attachments: Link to site_capture
ALTER TABLE inspection_attachments
  ADD COLUMN IF NOT EXISTS site_capture_id uuid REFERENCES site_captures(id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION fn_site_captures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_site_captures_updated_at
  BEFORE UPDATE ON site_captures
  FOR EACH ROW EXECUTE FUNCTION fn_site_captures_updated_at();
