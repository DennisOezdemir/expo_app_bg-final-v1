-- saga_orders mit projects verknüpfen
-- M1_02 setzt project_id beim Erstellen, Dokumente-Manager zeigt Auftrag an

ALTER TABLE saga_orders ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
CREATE INDEX IF NOT EXISTS idx_saga_orders_project_id ON saga_orders(project_id);
