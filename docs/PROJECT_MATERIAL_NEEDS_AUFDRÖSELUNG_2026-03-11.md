# project_material_needs aufgedroeselt

Stand: 11.03.2026

## Ziel dieses Dokuments

Verstehen, was `project_material_needs` im aktuellen System tatsaechlich ist:

- welche Rolle die Tabelle heute spielt
- wie n8n und Fachlogik sie nutzen
- welche implizite Fachsemantik schon vorhanden ist
- was noch fehlt, damit sie wirklich Source of Truth sein kann

## Kurzfassung

`project_material_needs` ist im heutigen Stand bereits deutlich naeher am eigentlichen Bauleiterprozess als `project_materials`.

Es repraesentiert:
- berechneten oder abgeleiteten Bedarf
- mit Projekt-, Raum-, Gewerk- und Mengenbezug
- inklusive Produkt-/Lieferantenanschluss
- inklusive Bestellstatus
- inklusive Nutzung in den neueren Order- und Schedule-Flows

Der Hauptmangel ist aktuell nicht die fachliche Richtung, sondern:
- fehlende Frontend-Nutzung
- moeglicherweise unvollstaendige Produkt-/Lernlogik
- noch nicht sauber ausformulierte Zielstruktur

## Was `project_material_needs` heute konkret macht

### 1. Es ist Ziel der neueren Materialberechnung

Der Workflow [`M4_05_Material_List_Generator.json`](/Users/DBL/Projects/Projekt%20Baugenius%20Stand%2028.02.2026/expo_app_bg-final-v1/n8n-workflows/M4_05_Material_List_Generator.json) schreibt direkt in `project_material_needs`.

Eingaben:
- `offer_positions`
- `offer_sections`
- `project_room_measurements`
- `catalog_material_mapping`

Berechnung:
- Position -> Mapping
- Mapping -> Mengentreiber
- Mengentreiber -> Raum-/Flaechen-/Umfangswerte
- Ergebnis -> Detailzeilen
- danach Konsolidierung

Write-Ziel:
- `project_id`
- `room`
- `trade`
- `material_type`
- `label`
- `total_quantity`
- `quantity_unit`
- `product_id`
- `source_position_nr`
- `status`
- `source`

Das ist bereits ein starkes Indiz:
- `project_material_needs` ist nicht nur Datenablage
- es ist das aktuelle Ziel eines auf Aufmass basierenden Bedarfsprozesses

### 2. Es traegt Raumbezug

Im Unterschied zur heutigen Nutzung von `project_materials` sieht man hier explizit:
- `room`
- Herleitung aus `project_room_measurements`

Das ist fachlich wichtig, weil Materialbedarf ohne Raum-/Aufmassbezug fuer den Bauleiter kaum belastbar ist.

### 3. Es traegt Gewerkbezug

`trade` ist zentral im Modell und wird in den Folgeflows aktiv verwendet.

Damit laesst sich:
- nach Gewerk gruppieren
- mit `schedule_phases.trade` koppeln
- Material vor der naechsten Phase priorisieren

### 4. Es traegt Bestellstatus

Die Flows nutzen klar:
- `status = planned`
- spaeter `status = ordered`

Das heisst:
- `project_material_needs` lebt nicht nur in der Berechnung
- sondern reicht bis in den Bestellprozess hinein

### 5. Es traegt Produkt- und Lieferantenbezug

Die neueren Order-Flows joinen von `project_material_needs` auf:
- `products`
- `suppliers`

Sie verwenden dabei z. B.:
- `product_id`
- `product_name`
- `unit_price_net`
- Lieferantenname / Mail / Telefon

Das ist wichtig:
- `project_material_needs` ist nicht mehr nur abstrakter Bedarf
- es ist bereits an reale Einkaufsobjekte anschlussfaehig

## Wie `project_material_needs` heute fachlich genutzt wird

### M4_05: Bedarf erzeugen

`M4_05` erzeugt Materialbedarfe aus:
- Aufmass
- Positionen
- Material-Mappings

Das ist der fachlich richtige Einstieg.

### M4_06: Bestellvorschlag bilden

[`M4_06_Order_Agent.json`](/Users/DBL/Projects/Projekt%20Baugenius%20Stand%2028.02.2026/expo_app_bg-final-v1/docs/n8n-flows/M4_06_Order_Agent.json) liest aus `project_material_needs`:
- Materialbedarf
- Lieferanten
- Preise
- Terminplan

Dann erzeugt der Flow:
- gruppierte Bestellvorschlaege je Lieferant
- mit Hinweis auf die naechste Phase

Das ist exakt Bauleiterlogik:
- nicht "welche Zeile ist offen?"
- sondern "was muss fuer die naechste Phase beschafft werden?"

### M4_07: Bestellung versenden

[`M4_07_Order_Send.json`](/Users/DBL/Projects/Projekt%20Baugenius%20Stand%2028.02.2026/expo_app_bg-final-v1/docs/n8n-flows/M4_07_Order_Send.json) arbeitet ebenfalls direkt auf `project_material_needs`.

