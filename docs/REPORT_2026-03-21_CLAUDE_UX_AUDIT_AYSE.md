# BauGenius UX-Audit: Die Ayse-Pruefung

**Datum:** 2026-03-21
**Auditor:** Claude Opus 4.6 als Ayse
**Methode:** Jeden Screen gelesen, gegen PERSONA_AYSE.md + NORDSTAR.md 7 UX-Gebote geprueft
**Perspektive:** Samsung in der Hand, Sonne blendet, Telefon klingelt, 3 Sekunden.

---

## DER AYSE-SATZ VORWEG

> "Zeig mir einfach was ich machen muss."

---

## SCREEN-BEWERTUNGEN

| # | Screen | Ayse-Score | Groesstes Problem | Fix-Vorschlag |
|---|--------|-----------|-------------------|---------------|
| 1 | **Start (GF)** | 9/10 | "Projekte kritisch" Banner nicht klickbar zu den kritischen Projekten | Banner soll direkt zu gefilterten Projekten navigieren |
| 2 | **Start (BL)** | 8/10 | Schnellfoto-Button doppelt (oben + Tile) | Einen entfernen, Platz fuer "Heute anstehend" nutzen |
| 3 | **Start (Monteur)** | 7/10 | Hardcoded "Schwentnerring 13c" — KEIN echtes Projekt | An `get_monteur_auftrag()` anbinden, DRINGEND |
| 4 | **Projekte** | 8/10 | Create-Modal hat 15+ Felder — Ayse wuerde aufgeben | Minimal-Erstellung (Name + Adresse), Rest spaeter |
| 5 | **Freigaben** | 10/10 | Nahezu perfekt: Swipe-Karten, FREIGEBEN gross, Ampelfarben | Vorbild-Screen. So muessen alle aussehen. |
| 6 | **Material** | 7/10 | Projekt-Picker versteckt, Ring-Diagramm braucht Interpretation | Projekt automatisch waehlen (naechster Termin), Probleme zuerst zeigen |
| 7 | **Mein Job** | 3/10 | KOMPLETT FAKE. Hardcoded Tasks, Datum "Montag 10. Feb" | AN DB ANBINDEN. `get_monteur_auftrag()` existiert bereits! |
| 8 | **Foto (Tab)** | 6/10 | "Letzte Fotos" sind hardcoded Mock-Daten (RECENT_PHOTOS) | Echte Fotos aus project_files laden |
| 9 | **Zeiten** | 5/10 | Komplett Mock — Timer zaehlt im RAM, Wochentabelle hardcoded | An time_entries Tabelle anbinden |
| 10 | **Profil** | 7/10 | Team-Sektion ist HARDCODED (Mehmet, Ali, Ayse) — team_members hat 15 Eintraege | Aus DB laden |
| 11 | **Projekt-Detail** | 8/10 | Sehr gut: Echte Daten, Angebote, Begehungen, Pipeline-Fortschritt | Naechste Aktion prominenter zeigen (was muss Ayse JETZT tun?) |
| 12 | **Angebot-Editor** | 2/10 | HARDCODED DUMMY-Positionen! Jumbo-Templates sind statisch im Code | An catalog_positions_v2 anbinden (1.833 Positionen in DB!) |
| 13 | **Freigabe-Detail** | 8/10 | Gute Detailansicht mit Pipeline-Steps | Kein "Zurueck"-Button sichtbar fuer Ayse |
| 14 | **Begehung** | 7/10 | Guter Flow, aber viele Schritte bis fertig | Fortschrittsbalken fehlt (Schritt 2 von 5) |
| 15 | **Chat** | 6/10 | Neues Feature, 0 Messages — Ayse weiss nicht was sie damit soll | Willkommensnachricht vom Bot, "Frag mich was" |
| 16 | **Planung** | 7/10 | Echte Daten, aber Monteur-Zuordnung nicht intuitiv | Drag & Drop fuer Monteur-Zuweisung |
| 17 | **Finanzen** | 7/10 | Gute Uebersicht, Ampelfarben | "Was muss ich tun?" fehlt — nur Zahlen, keine Aktion |
| 18 | **Rechnung-Detail** | 7/10 | Funktional, aber deutsch/englisch gemischt in Status-Labels | Status-Labels eindeutschen |
| 19 | **Rechnung-Neu** | 6/10 | Viele Felder, nicht klar was Pflicht ist | Pflichtfelder markieren, Vorausfuellen wo moeglich |
| 20 | **Login** | 8/10 | Sauber, einfach, Logo sichtbar | Gut |
| 21 | **Einstellungen/**** | 6/10 | 7 Unterseiten — viel fuer Ayse | Nur GF sieht sie, OK. Aber Reihenfolge optimieren |

---

## DETAILANALYSE DER KRITISCHEN SCREENS

### Freigaben (10/10) — DAS VORBILD

Ayse oeffnet den Screen und sieht:
- **"3 offen"** — sofort klar
- Karte mit grosser Schrift: "AUFTRAG FREIGEBEN"
- Projekt-Nummer, Adresse, Betrag — alles da
- **[FREIGEBEN]** — riesiger gruener Button (paddingVertical: 16!)
- **[Nein]** — links, kleiner, rot
- Swipe rechts = Freigeben, Swipe links = Ablehnen
- Haptic Feedback bei jeder Aktion
- Ampelfarben: Gruen/Gelb/Rot je nach Alter

**Ayse sagt:** "DAS versteh ich. Wisch nach rechts, fertig."

**Das ist der 30-Sekunden-Flash aus dem NORDSTAR.**

---

### Mein Job (3/10) — DAS SORGENKIND

Ayse (als Monteur) oeffnet den Screen und sieht:
- "Heute" / "Montag 10. Feb" — **FALSCHES DATUM** (hardcoded!)
- "Schwentnerring 13c" — **IMMER GLEICH** (hardcoded!)
- 4 Aufgaben: "Waende spachteln", "Decke grundieren", etc. — **FAKE**
- Material "Vliesraufaser fehlt!" — **FAKE**
- "07:15 eingestempelt" / "4:32h gearbeitet" — **FAKE**

**Ayse sagt:** "Das stimmt ja gar nicht! Ich bin heute am Holstenkamp, nicht am Schwentnerring!"

**Fix:** Die RPC `get_monteur_auftrag()` und `get_monteur_auftrag_data()` existieren BEREITS in der DB. Der Screen muss nur angebunden werden:
1. `get_monteur_auftrag(user_id)` → Heutiges Projekt + Aufgaben
2. `time_entries` → Echte Zeiten
3. `project_material_needs` WHERE project = aktuelles → Material-Status

---

### Angebot-Editor (2/10) — DAS PHANTOM

Ayse will ein Angebot bearbeiten und sieht:
- Jumbo-Templates: "Badsanierung komplett" — **HARDCODED IM CODE** (Zeile 65-80)
- Positionen: Dummy-Daten mit festen Preisen
- **1.833 echte Katalog-Positionen** in der DB (catalog_positions_v2) — UNGENUTZT

**Ayse sagt:** "Warum stehen da immer die gleichen Sachen? Wo ist mein WABS-Katalog?"

**Fix:**
1. Katalog-Suche aus DB (catalog_positions_v2)
2. `lookup-catalog` Edge Function existiert bereits
3. Jumbo-Templates aus `jumbo_templates` Tabelle laden (1 Template in DB)

---

### Zeiten (5/10) — SCHOENE LEICHE

Das Design ist hervorragend:
- Timer mit grosser Schrift (44px!)
- "LAEUFT" Badge mit pulsierendem Punkt
- Pause/Feierabend-Buttons gross genug
- Wochenansicht uebersichtlich

**ABER:** Alles ist hardcoded im RAM. Timer startet bei 4:32:15, Woche ist statisch, nichts wird gespeichert.

**Ayse sagt:** "Ich hab gestern 8 Stunden gearbeitet und das steht immer noch da?!"

---

### Foto-Tab (6/10) — GUTES DESIGN, FAKE DATEN

Design-technisch vorbildlich:
- Riesiger Kamera-Button (72x72 Icon!)
- Quick-Actions: Mangel / Fortschritt / Material
- Letzte Fotos als Liste

**ABER:** `RECENT_PHOTOS` ist hardcoded (Zeile 23-28). Keine echten Fotos.

---

## DIE 7 UX-GEBOTE — GESAMTBEWERTUNG

| # | Gebot | Bewertung | Beispiel |
|---|-------|-----------|----------|
| 1 | **Eine Sache pro Moment** | 7/10 | Freigaben: perfekt. Projekte-Create: zu viel (15+ Felder) |
| 2 | **Kontext kommt mit** | 8/10 | Projekt-Detail zeigt Angebote + Begehungen + Pipeline |
| 3 | **Proaktiv** | 5/10 | App wartet passiv. "3 Projekte kritisch" Banner, aber keine Push-Empfehlung |
| 4 | **Ein Klick = Eine Entscheidung** | 9/10 | Freigaben: 1 Swipe. Foto: 1 Tap. Start-Tiles: 1 Tap. |
| 5 | **Zahlen die sprechen** | 6/10 | Dashboard zeigt Zahlen, aber kein Trend/Vergleich. "5 aktiv" — ist das gut? |
| 6 | **Ampel ueberall** | 9/10 | Gruen/Amber/Rose konsistent. Emerald500 = gut, Amber500 = Achtung, Rose500 = Problem |
| 7 | **Stille ist Gold** | 7/10 | "Alles erledigt" bei leeren Freigaben. Aber keine Benachrichtigung WENN etwas kommt |

---

## NAVIGATION — DER AYSE-WALKTHROUGH

### Erste Oeffnung (als GF)
1. **"Moin Dennis"** — Persoenliche Begruessung. Gut.
2. **"3 Dinge brauchen dich"** — Sofort klar: Es gibt was zu tun.
3. **Rotes Banner "X Projekte kritisch"** — Ampelfarbe, sofort sichtbar.
4. **Schnellfoto** — Prominent, 44px+ Target. Gut.
5. **6 Tiles** (Projekte, Freigaben, Material, Planung, Angebote, Finanzen) — Klar, aber 6 Tiles brauchen Scrollen auf kleineren Phones.

**Ayse-Urteil:** Guter Einstieg. Weiss sofort wo's brennt.

### Tab-Navigation
- 5 Tabs (GF): Start, Projekte, Freigaben, Material, Profil
- Icons + deutsche Labels — Gut
- Badge auf Freigaben mit Zahl — Sehr gut
- FAB (Assistenten-Button) rechts unten — Sinnvoll

**Ayse-Urteil:** "Start" und "Projekte" koennte man verwechseln. Freigaben-Badge ist super.

### Wie viele Taps bis zur Aktion?
| Aktion | Taps | Bewertung |
|--------|------|-----------|
| Freigabe erteilen | 1 (Tab) + 1 (Swipe) = **2** | PERFEKT |
| Projekt oeffnen | 1 (Tab) + 1 (Tap auf Projekt) = **2** | GUT |
| Foto machen | 1 (Schnellfoto) = **1** | PERFEKT |
| Angebot bearbeiten | 1 (Tab) + 1 (Projekt) + 1 (Angebot) + 1 (Bearbeiten) = **4** | OK |
| Neues Projekt anlegen | 1 (Tab) + 1 (+) + 15 Felder ausfuellen = **VIELE** | SCHLECHT |
| Material-Problem sehen | 1 (Tab) + ggf. Projekt waehlen = **2-3** | OK |

---

## FLOW-PROBLEME: WO BRICHT DIE NUTZERREISE AB?

### 1. Monteur-Sackgasse
Monteur oeffnet App → "Mein Job" → Sieht FAKE-Daten → Vertraut der App nicht mehr → **Oeffnet sie nie wieder.**

### 2. Angebots-Erstellung ohne Katalog
GF will Angebot bearbeiten → Oeffnet Editor → Sieht Dummy-Positionen → Kann nichts Echtes hinzufuegen → **Wechselt zurueck zu Excel.**

### 3. Zeiten ohne Persistenz
Monteur stempelt ein → App-Crash oder Tab-Wechsel → Timer zurueckgesetzt → **"Die App speichert ja nichts!"**

### 4. Foto ohne Nachweis
Monteur macht Foto → Wird hochgeladen → Foto-Tab zeigt FAKE-Liste → **Monteur weiss nicht ob Foto angekommen ist.**

### 5. Chat ohne Zweck
Monteur oeffnet Chat → Leerer Screen → **"Was soll ich hier?"** → Geht weg.

---

## PROAKTIVITAET — WAS SOLLTE DIE APP VON SICH AUS TUN?

### Heute: Die App WARTET
- Banner "X Projekte kritisch" — zeigt an, aber dringt nicht durch
- Freigaben-Badge mit Zahl — gut, aber nur wenn man hinschaut
- Keine Push-Notifications implementiert (nur Toggle im Profil, aber kein Backend)

### Was Ayse BRAUCHT (aus NORDSTAR: "BG wartet nicht, BG sagt Bescheid"):

| Situation | App sollte | Heute |
|-----------|-----------|-------|
| Freigabe seit 3 Tagen offen | Push: "3 Freigaben warten auf dich" | Nur Badge |
| Material fehlt fuer morgen | Push: "Vliesraufaser fehlt fuer Schwentnerring" | Nichts |
| Rechnung ueberfaellig | Push: "Rechnung #R-2026-012 ueberfaellig seit 7 Tagen" | Nichts |
| Monteur hat eingestempelt | Zeigt GF: "Mehmet ist auf der Baustelle" | Nichts |
| Neuer Auftrag eingegangen | Push: "Neuer Auftrag von Rehbein & Weber" | Nur Event-Log |
| Marge unter 20% | Push: "Projekt BL-2026-028 Marge bei 14%" | Toggle vorhanden, nicht implementiert |

---

## ROLLENSPEZIFISCHE BEWERTUNG

### Als GF (Dennis)
**Score: 8/10**
- Dashboard mit echten Metriken: Gut
- Freigaben mit Swipe: Perfekt
- Finanzen/Angebote erreichbar: Gut
- **Fehlt:** Marge-Ampel auf einen Blick (NORDSTAR "MARGE"), Trend-Vergleich

### Als Bauleiter
**Score: 7/10**
- Projekte-Liste: Gut
- Begehungen erreichbar: Gut
- Material-Tab: Gut
- **Fehlt:** "Was steht heute an?" Tagesansicht, Monteur-Status

### Als Monteur
**Score: 3/10**
- Mein Job: FAKE
- Zeiten: FAKE
- Foto: FAKE (Liste)
- **Fazit:** Fuer den Monteur ist die App aktuell UNBRAUCHBAR.

---

## TOP 5 SCREENS DIE AYSE SOFORT VERSTEHT (Vorbilder)

1. **Freigaben** (10/10) — Swipe-Karten, FREIGEBEN-Button, Ampelfarben. DER Standard.
2. **Start (GF)** (9/10) — "Moin Dennis", rotes Banner, Schnellfoto, Tiles.
3. **Projekt-Detail** (8/10) — Alles auf einen Blick: Status, Angebote, Begehungen, Pipeline.
4. **Login** (8/10) — Einfach. Email/Passwort. Fertig.
5. **Projekte-Liste** (8/10) — Suche, Status-Filter, klare Karten.

---

## TOP 5 SCREENS DIE AYSE VERWIRREN (Dringend fixen)

1. **Angebot-Editor** (2/10) — Hardcoded Dummy-Daten, nutzlos
2. **Mein Job** (3/10) — Komplett fake, falsches Datum, falsche Baustelle
3. **Zeiten** (5/10) — Timer im RAM, nichts persistent
4. **Foto-Tab** (6/10) — Kamera gut, aber "Letzte Fotos" sind Fake
5. **Chat** (6/10) — Leer, kein Onboarding, Ayse weiss nicht was sie soll

---

## DER EINE SATZ

> **Wuerde Ayse diese App nach 1 Woche wieder oeffnen?**

**Als GF: JA.** Der Freigaben-Flow ist genial. Dashboard gibt Ueberblick. Schnellfoto funktioniert.

**Als Monteur: NEIN.** "Die App zeigt mir immer den gleichen Mist. Ich ruf lieber kurz den Meister an."

**Die App ist zu 80% fuer den GF gebaut und zu 20% fuer den Monteur — aber der Monteur ist der, der sie TAEGLICH braucht.**

---

## KONKRETE FIX-PRIORITAETEN

| # | Fix | Impact | Aufwand | Ayse-Effekt |
|---|-----|--------|---------|-------------|
| **1** | MeinJob an DB anbinden | KRITISCH | MITTEL | Monteur bekommt echte Tagesaufgaben |
| **2** | Angebot-Editor an Katalog | KRITISCH | HOCH | GF kann Angebote wirklich bearbeiten |
| **3** | Zeiten persistent machen | HOCH | MITTEL | Monteur kann wirklich stempeln |
| **4** | Foto-Tab echte Fotos zeigen | MITTEL | NIEDRIG | Vertrauen dass Upload funktioniert hat |
| **5** | Chat Willkommensnachricht | NIEDRIG | NIEDRIG | Monteur versteht was Chat kann |
| **6** | Push-Notifications Backend | HOCH | HOCH | App wird PROAKTIV statt passiv |
| **7** | Projekte-Erstellung vereinfachen | MITTEL | NIEDRIG | Nur Name + Adresse, Rest spaeter |
| **8** | Profil Team aus DB laden | NIEDRIG | NIEDRIG | Konsistenz, 15 echte Eintraege vorhanden |
| **9** | Dashboard Trend-Vergleich | MITTEL | MITTEL | "Zahlen die sprechen" (UX-Gebot 5) |
| **10** | Start-Screen "Was steht an?" | MITTEL | MITTEL | Proaktiv naechste Aktion vorschlagen |

---

## AYSES SCHLUSSWORT

> "Der Freigaben-Screen — den hat jemand gemacht, der versteht wie ich arbeite.
> Einen Wisch und fertig. DAS will ich ueberall.
>
> Aber Mein Job? Das ist wie eine Baustelle ohne Material.
> Sieht schoen aus, aber ich kann nicht arbeiten.
>
> Gebt dem Monteur echte Daten, dann oeffne ich die App auch morgen wieder."

---

**Report erstellt am 2026-03-21 von Claude Opus 4.6**
**Keine Aenderungen am System vorgenommen.**
