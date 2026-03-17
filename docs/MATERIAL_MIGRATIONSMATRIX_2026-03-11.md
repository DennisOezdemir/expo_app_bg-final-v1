# Material Migrationsmatrix

Stand: 11.03.2026

## Ziel

Festlegen, welche Inhalte und Funktionen aus `project_materials`:

- in `project_material_needs` uebernommen werden
- in einen separaten Suggestion-/Learning-Layer gehoeren
- oder bewusst nicht weitergefuehrt werden

## Zielarchitektur

### Fuehrendes Hauptmodell

- `project_material_needs`

### Ergaenzender Layer

- Produkt-/Lieferanten-/Learning-/Suggestion-Layer

Dieser Layer kann technisch spaeter sein:
- Felder direkt auf `project_material_needs`
- oder eigene Tabellen / Views / RPCs

Die Fachentscheidung hier ist wichtiger als die erste technische Form.

## Matrix

| Thema | Heute in `project_materials` | Ziel | Entscheidung |
|------|-------------------------------|------|-------------|
| Projektbezug | `project_id` | `project_material_needs.project_id` | Bleibt im Hauptmodell |
| Materialbezeichnung | `material_type` | `material_type` / `label` in `project_material_needs` | Bleibt im Hauptmodell |
| Gewerk | `trade` | `trade` in `project_material_needs` | Bleibt im Hauptmodell |
| Menge | `quantity` | `total_quantity` in `project_material_needs` | Bleibt im Hauptmodell |
| Einheit | `quantity_unit` | `quantity_unit` in `project_material_needs` | Bleibt im Hauptmodell |
| Produktzuordnung | `product_id` | `product_id` oder `selected_product_id` | Uebernehmen |
| Preisbezug | `line_total_net_eur`, `override_price_net_eur` | Preis-/Override-Felder im Zielmodell oder Preis-Layer | Uebernehmen |
| Lieferantenbezug | indirekt ueber `products -> suppliers` | weiter ueber Produkt/Lieferant | Uebernehmen |
| Status | `offen/fertig/bestellt` indirekt aus Feldern | sauberer Bedarfs-/Freigabe-/Bestellstatus | Neu schneiden |
| Lernsignal | `trg_learn_product` | Learning-Layer | Uebernehmen, aber entkoppeln |
| Auto-Apply | `trg_material_auto_apply` | Suggestion-Layer | Uebernehmen, aber entkoppeln |
| Kategorie | `material/werkzeug/hilfsmittel` | getrennt bewerten | Teilweise uebernehmen |
| Flache Listeninteraktion | Materialliste + `Zuordnen` | Bauleiter-Entscheidungsoberflaeche | Nicht uebernehmen |
| Aggregationslogik | uneinheitlich / UI-nah | Bedarf je Gewerk/Bauabschnitt | Neu schneiden |

## Konkrete Entscheidungen je Bereich

### 1. Muss direkt ins Hauptmodell

Diese Dinge gehoeren in `project_material_needs` oder muessen dort fachlich sichtbar sein:

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
- Preis-/Bestellrelevanz

Begruendung:
- das sind Kernbestandteile des Bauleiter-Bedarfsprozesses

### 2. Gehoert in einen Learning-/Suggestion-Layer

Diese Dinge sind wichtig, aber nicht Teil der fachlichen Hauptidentitaet eines Bedarfs:

- wie oft ein Produkt fuer einen bestimmten Materialtyp gewaehlt wurde
- welches Produkt nach 3x Nutzung zum Default wird
- Autocomplete-/Ranking-Signale
- Auto-Apply-Vorschlaege
- bevorzugter Lieferant

Begruendung:
- das ist Entscheidungsunterstuetzung, nicht der Bedarf selbst

### 3. Muss neu geschnitten werden

Diese Dinge sollten nicht 1:1 uebernommen werden:

- heutige Materialscreen-Statuslogik
- flache Zeilenstruktur
- direkte Hauptaktion `Zuordnen`

Stattdessen:
- Problemstatus
- Entscheidungsstatus
- Bestellstatus
- Terminprioritaet

## Empfohlene Zielstruktur

### Hauptmodell: `project_material_needs`

Soll repraesentieren:
- Was wird gebraucht?
- Wieviel wird gebraucht?
- Fuer welches Gewerk / welchen Raum?
- Bis wann wird es gebraucht?
- Ist es geprueft / freigegeben / bestellt?