Dabei:
- werden Bedarfe je Lieferant gruppiert
- E-Mail-Inhalte vorbereitet
- der Status auf `ordered` gesetzt

Auch das spricht klar fuer `needs` als Hauptmodell.

### M4_08: Terminwarnung

[`M4_08_Schedule_Order_Trigger.json`](/Users/DBL/Projects/Projekt%20Baugenius%20Stand%2028.02.2026/expo_app-bg-final-v1/docs/n8n-flows/M4_08_Schedule_Order_Trigger.json) prueft:
- welche `schedule_phases` bald starten
- ob dazu noch unbestellte `project_material_needs` existieren

Das ist ein sehr starkes Signal:
- `project_material_needs` ist bereits das Modell fuer terminrelevanten Materialbedarf

## Was `project_material_needs` fachlich repraesentiert

Am ehesten:

- ein aggregierter oder halbaggregierter Materialbedarf pro Projekt
- mit Raum- und Gewerkbezug
- mit Mengen, Produkten und Bestellstatus
- abgeleitet aus Aufmass und Positionslogik

Das ist deutlich naeher an einer Bauleiter-Entscheidungseinheit als `project_materials`.

## Was an `project_material_needs` gut ist

### A. Richtige Sprache

`needs` beschreibt Bedarf und nicht bloß Materialzeilen.

Das passt besser zum Fachprozess.

### B. Aufmass-Anschluss

Die Berechnung baut direkt auf `project_room_measurements` auf.

Das ist fachlich zentral.

### C. Termin-Anschluss

Das Modell ist bereits mit `schedule_phases` verknuepft.

Das ist fuer Bauleitersteuerung essenziell.

### D. Bestell-Anschluss

Das Modell wird bereits fuer:
- Vorschlag
- Freigabe
- Versand
- Statuswechsel

verwendet.

Damit ist es bereits viel naeher an einer End-to-End-Kette.

## Was an `project_material_needs` noch fehlt oder unklar ist

### A. Frontend ist nicht darauf umgestellt

Heute liest das Frontend weiter aus `project_materials`.

Das bedeutet:
- das bessere Fachmodell ist noch nicht im Alltag der App angekommen

### B. Lernlogik ist dort nicht sichtbar verankert

Bei `project_materials` sehen wir explizit:
- Produktauswahl
- Lernen
- Auto-Apply

Bei `project_material_needs` ist das im Repo aktuell nicht ebenso klar sichtbar.

Das muss nachgezogen werden.

### C. Kategorie-Logik ist noch offen

Material, Werkzeuge und Hilfsmittel wurden bisher eher um `project_materials` herum gedacht.

Es ist offen:
- ob `project_material_needs` nur echtes Material abbildet
- oder auch angrenzende Bedarfsarten

### D. Aggregationsebene muss bewusst definiert werden

Die Tabelle scheint heute eine Mischung aus:
- raumbezogenem Detailbedarf
- und gleichzeitig bestellrelevanter Einheit

zu tragen.

Das ist machbar, aber nur wenn klar definiert ist:
- was die primaere Entscheidungseinheit ist
- wann aggregiert wird
- was im Hauptscreen vs. Drilldown landet

## Was aus `project_material_needs` fuer die Zielarchitektur stark ist

Unbedingt beibehalten:

- `project_id`
- `room`
- `trade`
- `material_type`
- `label`
- `total_quantity`
- `quantity_unit`
- `product_id`
- `status`
- `source`
- terminbezogene Auswertbarkeit

Diese Dinge sind schon nah am Sollprozess.

## Was fuer das Zielmodell ergaenzt oder geschaerft werden sollte

### Produktentscheidungs-Layer

Klarer machen:
- vorgeschlagenes Produkt
- bestaetigtes Produkt
- manuelles Override
- Lernsignal

### Problemstatus

Sichtbar machen:
- Aufmass fehlt
- Mapping fehlt
- Produkt fehlt
- Lieferant fehlt
- Termin kritisch

### Entscheidungsstatus

Trennen zwischen:
- berechnet
- geprueft
- freigegeben
- bestellt

falls `planned/ordered` allein fachlich nicht reicht

## Gegenueberstellung zu `project_materials`

`project_materials` ist staerker bei:
- Produktauswahl
- Lernlogik
- alter UI-Anbindung

`project_material_needs` ist staerker bei:
- Aufmassbezug
- Gewerk
- Raum
- Termin
- Bestellung
- Bauleiterlogik

Darum ist `project_material_needs` die bessere Basis fuer das Hauptmodell.

## Endfazit

`project_material_needs` ist bereits heute das fachlich richtigere Materialmodell.

Es repraesentiert:

- Bedarf
- Baukontext
- Bestellrelevanz
- Terminbezug

Es fehlt vor allem:

- die Frontend-Hauptnutzung
- die vollstaendige Produkt-/Lernschicht

Deshalb lautet die richtige Richtung:

- `project_material_needs` ausbauen
- `project_materials` nicht weiter als Hauptmodell nutzen
- wertvolle Funktionen aus `project_materials` gezielt uebernehmen
