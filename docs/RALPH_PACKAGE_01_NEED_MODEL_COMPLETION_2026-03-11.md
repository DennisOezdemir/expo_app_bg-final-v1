# Ralph Package 01: Need Model Completion

Stand: 11.03.2026

## Ziel

`project_material_needs` soll fachlich und technisch so vervollstaendigt werden, dass es als echtes fuehrendes Materialmodell dienen kann.

Dieses Paket baut noch **keine** neue Bauleiter-UI.

Es schafft die Grundlage dafuer.

## Problem

Heute ist die Materiallogik gespalten:

- `project_materials` traegt Teile der Produktzuordnung und Lernlogik
- `project_material_needs` traegt die neuere Bedarfs-, Termin- und Bestelllogik

Dadurch existieren zwei konkurrierende Modelle.

## Zielbild nach diesem Paket

Nach Abschluss gilt:

- `project_material_needs` ist fachlich vollstaendig genug fuer neue Frontend-Arbeit
- fehlende Produkt-/Preis-/Override-Aspekte sind geklaert
- der Suggestion-/Learning-Bedarf ist technisch vorbereitet
- `project_materials` muss fuer neue Materialfeatures nicht mehr erweitert werden

## Scope

### In Scope

- Zielschema fuer `project_material_needs` finalisieren
- fehlende Felder identifizieren und ergaenzen
- Statusmodell fuer Materialbedarf schaerfen
- Produktzuordnung auf Bedarfsmodell definieren
- Grundlage fuer Learning-/Suggestion-Layer definieren
- bestehende M4-Flows gegen das Zielschema pruefen
- Read-/Write-Pfade fuer neue Frontend-Arbeit vorbereiten

### Out of Scope

- neues Material-Frontend
- komplette Migration alter Daten
- komplette Abschaltung von `project_materials`
- finale Bestell-UI
- finale Lernalgorithmen

## Fachliche Entscheidungen dieses Pakets

### 1. Fuehrendes Materialmodell

Festschreiben:
- `project_material_needs` ist Source of Truth

### 2. Bedarfseinheit

Festlegen:
- welche Granularitaet `project_material_needs` repraesentiert

Empfohlene Richtung:
- Bedarfszeile je Projekt + Raum/Allgemein + Materiallabel + Gewerk

### 3. Statusmodell

Klaeren, welche Status gebraucht werden.

Mindestens sauber unterscheiden:
- berechnet
- geprueft
- freigegeben
- bestellt

Falls bestehendes `planned/ordered` reicht, muss das explizit begruendet werden.

### 4. Produktentscheidungsmodell

Definieren:
- welches Feld den empfohlenen Produktkandidaten traegt
- welches Feld die bestaetigte Auswahl traegt
- wie manuelle Overrides modelliert werden

## Technische Aufgaben

### Aufgabe A: Zielschema definieren

Pruefen, ob `project_material_needs` folgende Aspekte explizit tragen muss:

- `product_id` oder `selected_product_id`
- `suggested_product_id`
- Preisfelder
- Override-Preis
- Kategorie
- Entscheidungsstatus
- Problemstatus
- Freigabezeitpunkt / Bestellzeitpunkt

Ergebnis:
- klares Sollschema
- Migrationsplan fuer noetige DB-Aenderungen

### Aufgabe B: Abhaengigkeiten zu `project_materials` identifizieren

Konkret analysieren:
- welche Features im aktuellen App-Code noch direkt daran haengen
- welche Trigger/Funktionen fuer Learning relevant sind
- welche Felder spaeter ersetzt oder uebernommen werden muessen

Ergebnis:
- Liste aller Alt-Abhaengigkeiten

### Aufgabe C: Suggestion-/Learning-Layer vorbereiten

Noch nicht voll implementieren, aber definieren:

- welche Inputs der Layer bekommt
- welche Outputs er liefert
- ob erste Felder direkt auf `project_material_needs` landen
- was spaeter in eigene Tabellen wandern kann

Ergebnis:
- klare technische Richtung fuer Paket 2

### Aufgabe D: Frontend-kompatiblen Read-Pfad vorbereiten

Bereitstellen einer stabilen Quelle fuer ein spaeteres Material-Center:

- View
- RPC
- oder sauber definierter Query-Pfad

Die Ausgabe muss bauleiter-tauglich aggregierbar sein.

Ergebnis:
- neuer Read-Pfad fuer Materialbedarfe

### Aufgabe E: M4-Flows gegen das Zielmodell pruefen

Pruefen, ob folgende Flows ohne Widerspruch auf dem Zielschema weiterarbeiten:

- `M4_05_Material_List_Generator`
- `M4_06_Order_Agent`
- `M4_07_Order_Send`
- `M4_08_Schedule_Order_Trigger`

Ergebnis:
- Abweichungsliste
- noetige Anpassungen markieren

## Akzeptanzkriterien

Dieses Paket ist abgeschlossen, wenn:

1. `project_material_needs` als offizielles Zielmodell dokumentiert und technisch vorbereitet ist.
2. Fehlende Felder und Status sind konkret definiert.
3. Es gibt einen klaren Plan, wie Produktwahl und Learning nicht mehr an `project_materials` haengen muessen.
4. Es gibt einen stabilen Read-Pfad fuer kuenftige Frontend-Arbeit.
5. Die M4-Order-/Schedule-Flows sind gegen das Zielmodell abgeglichen.

## Nicht-Ziele zur Vermeidung von Scope Drift

Ralph soll in diesem Paket nicht:

- den Materialscreen redesignen
- Bestellmails endgueltig umbauen
- Learning komplett automatisieren
- Legacy-Code schon entfernen

## Sinnvolle Deliverables

- DB-Migration(en) fuer `project_material_needs`
- kleines Architektur-/Readme-Dokument zum Zielmodell
- vorbereiteter Query-/View-/RPC-Pfad
- Liste der Legacy-Abhaengigkeiten

## Risiken

### Risiko 1

Zu viel Logik direkt in ein einziges Tabellenschema pressen.

Gegenmassnahme:
- Hauptmodell und Suggestion-Layer sauber trennen

### Risiko 2

Statusmodell wird unsauber und nicht UI-tauglich.

Gegenmassnahme:
- Status fachlich definieren, nicht aus Alt-UI ableiten

### Risiko 3

Bestehende M4-Flows brechen durch Schema-Aenderung.

Gegenmassnahme:
- Flow-Abgleich ist expliziter Teil des Pakets

## Folgepakete

Nach diesem Paket folgen logisch:

1. `Material Suggestion Layer Extraction`
2. `MagicPlan to Need Pipeline Hardening`
3. `Bauleiter Material Center`
4. `Need Assignment and Ordering`

## Kurzfazit

Dieses Paket ist das Fundament.

Es sorgt dafuer, dass wir auf einem einzigen, fachlich richtigen Materialmodell weiterbauen koennen, statt weiter an zwei konkurrierenden Systemen herumzudoktern.
