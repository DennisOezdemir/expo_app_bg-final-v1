# Material Migrationsstrategie

Stand: 11.03.2026

## Ziel

Migration vom heutigen uneinheitlichen Materialzustand zu einer klaren Zielarchitektur:

- `project_material_needs` als Source of Truth
- Bauleiter-orientierte Materialoberflaeche
- konsistenter Flow von Aufmass bis Bestellung

Die Migration soll ohne Big Bang erfolgen.

## Leitprinzip

Erst Architektur und Datenfluss stabilisieren, dann UI modernisieren, dann Altpfade abschalten.

Nicht:
- zuerst neue UI bauen
- waehrend parallel zwei konkurrierende Materialwahrheiten weiterleben

## Phase 1: Datenmodell festziehen

Ziel:
- `project_material_needs` offiziell zum fuehrenden Modell machen
- den Uebergang von `project_materials` kontrollieren

### 1.1 Bestand sauber inventarisieren

Pruefen:
- welche Felder in `project_material_needs` heute schon fachlich reichen
- welche Felder aus `project_materials` noch gebraucht werden
- welche Lern-/Produkt-/Lieferanteninformationen fehlen

Besonders relevant:
- `product_id`
- Statuslogik
- Preisfelder
- Lieferantenbezug
- Kategorie `material / werkzeug / hilfsmittel`
- manuelle Overrides

### 1.2 Zielschema fuer `project_material_needs` definieren

Falls noetig erweitern um:
- Produktzuordnung
- bevorzugtes Produkt / manuelles Override
- Preis / Preisquelle
- Kategorie
- Entscheidungstatus
- Herkunft des Bedarfs

Ziel:
- alles, was der Bauleiterprozess braucht, muss auf dem fuehrenden Modell leben

### 1.3 Legacy-Pfad markieren

`project_materials` wird nicht sofort geloescht, aber:
- nicht mehr als neue Hauptquelle weiterentwickelt
- technisch als Legacy markiert
- nur noch fuer Migration oder Rueckwaertskompatibilitaet genutzt

### 1.4 Migrationsmapping festlegen

Regeln definieren:
- wie vorhandene `project_materials` in `project_material_needs` ueberfuehrt werden
- was aggregiert wird
- welche Felder verlieren wir bewusst nicht
- wie Konflikte behandelt werden

Beispiel:
- mehrere Einzelmaterialzeilen -> ein aggregierter Bedarf
- bestehende Produktwahl -> `preferred_product_id` oder `product_id`

## Phase 2: Frontend auf Zielmodell umstellen

Ziel:
- Material-UI liest nicht mehr aus `project_materials`
- neue UI denkt in Bedarfen, Gewerken, Bauabschnitten und Ausnahmen

### 2.1 Kein inkrementelles Verschönern des alten Screens

Der aktuelle Screen ist fachlich falsch geschnitten.

Deshalb:
- nicht weiter an der flachen Listenlogik arbeiten
- stattdessen neue Screen-Struktur aufbauen

### 2.2 Neues Material-Center definieren

Hauptscreen:
- naechste Materialentscheidungen
- Gewerkepakete
- Terminbezug
- offene Probleme

Detailscreen:
- Bedarf je Raum / Bauabschnitt
- Produktvorschlaege
- Lieferanten
- manuelle Korrektur

### 2.3 Produktzuordnung neu anbinden

`assign-material` wird nicht mehr an `project_materials` gehaengt, sondern an Bedarfseintraege.

Das bedeutet:
- Auswahl eines Produkts fuer einen Materialbedarf
- optional Uebernahme fuer gleichartige Bedarfe
- Lernsignal aus echter Entscheidung

### 2.4 Bestellscreen anschliessen

Der aktuelle Bestellscreen ist Mock.

Er wird ersetzt durch:
- echte Lieferantengruppierung aus `project_material_needs`
- Bestellreife nach Termin und Status
- Versand/Freigabe an echten Flow gekoppelt

## Phase 3: Automation angleichen

Ziel:
- MagicPlan, Bedarf, Planung und Bestellung laufen auf einem konsistenten Prozess

### 3.1 MagicPlan bis Bedarf stabilisieren