### Learning-/Suggestion-Layer

Soll repraesentieren:
- Was wurde frueher bei aehnlichem Bedarf gewaehlt?
- Welches Produkt passt wahrscheinlich?
- Welcher Lieferant ist wahrscheinlich passend?
- Welche Preise/Verpackungen sind bekannt?

Moegliche technische Inhalte:
- Produktpraeferenz je Materialtyp
- Produktpraeferenz je Gewerk
- Produktpraeferenz je Kontext
- Zuordnungshistorie

## Kategorie-Frage: Material / Werkzeug / Hilfsmittel

Hier ist Vorsicht noetig.

Empfehlung:

- `project_material_needs` primaer fuer echten Materialbedarf
- Werkzeug/Hilfsmittel nicht ungeprueft in dasselbe Hauptmodell pressen

Sinnvolle Richtung:
- Materialbedarf = Hauptprozess
- Werkzeug/Hilfsmittel = Packlisten-/Baustellenlogik

Wenn gemeinsame Kategorie erhalten bleibt, dann nur mit klarer UI- und Prozess-Trennung.

## Was wir bewusst nicht migrieren sollten

- die heutige flache Materiallisten-UX
- Einzelzeile als primaere Entscheidungseinheit
- Statusableitung nur aus `product_id`

Das fuehrt direkt wieder in die falsche Richtung.

## Konkrete Umsetzungsempfehlung

### Schritt 1

`project_material_needs` um fehlende Produkt-/Preis-/Override-Felder erweitern, falls noetig.

### Schritt 2

Learning-Funktionen identifizieren und in einen neutralen Layer verschieben:
- Produktpraeferenz
- Auto-Apply
- Ranking

### Schritt 3

Neues Material-Frontend ausschliesslich auf `project_material_needs` bauen.

### Schritt 4

Bestehende `project_materials`-Nutzung nur noch fuer Migration und Rueckbau verwenden.

## Ralph-taugliche Umsetzungspakete aus der Matrix

### Paket A

`Need Model Completion`

Ziel:
- fehlende Felder im Zielmodell ergaenzen

### Paket B

`Material Suggestion Layer Extraction`

Ziel:
- Lern-/Suggestion-Logik aus `project_materials` loesen

### Paket C

`Needs-based Material UI`

Ziel:
- neues Frontend auf Basis von `project_material_needs`

### Paket D

`Legacy project_materials Decommission`

Ziel:
- Altpfade kontrolliert abschalten

## Migrationsreihenfolge

### Sprint A: Architektur und Daten

- Zielschema fuer `project_material_needs` festziehen
- Mapping Alt -> Neu definieren
- `project_materials` als Legacy markieren
- Read-Views/RPCs fuer neues Frontend bereitstellen

### Sprint B: Bauleiter-Materialcenter

- Neuer Read-Pfad fuer Material-Center
- Gewerk-/Termin-/Problemansicht
- Detailscreen fuer Bedarfe

### Sprint C: Produkt- und Lieferantenentscheidungen

- Assignment auf Bedarfsebene statt Einzelmaterialzeile
- Lern-/Suggestion-Layer anschliessen
- Echte Statusfluesse

### Sprint D: Bestellung und Abschaltung Altpfad

- Mock-Bestellung ersetzen durch echte Lieferantengruppierung
- Versand/Freigabe an echten Flow koppeln
- Altes `project_materials`-Frontend entfernen

## Risiken

- **Verdeckte Abhaengigkeiten an `project_materials`:** Vor jeder Abschaltung Repo- und Flow-Audit
- **Verlust von Lernlogik:** Lernmechanik explizit extrahieren, in Zielmodell oder Suggestion-Layer ueberfuehren
- **MagicPlan-Mapping bleibt unscharf:** Fehlerfaelle im UI sichtbar machen, gezielte Korrekturoberflaeche

## Endfazit

Die Migration sollte nicht bedeuten:

- `project_materials` nach `project_material_needs` kopieren

Sondern:

- Bedarf ins Hauptmodell
- Produktwissen in den Suggestion-Layer
- Listen-UX verwerfen

So bleibt das Wertvolle erhalten, ohne die falsche Struktur mitzuschleppen.
