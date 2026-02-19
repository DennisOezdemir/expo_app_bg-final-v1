# BAUGENIUS USP: Das lernende Materialsystem

> **"Das System wird besser, je mehr du es nutzt."**

---

## Das Problem (Markt)

Jeder Handwerker kämpft mit Material:

1. **Manuelle Artikelpflege** — Stundenlang Stücklisten pflegen
2. **Kein Kontext** — System weiß nicht, dass Nassbereich anderen Kleber braucht
3. **Statische Rezepte** — Vorgefertigte Listen, die nie zu DEINEN Projekten passen
4. **Preise veraltet** — Katalogpreise statt Marktpreise
5. **Wissen im Kopf** — Erfahrung stirbt mit dem Mitarbeiter

**Bestehende Lösungen (Craftboxx, openHandwerk, Streit, TopKontor):**
- Stammdatenpflege = deine Arbeit
- Starre Vorlagen
- Null Intelligenz

---

## Die Lösung: Lernendes Materialsystem

### Kernprinzip

```
Du arbeitest → System beobachtet → System lernt → System schlägt vor
```

### Wie es funktioniert

**1. Auto-Learning durch Nutzung**
```
Tag 1:  Position "Decke tapezieren" → du wählst "ERFURT Vlies-Raufaser 52/75"
Tag 5:  Gleiche Position → du wählst wieder ERFURT
Tag 12: Gleiche Position → du wählst wieder ERFURT
Tag 13: System schlägt ERFURT automatisch vor ✓
```

Nach 3x Nutzung = Default. Keine Konfiguration. Keine Stammdatenpflege.

**2. Kontext-Awareness**
```
Position: "Wände streichen"
├── Normaler Raum → Binderfarbe Standard
├── Nassbereich → Feuchtraumfarbe  
├── Keller → Kellerfarbe
└── Treppenhaus → Strapazierfähig
```

System lernt DEINE Entscheidungen pro Kontext.

**3. Preis-Agent**
```
Du: "Gibt's das günstiger?"
Agent: Recherchiert Würth, MEGA, Hornbach, IDS Connect
Agent: "Ja, bei MEGA 12% günstiger. Gleiche Qualität."
```

**4. Wissenstransfer**
```
Azubi startet → System zeigt was der Chef immer nimmt
Neuer Mitarbeiter → Sofort produktiv mit gelernten Defaults
```

---

## Technische Umsetzung (bereits gebaut)

### Datenbank-Trigger
```sql
-- Trigger: trg_learn_product auf project_materials
-- Nach 3x Nutzung → default_product_id wird gesetzt
-- use_count trackt Häufigkeit pro Produkt
```

### Tabellen
- `position_material_requirements` — Was braucht welche Position?
- `material_consumption_rates` — Verbrauch pro m²/Stück
- `products.use_count` — Wie oft verwendet?
- `products.last_used_at` — Wann zuletzt?

### Fehlend (Next Steps)
- [ ] Frontend persistiert Zuweisungen → Trigger feuert
- [ ] Auto-Suggest Query im Frontend
- [ ] IDS Connect API-Anbindung
- [ ] Preis-Agent (n8n Workflow + Claude)

---

## Warum das keiner hat

| Hersteller | Ansatz | Problem |
|------------|--------|---------|<br>| SAP/Oracle | Enterprise | Zu teuer, zu komplex für Handwerk |
| Craftboxx | Modern UI | Statische Stammdaten |
| openHandwerk | Cloud | Keine KI, keine Lernfunktion |
| Streit V.1 | Etabliert | DOS-Mentalität, null Innovation |
| TopKontor | Verbreitet | Klassische ERP-Denke |

**Keiner** baut ein System das:
- Aus Nutzerverhalten lernt
- Kontext versteht
- Aktiv Preise recherchiert
- Wissen transferierbar macht

---

## Business Case

### Zeitersparnis pro Projekt
| Aufgabe | Heute | Mit BG |
|---------|-------|--------|
| Material raussuchen | 45 min | 5 min |
| Preise vergleichen | 30 min | 0 min (Agent) |
| Bestellung zusammenstellen | 20 min | 2 min |
| **Gesamt** | **95 min** | **7 min** |

**88 Minuten pro Projekt gespart.**

Bei 50 Projekten/Jahr = **73 Stunden** = fast 2 Arbeitswochen.

### Kosteneinsparung
- Preis-Agent findet 5-15% günstigere Alternativen
- Bei 50.000€ Materialeinkauf/Jahr = **2.500-7.500€** gespart

### Wissenserhalt
- Mitarbeiter geht → Wissen bleibt im System
- Einarbeitung neuer Mitarbeiter: Tage statt Wochen

---

## Positionierung

**Nicht:** "Noch ein Handwerker-ERP"

**Sondern:** "Das erste Bausystem das mitdenkt"

### Tagline-Optionen
- "Dein System. Dein Wissen. Automatisch."
- "Je mehr du arbeitest, desto schlauer wird es."
- "KI die von DIR lernt — nicht umgekehrt."

---

## Zielgruppe für MVP

1. **Kleine Maler-/Bodenleger-Betriebe** (5-15 MA)
   - Schmerz: Chef hat alles im Kopf
   - Bedarf: Wissenstransfer, Zeitersparnis

2. **Subunternehmer** (wie Deine Baulöwen)
   - Schmerz: Wechselnde GU-Anforderungen
   - Bedarf: Schnelle Kalkulation, Material-Überblick

---

## Validierung

### Fragen für potenzielle Kunden
1. "Wie lange brauchst du für eine Materialbestellung?"
2. "Wer weiß bei euch welches Material für was?"
3. "Was passiert wenn der weggeht?"
4. "Vergleichst du Preise vor jeder Bestellung?"

### Erfolgskriterien MVP
- [ ] 3 Pilotbetriebe nutzen es aktiv
- [ ] System hat >100 gelernte Defaults
- [ ] Zeitersparnis messbar (vorher/nachher)
- [ ] Ein Betrieb sagt "Ohne geht nicht mehr"

---

## Zusammenfassung

**Der USP von BAUGENIUS:**

> Ein Materialsystem das aus deinem Verhalten lernt, Kontext versteht, 
> und aktiv nach besseren Preisen sucht. 
> 
> Keine Stammdatenpflege. Kein Konfigurationsaufwand.
> Es wird einfach besser, je mehr du es nutzt.

**Das gibt es nirgends.**

---

*Dokumentiert: 24.01.2026*
*Version: 1.0*
