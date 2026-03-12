# Materialmodell Entscheidung

Stand: 11.03.2026

## Fragestellung

Welches Modell soll im Materialprozess fuehrend sein?

- `project_materials`
- `project_material_needs`
- oder ein dauerhaftes Hybridmodell

## Kurzentscheidung

`project_material_needs` sollte das fuehrende fachliche Materialmodell werden.

`project_materials` sollte nicht weiter als primaeres Produktmodell ausgebaut werden, sondern nur noch:

- als Altpfad
- oder als begrenzter Lern-/Kompatibilitaetslayer

## Warum diese Entscheidung

Der heutige Codebestand zeigt:

- Frontend-Material arbeitet auf `project_materials`
- neuere Order-/Schedule-/Agent-Flows arbeiten auf `project_material_needs`
- MagicPlan-/Aufmass-basierte Materialberechnung passt fachlich besser zu `needs` als zu einer flachen Einzelmaterialliste

Wenn beide Modelle gleichberechtigt bleiben, entstehen weiter:

- doppelte Logik
- abweichende Status
- unterschiedliche Aggregationen
- inkonsistente UI und Automation

## Vergleich

### Option A: `project_materials` bleibt fuehrend

Vorteile:
- existiert bereits im Frontend
- Produktzuordnung und Lernlogik sind dort schon gedacht
- aktueller Materialscreen liest direkt daraus

Nachteile:
- Modell wirkt eher wie technische Einzelmaterialliste als wie Bauleiter-Bedarf
- aktuelles UI zeigt genau diese Schwaeche
- neuere n8n-Bestelllogik arbeitet bereits an `project_material_needs`
- Terminbezug und bauabschnittsbezogene Verdichtung sind dort nicht als fuehrende Sprache sichtbar

Urteil:
- technisch naheliegend
- fachlich die falsche Hauptrichtung

### Option B: `project_material_needs` wird fuehrend

Vorteile:
- Sprache passt zum Fachprozess: Bedarf statt Listenzeile
- aktuelle M4_05/M4_06/M4_07/M4_08-Flows setzen bereits darauf
- laesst sich sauber aus Aufmass + Positionen + Terminplan herleiten
- passt besser zu Bauleiterentscheidungen:
  - Was wird gebraucht?
  - Wann wird es gebraucht?
  - Was fehlt noch?
  - Was ist bestellreif?

Nachteile:
- aktuelles Frontend muss umgebaut werden
- Lernlogik aus `project_materials` muss migriert oder neu gedacht werden
- bestehende manuelle Produktzuordnung muss an das neue Modell angeschlossen werden

Urteil:
- fachlich die richtige Hauptrichtung
- mittelfristig die stabilere Architektur

### Option C: Dauerhaftes Hybridmodell

Idee:
- `project_material_needs` fuer Bedarf
- `project_materials` fuer Produkt- und Lernlogik

Vorteile:
- weniger sofortige Migration
- bestehender Screen koennte vorerst weiterlaufen

Nachteile:
- hoher Synchronisationsaufwand
- zwei Wahrheiten fuer Status und Mengen
- Fehlerbilder werden schwer debugbar
- hohes Risiko, dass Frontend und Automation weiter auseinanderlaufen

Urteil:
- als Uebergang vertretbar
- als Dauerzustand nicht akzeptabel

## Fachliche Zielarchitektur

Empfohlen:

- `project_material_needs` = Source of Truth fuer Materialbedarf
- separates Produkt-/Suggestion-Layer fuer:
  - bevorzugte Produkte
  - Lieferantenvorschlaege
  - Lernwerte
  - Preis-/Verpackungslogik

Das heisst:

- Bedarf und Menge leben im Bedarfsmodell
- Produktentscheidungen leben nicht als konkurrierendes zweites Material-Hauptmodell

## Konkrete Folgerung fuer das Frontend

Der aktuelle Materialscreen sollte nicht modernisiert, sondern neu geschnitten werden:

- Hauptscreen liest aus `project_material_needs`
- Fokus auf:
  - Gewerk
  - Bauabschnitt
  - Raumbezug
  - Bestellreife
  - offene Probleme
- Produktzuordnung ist Drilldown auf einen Bedarf, nicht Hauptliste

## Konkrete Folgerung fuer Automation

Die M4-Kette sollte auf einem einheitlichen Modell enden:

`MagicPlan -> room_measurements -> Position/Raum-Mapping -> Bedarf -> Terminabgleich -> Produkt/Lieferant -> Bestellung`

Nicht:

`MagicPlan -> irgendeine Liste`

## Empfehlung zur Migration

### Schritt 1

`project_material_needs` als offizielles Zielmodell festlegen.

### Schritt 2

Alle neuen Frontend-Arbeiten auf `project_material_needs` ausrichten.

### Schritt 3

Pruefen, welche Funktionen von `project_materials` noch benoetigt werden:

- Lerntrigger
- Produkt-Defaults
- manuelle Zuordnung
- Werkzeug-/Hilfsmittel-Logik

Diese Funktionen dann:

- in `project_material_needs`
- oder in einen separaten Suggestion-/Preference-Layer ueberfuehren

### Schritt 4

`project_materials` als Legacy markieren und nicht mehr als primaere UI-Quelle nutzen.

## Empfehlung fuer Ralph

Ralph sollte nicht den Dauer-Hybrid ausbauen.

Sinnvolle Ralph-Auftraege nach dieser Entscheidung:

1. `Material Needs as Source of Truth`
2. `Material Needs Product Assignment Layer`
3. `Bauleiter Material Center`

## Endfazit

Die richtige Entscheidung ist:

`project_material_needs` wird fuehrendes Materialmodell.

`project_materials` bleibt hoechstens als Migrations- oder Lernrest bestehen, aber nicht als primaerer Materialprozess.
