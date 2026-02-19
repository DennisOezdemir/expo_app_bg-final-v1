# BauGenius Flow-Architektur

## 1. Gesamtübersicht (Wer ruft wen?)

```mermaid
graph TB
    subgraph TRIGGER["TRIGGER"]
        EMAIL["Email eingang"]
        RECEIPT["Beleg in Drive"]
        MAGICPLAN["MagicPlan Export"]
        MANUAL["Manuell / UI"]
        CRON["Zeitgesteuert"]
    end

    subgraph INFRA["INFRASTRUKTUR"]
        MX00["MX00 Event Router<br/>Zentrale Weiche"]
        MX04["MX04 Dispatch Doctor<br/>Retry alle 15 Min"]
        MX01["MX01 Error Handler<br/>Fehler abfangen"]
        MX07["MX07 Flow Monitor<br/>24h Health Check"]
        MX06["MX06 AI Fallback<br/>Claude > Gemini > GPT"]
    end

    subgraph M1["M1: INTAKE (Der Flash)"]
        MX03["MX03 Superchat Intake<br/>Klassifizierung"]
        MX05["MX05 Attachment Processor<br/>Dateien speichern"]
        M102["M102 PDF Parser<br/>Daten extrahieren"]
        M103["M103 Position Extractor<br/>Positionen + Preise"]
        M104a["M104a Prepare Drive<br/>Jahresordner"]
        M104b["M104b Create Project Tree<br/>9 Unterordner"]
        M104c["M104c Sync Files<br/>PDF hochladen"]
        M105["M105 Notification<br/>Telegram an Chef"]
    end

    subgraph M2["M2: BAUSTELLE"]
        M201["M201 Monteur-Auftrag PDF"]
        M202["M202 Sync ZB Progress"]
        M203["M203 Protokoll PDF"]
        M210["M210 Sub-Order Generator"]
    end

    subgraph M4["M4: MATERIAL"]
        M401["M401 Material Planner"]
        M401a["M401a Receipt Intake<br/>Drive Watch"]
        M401b["M401b Receipt Processor<br/>Beleg scannen"]
        M410["M410 MagicPlan Parser"]
    end

    subgraph M6["M6: FINANZEN"]
        M601["M601 Invoice Processor"]
    end

    %% Trigger-Verbindungen
    EMAIL --> MX03
    RECEIPT --> M401a
    MAGICPLAN --> M410
    CRON --> MX04
    CRON --> MX07

    %% Intake Chain
    MX03 -->|DOC_CLASSIFIED| MX00
    MX00 -->|PROJECT_ORDER| MX05
    MX00 -->|INVOICE_IN| M601
    MX05 -->|FILES_READY| MX00
    MX00 --> M102
    M102 -->|ruft auf| MX06
    MX06 -.->|Claude/Gemini/GPT| M102
    M102 -->|PROJECT_CREATED| MX00

    %% Drive Chain
    MX00 --> M104a
    M104a -->|DRIVE_YEAR_READY| MX00
    MX00 --> M104b
    M104b -->|DRIVE_TREE_CREATED| MX00
    MX00 --> M104c
    M104c -->|DRIVE_SETUP_COMPLETE| MX00
    MX00 --> M105

    %% Position + Material Chain
    M102 -->|PROJECT_CREATED| MX00
    MX00 --> M103
    M103 -->|POSITIONS_EXTRACTED| MX00
    MX00 --> M401

    %% Receipt Chain
    M401a --> M401b
    M401b -->|PURCHASE_INVOICE_CREATED| MX00
    MX00 --> M601

    %% Error Handling
    MX00 -.->|Fehler| MX04
    MX04 -.->|Retry| MX00
    MX01 -.->|Alle Flows| MX01

    %% Styling
    style MX00 fill:#ff9900,stroke:#333,color:#000
    style MX06 fill:#9966ff,stroke:#333,color:#fff
    style MX04 fill:#ff6666,stroke:#333,color:#000
    style MX07 fill:#66aaff,stroke:#333,color:#000
    style M102 fill:#00cc66,stroke:#333,color:#000
    style M105 fill:#00cc66,stroke:#333,color:#000
    style EMAIL fill:#ffcc00,stroke:#333,color:#000
```

---

## 2. Der Flash: Email bis Freigabe (Schritt für Schritt)

