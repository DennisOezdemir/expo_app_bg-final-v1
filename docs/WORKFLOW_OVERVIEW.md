# Baugenius Workflow-Ãœbersicht

> **Stand:** 21.12.2024  
> **Status:** Definiert, DB-ready, n8n-Flows in Planung

---

## GesamtÃ¼bersicht

```mermaid
flowchart TB
    subgraph INTAKE["ðŸ“¥ PHASE 1: Auftragseingang"]
        A1[ðŸ“§ Mail/WhatsApp] --> A2[n8n: Polling]
        A2 --> A3[ðŸ¤– Claude: Extraktion]
        A3 --> A4[(Supabase: Project anlegen)]
        A4 --> A5[ðŸ“ Drive: Ordner erstellen]
        A5 --> A6[ðŸ“± Telegram: Notification]
    end

    subgraph EB["ðŸ” PHASE 2: Erstbegehung"]
        B1[ðŸ“ Magic Plan: Scan] --> B2[ðŸ“§ Email Export]
        B2 --> B3[n8n: Gmail Polling]
        B3 --> B4[ðŸ¤– Claude: Adress-Match]
        B4 --> B5[ðŸ“± Telegram: HITL Frage]
        B5 --> B6{Dennis: BestÃ¤tigung}
        B6 -->|Ja| B7[ðŸ“ Drive: AufmaÃŸ ablegen]
        B6 -->|Korrektur| B4
        B7 --> B8[ðŸ“ Tally: EB-Protokoll]
        B8 --> B9[n8n: Webhook]
        B9 --> B10[(Supabase: Protocol speichern)]
        B10 --> B11[Status: INSPECTION âœ“]
    end

    subgraph MATERIAL["ðŸ“¦ PHASE 3: Material & Planung"]
        C1[n8n: AufmaÃŸ + Auftrag laden] --> C2[ðŸ¤– Claude: Materialvorschlag]
        C2 --> C3[ðŸ“± Telegram: Vorschlag]
        C3 --> C4{Dennis: Freigabe}
        C4 -->|Ã„ndern| C2
        C4 -->|OK| C5[ðŸ“§ Gmail: Draft erstellen]
        C5 --> C6[ðŸ“± Telegram: Final Freigabe]
        C6 --> C7[ðŸ“§ Email an HÃ¤ndler]
        C7 --> C8[(Supabase: Bestellung speichern)]
        C8 --> C9[Status: PLANNING âœ“]
    end

    subgraph SUB["ðŸ‘· PHASE 4: Sub-Auftrag"]
        D1[n8n: Positionen laden] --> D2[DB: TÃ¼rkische Texte]
        D2 --> D3[ðŸ“„ PDF generieren DE+TR]
        D3 --> D4[ðŸ“ Drive: Monteur_Sub]
        D4 --> D5[ðŸ“± Telegram: Fertig]
        D5 --> D6[Dennis: Weiterleiten]
    end

    subgraph BAU["ðŸ—ï¸ PHASE 5: Bauablauf"]
        E1[â° n8n: WÃ¶chentlicher Trigger] --> E2[ðŸ“± Telegram: ZB Reminder]
        E2 --> E3[ðŸ“ Tally: ZB-Protokoll]
        E3 --> E4[n8n: Webhook]
        E4 --> E5[(Supabase: Progress update)]
        E5 --> E6[ðŸ“ Drive: Fotos ablegen]
        E6 --> E7[Status: IN_PROGRESS]
        E7 -->|< 100%| E1
        E7 -->|= 100%| F1
    end

    subgraph DONE["âœ… PHASE 6: Abnahme"]
        F1[ðŸ“ Tally: Abnahme-Protokoll] --> F2[n8n: Webhook]
        F2 --> F3[(Supabase: Abnahme speichern)]
        F3 --> F4[ðŸ“ Drive: Endfotos]
        F4 --> F5[Status: COMPLETED âœ“]
        F5 --> F6[ðŸ“± Telegram: Projekt fertig!]
    end

    INTAKE --> EB
    EB --> MATERIAL
    MATERIAL --> SUB
    SUB --> BAU
    BAU --> DONE
```

---

## Datenfluss

```mermaid
flowchart LR
    subgraph INPUTS["ðŸ“¥ Inputs"]
        I1[ðŸ“§ Gmail]
        I2[ðŸ“± WhatsApp]
        I3[ðŸ“ Magic Plan]
        I4[ðŸ“ Tally Forms]
    end

    subgraph N8N["âš™ï¸ n8n Orchestration"]
        N1[Scheduler]
        N2[Webhooks]
        N3[AI Processing]
        N4[File Handling]
    end

    subgraph STORAGE["ðŸ’¾ Storage"]
        S1[(Supabase)]
        S2[ðŸ“ Google Drive]
    end

    subgraph OUTPUTS["ðŸ“¤ Outputs"]
        O1[ðŸ“± Telegram]
        O2[ðŸ“§ Email Drafts]
        O3[ðŸ“„ PDFs]
    end

    I1 --> N2
    I2 --> N2
    I3 --> N2
    I4 --> N2
    
    N1 --> N3
    N2 --> N3
    N3 --> N4
    
    N4 --> S1
    N4 --> S2
    
    N3 --> O1
    N4 --> O2
    N4 --> O3
```

---

## Projekt-Status Flow

