# UX-AUDIT REPORT: PERSONA AYSE — BAUGENIUS (2026-03-21)

## EXECUTIVE SUMMARY
BauGenius ist "Ayse-konform" gebaut. Die App atmet das Prinzip der 3-Sekunden-Regel und nutzt konsequent das "Wurstfinger-Design" (große Buttons, klare Kontraste). Der "Flash" (Mail -> 30 Sek -> Freigabe) ist im Kern vorhanden, wird aber durch kleine "Englisch-Lecks" und technisches Jargon (z.B. "Jumbos", "Controlling") an einigen Stellen noch gebremst.

**Gesamt-Score: 8.7 / 10**

---

## AYSE-TEST: EINZELBEWERTUNG (SCREENS)

| Screen | Ayse-Score (1-10) | Größtes Problem | Fix-Vorschlag |
| :--- | :---: | :--- | :--- |
| **Übersicht (Start)** | 9/10 | Feed zeigt "AUTO PLAN COMPLETED" | Alle Feed-Ereignisse auf Deutsch (z.B. "Planung fertig"). |
| **Freigabecenter** | 10/10 | — (Benchmark) | Perfekt: Eine Frage, zwei riesige Buttons. |
| **Projekte-Liste** | 8/10 | Suche ist nur ein kleines Icon | Suchleiste permanent oben einblenden ("Projekt suchen..."). |
| **Projekt-Detail** | 9/10 | Zu viele kleine Tabs unten | Wichtigste Aktion (z.B. "Planung") als FAB (Floating Action Button). |
| **Baustellenaufnahme**| 10/10 | — | Das riesige Mikrofon ist genial für Ayse auf der Baustelle. |
| **LV-Editor** | 7/10 | Begriff "Jumbos" verwirrt | Umbenennen in "Leistungspakete" oder "Standard-Arbeiten". |
| **Finanzen** | 6/10 | Jargon: "Controlling", "DB", "WIP" | Umbenennen: "Gewinn", "Laufende Arbeiten", "Kasse". |
| **Material-Fluss** | 8/10 | Details in Karten zu klein | Schriftgröße in der Material-Liste um 20% erhöhen. |
| **Foto-Modul** | 9/10 | Kategorie-Labels klein | Icons vergrößern und Text fetter machen. |
| **Zeiten/Stempeln** | 9/10 | Wochenübersicht versteckt | Wochensaldo (Stunden gesamt) oben als dicke Zahl. |
| **Einst./Team** | 7/10 | Zu viel Text, zu wenig Icons | Team-Mitglieder als große Karten mit Avataren. |
| **Einst./Firma** | 5/10 | Endloses Scrollen | In Sektionen unterteilen (Briefpapier, Stammdaten, Bank). |
| **Einsatzplanung** | 8/10 | "Drag & Drop" auf Handy schwer | Tippen-basiertes Verschieben (Zuweisen-Menü). |
| **Rechnung/Neu** | 7/10 | "Reverse Charge" Checkbox | Infotext daneben: "Ohne MwSt (Bauleistung)". |
| **Projekt-Chat** | 9/10 | "Typing..." in Englisch | "Schreibt gerade..." |

---

## 1. TOP 5 SCREENS (DIE VORBILDER)
1. **Freigaben (Tabs/Details):** Maximale Reduktion. Entscheidung in 1 Sekunde möglich.
2. **Baustellenaufnahme (Audio):** Ersetzt Tippen durch Sprechen. Ayse liebt das.
3. **Dashboard (Start):** Die Ampel ("3 Projekte kritisch") sagt sofort, wo es brennt.
4. **Foto-Schnellschuss:** Ein Klick von der Übersicht direkt zur Kamera.
5. **Projekt-Status-Bar:** Der visuelle Fortschrittsbalken oben in jedem Projekt.

## 2. TOP 5 CONFUSION-SCREENS (DRINGEND FIXEN)
1. **Finanz-Übersicht:** Zu viele BWL-Begriffe. Ayse will nur wissen: "Haben wir Geld? Verdienen wir?"
2. **Firmeneinstellungen:** Fühlt sich an wie ein Formular-Friedhof. Braucht mehr Struktur.
3. **LV-Editor (Jumbos):** Der Begriff "Jumbo" ist Insider-Wissen. Muss weg.
4. **Team-Verwaltung:** Zu tabellarisch. Mehr "Mensch", weniger "Datenbank".
5. **Feed/Aktivitäten:** Die automatischen Systemmeldungen (Logs) sind noch zu "roboterhaft" auf Englisch.

---

## 3. FLOW-LOGIK & PROAKTIVITÄT
- **BG wartet nicht:** Die App schlägt proaktiv vor: "Planung für Projekt X ist fertig. Jetzt prüfen?" — Das ist exzellent.
- **Sackgassen:** Nach einer Rechnungs-Erstellung fehlt oft der direkte "Zurück zum Projekt" Button.
- **Benachrichtigung:** Die "3-Minuten-Regel" (BG meldet sich, wenn Ayse handeln muss) ist gut umgesetzt, aber die Push-Nachrichten-Texte müssen "Ayse-freundlicher" werden (weniger Technik, mehr Aktion).

---

## 4. DER EINE SATZ (FAZIT)
**Ayse würde diese App nach 1 Woche wieder öffnen, weil sie sich nicht wie "Arbeit am Handy" anfühlt, sondern wie ein digitaler Bauleiter, der ihr den Rücken freihält und nur "piept", wenn sie wirklich entscheiden muss.**

---
**Audit durchgeführt von:** Gemini CLI (UX Auditor Mode)
**Datum:** 21. März 2026
**Status:** ABGESCHLOSSEN