```mermaid
sequenceDiagram
    participant Email as Email
    participant MX03 as MX03 Superchat
    participant MX05 as MX05 Attachments
    participant MX00 as MX00 Router
    participant M102 as M102 PDF Parser
    participant MX06 as MX06 AI (Claude)
    participant DB as Supabase DB
    participant M103 as M103 Positionen
    participant M104 as M104a/b/c Drive
    participant M105 as M105 Telegram
    participant M401 as M401 Material
    participant Chef as Chef (Telegram)

    Email->>MX03: Neue Email mit PDF
    MX03->>MX03: Claude klassifiziert: AUFTRAG
    MX03->>DB: Event: DOC_CLASSIFIED_PROJECT_ORDER
    DB->>MX00: Event erkannt
    MX00->>MX05: Route: Dateien speichern
    MX05->>DB: PDF in Storage hochgeladen
    MX05->>DB: Event: PROJECT_FILES_READY

    DB->>MX00: Event erkannt
    MX00->>M102: Route: PDF parsen
    M102->>MX06: Base64 PDF + Prompt
    MX06->>MX06: Claude Sonnet 4 extrahiert
    MX06-->>M102: JSON: Firma, Adresse, Ref-Nr
    M102->>DB: Projekt angelegt + Event: PROJECT_CREATED

    par Drive-Setup
        DB->>MX00: PROJECT_CREATED
        MX00->>M104: Drive Ordner erstellen
        M104->>M104: Jahresordner > Projektordner > 9 Unterordner
        M104->>M104: PDF in Drive kopiert
        M104->>DB: Event: DRIVE_SETUP_COMPLETE
        DB->>MX00: Route
        MX00->>M105: Benachrichtigung senden
        M105->>Chef: Neuer Auftrag! SAGA / Musterstr. 12
    and Positionen + Material
        DB->>MX00: PROJECT_CREATED
        MX00->>M103: Positionen extrahieren
        M103->>DB: Angebot + Positionen + Preise
        M103->>DB: Event: POSITIONS_EXTRACTED
        DB->>MX00: Route
        MX00->>M401: Material planen
        M401->>DB: Materialliste generiert
    end

    Note over Chef: 30 Sekunden spaeter:<br/>Projekt da, Drive da, Material geplant
```

---

## 3. Fehlerbehandlung & Monitoring

```mermaid
graph LR
    subgraph NORMAL["Normaler Ablauf"]
        A["Flow A<br/>sendet Event"] --> MX00["MX00<br/>Event Router"]
        MX00 -->|HTTP POST| B["Flow B<br/>verarbeitet"]
    end

    subgraph FEHLER["Wenn Webhook fehlschlaegt"]
        MX00 -->|HTTP Error| DE["dispatch_errors<br/>Tabelle"]
        DE -->|alle 15 Min| MX04["MX04<br/>Dispatch Doctor"]
        MX04 -->|Retry 1| B
        MX04 -->|Retry 2<br/>+5 Min| B
        MX04 -->|Retry 3<br/>+15 Min| B
        MX04 -->|Max erreicht| TG["Telegram Alert<br/>Dead Letter"]
    end

    subgraph MONITOR["Monitoring (MX07)"]
        direction TB
        E15["Alle 15 Min<br/>Error Check"] -->|Fehler gefunden| TG2["Telegram<br/>Sofort-Alert"]
        E4H["Alle 4 Std<br/>Smoke Test"] -->|PDF an Claude| TG3["Telegram<br/>OK / FAILED"]
        E24["Taeglich 08:00<br/>Daily Report"] --> TG4["Telegram<br/>24h Report"]
    end

    subgraph AI["AI Fallback (MX06)"]
        direction TB
        C1["Claude Sonnet 4"] -->|Fehler| C2["Gemini 2.0 Flash"]
        C2 -->|Fehler| C3["GPT-4o"]
        C3 -->|Fehler| FAIL["Alle 3 fehlgeschlagen"]
    end

    style MX00 fill:#ff9900,stroke:#333,color:#000
    style MX04 fill:#ff6666,stroke:#333,color:#000
    style DE fill:#ff6666,stroke:#333,color:#000
    style TG fill:#ff3333,stroke:#333,color:#fff
    style C1 fill:#9966ff,stroke:#333,color:#fff
    style C2 fill:#7744dd,stroke:#333,color:#fff
    style C3 fill:#5522bb,stroke:#333,color:#fff
```

---

## 4. Flow-Tabelle (Alle 21 Flows)

