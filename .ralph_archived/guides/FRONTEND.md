# Frontend Design Guide — BauGenius

> **Vor jedem UI-Feature:** Lies `docs/PERSONA_AYSE.md` und `docs/NORDSTAR.md`

## Zielnutzerin: Ayse

- 46 Jahre, Projektmanagerin, Samsung-Handy
- Arbeitet auf der Baustelle (Sonne, Regen, Handschuhe)
- Tech: WhatsApp Profi, Excel vermeidet sie, neue Apps = Stress
- Unterbrechungen alle 5 Minuten, Telefon klingelt ständig

### Der Ayse-Test

**Wenn sie nach 3 Sekunden nicht weiß wo sie tippen soll, ist das Design falsch.**

### Ayse-Checkliste (jedes Feature)

- [ ] Funktioniert es mit einem Daumen auf dem Handy?
- [ ] Sind alle Buttons mindestens 44px hoch?
- [ ] Sind die Farben eindeutig (grün = gut, gelb = Achtung, rot = Problem)?
- [ ] Sind alle Labels auf Deutsch?
- [ ] Ist die wichtigste Aktion sofort sichtbar ohne Scrollen?
- [ ] Kann Ayse es bei Sonnenlicht draußen lesen?
- [ ] Braucht es maximal 1 Tippen bis zur Hauptaktion?

---

## Nordstar: Die 7 UX-Gebote

1. **Eine Sache pro Moment** — Jeder Screen = eine Frage
2. **Kontext kommt mit** — WAS + WOZU + BEDEUTUNG
3. **Proaktiv** — BG wartet nicht, BG sagt Bescheid
4. **Ein Klick = Eine Entscheidung** — Max 2 Klicks bis Action
5. **Zahlen die sprechen** — Vergleich, Trend, Bewertung
6. **Ampel überall** — Grün/Gelb/Rot
7. **Stille ist Gold** — Still = läuft. Piep = handeln.

### Feature-Creep Filter

> **"Macht es den 30-Sekunden-Flash besser?"**
> Ja → Einbauen. Nein → Später oder nie.

---

## Tech Stack (Frontend)

- **React Native 0.81** + Expo 54 + Expo Router 6
- **TypeScript 5.9** strict
- **Styling**: Inline Styles (React Native StyleSheet), KEIN Tailwind
- **State**: useState/useEffect + @tanstack/react-query
- **Realtime**: `supabase.channel().on('postgres_changes', ...).subscribe()`
- **Navigation**: 5-Tab (Inbox, Projekte, (+), Geld, Mehr), 13 Routen

### Projekt-Struktur

```
app/                    # Expo Router Seiten (13 Routen)
components/
  shared/               # PageShell, DataList, etc.
  ui/                   # Basis-Components
hooks/                  # useProjects, useInbox, useOffers, useProjectDetail
lib/
  formatters.ts         # Zentralisierte Formatter
  status.ts             # Status-Configs mit Ampelfarben
  utils.ts              # Utilities
```

---

## Design-Regeln

### Farben

```
Ampel:
  grün  = Colors.raw.emerald500  (gut, fertig, OK)
  gelb  = Colors.raw.amber500    (Achtung, in Arbeit)
  rot   = Colors.raw.rose500     (Problem, überfällig)

Neutral: Colors.raw.zinc*

VERBOTEN: blue500 (nicht verwenden!)
```

### Touch-Targets

- Minimum 44x44px für alle interaktiven Elemente
- Großzügige Padding um Buttons
- Wurstfinger-kompatibel = lieber zu groß als zu klein

### Sprache

- UI komplett Deutsch
- Keine englischen Fachbegriffe ("Übersicht" statt "Dashboard")
- Kurze, klare Texte
- Zahlen mit € und deutschem Format (1.234,56 €)

### Die 3 Ansichten (Nordstar)

1. **FLASH** — Mail → 30 Sek → Alles fertig → [Freigeben]
2. **MARGE** — Ein Blick → Grün/Rot → Wo verdien ich, wo verlier ich
3. **PROJEKT-CHECK** — 5-Sekunden-Scan mit Ampel-Status

---

## Component Patterns

### Status-Anzeige (Ampel)

```tsx
// Immer mit Farbe + Text, nie nur Farbe
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <View style={{
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: status === 'ok' ? Colors.raw.emerald500
      : status === 'warning' ? Colors.raw.amber500
      : Colors.raw.rose500
  }} />
  <Text>{statusLabel}</Text>
</View>
```

### Leere Zustände

Nie leer lassen. Immer:
1. Erklären was hier sein wird
2. Weg nach vorne anbieten

### Loading States

- < 300ms: Kein Indikator
- 300ms - 2s: Spinner
- > 2s: Skeleton

### Fehlerzustände

- Klare deutsche Fehlermeldung
- Was schiefging (einfach)
- Retry-Option anbieten

---

## Anti-Patterns (NICHT machen)

| Verboten | Stattdessen |
|----------|-------------|
| Englische Labels | Deutsche Begriffe |
| Kleine Schrift | Min 14px, besser 16px |
| Versteckte Menüs | Wichtigstes sofort sichtbar |
| Scrollen für Hauptaktion | Above-the-fold |
| Komplexe Formulare | Pre-fill, 1-Tap-Bestätigung |
| Nur Farbe als Indikator | Farbe + Text/Icon |
| `blue500` als Farbe | `emerald/amber/rose/zinc` |

---

## Automation Manifest (Frontend-relevant)

> **"Muss der User das wirklich selbst tun, oder kann das System es für ihn erledigen?"**

- System zeigt → User reagiert (nicht umgekehrt)
- Pre-fill statt Formular
- [✓ Ja] Button statt Eingabefelder
- Durchschnittliche Taps pro Aktion: < 2
- Manuelle Dateneingabe pro Tag: < 5 Min

---

## Quality Checklist (vor Commit)

### Ayse-Test
- [ ] 3-Sekunden-Regel bestanden
- [ ] Wurstfinger-kompatibel (44px Targets)
- [ ] Deutsche Labels überall
- [ ] Ampelfarben korrekt

### States
- [ ] Loading State
- [ ] Empty State (hilfreich, nicht leer)
- [ ] Error State (deutsch, mit Retry)
- [ ] Daten-State (auch mit vielen Einträgen testen)

### Mobile
- [ ] Getestet auf schmalem Screen
- [ ] Kein horizontales Scrollen
- [ ] Hauptaktion ohne Scrollen erreichbar
- [ ] Bei Sonnenlicht lesbar (Kontrast)
