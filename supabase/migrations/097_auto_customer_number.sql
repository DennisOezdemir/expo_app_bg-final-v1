-- Auto-generate customer_number on INSERT (K-YYYY-NNN)
CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS TRIGGER AS $$
DECLARE
  yr TEXT := to_char(now(), 'YYYY');
  seq INT;
BEGIN
  IF NEW.customer_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(
    CASE
      WHEN customer_number ~ ('^K-' || yr || '-\d+$')
      THEN CAST(split_part(customer_number, '-', 3) AS INT)
      ELSE 0
    END
  ), 0) + 1 INTO seq
  FROM clients;

  NEW.customer_number := 'K-' || yr || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_customer_number ON clients;
CREATE TRIGGER trg_generate_customer_number
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION generate_customer_number();
