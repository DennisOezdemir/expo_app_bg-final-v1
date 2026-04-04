# UX Audit Ayse

Datum: 2026-03-21

Grundlage:
- Gelesen: `docs/PERSONA_AYSE.md`
- Gelesen: `docs/NORDSTAR.md`
- Geprueft: alle nutzerrelevanten `.tsx`-Routen in `app/`
- Brille: Ayse, Baustelle, Samsung in der Hand, Sonne, Unterbrechungen, 3 Sekunden Zeit

## Kurzurteil

BauGenius hat bereits einen klaren Kern, wenn Ayse nur eine Sache tun soll: Freigabe geben, Materialproblem sehen, Baustellenaufnahme durchlaufen, Rechnung anlegen. In diesen Momenten ist die App nah an den 7 UX-Geboten.

Sobald ein Screen mehrere Aufgaben gleichzeitig tragen soll, kippt das System in Richtung "Buerosoftware fuer Entwickler". Die groessten Brueche sind das zentrale Projektdetail, der Angebot-Editor, die Import-/Katalog-/Briefpapier-Strecke und der komplette Monteur-Alltag, weil dort viel klar aussieht, aber nicht echt ist. Ayse wuerde an guten Screens schnell handeln. Sie wuerde an den falschen Screens das Vertrauen verlieren.

## Navigation

Was Ayse als erstes sieht:
- Technisch startet die App ueber `app/index.tsx` und landet nach Login in den Tabs.
- Fuer GF/BL ist der erste echte Eindruck brauchbar: Start mit grossen Kacheln, Foto, Projekte, Freigaben.
- Fuer Monteur ist der erste Eindruck schwach, weil `Start`, `Mein Job`, `Foto` und `Zeiten` zwar klar aussehen, aber im Code weitgehend statisch/mock sind.

Tab-Navigation:
- GF/BL Tabs: `Start`, `Projekte`, `Freigaben`, `Material`, `Profil`
- Monteur Tabs: `Start`, `Mein Job`, `Foto`, `Zeiten`, `Profil`
- Die Icons tragen nicht allein, aber die Labels retten die Verstaendlichkeit. Das ist gut.

Wie schnell findet Ayse den naechsten Schritt:
- `Freigaben` ist stark: 1 Tab-Wechsel, dann direkt Entscheidung.
- `Projekte` ist okay: Projekt finden geht schnell, der naechste Schritt im Projekt selbst aber nicht.
- `Projekt-Detail` ist schwach: dort muss Ayse suchen statt gefuehrt zu werden.

Wie viele Taps bis Kamera offen:
- GF/BL: meist 1 Tap auf `Schnellfoto`, dann noch Projektwahl, dann Kamera. Realistisch 3 Schritte bis zur Kamera.
- Monteur: `Foto`-Tab oeffnen, `Foto aufnehmen`, Projekt waehlen, dann Kamera. Ebenfalls eher 3 Schritte bis zur Kamera.
- Nach NORDSTAR ist das zu viel. Foto muss aus Kontext in 1 Tap erreichbar sein.

## Screen-Matrix

