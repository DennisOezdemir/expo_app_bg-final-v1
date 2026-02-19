# AUTOMATION MANIFEST
## BAUGENIUS Design Principles

---

## DAS PRINZIP

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   USER = ENTSCHEIDER                                   │
│   SYSTEM = ARBEITER                                    │
│                                                         │
│   Der User soll nicht Sklave seines Systems werden,    │
│   sondern das System soll für ihn arbeiten.            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## DIE GOLDENE REGEL

> **Kein Feature das regelmäßige manuelle Eingabe braucht.**

Eingabe nur bei:
1. **Einmalig** — Projekt anlegen, Stammdaten pflegen
2. **Entscheidung** — Freigabe ja/nein, Auswahl treffen
3. **Ausnahme** — Korrektur, Sonderfall

---

## AUTOMATION LEVELS

| Level | Beschreibung | User-Aktion |
|-------|--------------|-------------|
| **100%** | System erledigt alles | Nichts |
| **95%** | System macht, User bestätigt | 1 Tap |
| **90%** | System schlägt vor, User wählt | Auswahl |
| **85%** | System pre-filled, User prüft | Review |
| **<80%** | ❌ Nicht akzeptabel | Zu viel Arbeit |

---

## FEATURE CHECKLIST

Vor jedem Feature diese Fragen:

```
□ Kann das System die Daten selbst sammeln?
  → Email-Anhänge, GPS, Rechnungen, Bank

□ Kann das System die Aktion selbst auslösen?
  → Trigger: Zeit, Event, Schwellwert

□ Kann das System die Entscheidung vorbereiten?
  → Pre-fill, Empfehlung, Default

□ Muss der User nur noch bestätigen?
  → [✓ Ja] Button statt Formular
```

---

## ANTI-PATTERNS

| ❌ Schlecht | ✅ Gut |
|-------------|--------|
| User muss Foto taggen | AI taggt, User bestätigt |
| User trägt Zeit ein | GPS/QR erfasst automatisch |
| User schreibt Mahnung | System eskaliert automatisch |
| User sucht Dokumente | System sortiert nach Projekt |
| User fragt "Wie ist Stand?" | System zeigt proaktiv |
| User erstellt Rechnung | System triggert bei Milestone |

---

## DIE AUTOMATION-PYRAMIDE

```
                    ▲
                   /│\
                  / │ \
                 /  │  \     ENTSCHEIDEN
                /   │   \    User genehmigt
               /────┼────\
              /     │     \
             /      │      \   VORSCHLAGEN
            /       │       \  System empfiehlt
           /────────┼────────\
          /         │         \
         /          │          \  ANALYSIEREN
        /           │           \ System berechnet
       /────────────┼────────────\
      /             │             \
     /              │              \  SAMMELN
    /               │               \ System erfasst
   ──────────────────────────────────
```

---

## KONKRETE BEISPIELE

### Foto-Dokumentation

**❌ Manuell:**
1. User macht Foto
2. User wählt Projekt
3. User wählt Raum
4. User wählt Gewerk
5. User tippt Beschreibung
6. User speichert

**✅ Automatisiert:**
1. User macht Foto
2. System erkennt: GPS → Projekt, AI → Raum/Gewerk
3. User sieht: "Bad EG, Fliesen — Stimmt das? [✓]"
4. User tippt einmal

### Zeiterfassung

**❌ Manuell:**
1. User öffnet App morgens
2. User wählt Projekt
3. User drückt Start
4. User drückt Stop abends
5. User korrigiert Pausen

**✅ Automatisiert:**
1. User fährt zur Baustelle
2. Handy erkennt Geofence → Auto Check-in
3. Notification: "📍 Auf P-2024-001 eingecheckt"
4. User fährt weg → Auto Check-out
5. Fertig

### Rechnungsstellung

**❌ Manuell:**
1. User merkt "Projekt 50% fertig"
2. User öffnet Rechnungsformular
3. User wählt Kunde, Projekt
4. User berechnet Betrag
5. User erstellt Positionen
6. User sendet

**✅ Automatisiert:**
1. System erkennt: ZB-Protokoll = 50%
2. Alert: "Abschlagsrechnung fällig"
3. Draft auto-generiert (Kunde, Betrag, Positionen)
4. User prüft Vorschau
5. User drückt [Senden]

---

## IMPLEMENTATION RULES

### n8n Flows

```
TRIGGER → PROCESS → NOTIFY → [USER DECISION] → ACT

Beispiel Mahnung:
Cron (täglich)
  → Check fällige Rechnungen
    → Tag 7? Auto-send Erinnerung 2
    → Tag 14? Notification an User
      → User: [Mahnung senden] [Ignorieren]
        → Mahnung senden
```

### Frontend

```
SYSTEM ZEIGT → USER REAGIERT

Beispiel Alert:
┌─────────────────────────────────────────┐
│ ⚠️ Elektro überschreitet Budget um €300 │
│                                         │
│ Empfehlung: Nachtrag dokumentieren      │
│                                         │
│ [Nachtrag erstellen] [Später] [Ignorieren]│
└─────────────────────────────────────────┘
```

### Datenfluss

```
EMAIL ──────┐
GPS ────────┤
BANK ───────┼──→ SYSTEM ──→ ANALYSE ──→ ALERT ──→ USER
ZEIT ───────┤               ↓
FOTOS ──────┘            AKTION
                       (wenn auto-ok)
```

---

## KPIs FÜR AUTOMATION

| Metrik | Ziel |
|--------|------|
| Durchschnittliche Taps pro Aktion | < 2 |
| Manuelle Dateneingabe pro Tag | < 5 Min |
| Auto-erfasste vs manuelle Daten | > 90% auto |
| Alerts die Aktion triggern | > 70% |
| False Positives bei AI | < 10% |

---

## REVIEW FRAGE

Bei jedem neuen Feature:

> **"Muss der User das wirklich selbst tun,
> oder kann das System es für ihn erledigen?"**

Wenn System kann → System macht.
Wenn User muss → Minimiere auf 1 Tap.

---

*Das System arbeitet. Der User entscheidet.*
