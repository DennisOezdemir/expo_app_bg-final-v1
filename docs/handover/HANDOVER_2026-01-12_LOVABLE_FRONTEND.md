# HANDOVER â€” 12. Januar 2026
## BAUGENIUS Frontend Mockup + Email Intake Completion

---

## ðŸ“‹ SESSION ÃœBERSICHT

**Datum:** 11.-12. Januar 2026
**Dauer:** ~8 Stunden
**Fokus:** 
1. Email Intake Automation (MX_03 Document Classifier)
2. Lovable.dev Frontend Mockup (~40 Features)
3. Logo Design (Midjourney)

---

## TEIL 1: EMAIL INTAKE AUTOMATION (Morgen-Session)

### MX_03_Document_Classifier â€” NEU GEBAUT

**Zweck:** Automatische Klassifizierung aller eingehenden Emails

**Flow-Architektur:**
```
Gmail Poll (01_Eingang, unread)
    â†“
Claude Vision API Classification
    â†“
5-Way Routing:
â”œâ”€â”€ SKIP (Payment Reminder) â†’ Mark Read only
â”œâ”€â”€ M1 (Project Orders) â†’ Move to 02_Auftraege + Event
â”œâ”€â”€ M6 (Invoices) â†’ Move to 03_Finanzen + Event
â”œâ”€â”€ ARCHIVE (Info/Catalog) â†’ Move to 05_Marketing_Info
â””â”€â”€ REVIEW (Other/Low Confidence) â†’ DOC_NEEDS_REVIEW Event
```

**7 Nodes importiert:**
| Node | Funktion |
|------|----------|
| Mark Read (Skip) | Gmail mark as read fÃ¼r PAYMENT_REMINDER |
| Event M1 | PROJECT_ORDER Event erzeugen |
| Move to Auftraege | â†’ 02_Geschaeft_Projekte/Auftraege Label |
| Event M6 | INVOICE_IN/OUT Event erzeugen |
| Move to Finanzen | â†’ 03_Finanzen Label |
| Move to Archive | â†’ 05_Marketing_Info Label |
| Event Review | DOC_NEEDS_REVIEW Event |

### Migration 024 â€” AUSGEFÃœHRT

**Datei:** `024_classified_emails.sql`

**Neue Tabelle:** `classified_emails`
- Tracking aller klassifizierten Emails
- Verhindert Doppelverarbeitung

**Neue Event Types:**
- `PROJECT_ORDER_RECEIVED`
- `INVOICE_RECEIVED`
- `DOC_NEEDS_REVIEW`

### M1_01 Migration zu Label-Based Filtering â€” UMGEBAUT

**Vorher:** Sender-basierter Filter (fragil)
**Nachher:** Label-basierter Filter (robust)

Pattern von M4_02 Ã¼bernommen:
- Label: `02_Geschaeft_Projekte/Auftraege`
- Filter: Unread only
- Konsistent mit MX_03 Routing

### Single Point of Entry Architecture â€” BESTÃ„TIGT

```
01_Eingang (alle Emails)
    â†“
MX_03 (Claude Classification, every 5 min)
    â†“
â”œâ”€â”€ 02_Auftraege â†’ M1_01 (Project Intake)
â”œâ”€â”€ 03_Finanzen â†’ M4_02 (Invoice Processing)
â”œâ”€â”€ 05_Marketing_Info â†’ Archive (no processing)
â””â”€â”€ Review Events â†’ Manual Queue
```

### M1.03 Positions â€” STATUS KORRIGIERT

- **620 Katalog-Positionen** Ã¼ber 6 WBS Kataloge
- **84% Match-Rate** (Maximum erreichbar)
- Fuzzy Matching operational

---

## TEIL 2: LOVABLE.DEV FRONTEND MOCKUP (Abend-Session)

### Ausgangslage

