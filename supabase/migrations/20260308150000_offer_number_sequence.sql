-- Angebotsnummer: A-YYYY-NNN (fortlaufend, resettet NIE)
-- Bestehende 12 Angebote: A-2026-101 bis A-2026-112
-- Nächstes neues: A-2026-113

-- Sequenz (startet bei 113, steigt immer weiter)
CREATE SEQUENCE IF NOT EXISTS offer_number_seq START WITH 113;

-- Trigger-Funktion
CREATE OR REPLACE FUNCTION generate_offer_number()
RETURNS TRIGGER AS $$
DECLARE
  yr TEXT := to_char(now(), 'YYYY');
  seq INT;
BEGIN
  -- Wenn schon eine gültige Nummer im neuen Format → nicht überschreiben
  IF NEW.offer_number IS NOT NULL AND NEW.offer_number LIKE 'A-%' THEN
    RETURN NEW;
  END IF;

  seq := nextval('offer_number_seq');
  NEW.offer_number := 'A-' || yr || '-' || seq::TEXT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_offer_number ON offers;
CREATE TRIGGER trg_generate_offer_number
  BEFORE INSERT ON offers
  FOR EACH ROW
  EXECUTE FUNCTION generate_offer_number();

-- Bestehende Nummern migrieren (ANG-2026-XXX-YY → A-2026-1NN)
WITH numbered AS (
  SELECT id, created_at,
         100 + ROW_NUMBER() OVER (ORDER BY created_at ASC) AS new_seq
  FROM offers
  WHERE offer_number NOT LIKE 'A-%'
)
UPDATE offers
SET offer_number = 'A-' || to_char(offers.created_at, 'YYYY') || '-' || numbered.new_seq::TEXT
FROM numbered
WHERE offers.id = numbered.id;
