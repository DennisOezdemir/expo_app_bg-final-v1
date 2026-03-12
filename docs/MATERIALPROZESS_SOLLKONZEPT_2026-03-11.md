# Materialprozess Sollkonzept

Stand: 11.03.2026

## Ziel

Der Materialprozess soll nicht wie eine digitale Materialliste funktionieren, sondern wie die Arbeitsweise eines Bauleiters:

- erst Aufmass und Baukontext verstehen
- dann Mengen und Materialbedarf ableiten
- dann auf Termin und Gewerk schauen
- dann nur noch Entscheidungen vorlegen

Der User soll nicht Materialzeilen einzeln pflegen. Das System soll vorbereiten, verdichten, warnen und Vorschlaege machen.

## Ausgangspunkt

Fachlich beginnt der Materialprozess nicht bei einer Materialliste, sondern bei:

1. MagicPlan-Aufmass per Mail
2. Projekt-/Adresszuordnung
3. Raumdaten und Flaechen
4. Angebots-/Auftragspositionen je Raum und Gewerk
5. geplanter Ausfuehrung im Terminplan

Ohne diese Kette ist jede Materialberechnung fachlich unvollstaendig.

## Soll-Flow aus Bauleiter-Sicht

### 1. Aufmass kommt rein

Trigger:
- MagicPlan-Mail mit PDF/CSV/Export

System macht:
- erkennt MagicPlan automatisch
- ordnet Export dem Projekt zu
- schreibt Raumdaten in `project_room_measurements`
- speichert Originaldateien im Projektkontext

User macht:
- nur pruefen, falls Projektzuordnung unklar ist

### 2. Aufmass wird mit Leistungsbild verbunden

System macht:
- verbindet Raeuume mit `offer_sections`
- nutzt `room_measurement_id` oder kontrollierten Fallback
- verbindet Positionen mit Raum, Gewerk und Mengenlogik

User macht:
- nur Korrekturen bei unklaren Raumzuordnungen

### 3. Materialbedarf wird berechnet

System macht:
- berechnet Materialbedarf aus:
  - Raumflaechen
  - Umfaengen
  - Positionsmengen
  - Material-Mappings / Verbrauchswerten
- aggregiert auf ein bauleiter-taugliches Niveau:
  - Projekt
  - Gewerk
  - Bauabschnitt
  - optional Raumgruppe / Einzelraum

User macht:
- keine Einzelpflege

### 4. Materialbedarf wird terminlich eingeordnet

System macht:
- gleicht Materialbedarf mit `schedule_phases` ab
- erkennt:
  - was bald gebraucht wird
  - was schon bestellt ist
  - was noch ohne Produkt / Lieferant ist
  - was terminlich kritisch wird

User macht:
- priorisiert nur bei Konflikten

### 5. Produkt- und Lieferantenvorschlag

System macht:
- schlaegt passende Produkte vor
- nutzt Lernlogik aus vergangenen Entscheidungen
- gruppiert nach Lieferant
- berechnet Bestellvorschlaege

User macht:
- bestaetigt oder korrigiert Vorschlaege

### 6. Freigabe und Bestellung

System macht:
- erzeugt bestellreife Lieferantenpakete
- bereitet Mail / Bestellung / Dokumentation vor
- markiert Materialstatus sauber

User macht:
- Freigeben
- im Ausnahmefall aendern

## Was der Bauleiter im Frontend sehen sollte

Nicht:
- 40 gleiche Materialzeilen mit `Zuordnen`

Sondern:
- den naechsten relevanten Bauabschnitt
- die betroffenen Gewerkepakete
- die betroffenen Raeume
- den aggregierten Materialbedarf
- offene Probleme
- konkrete Entscheidungen

## Vorschlag fuer die Hauptansicht

### Bereich 1: Naechste Materialentscheidung

Beispiel:
- Projekt `BL-2026-014`
- naechste Phase: `Maler` ab `18.03.2026`
- betroffen: `Wohnzimmer, Flur, Schlafzimmer`
- Status: `2 Produkte fehlen`, `1 Lieferant fehlt`, `Bestellung bis 14.03.2026 sinnvoll`

Aktionen:
- `Bedarf pruefen`
- `Produkte bestaetigen`
- `Bestellung freigeben`

### Bereich 2: Gewerke-Pakete