**Mockup analysiert:** `baugenius-mockup-main.zip`
- React/Vite/TypeScript
- Shadcn/ui Components (Dark Mode)
- Tailwind CSS mit Orange Accent (#F97316)
- 8 Routes vorhanden

**Vorhandene Pages:**
- âœ… Dashboard
- âœ… Projekte (List + Detail)
- âœ… Angebote
- âœ… Rechnungen
- âœ… Import/Export
- âœ… Freigaben
- âœ… GeschÃ¤ftsfÃ¼hrer

### Hidden Complexity entdeckt

**AngebotFormDialog.tsx (757 Zeilen):**
- Komplettes LV-Kalkulationssystem
- Titel â†’ Positionen Struktur
- Material/Lohn/GerÃ¤te/Fremdleistungen
- GAEB Export (XML 3.1, 3.2, DA 81)
- PDF Export Optionen
- Identisch mit "Das Programm" â€” kopiert!

**ProtokollDetailDialog.tsx:**
- Read-only Detail View
- Fortschritt mit Progress Bar
- MÃ¤ngel-Section
- Unterschriften-Section

### Architektur-Entscheidungen

**Navigation Restructure:**
- "GeschÃ¤ftsfÃ¼hrer" Page ENTFERNT
- Inhalte verteilt auf Dashboard + Chef-Inbox
- "Freigaben" umbenannt zu "Chef-Inbox" mit Bell Icon

**Mobile-First Refactor:**
- Bottom Navigation auf Mobile
- Collapsible Sidebar auf Desktop

---

## ALLE LOVABLE PROMPTS (in Reihenfolge)

### Batch 1: Core UI (Prompts 1-11)

| # | Feature | Status |
|---|---------|--------|
| 1 | Mobile Navigation + Layout | âœ… |
| 2 | GF Removal + Chef-Inbox | âœ… |
| 3 | Visual Polish | âœ… |
| 4 | Fehlende Dialoge (Protokoll, Bestellung, Nachtrag) | âœ… |
| 5 | Stammdaten (Kunden, Lieferanten, Artikel, Lohngruppen) | âœ… |
| 6 | Global Search (CMD+K) | âœ… |
| 7 | Notification Center | âœ… |
| 8 | Projekt Kanban View | âœ… |
| 9 | Kalender View | âœ… |
| 10 | Settings Page | âœ… |
| 11 | Login Screen | âœ… |

### Batch 2: Projekt Features (Prompts 12-16)

| # | Feature | Status |
|---|---------|--------|
| 12 | Projekt Activity Feed (statt Chat) | âœ… |
| 13 | Smart Dokumente Tab | âœ… |
| 14 | EDS Katalog Integration | âœ… |
| 15 | Proaktiver KI-Assistent | âœ… |
| 16 | Spracheingabe fÃ¼r Protokolle | âœ… |

### Batch 3: Automation-First Features (Prompts 17-33)

| # | Feature | Automation Level |
|---|---------|------------------|
| 17 | Auto-Foto mit AI Tags | 95% auto |
| 18 | Unterschrift-Pad + Auto-Request | 95% auto |
| 19 | QR Check-In System | 100% auto |
| 20 | Kosten-Radar Dashboard | 100% auto |
| 21 | Daily Briefing (07:00) | 100% auto |
| 22 | Project Health Score | 100% auto |
| 23 | Auto-Mahnung Eskalation | 95% auto |
| 24 | Wetter-Widget + Baustellen-Warnungen | 100% auto |
| 25 | Schnellerfassung Mobile | 90% auto |
| 26 | Lieferanten Auto-Bewertung | 100% auto |
| 27 | Auto-Rechnungsstellung | 90% auto |
| 28 | Auto-Nachtragserkennung | 90% auto |
| 29 | Auto-Steuerberater-Export | 100% auto |
| 30 | Smart Notification Bundling | 100% auto |
| 31 | One-Click Projektabschluss | 90% auto |
| 32 | GewÃ¤hrleistungs-Tracker | 100% auto |
| 33 | Auto-Bank-Matching | 100% auto |

### Batch 4: Advanced Features (Prompts 34-40)

| # | Feature | Automation Level |
|---|---------|------------------|
| 34 | Subunternehmer-Portal | 90% auto |
| 35 | Auto-Fahrtenbuch (GPS) | 100% auto |
| 36 | KapazitÃ¤tsplanung | 90% auto |
| 37 | Auto-Angebotskalkulation | 85% auto |
| 38 | Auto-Terminplanung | 90% auto |
| 39 | Kunden-Portal | 95% auto |
| 40 | Auto-Cashflow-Prognose | 100% auto |
| 41 | Auto-Dokumentenvorlagen | 95% auto |
| 42 | Auto-JahresÃ¼bersicht | 100% auto |
| 43 | Auto-Werkzeugverwaltung | 90% auto |

---

## TEIL 3: LOGO DESIGN

### Midjourney Prompts erstellt

**5 Optionen generiert:**
1. LÃ¶we + Bau (geometrisch)
2. Abstract B + LÃ¶we Silhouette
3. LÃ¶wenkopf mit Helm
4. Shield/Wappen Style
5. Pure Tech/Abstract BG

### GewÃ¤hltes Logo

**Abstract BG Interlocking Shapes**
- Geometrische verschrÃ¤nkte Formen
- B + G erkennbar
- 3D Tiefe mit Orange Glow
- Dark Mode native
- Perfekt skalierbar (16px - Billboard)

**Prompt:**
```
Abstract logo mark, interlocking geometric shapes forming 
letter B and G, construction blueprint aesthetic, orange 
glow effect, dark mode friendly, futuristic yet grounded, 
SaaS company logo, silicon valley style, minimal and bold 
--ar 1:1 --v 6 --stylize 250
```

---

## AUTOMATION-FIRST PRINZIP

**Das BAUGENIUS-Manifest:**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  SYSTEM ARBEITET                            â”‚
â”‚  â”œâ”€ Beobachtet (Emails, GPS, Rechnungen)   â”‚
â”‚  â”œâ”€ Analysiert (Kosten, Zeit, Fortschritt) â”‚
â”‚  â”œâ”€ Handelt (Zuordnung, Berechnung)        â”‚
â”‚  â””â”€ Meldet (Alerts, Empfehlungen)          â”‚
â”‚                                             â”‚
â”‚  USER ENTSCHEIDET                           â”‚
â”‚  â”œâ”€ BestÃ¤tigt (âœ“ oder Korrektur)          â”‚
â”‚  â”œâ”€ Genehmigt (Freigabe ja/nein)          â”‚
â”‚  â””â”€ Reagiert (bei Ausnahmen)               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Goldene Regel:**
> Kein Feature das regelmÃ¤ÃŸige manuelle Eingabe braucht.
> Eingabe nur bei: Einmalig, Entscheidung, Ausnahme.

---

## BACKEND READINESS ASSESSMENT

### Sofort anschlieÃŸbar (Backend ready):

| Feature | Tabelle | Status |
|---------|---------|--------|
| Projekte | `projects` | M1 âœ… |
| Angebote | `offers`, `offer_positions` | M1 âœ… |
| Rechnungen Eingang | `purchase_invoices` | M4 âœ… |
| Katalog | `catalog_positions_v2` | 620 Pos âœ… |

### Schema existiert, Flow fehlt:

| Feature | Tabelle | NÃ¤chster Schritt |
|---------|---------|------------------|
| Protokolle | `protocols` | M2 Flow (Tally Webhook) |
| NachtrÃ¤ge | `change_orders` | M2 Schema erweitern |
| Freigaben | `approvals` | M5 Flow bauen |

### Komplett offen:

| Feature | BenÃ¶tigt |
|---------|----------|
| Dashboard KPIs | M6 Aggregation Views |
| Rechnungen Ausgang | `sales_invoices` Tabelle |
| Cashflow | Bank Integration |

---

## LOVABLE â†’ CURSOR MIGRATION

### Export Schritte:

1. **Lovable:** GitHub Repo exportieren
2. **Lokal:** `git clone` + `npm install`
3. **Cursor:** Projekt Ã¶ffnen
4. **Supabase:** Schema mappen

### PrioritÃ¤ts-Reihenfolge:

1. Auth (Login funktional machen)
2. Projekte + Angebote anbinden
3. Rechnungen/Eingang anbinden
4. Dashboard KPIs (M6 Views)
5. M2 Baustelle Flow
6. Portale (Sub, Kunde)

---

## DATEIEN FÃœR PROJEKT-KNOWLEDGE

### Neue Dokumente zu erstellen:

| Datei | Inhalt |
|-------|--------|
| `HANDOVER_2026-01-12_LOVABLE_FRONTEND.md` | Dieses Dokument |
| `LOVABLE_PROMPTS_COMPLETE.md` | Alle 43 Prompts als Referenz |
| `FRONTEND_BACKEND_MAPPING.md` | UI Components â†” Supabase Tabellen |
| `AUTOMATION_MANIFEST.md` | Automation-First Prinzipien |

### Bestehende Docs zu aktualisieren:

| Datei | Ã„nderung |
|-------|----------|
| `FLOW_REGISTER_V2_3.md` | MX_03 Document Classifier hinzufÃ¼gen |
| `WORKFLOW_OVERVIEW.md` | Single Point of Entry dokumentieren |
| `DATABASE_SCHEMA_V1_4.md` | â†’ V1_5 mit classified_emails |

### SQL Migrations zu archivieren:

| Datei | Inhalt |
|-------|--------|
| `024_classified_emails.sql` | classified_emails Tabelle + Event Types |

---

## OFFENE PUNKTE / KNOWN ISSUES

1. **Lovable GitHub Export:** Noch nicht durchgefÃ¼hrt
2. **Logo Vector:** Midjourney PNG â†’ Illustrator/Figma nachbauen
3. **M1_01 Prod-Test:** Label-basierter Filter noch nicht live getestet
4. **"Das Programm" API:** Weiterhin ausstehend

---

## NÃ„CHSTE SESSION PRIORITIES

1. **GitHub Export** finalisieren
2. **Cursor Setup** mit Supabase Connection
3. **Auth implementieren** (Supabase Auth)
4. **Erste Seite live:** Projekte mit echten Daten
5. **Logo einbauen** (Sidebar, Favicon, Login)

---

## METRIKEN

| Metrik | Wert |
|--------|------|
| Lovable Credits verbraucht | ~200 |
| Lovable Credits Ã¼brig | ~380 (Rollover) |
| Features gebaut | ~43 |
| Automation Level Durchschnitt | 94% |
| Email Intake Match Rate | 84% |
| Katalog Positionen | 620 |

---

*Dokumentiert am 12. Januar 2026, 01:15 Uhr*
