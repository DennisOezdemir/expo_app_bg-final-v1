-- Standard-Ordner bei jedem neuen Projekt automatisch anlegen
-- Gleiche Struktur wie Google Drive: 01_Auftrag bis 09_Sonstiges

CREATE OR REPLACE FUNCTION create_default_project_folders()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_folders (project_id, name, sort_order) VALUES
    (NEW.id, '01_Auftrag', 1),
    (NEW.id, '02_Angebot', 2),
    (NEW.id, '03_Aufmass', 3),
    (NEW.id, '04_Rechnung', 4),
    (NEW.id, '05_Bauakte', 5),
    (NEW.id, '06_Protokolle', 6),
    (NEW.id, '07_Fotos', 7),
    (NEW.id, '08_Kommunikation', 8),
    (NEW.id, '09_Sonstiges', 9);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_default_folders ON projects;
CREATE TRIGGER trg_create_default_folders
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_default_project_folders();

-- Bestehende Projekte nachpflegen
INSERT INTO project_folders (project_id, name, sort_order)
SELECT p.id, f.name, f.sort_order
FROM projects p
CROSS JOIN (VALUES
  ('01_Auftrag', 1), ('02_Angebot', 2), ('03_Aufmass', 3),
  ('04_Rechnung', 4), ('05_Bauakte', 5), ('06_Protokolle', 6),
  ('07_Fotos', 7), ('08_Kommunikation', 8), ('09_Sonstiges', 9)
) AS f(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM project_folders pf
  WHERE pf.project_id = p.id AND pf.name = f.name
);
