# Datenbereinigung Produktdatenbank — 23.03.2026

## Kontext

BG wurde abgespeckt: Material-Zuordnung passiert jetzt direkt in der Erstbegehung (EB).
Der Bauleiter steht auf der Baustelle, bestätigt eine Position und bekommt sofort Produktvorschläge.

**Problem:** Die `products`-Tabelle (981 Einträge) war durch den SevDesk-Rechnungsimport mit Müll gefüllt — Tankquittungen, Software-Subscriptions, KFZ-Kosten, abgeschnittene Produktnamen.
BL bekommt "Compute Hours", "Diesel ARAL" oder "BUSCH REFLEX RAHMEN" statt echte Baumaterialien vorgeschlagen.

## Was bereinigt wurde

### 1. Nicht-Baumaterial gelöscht (~230 Einträge)
- **Software/SaaS:** Supabase, Vercel, Cursor, Midjourney, Google Workspace, v0, IONOS, Superchat
- **Mobilfunk:** Vodafone, congstar, 5G Option
- **KFZ:** Diesel, Super E10, V-Power, Getriebeöl, Bremsflüssigkeit, Scheibenwischer, Fahrzeugmiete (Sixt)
- **Büro:** HJH Office Drehstuhl, Büromarkt, Europalette, Exoskelett
- **Buchhaltung:** Einkommensteuer, MwSt-Zeilen, Preise als Produktnamen (29,90 C)
- **Sonstiges:** Kennzeichen, Krankenkasse, Tankstellen, Frachtpauschalen

### 2. Duplikate bereinigt
- **Busch-Jaeger:** 10 abgeschnittene Duplikate gelöscht (z.B. "BU REFLEX SI", "Busch Eingsatz Wechse"), 12 saubere Einträge behalten + 3-fach/4-fach Rahmen aktiviert
- **Alle CAPS-Müll gelöscht:** ~55 unleserliche Einträge (z.B. "MOERTELKUEBEL TO", "WECHSE.WIP B&J SIWW", "SPOLTE-GHM STRAHLT VE")

### 3. Einheiten vereinheitlicht
| Vorher | Nachher |
|--------|---------|
| Stk, STUECK, STB | **Stück** |
| RL, ROL | **Rolle** |
| DOS | **Dose** |
| EIM | **Eimer** |
| SA, KA | **Sack** |
| Std, GB-Std | **Stunde** |
| Psch | **Pauschal** |
| Mon. | **Monat** |
| Tg | **Tag** |
| VE | **Paket** |

### 4. CAPS-Namen umbenannt
Alle GROSSBUCHSTABEN-Produkte in lesbares Title Case:
- `ABB HAUPTSCHALTER` → `ABB Hauptschalter`
- `BETON-ESTRICH` → `Beton-Estrich`
- `SCHNELLESTRICH 30KG` → `Schnellestrich 30kg`
- `FB 113x25 JURAMARMOR` → `Fensterbank 113x25mm Jura Marmor`
- etc.

### 5. Supplier-Bereinigung
**Marken umbenannt (Alias-System):**
- REESA-Produkte → `Suding & Soeken ... (REESA)` — Suche nach "Suding" oder "REESA" findet beides
- Sanibel-Produkte → `Peter Jensen ... (Sanibel)` — analog

**Duplikat-Lieferanten zusammengeführt:**
| Duplikate | → Zusammengeführt zu |
|-----------|---------------------|
| Reesa, Suding & Soeken GmbH & Co. KG | **Suding & Soeken** |
| Ullmann Farben, Ullmann Farben & Heimtex GmbH & Co. KG | **Ullmann Farben** |
| toom Baumarkt GmbH, toom Baumarkt Neumünster | **toom** |
| Benthack, Henri Benthack GmbH & Co. KG | **Benthack** |
| bauwelt, bauwelt Delmes Heitmann, Delmes Heitmann GmbH & Co. KG | **Delmes Heitmann** |
| KERAMUNDO Fliesenhandel, Keramundo Hamburg, STARK Deutschland GmbH, STARK...NL Keramundo | **Keramundo** |
| BAUHAUS, Bauhaus Gesellschaft für... | **Bauhaus** |
| Würth Industrie Service, Adolf Würth GmbH & Co. KG | **Würth** |
| Pleikies (3x), PLEIKIES GmbH & Co. KG | **Pleikies** |
| elektroland24 (2x) | **elektroland24** |
| DLA Trockenbau (2x) | **DLA Trockenbau** |

**~50 Nicht-Bau-Supplier deaktiviert:** Anthropic, Supabase, Cursor, Vodafone, Tankstellen, Versicherungen, etc.

**Source → Supplier zugeordnet (38 Produkte):**
- `source = 'Peter Jensen'` → supplier_id gesetzt
- `source = 'BAUHAUS'` → supplier_id gesetzt
- `source = 'Büromarkt AG'` → supplier_id gesetzt

### 6. Trades gesetzt
574 von 722 Produkten haben jetzt ein Gewerk:

| Trade | Anzahl | Beispiele |
|-------|--------|-----------|
| maler | 315 | Farbe, Lack, Spachtel, Tapete, Pinsel, Walze |
| sanitaer | 71 | WC, Armatur, Ventil, Siphon, Dichtung |
| elektro | 52 | Steckdose, Schalter, Kabel, Dose, Rauchmelder |
| boden | 46 | Designboden, Sockelleiste, Estrich, Fensterbank |
| trockenbau | 39 | Gipskarton, Profile, Schnellbauschrauben |
| fliesen | 29 | Fugenmörtel, Fliesenkleber, Fliesenkreuze |
| tischler | 12 | Drückergarnitur, Schloss, Fenstergriff |
| heizung | 5 | Thermostatkopf |
| allgemein | 5 | WD-40, Fenstergriff |
| *ohne* | 148 | Werkzeug, Entsorgung, Querschnitts-Artikel |

### 7. Produktsuche-Fix im Code
- **Trade-Matching:** DB hat `elektro`/`sanitaer` (lowercase), UI hat `Elektro`/`Sanitär` → `TRADE_MAP` Normalisierung
- **NULL-Trades:** 148 Produkte ohne Trade werden bei gefilterter Suche trotzdem mit angezeigt (Querschnitts-Artikel)
- **Multi-Word-Suche:** `busch rahmen` findet jetzt `Busch-Jaeger Abdeckrahmen 1-fach/2-fach/3-fach` (Wort-Split mit AND-Logik)

## Ergebnis

| Vorher | Nachher |
|--------|---------|
| 981 Produkte | **722 Produkte** |
| ~30 Supplier-Duplikate | **Konsolidiert** |
| 279 ohne Trade | **148 ohne Trade** (nur echte Querschnitts-Artikel) |
| 85 CAPS-Namen | **0** |
| 12 verschiedene Einheiten-Schreibweisen | **Einheitlich** |
| Diesel, Compute Hours, Vodafone in Vorschlägen | **Nur Baumaterial** |

## Ursache

Der SevDesk-Rechnungsimport (`source = 'invoice_import'`) hat **alle** Rechnungspositionen als Produkte angelegt — nicht nur Baumaterial. Tankquittungen, Software-Lizenzen, KFZ-Werkstatt, Krankenkasse.

**TODO:** Im Import-Flow filtern: Nur Rechnungen von Bau-Lieferanten als Produkte importieren, nicht alle SevDesk-Positionen.