Je Gewerk eine Karte:
- Gewerk
- Startdatum
- Materialbedarf gesamt
- bereits zugeordnet
- noch offen
- Bestellstatus
- Risikoampel

### Bereich 3: Offene Klaerungen

Nur Ausnahmen:
- Raum nicht gemappt
- Aufmass fehlt
- Produkt fehlt
- Lieferant ohne Mail
- Termin startet vor unbestelltem Material

### Bereich 4: Detailansicht

Erst im Drilldown:
- Raumweise Mengen
- einzelne Materialien
- Produktalternativen
- Preis / Lieferant / Verpackung

## Datenmodellentscheidung

Aktuell existieren zwei konkurrierende Materialmodelle:

- `project_materials`
- `project_material_needs`

Das ist fuer Produkt und Automation zu instabil.

## Entscheidungsvorschlag

Ein fuehrendes Modell fuer den Bauleiterprozess definieren.

Empfohlene Richtung:
- `project_material_needs` als fachliches Soll-Modell fuer berechneten Bedarf, Terminbezug und Bestellprozess
- `project_materials` nur behalten, wenn es eine klar abgegrenzte Alt-/Lernfunktion erfuellt

Begruendung:
- `project_material_needs` passt besser zur Sprache des Prozesses: Bedarf statt Einzelmaterialzeile
- die neueren n8n-Flows fuer Order und Schedule arbeiten bereits darauf
- es ist naeher an Bauleiterentscheidungen als eine technische Einzelpositionsliste

Offene Architekturfrage:
- wird Lernlogik direkt in `project_material_needs` integriert
- oder bleibt sie in einem separaten Produkt-/Material-Preference-Layer

## Harte Fachregeln

- kein Materialbedarf ohne Aufmass oder klaren Mengentreiber
- kein Bestellvorschlag ohne Terminbezug
- keine manuelle Einzelpflege als Standardprozess
- der User entscheidet nur bei Abweichung, Unsicherheit oder Freigabe
- fehlende Daten muessen als Problem sichtbar werden, nicht als stille Leere

## Was kurzfristig weg muss

- Materialscreen als flache Einzelliste
- `Zuordnen` als primaere Hauptinteraktion
- Vermischung von Datenmodellen ohne klare Fuehrung
- Mock-Bestellprozess ohne Verbindung zum echten Materialbedarf

## Umsetzungsreihenfolge

### Phase 1: Architektur festziehen

- entscheiden, welches Materialmodell fuehrend ist
- Ist-Flow auf Soll-Flow mappen
- Altpfade markieren

### Phase 2: Materialbedarf konsolidieren

- MagicPlan -> Aufmass -> Bedarf stabilisieren
- Position/Raum-Mapping robust machen
- Aggregation je Gewerk/Bauabschnitt definieren

### Phase 3: Bauleiter-UI bauen

- Material-Center als Entscheidungsoberflaeche
- Fokus auf Pakete, Ausnahmen, Freigaben
- Drilldown fuer Details

### Phase 4: Order-Flow anschliessen

- Produktvorschlaege
- Lieferantengruppierung
- Terminwarnungen
- Freigabe / Versand

## Ralph-taugliche Pakete

Nach Architekturentscheidung sind diese Pakete sinnvoll:

1. `MagicPlan-to-MaterialNeed Consolidation`
- Fuehrendes Materialmodell anschliessen
- Mapping und Berechnung vereinheitlichen

2. `Schedule-linked Material Prioritization`
- Bedarf mit `schedule_phases` koppeln
- kritische Faelle markieren

3. `Bauleiter Material Center`
- neue Hauptoberflaeche fuer Materialentscheidungen

## Offene Entscheidungen

1. Soll `project_material_needs` das fuehrende Modell werden?
2. Wie tief soll Raumbezug im Hauptscreen sichtbar sein?
3. Soll Bestellung direkt aus der App oder primär ueber n8n/Telegram freigegeben werden?
4. Welche manuellen Eingriffe bleiben bewusst erlaubt?

## Kurzfazit

Das Materialmodul darf nicht als Liste gedacht werden.

Es ist ein Entscheidungsprozess:

`Aufmass -> Mengen -> Bedarf -> Terminbezug -> Produkt/Lieferant -> Freigabe -> Bestellung`

Wenn wir das konsequent so schneiden, kann Ralph danach sinnvoll an klar abgegrenzten Paketen arbeiten.
