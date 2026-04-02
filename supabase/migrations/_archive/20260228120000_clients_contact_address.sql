-- Stammdaten Kunden: E-Mail, Telefon, Adresse ergänzen
-- Für Einstellungen → Kunden (CRUD)

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT;

COMMENT ON COLUMN clients.email IS 'E-Mail-Adresse des Kunden / Ansprechpartners';
COMMENT ON COLUMN clients.phone IS 'Telefonnummer';
COMMENT ON COLUMN clients.street IS 'Straße und Hausnummer';
COMMENT ON COLUMN clients.zip_code IS 'PLZ';
COMMENT ON COLUMN clients.city IS 'Ort';
