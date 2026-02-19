# BAUGENIUS ARBEITSWEISE

> Stand: 2026-01-11
> Verbindlich für alle Sessions.

---

## 🏗️ BUILD METHODOLOGY: UI-First Hybrid

### Prinzip

```
Dennis sieht BG fertig im Kopf.
Wir bauen von außen nach innen.
```

### Ablauf pro Feature

```
┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│  SKIZZE  │ ──▶ │  DB-ANFORDERUNG  │ ──▶ │   PARALLEL   │
│  (Dennis)│     │     (Claude)     │     │    BUILD     │
└──────────┘     └──────────────────┘     └──────┬───────┘
                                                  │
                                           ┌──────┴───────┐
                                           │              │
                                           ▼              ▼
                                       [ DB ]        [ UI ]
                                           │              │
                                           └──────┬───────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │    FLOW      │
                                           │  (wenn nötig)│
                                           └──────────────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │    TEST      │
                                           └──────────────┘
```

---

## Schritt für Schritt

### 1. SKIZZE (Dennis)

**Input kann sein:**
- Beschreibung ("Ich will einen Kasten der X zeigt")
- Screenshot von woanders ("So ähnlich wie das")
- Papier-Skizze (Foto)
- Figma/Excalidraw
- Oder einfach: "Ich seh das so im Kopf..."

**Wichtig:** Nicht perfekt. Grob reicht. Hauptsache ICH (Claude) verstehe was du SEHEN willst.

---

### 2. DB-ANFORDERUNG (Claude)

Claude analysiert die Skizze und sagt:

```
"Für diesen Screen brauchst du:
- Tabelle X mit Spalten A, B, C
- View Y die Z aggregiert
- Feld W fehlt noch in Tabelle Q"
```

**Hier wird diskutiert.** Bevor Code geschrieben wird.

---

### 3. PARALLEL BUILD

| Track | Wer | Was |
|-------|-----|-----|
| DB | Claude | Migration schreiben, Views, Functions |
| UI | Claude | Komponente bauen, Dummy-Daten zuerst |

Beide Tracks gleichzeitig. UI zeigt erstmal Fake-Daten bis DB steht.

---

### 4. FLOW (wenn nötig)

Nicht jedes Feature braucht einen Flow.

**Flow nötig wenn:**
- Automatisierung (Email rein → Event)
- Scheduled Jobs (Umlage Monatsende)
- Externe Trigger (Webhook)

**Kein Flow nötig wenn:**
- Nur Lesen aus DB
- User-Aktion → direkte DB-Mutation

---

### 5. TEST

- UI mit echten Daten
- Flow End-to-End
- Edge Cases

---

## Warum so und nicht anders?

| Klassisch | UI-First Hybrid |
|-----------|-----------------|
| DB → API → UI | Skizze → DB + UI → Flow |
| Features die keiner sieht | Nur was sichtbar gebraucht wird |
| "Funktioniert" aber UX egal | UX treibt Architektur |
| Datenmodell-Fehler spät | Datenmodell-Fehler früh |
| Lange bis erstes Ergebnis | Sofort sichtbar |

---

## Anti-Patterns

| ❌ Verboten | ✅ Stattdessen |
|-------------|----------------|
| "Bau mal die DB für Finance" | "Ich will diesen Screen sehen" |
| Alles durchplanen vor dem Bauen | Skizze → Bauen → Lernen → Anpassen |
| UI ohne DB-Konzept | Parallel, aber DB-Check vor UI-Code |
| Features ohne sichtbaren Output | Jedes Feature = sichtbare Änderung |

---

## Kommunikation in Sessions

### Dennis sagt:

```
"Ich stell mir das so vor: [Beschreibung/Skizze]"
```

### Claude antwortet:

```
"Verstanden. Dafür brauchen wir:
- DB: ...
- UI: ...
- Flow: ja/nein

Fragen bevor ich baue: ..."
```

### Dann:

```
Dennis: "Ja, bau."
Claude: [baut]
```

---

## Checkliste vor jedem Build

```
□ Skizze/Beschreibung vorhanden?
□ DB-Anforderungen geklärt?
□ Offene Fragen beantwortet?
□ Dann erst: Bauen.
```

---

*Erstellt: 2026-01-11 | Gilt ab sofort.*
