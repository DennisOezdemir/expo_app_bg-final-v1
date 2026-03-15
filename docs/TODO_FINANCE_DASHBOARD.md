# TODO: Finance Dashboard (Geld-Tab)

**Erstellt:** 2026-03-15
**Modul:** M6 Finance
**Priorität:** Hoch
**Status:** Geplant

## Ziel

Lexware-Daten (Zahlungsstatus, Belege) ins BG-Dashboard bringen.
Ayse sieht auf einen Blick: Was ist bezahlt, was ist offen, was ist überfällig.

## Datenquellen

- Lexware API: `GET /v1/vouchers/{id}` liefert `voucherStatus`, `paidAmount`, `files`, `dueDate`
- Supabase: `purchase_invoices` (bereits mit `lexware_voucher_id` gesyncht)
- n8n: `M6_03_Lexware_Pull_Sales` (existiert bereits, pollt alle 4h)

## Konzept

### 1. Daten-Sync (n8n)
- Bestehenden Pull-Flow erweitern oder neuen Sync-Flow
- Lexware Voucher-Status + Zahlungen regelmäßig nach Supabase synchen
- Felder in `purchase_invoices`: `payment_status` (paid/partial/open/overdue), `lexware_paid_amount`, `lexware_has_file`

### 2. Dashboard UI (Geld-Tab)
- Ampel-Karten oben: Bezahlt (grün) / Offen (gelb) / Überfällig (rot)
- Summen pro Status
- Liste der offenen/überfälligen Rechnungen mit Fälligkeitsdatum
- Touch-Target auf Rechnung → Detail mit Beleg-Vorschau

### 3. Ayse-Checkliste
- [ ] Auf einen Blick: Wie viel Geld steht noch aus?
- [ ] Überfällige sofort sichtbar (rot, oben)
- [ ] Keine englischen Begriffe
- [ ] Mobile-first, große Touch-Targets
- [ ] 3-Sekunden-Regel: Sofort klar was zu tun ist

## Abhängigkeiten
- Lexware PDF Re-Upload muss erst abgeschlossen sein (aktuell in Arbeit)
- M6_02c Fix deployed (2026-03-15) — neue Belege werden jetzt automatisch hochgeladen
