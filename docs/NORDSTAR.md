# NORDSTAR.md — Vision & UX-Leitstern

> **Lade diese Datei wenn:** Feature-Entscheidungen, UX-Fragen, Priorisierung

---

## DAS EINE BILD (Der Flash)

```
Mail rein → 30 Sekunden → Alles ready → [Freigeben]
```

**Von Sklave zu Chef. Das ist Baugenius.**

---

## WAS WIR VERKAUFEN

Nicht Software. Nicht Features.

> **Würde und Feierabend.**

Der Handwerker der abends seinen Kindern Gute Nacht sagt statt Rechnungen zu sortieren.

---

## DIE DREI ANSICHTEN (Mehr gibt es nicht)

### 1. FLASH (Hero Moment)
Mail → 30 Sek → Alles fertig → Nur noch freigeben
*"Das macht das AUTOMATISCH?!"*

### 2. MARGE (No-Brainer)  
Ein Blick → Grün/Rot → Wo verdien ich, wo verlier ich
*"Endlich weiß ich was Sache ist."*

### 3. PROJEKT-CHECK (5-Sek-Scan)
```
Musterstraße 12
━━━━━━━━━━━━━━━━━━━━━━
🟢 Angebot: Freigegeben (4.200€)
🟢 Material: Bestellt, kommt Di
🟡 Baustelle: Läuft — Tag 3/5
🔴 Nachtrag: Offen seit 2 Tagen → [Klären]
━━━━━━━━━━━━━━━━━━━━━━
Marge: 21% (Plan: 20%) ✔
```

---

## 7 UX-GEBOTE

1. **Eine Sache pro Moment** — Jeder Screen = eine Frage
2. **Kontext kommt mit** — WAS + WOZU + BEDEUTUNG
3. **Proaktiv** — BG wartet nicht, BG sagt Bescheid
4. **Ein Klick = Eine Entscheidung** — Max 2 Klicks bis Action
5. **Zahlen die sprechen** — Vergleich, Trend, Bewertung
6. **Ampel überall** — Grün/Gelb/Rot
7. **Stille ist Gold** — Still = läuft. Piep = handeln.

---

## FEATURE-CREEP FILTER

Bei jedem neuen Feature:

> **„Macht es den 30-Sekunden-Flash besser?"**

- Ja → Einbauen
- Nein → Später oder nie

---

## PRIORITÄT

```
1. FLASH MUSS SITZEN (M1 Intake stabil)
   ↓
2. DANN MARGE (Ein Blick, Ampel, fertig)
   ↓
3. DANN REST (Nachträge, Zeiten, DATEV...)
```

**Wenn der Flash nicht täglich zuverlässig knallt, ist alles andere egal.**

---

## DAS ARCHITEKTUR-PRINZIP: STAFFELLAUF

**Das ist das Fundament. ALLES in BauGenius funktioniert so.**

```
Ein Agent = Eine Aufgabe = Weitergeben
```

Kein Agent der alles kann. Kein Monolith der würfelt. Spezialisten die den Staffelstab weitergeben. Wie auf der Baustelle: Der Elektriker macht keine Fliesen.

### Die Regeln

1. **Ein Agent, eine Aufgabe** — Der LV-Leser liest. Der Zeitprüfer prüft Zeiten. Der Materialagent rechnet Material. Keiner macht zwei Dinge.
2. **Stab weitergeben** — Output von Agent 1 ist Input von Agent 2. Saubere Schnittstelle, kein Durcheinander.
3. **Jeder darf Nein sagen** — Agent 2 kriegt "8 Stunden für 6qm Decke" und sagt: "Nein, 1h15min." Der Stab geht erst weiter wenn es stimmt.
4. **Ein Godmode-Agent lernt mit** — Vergleicht SOLL (geplant) vs IST (tatsächlich gebraucht). Passt Zeitfaktoren an. Wird jeden Tag schlauer.
5. **Menschliche Logik schlägt Formel** — Thermostatkopf tauschen = 3 Minuten, nicht 16. Die Formel ist die Untergrenze, die Realität ist der Anker.

### Beispiel: Autoplanung

```
PDF/Aufmaß
    ↓
[LV-Leser]         "6qm Decke: Raufaser + Streichen"
    ↓
[Zeitprüfer]        "Nicht 8h sondern 1h15min"
    ↓
[Plausibilität]     "Reihenfolge OK? Erst Elektro, dann Maler"
    ↓
[Material-Agent]    "720g Kleber, 1.2kg Dispersion, 1m Acryl"
    ↓
[Einsatzplaner]     "Jürgen, Mo 09:00–10:15, Material bestellt"
    ↓
→ Freigabecenter: [PLANUNG BESTÄTIGEN]
```

### Gilt ÜBERALL — nicht nur Planung

- **Intake**: Mail-Leser → Projekt-Anleger → Freigabe-Ersteller → ...
- **Angebot**: Aufmaß-Leser → Positions-Matcher → Kalkulator → PDF-Generator
- **Abrechnung**: Ist-Stunden-Sammler → Soll/Ist-Vergleicher → Nachtrags-Erkenner → Rechnungs-Ersteller
- **Qualität**: Foto-Leser → Mängel-Erkenner → Protokoll-Schreiber

### Die Kalkulations-Logik

```
Positionspreis − Materialkosten = Lohnanteil
Lohnanteil ÷ Ziel-Stundensatz (70€/h) = Maximale erlaubte Zeit
Richtzeitwert (echte Erfahrung) = Tatsächliche Dauer
Tatsächliche Dauer × Stundensatz = Echter Stundensatz pro Position
```

Wenn der echte Stundensatz über 70€ liegt → Position ist profitabel.
Wenn darunter → Warnung, Position frisst Marge.

**Die schnellen Positionen finanzieren die langsamen. Das muss die Planung verstehen.**

---

## DER GOLDENE SATZ

> **Jeder Schritt braucht: Status, Owner, Rollback-Option.**

Sonst ist es nur Automation die heimlich den Betrieb anzündet.

---

## DER ZWEITE GOLDENE SATZ

> **Ein Agent, eine Aufgabe. Stab weitergeben. Godmode lernt mit.**

Sonst ist es nur Würfeln mit Soße.
