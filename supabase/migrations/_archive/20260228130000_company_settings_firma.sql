-- Firmenstammdaten: Alle Keys für Einstellungen → Firma
-- Ergänzt company_settings um fehlende Keys (bestehende Keys unverändert).

INSERT INTO company_settings (key, value, setting_type, description) VALUES
  ('company_name', 'Deine Baulöwen GmbH', 'text', 'Firmenname'),
  ('company_since', 'Seit Januar 2025', 'text', 'Text unter Firmenname im Profil (z. B. Seit Januar 2025)'),
  ('rechtsform', 'GmbH', 'text', 'Rechtsform'),
  ('geschaeftsfuehrer', 'Dennis', 'text', 'Geschäftsführer'),
  ('address_street', 'Musterstraße 12', 'text', 'Straße und Hausnummer'),
  ('address_zip', '20095', 'text', 'PLZ'),
  ('address_city', 'Hamburg', 'text', 'Ort'),
  ('phone', '040-123456', 'text', 'Telefon'),
  ('email', 'info@bauloewen.de', 'text', 'E-Mail'),
  ('website', 'www.bauloewen.de', 'text', 'Website'),
  ('tax_id', '41/123/45678', 'text', 'Steuernummer'),
  ('vat_id', 'DE123456789', 'text', 'USt-IdNr.'),
  ('handelsregister', 'HRB 12345 Hamburg', 'text', 'Handelsregister'),
  ('finanzamt', 'Hamburg-Nord', 'text', 'Finanzamt'),
  ('bank', 'Hamburger Sparkasse', 'text', 'Bank'),
  ('iban', 'DE89 3704 0044 0532 0130 00', 'text', 'IBAN'),
  ('bic', 'HASPDEHHXXX', 'text', 'BIC'),
  ('zahlungsziel', '14', 'text', 'Zahlungsziel (Tage)'),
  ('skonto_percent', '2', 'text', 'Skonto %'),
  ('skonto_tage', '7', 'text', 'Skonto innerhalb (Tage)'),
  ('mahnfrist_1', '14', 'text', 'Mahnfrist 1. Mahnung (Tage)'),
  ('mahnfrist_2', '14', 'text', 'Mahnfrist 2. Mahnung (Tage)'),
  ('verzugszinsen', '5', 'text', 'Verzugszinsen % über Basiszins')
ON CONFLICT (key) DO NOTHING;