| Flow | Trigger | Macht was | Ruft auf | Sendet Event |
|------|---------|-----------|----------|--------------|
| **MX00 Event Router** | Webhook + Sweeper (5 Min) | Zentrale Weiche: Event > Routing > Webhook | Alle Flows via HTTP | - |
| **MX01 Error Handler** | n8n Error Trigger | Fehler loggen + Telegram | Telegram | - |
| **MX02 Folder Manager** | Webhook | Drive-Ordner finden/erstellen | Google Drive | - |
| **MX03 Superchat Intake** | Superchat Webhook | Email klassifizieren (Claude) | Claude, Superchat | DOC_CLASSIFIED_* |
| **MX04 Dispatch Doctor** | Schedule (15 Min) | Fehlgeschlagene Events erneut senden | Ziel-Webhooks | - |
| **MX05 Attachment Processor** | Webhook | Dateien von Superchat in Storage | Supabase Storage | PROJECT_FILES_READY |
| **MX06 AI Fallback** | Webhook | Claude > Gemini > GPT Fallback | Claude, Gemini, GPT | - |
| **MX07 Flow Monitor** | Schedule (15 Min/4h/Daily) | Health Checks + Smoke Test | n8n API, Telegram | - |
| **M101 Email Trigger** | Gmail Poll (5 Min) | Neue Emails erkennen | Gmail | - |
| **M102 PDF Parser** | Webhook | PDF mit Claude extrahieren | MX06 | PROJECT_CREATED |
| **M103 Position Extractor** | Webhook | Positionen + Preise zuordnen | Supabase | POSITIONS_EXTRACTED |
| **M104a Prepare Drive** | Webhook | Jahresordner in Drive | Google Drive | DRIVE_YEAR_READY |
| **M104b Create Tree** | Webhook | 9 Projektunterordner | Google Drive | DRIVE_TREE_CREATED |
| **M104c Sync Files** | Webhook | PDF in Drive kopieren | Google Drive, Storage | DRIVE_SETUP_COMPLETE |
| **M105 Notification** | Webhook | Telegram an Chef | Telegram | NOTIFICATION_SENT |
| **M201 Monteur-Auftrag** | Webhook | Arbeitsauftrag-PDF | Gotenberg | - |
| **M202 Sync ZB** | Webhook | Baufortschritt abgleichen | Supabase | ZB_PROGRESS_SYNCED |
| **M203 Protokoll PDF** | Webhook | Begehungsprotokoll-PDF | Gotenberg | - |
| **M401 Material Planner** | Webhook | Materialliste aus Positionen | Supabase | MATERIALS_PLANNED |
| **M401b Receipt Processor** | Schedule (30 Sek) | Belege scannen mit Claude | Claude, Drive | PURCHASE_INVOICE_CREATED |
| **M601 Invoice Processor** | Webhook | Eingangsrechnungen verarbeiten | Claude, Drive | - |

---

## 5. Event-Routing Karte

```mermaid
graph LR
    subgraph Events["Events (event_routing Tabelle)"]
        E1["DOC_CLASSIFIED_PROJECT_ORDER"]
        E2["DOC_CLASSIFIED_INVOICE_IN"]
        E3["PROJECT_FILES_READY"]
        E4["PROJECT_CREATED"]
        E5["DRIVE_YEAR_READY"]
        E6["DRIVE_TREE_CREATED"]
        E7["DRIVE_SETUP_COMPLETE"]
        E8["POSITIONS_EXTRACTED"]
        E9["PURCHASE_INVOICE_CREATED"]
        E10["MONTEUR_AUFTRAG_CREATED"]
        E11["PAYMENT_REMINDER_SENT"]
    end

    E1 --> MX05["MX05 Attachments"]
    E2 --> M601["M601 Invoice"]
    E3 --> M102["M102 PDF Parser"]
    E4 --> M104a["M104a Drive"]
    E4 --> M103["M103 Positionen"]
    E5 --> M104b["M104b Tree"]
    E6 --> M104c["M104c Sync"]
    E7 --> M105["M105 Telegram"]
    E8 --> M401["M401 Material"]
    E9 --> M601
    E10 --> M201["M201 Monteur PDF"]
    E11 --> NOTIF["Notification Hub"]

    style E4 fill:#00cc66,stroke:#333,color:#000
    style E1 fill:#ffcc00,stroke:#333,color:#000
```
