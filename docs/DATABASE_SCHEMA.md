# BAUGENIUS Datenbank-Schema v1.4

> **Stand:** 27.12.2024  
> **Datenbank:** Supabase (PostgreSQL 15+)  
> **Module:** Basis + Angebot + Protokolle + Approvals + Events + **Lieferanten & Einkauf + Kostenkategorien**

---

## 📊 SCHEMA-ÜBERSICHT

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BAUGENIUS DATENMODELL v1.4                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  STAMMDATEN              PROJEKTE                   KATALOG                     │
│  ──────────              ────────                   ───────                     │
│  ┌─────────┐            ┌──────────┐              ┌──────────────────┐         │
│  │ clients │◄───────────│ projects │              │ catalog_versions │         │
│  └─────────┘            └────┬─────┘              └────────┬─────────┘         │
│       ▲                      │                             │                   │
│       │                      │                    ┌────────┴─────────┐         │
│  ┌────┴────┐                 │                    │catalog_positions │         │
│  │  leads  │─────────────────┘                    └────────┬─────────┘         │
│  └─────────┘                                               │                   │
│                                                   ┌────────┴─────────┐         │
│                                                   │catalog_pos_prices│         │
│                                                   └────────┬─────────┘         │
│                                                            │                   │
│  LIEFERANTEN & EINKAUF (v1.3 + v1.4)             ┌────────┴─────────┐         │
│  ────────────────────────────────────            │catalog_supplier_ │         │
│  ┌───────────┐     ┌──────────────────┐          │    mapping       │         │
│  │ suppliers │◄────│supplier_articles │◄─────────┴──────────────────┘         │
│  │  + aliases│     └────────┬─────────┘                                       │
│  └─────┬─────┘              │                                                  │
│        │           ┌────────┴─────────┐                                       │
│        │           │supplier_article_ │                                       │
│        │           │     prices       │                                       │
│        │           └──────────────────┘                                       │
│        │                                                                       │
│  ┌─────┴─────────────┐     ┌──────────────────────┐                           │
│  │purchase_invoices  │────►│purchase_invoice_items│                           │
│  │+ expense_category │     │  (Rechnungszeilen)   │                           │
│  └───────────────────┘     └──────────────────────┘                           │
│                                                                                 │
│  KOSTENKATEGORIEN (NEU v1.4)                                                   │
│  ───────────────────────────                                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │ expense_category ENUM:                                                  │   │
│  │ MATERIAL, SUBCONTRACTOR (Einzelkosten)                                  │   │
│  │ VEHICLE_FUEL, VEHICLE_RENTAL, VEHICLE_REPAIR, ENTERTAINMENT,            │   │
│  │ SOFTWARE, INSURANCE, OFFICE, DISPOSAL, OTHER (Gemeinkosten/AGK)         │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  VIEWS FÜR KALKULATION                                                         │
│  ─────────────────────                                                         │
│  v_overhead_rate        → Monatlicher AGK-Zuschlagssatz                        │
│  v_direct_costs_monthly → Einzelkosten pro Monat                               │
│  v_overhead_costs_monthly → Gemeinkosten pro Monat                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🆕 ÄNDERUNGEN v1.4 (27.12.2024)

### Neue ENUM: `expense_category`

Kategorisierung aller Belege für Zuschlagskalkulation.

| Kategorie | Typ | Beschreibung | Beispiel-Lieferanten |
|-----------|-----|--------------|----------------------|
| `MATERIAL` | Einzelkosten | Baumaterial, Werkzeug | Bauhaus, Hornbach, Würth |
| `SUBCONTRACTOR` | Einzelkosten | Fremdleistung | DLA Trockenbau, Ay Logistik |
| `VEHICLE_FUEL` | AGK | Tanken | Aral, Shell, Total, JET |
| `VEHICLE_RENTAL` | AGK | Mobilität | Miles, Sixt, EasyPark |
| `VEHICLE_REPAIR` | AGK | Werkstatt, Autowäsche | Car Klinik, Mr. Wash |
| `ENTERTAINMENT` | AGK | Bewirtung | Restaurants, Bäckereien |
| `SOFTWARE` | AGK | AI, Tools, Hosting | Anthropic, OpenAI, Supabase |
| `INSURANCE` | AGK | Versicherungen | R+V, BG Bau, Itzehoer |
| `OFFICE` | AGK | Büro, Telefon | Vodafone, Böttcher, dm |
| `DISPOSAL` | AGK | Entsorgung | Pleikies, Buhck |
| `OTHER` | AGK | Sonstiges | Banken, Behörden |