| Screen | Ayse-Score (1-10) | Groesstes Problem | Fix-Vorschlag |
| --- | --- | --- | --- |
| `app/index.tsx` | 2 | Nur technischer Router mit Spinner, kein Orientierungspunkt fuer den Menschen | Sofort weiterleiten oder klare Ladebotschaft statt leerem Wartezustand |
| `app/splash.tsx` | 4 | Branding statt Nutzen, kostet Ayse Zeit vor der ersten Handlung | Nach erstem Start ueberspringen oder stark verkuerzen |
| `app/login.tsx` | 7 | Zu viele gleichwertige Login-Wege auf einmal | Einen primaeren Login zeigen, Rest unter "Weitere Optionen" |
| `app/+not-found.tsx` | 1 | Englisch, klein, ohne Baustellen-Kontext | Deutsche Fehlerseite mit grossem `Zur Startseite`-Button |
| `app/(tabs)/index.tsx` | 6 | GF/BL gut, Monteur schwach wegen Fake-Alltag und fehlender echter Tagesfuehrung | Startscreen rollenspezifisch auf echte "Naechste Aktion" umbauen |
| `app/(tabs)/projekte.tsx` | 8 | Liste ist klar, aber der naechste Schritt pro Projekt ist noch nicht hervorgehoben | Pro Karte eine klare Handlungszeile wie `Freigabe offen` oder `Termin fehlt` |
| `app/(tabs)/freigaben.tsx` | 9 | Entscheidung ist stark, aber das Swipe-Muster ist nicht fuer alle sofort sichtbar | Auf der obersten Karte immer explizite Ja/Nein-Buttons sichtbar halten |
| `app/(tabs)/material.tsx` | 8 | Guter Problemfokus, aber Projektwechsel und Details liegen etwas versteckt | Aktuelles Projekt fixer und `Probleme klaeren` noch dominanter oben halten |
| `app/(tabs)/profil.tsx` | 5 | Profil, Stats, Einstellungen, Integrationen und Mock-Inhalte liegen gemischt auf einem Screen | In `Mein Profil` und `Firma & Einstellungen` aufteilen, Fake-Zahlen entfernen |
| `app/(tabs)/meinjob.tsx` | 6 | Sieht klar aus, ist aber statisch und daher nicht vertrauenswuerdig | Echten Tagesauftrag, Startzeit, Ort und Hauptaktion aus Live-Daten laden |
| `app/(tabs)/foto.tsx` | 7 | Klarer Kamera-CTA, aber drumherum nur Demo-Kontext | Direkt aus dem Tab in die echte Kamera oder echte letzte Fotos laden |
| `app/(tabs)/zeiten.tsx` | 7 | Timer und Buttons sind klar, aber die Datenlage ist nicht echt | Echte Zeitbuchung mit aktivem Status und Projektkontext anbinden |
| `app/project/[id].tsx` | 4 | Der Screen versucht 5 Dinge gleichzeitig: Angebote, Fotos, Chat, Dokumente, Begehung, Planung | Oben nur `Naechster Schritt` zeigen, alles andere in klare Unterbereiche auslagern |
| `app/project/team.tsx` | 4 | Teamplanung wirkt komplett mock und fuehlt sich wie Demo an | Entweder an echte Planung koppeln oder den Screen aus dem Flow entfernen |
| `app/angebote/index.tsx` | 7 | Gute Liste, aber viel Sortier- und Filterlogik vor der Kernhandlung | `Zuletzt bearbeitet` und `Naechstes Angebot` oben priorisieren |
| `app/angebot/editor.tsx` | 3 | Fachlich stark, UX-seitig viel zu dicht und nicht 3-Sekunden-tauglich | In 3-4 Schritte zerlegen: Kunde, Positionen, Pruefen, Freigeben |
| `app/angebot/[id].tsx` | 2 | Mock-Screen mit unklarem Wahrheitsgehalt und kaputtem Param-Flow | Route entfernen oder auf den echten Editor/echte Detailansicht umleiten |
| `app/auftrag/[id].tsx` | 7 | Gute Gewerke-Uebersicht, aber eher Lesescreen ohne klaren Anschluss | Oben einen Folgeschritt wie `Zu Material`, `Zu Planung` oder `Zur Freigabe` setzen |
| `app/begehung/[type].tsx` | 7 | Die Route bedient mehrere mentale Modelle und wird dadurch teilweise schwerer als noetig | Pro Begehungstyp eine eigene klare Einstiegsfrage und eigenes Wording geben |
| `app/begehung/baustellenaufnahme.tsx` | 8 | Sehr gute Schrittfuehrung, aber Audio als Schritt 1 ist nicht fuer jede Baustelle praktisch | `Schnellmodus: nur Fotos + Notiz` als Alternative anbieten |
| `app/bestellung/index.tsx` | 5 | Klarer Footer, aber stark demohaft und nicht als echter Tagesflow fuehlbar | Reale Bestellungen zeigen und pro Lieferant nur eine klare Sendeaktion lassen |
| `app/chat/[id].tsx` | 5 | Chat ist bedienbar, aber `BauGenius Agent` wirkt eher technisch als hilfreich | Statt leerem Agent-Chat konkrete Kontextvorschlaege und To-dos vorschlagen |
| `app/einstellungen/firma.tsx` | 6 | Solide Form, aber zu lang fuer 3-Sekunden-Orientierung | In Basis, Steuer, Bank, Zahlung aufteilen |
| `app/einstellungen/kunden.tsx` | 7 | Klarer Listen-/Form-Flow, aber eher Backoffice als Baustellenhilfe | `Neuer Kunde` als sticky CTA und bessere Leerseite nutzen |
| `app/einstellungen/team.tsx` | 7 | Mitgliederliste ist klar, Modal aber schnell zu voll | Erst Name/Email/Rolle, dann Rest als zweiter Schritt |
| `app/einstellungen/lieferanten.tsx` | 5 | Starkes CRM-Gefuehl, viele Felder, wenig unmittelbare Baustellenaktion | Liste vereinfachen auf Kontakt, Status, Bestellweg, dann Details spaeter |
| `app/einstellungen/katalog.tsx` | 5 | Dreistufige Fachnavigation, wenig sofortige Klarheit fuer Ayse | Browse und Bearbeiten trennen, staerkere Breadcrumbs und ein Hauptziel pro Ansicht |
| `app/einstellungen/briefpapier.tsx` | 4 | Typografie-/Farbsteuerung ist zu detailreich und nicht Ayse-konform | Voreinstellungen plus Vorschau, `Erweitert` nur optional |
| `app/einstellungen/import.tsx` | 3 | Schwerer Admin-Wizard mit Mapping, Dateiformaten und Fachjargon | Streng rollengaten und pro Importart einen einfachen Einzel-Flow bauen |
| `app/finanzen/index.tsx` | 6 | Viele gute Ampeln, aber insgesamt zu dashboard-lastig | Standardansicht auf `Heute kritisch` und `Jetzt handeln` reduzieren |
| `app/foto/index.tsx` | 6 | Hauptaktion ist sichtbar, aber Projektwahl, Kamera und Review sind zu viele Schritte | Kamera aus Kontext direkt oeffnen und Metadaten danach optional machen |
| `app/freigabe/[id].tsx` | 8 | Sehr gute Aktionsleiste unten, aber die Mitte des Screens ist teils lang | Oben eine kompakte `Darum geht es`-Box und empfohlene Aktion fixieren |
| `app/planung/index.tsx` | 7 | Gute Proaktivitaet bei `Nicht eingeplant`, aber Grid-Ansicht ist noch dispatcher-lastig | Standardmaessig Probleme und Auto-Plan-Vorschlaege vor dem Kalender zeigen |
| `app/planung/[id].tsx` | 6 | Hero gut, danach zu viel auf einmal: Gantt, Konflikte, Team, Meilensteine | In `Heute`, `Woche`, `Team` splitten |
| `app/rechnung/index.tsx` | 8 | Sehr klarer Listenflow, aber kritische Forderungen koennten noch haerter priorisiert werden | `Ueberfaellig` als rote Sofortzone ueber die Liste setzen |
| `app/rechnung/neu.tsx` | 8 | Fokussierter Formularscreen mit starkem CTA | Sekundaere Optionen wie Reverse Charge erst aufklappen, wenn noetig |
| `app/rechnung/[id].tsx` | 6 | Solide Details, aber lang und zustandslastig | Statusaktion oben priorisieren, Details einklappbar machen |
| `app/assign-material.tsx` | 8 | Sehr fokussierte Auswahlmaske mit klarer Handlung | `Neues Produkt anlegen` erst zeigen, wenn Suche nichts findet |