Sicherstellen:
- MagicPlan-Mail wird sauber erkannt
- `project_room_measurements` ist verlaesslich gefuellt
- Raum-zu-Section-Mapping ist robust
- fehlende Zuordnung wird als Problem sichtbar

### 3.2 Bedarfsgenerierung vereinheitlichen

Es darf nur noch einen offiziellen Weg geben:

`Aufmass + Positionen + Mapping -> project_material_needs`

Keine zweite primäre Materialerzeugung in ein Konkurrenzmodell.

### 3.3 Terminbezug verbindlich machen

Bedarf wird nicht nur berechnet, sondern priorisiert:
- bald faellig
- unkritisch spaeter
- blockiert wegen fehlender Daten

Das soll auf `schedule_phases` aufsetzen.

### 3.4 Bestelllogik final anschliessen

Order-Flows sollen direkt auf dem Zielmodell arbeiten:
- Vorschlag
- Freigabe
- Versand
- Statusupdate

### 3.5 Legacy-Automation auslaufen lassen

Alles, was noch implizit an `project_materials` haengt, wird:
- migriert
- ersetzt
- oder bewusst stillgelegt

## Technische Reihenfolge

### Sprint A: Architektur und Daten

- Zielschema festziehen
- Mapping Alt -> Neu definieren
- Legacy markieren
- erste Read-Views/RPCs fuer neues Frontend bereitstellen

### Sprint B: Bauleiter-Materialcenter

- neuer Read-Pfad fuer Material-Center
- Gewerk-/Termin-/Problemansicht
- Detailscreen fuer Bedarfe

### Sprint C: Produkt- und Lieferantenentscheidungen

- neues Assignment auf Bedarfsebene
- Lern-/Suggestion-Layer anschliessen
- echte Statusfluesse

### Sprint D: Bestellung und Abschaltung Altpfad

- Mock-Bestellung ersetzen
- Versand/Freigabe anbinden
- altes `project_materials`-Frontend entfernen

## Risiken

### Risiko 1: Verdeckte Abhaengigkeiten an `project_materials`

Loesung:
- vor jeder Abschaltung Repo- und Flow-Audit

### Risiko 2: Verlust von Lernlogik

Loesung:
- Lernmechanik explizit extrahieren und ins Zielmodell oder einen Suggestion-Layer ueberfuehren

### Risiko 3: Frontend wird nur anders, aber nicht fachlich besser

Loesung:
- Screens immer gegen Bauleiter-Entscheidungen pruefen, nicht gegen Tabellenstruktur

### Risiko 4: MagicPlan-Mapping bleibt unscharf

Loesung:
- Fehlerfaelle im UI sichtbar machen
- gezielte Korrekturoberflaeche statt stiller Fallbacks

## Ralph-Pakete in sinnvoller Reihenfolge

### Paket 1

`Material Needs Source of Truth`

Inhalt:
- Zielschema
- Datenzugriff vereinheitlichen
- Legacy kennzeichnen

### Paket 2

`MagicPlan to Need Pipeline Hardening`

Inhalt:
- Raum-/Section-Mapping
- Bedarfsberechnung
- Problemfaelle sichtbar machen

### Paket 3

`Bauleiter Material Center`

Inhalt:
- neue Hauptoberflaeche
- Gewerkepakete
- Terminbezug
- Problemliste

### Paket 4

`Need Assignment and Ordering`

Inhalt:
- Produktzuordnung
- Lieferantenvorschlag
- Bestellfreigabe
- Statusfluss

## Konkrete naechste Entscheidung

Vor der Umsetzung sollte einmal explizit entschieden werden:

- welche Felder aus `project_materials` in das Zielmodell muessen
- was als separater Suggestion-/Learning-Layer endet
- welche Altfunktionen sofort eingefroren werden

## Kurzfazit

Die Migration sollte so laufen:

1. `project_material_needs` fachlich vollstaendig machen
2. Frontend auf das Zielmodell umstellen
3. Automation konsolidieren
4. `project_materials` aus der Hauptlogik entfernen

So bleibt das System arbeitsfaehig, waehrend wir es von einer Materialliste zu einem echten Bauleiterprozess umbauen.