**Einzelkosten** = Direkt einem Projekt zuordenbar → Marge-Berechnung
**AGK (Gemeinkosten)** = Nicht zuordenbar → Zuschlagssatz für Kalkulation

---

### Neue Spalten

| Tabelle | Spalte | Typ | Beschreibung |
|---------|--------|-----|--------------|
| `purchase_invoices` | expense_category | expense_category | Kostenkategorie des Belegs |
| `suppliers` | default_expense_category | expense_category | Standard-Kategorie für diesen Lieferanten |

---

### Neue Tabelle: `supplier_aliases`

Für OCR-Erkennung verschiedener Schreibweisen.

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | UUID | Primary Key |
| supplier_id | UUID | FK zu suppliers |
| alias_name | TEXT | Alternative Schreibweise (UNIQUE) |
| created_at | TIMESTAMPTZ | Erstellungsdatum |

**Beispiel:**
```sql
-- Bauhaus hat viele Schreibvarianten auf Belegen:
INSERT INTO supplier_aliases (supplier_id, alias_name) VALUES
  ('bauhaus-uuid', 'BAUHAUS Gesellschaft für Bau- und Hausbedarf mbH &'),
  ('bauhaus-uuid', 'Bau und Hausbedarf mbH & Co.KG'),
  ('bauhaus-uuid', 'Bauhaus 620'),
  ('bauhaus-uuid', 'Bauhaus 654');
```

---

### Neue Views für Kalkulation

#### `v_overhead_rate`
Monatlicher AGK-Zuschlagssatz für Angebotskalkulation.

```sql
SELECT * FROM v_overhead_rate;

-- Ergebnis:
-- monat      | einzelkosten | gemeinkosten | zuschlagssatz_prozent
-- 2025-01    | 45.000€      | 8.500€       | 18,89%
-- 2024-12    | 52.000€      | 9.200€       | 17,69%
```

**Nutzung:** Der Zuschlagssatz fließt in die Angebotskalkulation ein.

#### `v_direct_costs_monthly`
Einzelkosten nach Kategorie pro Monat.

#### `v_overhead_costs_monthly`
Gemeinkosten nach Kategorie pro Monat.

---

## 📦 LIEFERANTEN-STAMMDATEN

### Seed-Daten (135 Lieferanten)

Die Migration 012 enthält 135 vorkategorisierte Lieferanten aus dem Sevdesk-Export.

| Kategorie | Anzahl | Beispiele |
|-----------|--------|-----------|
| **Baumärkte** | 7 | Bauhaus, Hornbach, OBI, Toom, Hagebau, Globus |
| **Großhandel** | 7 | Stark, Mega, Delmes, HolzLand, Benthack |
| **Farben/Lacke** | 3 | Imparat, Ullmann, Maleco |
| **Werkzeug** | 7 | Würth, Storch, GoTools, Contorion, Toolnation |
| **Fliesen** | 2 | Graumann, Alfers |
| **Sanitär** | 3 | Peter Jensen, Stitz, CWS |
| **Elektro** | 5 | Elektroland24, Voltking, Wagner, Schacht |
| **Subunternehmer** | 5 | DLA Trockenbau, Ay Logistik, Kevin Wulf |
| **Tankstellen** | 15 | Aral, Shell, Total, JET, Esso, OIL!, ... |
| **Mobilität** | 3 | Miles, Sixt, EasyPark |
| **KFZ** | 7 | Werkstätten, Autowäsche |
| **Entsorgung** | 4 | Pleikies, Buhck, Brockmann |
| **Bewirtung** | 4 | Restaurant, Bäckerei, Allwörden |
| **Software** | 24 | Anthropic, OpenAI, Supabase, Canva, ... |
| **Büro/Telko** | 8 | Vodafone, IONOS, Böttcher, dm |
| **Versicherung** | 3 | R+V, Itzehoer, BG Bau |
| **Sonstige** | 28 | Banken, Behörden, Steuerberater, ... |

---

## 🔗 TABELLEN-BEZIEHUNGEN (Einkauf)

```
suppliers
    │
    ├──► supplier_aliases (1:N)
    │    └── Verschiedene Schreibweisen für OCR
    │
    ├──► supplier_articles (1:N)
    │    └── Artikel pro Lieferant
    │         │
    │         └──► supplier_article_prices (1:N)
    │              └── Preishistorie mit valid_from/valid_to
    │
    └──► purchase_invoices (1:N)
         │    ├── expense_category (NEU v1.4)
         │    └── project_id (NULL = Gemeinkosten)
         │
         └──► purchase_invoice_items (1:N)
              └── Einzelpositionen mit Artikelzuordnung
```

---

## 📋 HILFS-FUNKTIONEN