## Nicht als Ayse-Screen bewertet

Diese Dateien sind technische Infrastruktur oder Layout-Wrapper, keine echten Nutzer-Screens:
- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `app/angebote/_layout.tsx`
- `app/begehung/_layout.tsx`
- `app/einstellungen/_layout.tsx`
- `app/freigabe/_layout.tsx`
- `app/planung/_layout.tsx`
- `app/+native-intent.tsx`

## Top 5 Screens, die Ayse sofort versteht

1. `app/(tabs)/freigaben.tsx`
   Eine Frage, klare Anzahl offen, direkte Entscheidung.
2. `app/(tabs)/projekte.tsx`
   Sofort klar: Projekte sehen, filtern, neues Projekt anlegen.
3. `app/(tabs)/material.tsx`
   Fortschritt plus Problem-CTA funktionieren gut.
4. `app/begehung/baustellenaufnahme.tsx`
   Schritt-fuer-Schritt, grosse Aktionen, wenig Sucharbeit.
5. `app/freigabe/[id].tsx`
   Kontext plus starke Bottom-Aktion, sehr nah an Ayse.

## Top 5 Screens, die Ayse verwirren

1. `app/project/[id].tsx`
   Zu viele Themen auf einmal, kein klarer naechster Schritt.
2. `app/angebot/editor.tsx`
   Fachlich voll, aber fuer Ayse viel zu dicht und zu lang.
3. `app/einstellungen/import.tsx`
   Admin-Wizard, kein Baustellenmoment, viel Fachjargon.