```mermaid
stateDiagram-v2
    [*] --> INTAKE: Auftrag eingehend
    INTAKE --> DRAFT: Projekt angelegt
    DRAFT --> ACTIVE: Freigabe erteilt
    ACTIVE --> INSPECTION: Erstbegehung geplant
    INSPECTION --> PLANNING: EB abgeschlossen
    PLANNING --> IN_PROGRESS: Material bestellt
    IN_PROGRESS --> IN_PROGRESS: Zwischenbegehungen
    IN_PROGRESS --> COMPLETION: 100% erreicht
    COMPLETION --> COMPLETED: Abnahme erfolgt
    
    ACTIVE --> ON_HOLD: Pausiert
    IN_PROGRESS --> ON_HOLD: Pausiert
    ON_HOLD --> ACTIVE: Fortgesetzt
    ON_HOLD --> IN_PROGRESS: Fortgesetzt
    
    DRAFT --> CANCELLED: Abgebrochen
    ACTIVE --> CANCELLED: Abgebrochen
    ON_HOLD --> CANCELLED: Abgebrochen
    
    COMPLETED --> [*]
    CANCELLED --> [*]
```

---

## HITL / Approval Flow

```mermaid
flowchart TB
    subgraph REQUEST["ðŸ“¨ Anfrage"]
        R1[n8n: create_approval] --> R2[(approvals: PENDING)]
        R2 --> R3[ðŸ“± Telegram: Freigabe-Anfrage]
    end

    subgraph DECISION["âš–ï¸ Entscheidung"]
        R3 --> D1{Dennis}
        D1 -->|Freigeben| D2[Kategorie: OK]
        D1 -->|Anpassen| D3[Kategorie: *_WRONG]
        D1 -->|Ablehnen| D4[Kategorie: REJECT/*]
    end

    subgraph PROCESS["âš™ï¸ Verarbeitung"]
        D2 --> P1[decide_approval: APPROVED]
        D3 --> P2[decide_approval: APPROVED + Feedback]
        D4 --> P3[decide_approval: REJECTED]
        
        P1 --> E1[Event: APPROVAL_DECIDED]
        P2 --> E1
        P3 --> E1
    end

    subgraph FOLLOWUP["âž¡ï¸ Folgeaktion"]
        E1 --> F1{Status?}
        F1 -->|APPROVED| F2[n8n: NÃ¤chster Schritt]
        F1 -->|REJECTED| F3[n8n: Abbruch/Revision]
    end
```

---

## Drive Ordnerstruktur

```mermaid
flowchart TB
    ROOT[ðŸ“ 10_PROJEKTE] --> P1[ðŸ“ BL-2025-001_Musterstr_3]
    
    P1 --> F1[ðŸ“ 01_Auftragsunterlagen]
    P1 --> F2[ðŸ“ 02_Aufmass]
    P1 --> F3[ðŸ“ 03_Erstbegehung]
    P1 --> F4[ðŸ“ 04_Material]
    P1 --> F5[ðŸ“ 05_Baufortschritt]
    P1 --> F6[ðŸ“ 06_Nachtraege]
    P1 --> F7[ðŸ“ 07_Abnahme]
    P1 --> F8[ðŸ“ 08_Rechnung]
    P1 --> F9[ðŸ“ 09_Monteur_Sub]

    F1 --> D1[ðŸ“„ Original_Auftrag.pdf]
    F2 --> D2[ðŸ“„ MagicPlan_Export.pdf]
    F3 --> D3[ðŸ“„ EB_Protokoll_001.pdf]
    F3 --> D4[ðŸ–¼ï¸ Fotos...]
    F5 --> D5[ðŸ“„ ZB_Protokoll_001.pdf]
    F5 --> D6[ðŸ“„ ZB_Protokoll_002.pdf]
    F7 --> D7[ðŸ“„ Abnahme_Protokoll.pdf]
    F9 --> D8[ðŸ“„ Sub_Auftrag_DE.pdf]
    F9 --> D9[ðŸ“„ Sub_Auftrag_TR.pdf]
```

---

## Tally Formulare

| Formular | Felder | Webhook â†’ |
|----------|--------|-----------|
| **EB-Protokoll** | Projekt (Dropdown), Datum, Zustand (Checkboxen), MÃ¤ngel, Fotos, Notizen | `protocols` (ERSTBEGEHUNG) |
| **ZB-Protokoll** | Projekt, Datum, Fortschritt %, Probleme, Fotos, NÃ¤chste Schritte | `protocols` (ZWISCHENBEGEHUNG) |
| **Material-Protokoll** | Projekt, Material-Liste, Mengen, Dringlichkeit, Fotos | `protocols` (MATERIAL) |
| **Abnahme-Protokoll** | Projekt, Datum, MÃ¤ngel (Checkboxen), Restarbeiten, Fotos, Unterschrift | `protocols` (ABNAHME) |

---

## Ablauf-Tabelle

| Phase | Trigger | Agent-Aktion | HITL | Output |
|-------|---------|--------------|------|--------|
| **1. Intake** | Mail/WhatsApp | Extraktion, Project anlegen | Projekt bestÃ¤tigen | Project in DB, Drive-Ordner |
| **2. EB** | Magic Plan Export | Adress-Match | Projekt zuordnen | AufmaÃŸ in Drive, EB-Protokoll |
| **3. Material** | EB abgeschlossen | Materialvorschlag | Freigabe | Bestellung an HÃ¤ndler |
| **4. Sub** | Material bestÃ¤tigt | PDF generieren (DE+TR) | - | Sub-Auftrag in Drive |
| **5. Bau** | WÃ¶chentlich | ZB-Reminder | ZB ausfÃ¼llen | Progress-Update |
| **6. Abnahme** | 100% erreicht | Abnahme-Reminder | Abnahme ausfÃ¼llen | Projekt COMPLETED |

---

*Dokumentation erstellt: 21.12.2024*
