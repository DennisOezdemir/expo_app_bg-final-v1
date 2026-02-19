# HANDOVER 2026-01-18: Clients vs Catalogs Fix + Bank Matching

## Session Summary

**Datum:** 18.01.2026  
**Kontext:** Claude.ai mit MCP (Supabase, GitHub, n8n)

---

## Was wurde gemacht

### 1. Migration 028: Bank Transaction Matching
**Problem:** Keine automatische Zuordnung von Bankbewegungen zu Rechnungen

**Lösung:**
- `bank_transactions` Tabelle für Kontobewegungen
- `invoice_payments` Junction-Table mit Confidence-Score
- `calculate_match_confidence()` Funktion mit Scoring:
  - Betrag exakt: +40%
  - Betrag ±1%: +20%
  - Rechnungsnummer in Verwendungszweck: +50%
  - Name matcht: +25%
  - Datum plausibel: +15%
- `find_payment_matches()` findet Top-5 Vorschläge
- `confirm_payment_match()` bestätigt Zuordnung

**Files:** `migrations/028_bank_transactions_matching.sql`

---

### 2. Migration 029: Clients vs Catalogs Fix
**Problem:** SAGA/WBS wurden als "Kunden" gespeichert, sind aber nur Preiskataloge

**Realität:**
- SAGA/WBS = Preiskataloge (fixe Positionspreise)
- Echte Kunden = GUs wie besser zuhause GmbH, Roland Ernst, Rehbein & Weber

**Lösung:**
- `projects.price_catalog` TEXT Feld (SAGA, WBS, CUSTOM)
- `clients` Tabelle B2B-fähig gemacht (first_name/last_name nullable)
- Neue Felder: `vat_id`, `contact_person`, `customer_number`
- Alte Fake-Kunden gelöscht, echte Kunden eingefügt

**Echte Kunden jetzt in DB:**
| Firma | USt-ID | Kundennummer |
|-------|--------|--------------|
| besser zuhause GmbH | DE322970160 | - |
| Roland Ernst Sanitär GmbH | DE118613602 | 2027 |
| Rehbein & Weber GmbH | DE118681696 | K-2023-18 |

**Files:** `migrations/029_fix_clients_vs_catalogs.sql`

---

## Frontend-Änderungen NOCH OFFEN

### Projekte.tsx
```
VORHER: KUNDE Spalte zeigt "SAGA" (falsch)
NACHHER: 
  - KATALOG Badge (SAGA/WBS) 
  - KUNDE Spalte (echter Client via client_id JOIN)
  - Quick-Assign Dropdown wenn NULL
```

### Benötigte Queries
```sql
-- Projekte mit Katalog + Kunde
SELECT 
  p.project_number,
  p.name,
  p.price_catalog,
  c.company_name as client_name
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
ORDER BY p.project_number DESC;

-- Kunden für Dropdown
SELECT id, company_name 
FROM clients 
WHERE client_type = 'COMMERCIAL'
ORDER BY company_name;
```

---

## GitHub Status

- **Repo:** `Deine-Baulowen/baugenius-mockup`
- **Branch:** `main`
- **Backup:** `backup-2026-01-18-clients-catalogs`
- **Commits:**
  - `390762b` — Migration 028 Bank Matching
  - `6ff0262` — Migration 029 Clients Fix

---

## Nächste Schritte

1. [ ] Projekte.tsx: Katalog Badge + Kunde Dropdown
2. [ ] Kunden-Verwaltung (CRUD Page)
3. [ ] Bank Matching UI (Vorschläge mit Confidence-Badges)
4. [ ] Projekte bestehenden Kunden zuweisen

---

## Datenmodell Referenz

```
projects
├── price_catalog: TEXT (SAGA, WBS, CUSTOM)
├── client_id: UUID → clients.id (nullable, echter Auftraggeber)
└── ...

clients
├── company_name: TEXT
├── vat_id: TEXT (USt-IdNr)
├── customer_number: TEXT (deine interne Nummer)
├── contact_person: TEXT
└── client_type: ENUM (COMMERCIAL, PRIVATE, ...)

bank_transactions
├── amount, booking_date, transaction_type (CREDIT/DEBIT)
├── counterpart_name, reference_text
└── is_matched: BOOLEAN

invoice_payments
├── bank_transaction_id → bank_transactions
├── sales_invoice_id OR purchase_invoice_id
├── match_confidence: 0-100
└── status: SUGGESTED, CONFIRMED, REJECTED
```