4. `app/angebot/[id].tsx`
   Wirkt wie Demo, nicht wie verlässlicher Arbeits-Screen.
5. `app/+not-found.tsx`
   Englisch, klein, ohne Orientierung oder Rettungsanker.

## Flow-Probleme

1. Die Nutzerreise bricht im Projektdetail.
   Ayse oeffnet ein Projekt und bekommt keinen dominanten `Naechster Schritt`, sondern ein Sammelbecken.

2. Der Foto-Flow ist zu indirekt.
   Der Weg zur Kamera braucht in der Regel mehrere Zwischenschritte. Fuer Baustellen-Tempo ist das zu langsam.

3. Monteur-Flow wirkt klar, ist aber nicht belastbar.
   `Start`, `Mein Job`, `Foto`, `Zeiten` sehen gut aus, basieren aber groesstenteils nicht auf echten Tagesdaten. Das zerstoert Vertrauen.

4. Admin- und Expertenscreens liegen zu nah am Alltagsflow.
   Import, Katalog, Briefpapier, Lieferanten und der grosse Angebot-Editor fuehlen sich nicht wie Ayse an, sondern wie Office-Backoffice.

5. Einzelne Dead Ends sind real.
   `+not-found` ist unbrauchbar.
   Der Aktivitaets-Feed im Startscreen verlinkt auf `/projekt/...` statt auf die existierende `project/[id]`-Route.
   `app/angebot/[id].tsx` ist als echter Weg nicht vertrauenswuerdig.

## Rollenspezifisch

GF:
- Sieht auf `Start` schnell, wo es brennt.
- `Freigaben`, `Projekte`, `Material` und `Finanzen` sind als Navigationsziele stark.
- Aber selbst fuer GF fehlt oft der eine empfohlene naechste Klick.

BL:
- Findet Projekte, Material und Planung relativ schnell.
- Wird aber im Projekt selbst und in der Detail-Planung zu sehr in Fachstruktur statt in Handlung gefuehrt.

Monteur:
- Hat die schlechteste echte Produktlage.
- Die Screens sind optisch am einfachsten, aber fachlich am wenigsten belastbar.
- Genau hier entsteht das groesste Risiko: klare UX ohne echte Daten fuehlt sich wie Spielzeug an.

## Proaktivitaet

Was heute schon gut ist:
- Freigabe-Badge im Tab
- Problem-CTA im Materialscreen
- `Nicht eingeplant` plus `Planen` in der Planung
- Ampellogik in mehreren Fachscreens

Was BauGenius von sich aus tun sollte:

1. Auf jedem Startscreen genau eine naechste Aktion nennen.
   Beispiele: `Heute 2 Freigaben`, `Termin fuer Erstbegehung fehlt`, `3 Materialprobleme blockieren Projekt`.

2. Im Projekt immer einen naechsten Schritt oben pinnen.
   Nicht Listen zuerst, sondern `Jetzt tun`.

3. Die Kamera kontextbasiert oeffnen.
   Wenn Ayse aus Projekt, Freigabe oder Material kommt, darf keine Projektwahl mehr dazwischen liegen.

4. Monteure aktiv fuehren.
   `Heute hierhin`, `Das fehlt`, `Das zuerst fotografieren`, `Jetzt einstempeln`.

5. Ueberfaelliges und Blocker lauter machen.
   Rot muss immer sofort mit einer Handlung gekoppelt sein, nicht nur mit einer Zahl.

## Uebergreifende Muster

Was gut ist:
- Buttons sind oft gross genug.
- Deutsch ist auf vielen Kernscreens gut.
- Ampelfarben sind fachlich schon sichtbar.
- Die besten Screens fragen genau eine Sache.

Was systemisch noch schmerzt:
- Viel graue Sekundaer-Typografie ist draussen in Sonne zu schwach.
- Zu viele Ellipsis-Menues, Long-Presses oder sekundaere Sheets fuer wichtige Dinge.
- Einige Screens sind eher "alles auf einmal" statt "eine Entscheidung pro Moment".
- Das Backend ist an mehreren Stellen weiter als die eigentliche Oberflaechenfuehrung.

## Der eine Satz

Ayse wuerde die App nach 1 Woche fuer Freigaben, Projekte und schnelle Baustellenaktionen wieder oeffnen, aber sie wuerde sie nicht als verlaessliche Alltags-App lieben, solange zentrale Screens noch suchen lassen, zu viel gleichzeitig wollen oder nur wie echte Arbeit aussehen statt echte Arbeit zu tragen.