### Lieferant finden

```sql
-- Per Code
SELECT get_supplier_by_code('HORN');  -- Returns UUID

-- Per Alias (für OCR)
SELECT s.* 
FROM suppliers s
JOIN supplier_aliases sa ON sa.supplier_id = s.id
WHERE LOWER(sa.alias_name) LIKE '%bauhaus%';
```

### Artikel finden/anlegen

```sql
SELECT find_or_create_supplier_article(
  p_supplier_id := 'uuid',
  p_article_number := '12345678',
  p_article_name := 'Silikon transparent 310ml',
  p_unit := 'STUECK',
  p_category := 'Dichtstoffe'
);
```

### Preis erfassen

```sql
SELECT record_price_from_invoice(
  p_supplier_article_id := 'uuid',
  p_unit_price := 4.99,
  p_invoice_number := 'R-2024-12345'
);
```

---

## 📈 PREISVERGLEICH

### Günstigsten Lieferanten finden

```sql
SELECT * FROM v_cheapest_supplier 
WHERE internal_name ILIKE '%silikon%';

-- Ergebnis:
-- supplier | article              | price | unit
-- HORN     | Silikon transp. 310ml | 4.99  | STUECK
-- OBI      | Silikon transp. 310ml | 5.49  | STUECK
-- BAUH     | Silikon transp. 310ml | 5.29  | STUECK
```

### Aktuelle Preise

```sql
SELECT * FROM v_current_supplier_prices 
WHERE supplier_code = 'HORN'
ORDER BY category, internal_name;
```

---

## 📁 MIGRATIONS-REIHENFOLGE

| Nr | Datei | Beschreibung |
|----|-------|--------------|
| 001 | offer_sections_positions.sql | Angebote & Positionen |
| 002 | text_blocks_custom_options.sql | Textbausteine |
| 003 | jumbos_legacy_search.sql | Jumbo-Templates |
| 004 | projects_workflow_extension.sql | Projekt-Workflow |
| 005 | catalog_translations.sql | Katalog-Übersetzungen |
| 006 | protocols_drive_folders.sql | Protokolle & Drive |
| 007 | approvals_events_feedback.sql | HITL & Approvals |
| 008 | hardening_constraints.sql | Constraints |
| 009 | suppliers_purchasing.sql | Lieferanten & Einkauf |
| 010 | event_system.sql | Event-System |
| 011 | workflow_steps.sql | Workflow State Machine |
| **012** | **suppliers_expense_categories.sql** | **Kostenkategorien (NEU)** |

---

## 🔄 EVENT-TYPEN (Einkauf)

| Event | Trigger | Beschreibung |
|-------|---------|--------------|
| `PURCHASE_INVOICE_CREATED` | M4_01 Flow | Neue Eingangsrechnung erfasst |
| `PURCHASE_INVOICE_APPROVED` | Freigabe-UI | Rechnung freigegeben |
| `PURCHASE_INVOICE_PAID` | Buchhaltung | Rechnung bezahlt |
| `SUPPLIER_PRICE_UPDATED` | M4_01 Flow | Neuer Preis erfasst |
| `SUPPLIER_ARTICLE_CREATED` | M4_01 Flow | Neuer Artikel angelegt |

---

## 🧮 ZUSCHLAGSKALKULATION

### Formel

```
                    Σ Gemeinkosten (Monat)
Zuschlagssatz = ────────────────────────────── × 100%
                    Σ Einzelkosten (Monat)
```

### Beispiel

| Monat | Einzelkosten | Gemeinkosten | Zuschlag |
|-------|--------------|--------------|----------|
| Jan 2025 | 45.000€ | 8.500€ | 18,89% |
| Dez 2024 | 52.000€ | 9.200€ | 17,69% |

**Anwendung im Angebot:**
```
Materialkosten:     1.000€
+ Zuschlag (18,89%):  189€
= Selbstkosten:     1.189€
+ Gewinn (15%):       178€
= Angebotspreis:    1.367€
```

---

## 📝 CHANGELOG

### v1.4 (27.12.2024)
- ✅ `expense_category` ENUM (11 Kategorien)
- ✅ `suppliers.default_expense_category`
- ✅ `purchase_invoices.expense_category`
- ✅ `supplier_aliases` Tabelle
- ✅ 135 Lieferanten aus Sevdesk-Export
- ✅ Views für Zuschlagskalkulation
- ✅ Alias-Einträge für OCR-Matching

### v1.3 (21.12.2024)
- Lieferanten & Einkauf (Migration 009)
- Preishistorie & Preisvergleich

### v1.2 (20.12.2024)
- Event-System
- Workflow State Machine
