# project_materials aufgedroeselt

Stand: 11.03.2026

## Ziel dieses Dokuments

Verstehen, was `project_materials` im aktuellen System tatsaechlich ist:

- welche Rolle die Tabelle heute spielt
- wie das Frontend sie benutzt
- welche implizite Fachlogik darin steckt
- was davon ins Zielmodell uebernommen werden muss

## Kurzfassung

`project_materials` ist im heutigen Stand vor allem:

- ein altes projektbezogenes Materiallistenmodell
- die aktuelle Quelle fuer den Materialscreen
- die aktuelle Quelle fuer manuelle Produktzuordnung
- ein Traeger fuer Lernlogik

`project_materials` ist im heutigen Stand eher **kein gutes fuehrendes Bauleiter-Bedarfsmodell**.

## Was `project_materials` heute konkret macht

### 1. Materialscreen speist sich daraus

Der Screen [`app/(tabs)/material.tsx`](/Users/DBL/Projects/Projekt%20Baugenius%20Stand%2028.02.2026/expo_app_bg-final-v1/app/(tabs)/material.tsx) liest direkt aus `project_materials`.

Geladene Felder:
- `id`
- `material_type`
- `trade`
- `quantity`
- `quantity_unit`
- `product_id`
- `status`
- `line_total_net_eur`
- `override_price_net_eur`

Dazu Join auf `products` und `suppliers`.

Die UI-Logik ist heute:
- kein `product_id` -> `offen`
- `product_id` gesetzt -> `fertig`
- `product_id` plus `status = ordered` -> `bestellt`

Das heisst:
- `project_materials` ist heute direkt das Interaktionsmodell fuer Material-Zuordnung
- aber nur in einer flachen Listenlogik

### 2. Produktzuordnung haengt direkt daran

Der Screen [`app/assign-material.tsx`](/Users/DBL/Projects/Projekt%20Baugenius%20Stand%2028.02.2026/expo_app_bg-final-v1/app/assign-material.tsx) arbeitet ebenfalls direkt auf `project_materials`.

Was dort passiert:
- Materialeintrag laden
- Produkte dazu suchen
- ausgewaehltes Produkt direkt in `project_materials.product_id` schreiben
- neues Produkt optional anlegen und sofort zuweisen

Das heisst:
- `project_materials` ist heute das unmittelbare Objekt der Materialentscheidung
- nicht ein aggregierter Bedarf, sondern eine technische Materialzeile

### 3. Lernlogik ist daran aufgehängt

Mehrere Dokumente verweisen auf:
- `trg_learn_product`
- `trg_material_auto_apply`

Gedachte Logik:
- User waehlt Produkt fuer Material
- Nutzung wird beobachtet
- nach wiederholter Nutzung wird ein Default gelernt

Das ist fachlich wertvoll.

Wichtig:
- wertvoll ist die **Lernfunktion**
- nicht zwingend die Tatsache, dass sie an `project_materials` haengt

### 4. Material, Werkzeuge und Hilfsmittel wurden dort vermischt

Laut Badge-/AI-Dokumentation wurde `project_materials` auch erweitert fuer:
- `category = material`
- `category = werkzeug`
- `category = hilfsmittel`

Das war vermutlich praktisch fuer eine einheitliche Badge-UI.

Fachlich bedeutet das aber:
- Materialbedarf
- Werkzeugbedarf
- Hilfsmittel

wurden in ein gemeinsames Listenmodell gepackt.

Das kann fuer eine Packlisten-/Badge-Interaktion sinnvoll sein, ist aber nicht automatisch das richtige Hauptmodell fuer Bauleiter-Materialsteuerung.

## Was `project_materials` fachlich wahrscheinlich repraesentiert

Am ehesten:

- projektbezogene Materialeintraege
- relativ nah an Positionen / Materialarten
- mit direkter Produktzuordnung
- mit Summen-/Preisbezug
- mit Lern-/Autocomplete-Hintergrund

Nicht gut repraesentiert sind darin als primaerer Fokus:
- Bauabschnitt
- Terminprioritaet
- Bestellreife
- Problemstatus
- Bedarf als Entscheidungseinheit

## Was an `project_materials` gut ist

Diese Aspekte sind wertvoll und sollten nicht verloren gehen:

### A. Produktzuordnung

Wichtiger Nutzen:
- konkretem Material wird ein reales Produkt zugeordnet

Das brauchen wir weiter.

### B. Lernfunktion

Wichtiger Nutzen:
- System lernt aus wiederholter Produktauswahl

Das brauchen wir weiter.

### C. Preis- und Lieferantenbezug

Wichtiger Nutzen:
- Produkt bringt Preis, Lieferant, SKU und Einkaufskontext mit

Das brauchen wir weiter.

### D. Kategorie-Idee

Wichtiger Nutzen:
- Material ist nicht alles
- Werkzeuge und Hilfsmittel sind im Baustellenkontext ebenfalls relevant

Das brauchen wir weiter, aber eventuell nicht im gleichen Hauptmodell.

## Was an `project_materials` problematisch ist

### A. Es zieht die UI in Richtung Listenpflege

Die heutige Frontend-Nutzung zeigt:
- viele Einzelzeilen
- Fokus auf `Zuordnen`
- kaum Baukontext

Das fuehrt weg von Bauleiter-Arbeit und hin zu Datenpflege.

### B. Es ist nicht das aktive Order-/Schedule-Modell

Die neueren Material- und Bestellfluesse arbeiten bereits auf `project_material_needs`.

Das heisst:
- `project_materials` ist im Frontend fuehrend
- `project_material_needs` ist in der neueren Automation fuehrend

Das ist die eigentliche Systemspannung.

### C. Es ist als Hauptmodell zu nah an der technischen Materialzeile

Fuer einen Bauleiter ist nicht die Zeile wichtig, sondern:
- welcher Bauabschnitt
- welches Gewerk
- welche Raeume
- was fehlt
- was muss wann bestellt werden

Dafuer ist `project_materials` als Hauptmodell ungeeignet.

## Welche Inhalte aus `project_materials` wir behalten muessen

Diese Dinge muessen in die Zielarchitektur hinein:

### Unbedingt behalten

- Produktzuordnung
- Preis-/Lieferantenbezug
- manuelle Override-Moeglichkeit
- Lernsignal aus echter Auswahl

### Wahrscheinlich behalten

- Kategorie-Unterscheidung `material / werkzeug / hilfsmittel`
- Verbrauch vs. Nicht-Verbrauch
- Favoriten-/Autocomplete-Naehe zu `products`

### Nicht als Hauptlogik behalten

- flache Materiallisten-Interaktion
- Einzelzeile als primaere Entscheidungseinheit
- aktueller Statusaufbau im Materialscreen

## Empfehlung fuer die Zielarchitektur

### 1. `project_material_needs` wird Hauptmodell

Dort lebt:
- Bedarf
- Menge
- Raum-/Gewerk-/Bauabschnittskontext
- Terminbezug
- Bestellstatus

### 2. Produkt- und Lernlogik wird als Layer darauf gelegt

Nicht zwingend als `project_materials`.

Moegliche Richtungen:
- direkt erweiterte Felder auf `project_material_needs`
- oder eigener Suggestion-/Preference-Layer

### 3. Werkzeug/Hilfsmittel separat denken

Wahrscheinlich besser:
- Materialbedarf als eigener Hauptprozess
- Packliste/Werkzeug/Hilfsmittel als angrenzender, aber anderer Prozess

Nicht alles in ein einziges Hauptmodell pressen.

## Konkrete Uebernahme aus `project_materials`

Bei der Migration sollten wir explizit entscheiden:

### In `project_material_needs` oder Suggestion-Layer uebernehmen

- `product_id`
- Preisbezug
- Override-Preis
- Lieferantenkontext
- Lernereignis bei Auswahl

### Konzeptionell neu zuschneiden

- `status`
- Kategorie
- Aggregation
- UI-Interaktion

## Endfazit

`project_materials` ist kein nutzloser Altmuell.

Es enthaelt wichtige Dinge:
- Produktauswahl
- Lernen
- Preis-/Lieferantennaehe

Aber:

Es ist als fuehrendes Bauleiter-Materialmodell falsch geschnitten.

Die richtige Richtung ist:

- Bedarf in `project_material_needs`
- Produkt-/Lernlogik als gezielter Layer
- `project_materials` nicht weiter als primaeren Prozess ausbauen
