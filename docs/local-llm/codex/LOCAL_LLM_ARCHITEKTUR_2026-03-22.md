# BauGenius Local LLM Architektur

Stand: 2026-03-22

## Executive Summary

Empfehlung fuer den Zielzustand:

- App -> Supabase Edge Function `agent-chat-router` -> Strix-Box fuer lokale Textanfragen
- App -> Supabase Edge Function `agent-chat-router` -> Claude Cloud nur fuer PDF/Bild/Vision
- Die 6 vorhandenen BG-Tools bleiben serverseitig in Supabase/Router und werden nicht auf die Box verlagert
- Night Jobs bleiben primaer in n8n, weil dafuer bereits produktionsnahe Workflows im Repo existieren
- Die App sollte nicht direkt mit der Box ueber VPN sprechen

Wichtigster technischer Befund:

- Der aktuelle Chat-Stack vertraut `user_role`, `user_id` und `project_id` aus dem Client-Body und nutzt dann einen Service-Role-Client fuer Tool-Abfragen. Das ist fuer DSGVO-/Berechtigungsansprueche nicht hart genug und muss vor einem Local-LLM-Rollout serverseitig korrigiert werden.

## Repo-Befund

Bereits vorhanden:

- Der bestehende Claude-Agent lebt in `supabase/functions/agent-chat/index.ts`.
- Die 6 Chat-Tools sind dort bereits definiert und in einem Agent-Loop nutzbar.
- Chat-History wird in `chat_messages` persistiert.
- Das Frontend sendet Nachrichten an die Edge Function und zeigt `tool_calls` in der UI an.

Relevante Stellen:

- `supabase/functions/agent-chat/index.ts:22-40` baut den Rollen-Prompt
- `supabase/functions/agent-chat/index.ts:45-150` definiert die 6 Tools
- `supabase/functions/agent-chat/index.ts:154-361` fuehrt Tools gegen Supabase aus
- `supabase/functions/agent-chat/index.ts:365-538` implementiert den Claude Tool-Loop
- `lib/api/chat.ts:42-71` sendet den Chat an `/functions/v1/agent-chat`
- `hooks/queries/useChat.ts:73-81` uebergibt `project_id`, `user_role`, `user_name`, `user_id` aus dem Client
- `supabase/migrations/20260321100000_chat_messages.sql:4-45` definiert Persistenz und Realtime fuer `chat_messages`

## Kritische Luecken im aktuellen Stand

### 1. Rollen- und Projektpruefung ist nicht server-authoritative

Der aktuelle Endpoint akzeptiert diese Felder direkt aus dem Request:

- `project_id`
- `user_role`
- `user_id`

Das passiert in `supabase/functions/agent-chat/index.ts:376-383`.

Der Request wird aus dem Client gebaut in `hooks/queries/useChat.ts:73-81`.

Die Tool-Ausfuehrung laeuft mit Service Role ueber `createServiceClient()` aus `supabase/functions/_shared/supabase-client.ts:3-9`, also ohne RLS-Schutz.

Folge:

- Ein manipulierter Client koennte potentiell eine andere Rolle oder ein anderes Projekt schicken.
- Die Rollenfilter werden derzeit teilweise nur im Prompt und teilweise in der Tool-Ausgabe durchgesetzt.
- Fuer echte DSGVO-/Berechtigungszusagen reicht das nicht.

Pflichtmassnahme vor Produktiv-Rollout:

- Rolle, User-ID und Projektberechtigung muessen serverseitig aus dem JWT und aus DB-Zuordnungen abgeleitet werden.
- Die Edge Function darf `user_role`, `user_id` und erlaubte `project_id`s nicht aus dem Client vertrauen.

### 2. Attachment-Routing ist noch gar nicht im API-Schema

Eure Soll-Logik lautet:

- Bild/PDF => Claude Cloud
- Alles andere => lokal

Aktuell fehlt dafuer die Transportstruktur:

- `ChatRequest` in `supabase/functions/agent-chat/index.ts:12-18` kennt keine `attachments`
- `sendChatMessage()` in `lib/api/chat.ts:42-71` sendet nur Textfelder
- `useSendMessage()` in `hooks/queries/useChat.ts:73-81` uebergibt nur einen String

Pflichtmassnahme:

- Request-Schema erweitern um `attachments[]`
- Router muss MIME-Typen oder Dateitypen serverseitig auswerten

## Entscheidung 1: Welches Modell?

### Klare Empfehlung

Wenn ihr bei einem lokal laufenden Modell in der 70B-Klasse bleiben wollt:

- Erste Wahl: `qwen2.5:72b-instruct-q4_K_M`
- Zweite Wahl: `llama3.1:70b`
- Nicht erste Wahl: `mistral-large`

### Warum Qwen 2.5 72B?

Heute ist Qwen 2.5 fuer euren Use Case die beste Wette aus:

- starkem Tool-/Agent-Verhalten
- guter Mehrsprachigkeit inklusive Deutsch
- brauchbarer JSON-/Structured-Output-Stabilitaet
- guter Verfuegbarkeit in Ollama

Qwen selbst beschreibt Qwen 2.5 als staerker in Coding, Instruction Following, Long Context und Structured Outputs. Die Ollama-Library beschreibt Qwen 2.5 als Modellreihe mit verbessertem Roleplay, Structured Outputs und Langzeitkontext.

### Warum nicht Llama 3.1 70B als erste Wahl?

Llama 3.1 70B ist ein serioeser Fallback und ebenfalls sehr brauchbar. Fuer deutschsprachige Handwerker-Dialoge mit Tool-Calls und JSON ist Qwen 2.5 in der Praxis aber meist die sicherere erste Benchmark-Kandidatin.

### Warum nicht Mistral Large lokal?

Es gibt drei Gruende:

- Die aktuellen Mistral-Large-Varianten sind fuer einen simplen Single-Box-Ollama-Betrieb unattraktiver als Qwen 2.5 72B.
- Die Ollama-Library fuehrt `mistral-large` aktuell als 123B-Modellfamilie.
- Die in der Ollama-Library genannte Mistral Research License ist fuer Forschung/Nicht-kommerzielle Nutzung beschrieben und passt daher nicht gut zu einer produktiven Handwerks-App.

### Wichtiger Zusatz: Qwen 3 benchmarken

Auch wenn eure Frage auf 70B zielt, solltet ihr zusaetzlich `qwen3:30b` benchmarken.

Grund:

- Qwen 3 wird offiziell als agentisch staerker positioniert
- deutlich geringere Latenz auf einer Einzelbox
- fuer 90 Prozent eurer Alltagsanfragen koennte es der bessere wirtschaftliche Produktionssweetspot sein

Produktionsvorschlag:

- Start mit `qwen2.5:72b-instruct-q4_K_M` als Qualitaetsbaseline
- Paralleltest mit `qwen3:30b`
- Entscheidung nach 200 realen BG-Transkripten mit Tool-Use-Messung

## Entscheidung 2: Wo sitzt der Privacy Router?

### Empfehlung

Der Privacy Router sollte logisch in einer Supabase Edge Function sitzen.

Warum:

- Die App spricht heute bereits mit einer Edge Function
- Secrets bleiben serverseitig
- Fallback auf Claude laesst sich dort sauber zentralisieren
- Chat-History, Eventing und Tool-Ausfuehrung bleiben an einem Ort

Zielbild:

1. App sendet an `agent-chat-router`
2. Router validiert JWT und Projektberechtigung serverseitig
3. Router entscheidet:
   - mit Bild/PDF => Claude Cloud
   - ohne Anhang => lokaler Provider auf der Strix-Box
4. Tool-Execution bleibt im Router
5. Antwort und Routing-Metadaten werden in `chat_messages.metadata` gespeichert

### Aber: rein VPN/LAN-only passt nicht zu Supabase-hosted Edge

Das ist der zentrale Netzwerkkonflikt in eurem aktuellen Zielbild:

- Eine von Supabase gehostete Edge Function kann nicht einfach einen reinen Tailscale-/LAN-Host im Buero erreichen.
- Supabase dokumentiert fuer Edge Functions keine statischen Outbound-IP-Adressen.

Das heisst praktisch:

- Entweder die Strix-Box stellt einen schmalen HTTPS-Gateway-Endpunkt oeffentlich bereit
- oder ihr fuehrt einen zusaetzlichen oeffentlich erreichbaren Gateway/Relay ein, der mit der Box privat verbunden ist
- oder ihr hostet den Router nicht mehr bei Supabase, sondern selbst in derselben privaten Netzdomane

### Konkrete Empfehlung fuer BauGenius

Ich wuerde nicht die rohe Ollama-API direkt veroeffentlichen.

Sondern:

- Auf der Strix-Box laeuft `ollama` nur intern auf `127.0.0.1:11434`
- Davor laeuft ein kleiner eigener Router/Gateway-Dienst, z. B. Node/Fastify
- Nur dieser Gateway wird ueber HTTPS exponiert
- Der Gateway akzeptiert nur signierte Requests vom Edge-Router
- Der Gateway hat Request-Rate-Limits, Body-Limits, Timeouts und Logging

Damit bleibt Ollama selbst intern, aber die Edge Function kann die Box trotzdem erreichen.

## Entscheidung 3: VPN-Setup

### Empfehlung

Die App selbst sollte nicht direkt per VPN mit der Buero-Box sprechen.

Begruendung:

- Mobile Expo-App + Firmen-VPN auf jedem Endgeraet ist betriebspraktisch schlecht
- Fallback auf Claude wird komplizierter
- Secrets und Routinglogik wandern an den falschen Rand
- Debugging und Monitoring werden unnoetig schwer

Stattdessen:

- Endnutzer-App -> Supabase Edge
- Admin/SSH/Observability -> Tailscale fuer Menschen und Wartung
- Edge -> Strix ueber abgesicherten HTTPS-Gateway oder oeffentlichen Relay

Wenn ihr Tailscale einsetzen wollt, ist das sinnvoll fuer:

- Admin-Zugriff
- SSH
- interne Dashboards
- optionalen Relay/Gateway in einem Tailnet

Nicht sinnvoll ist Tailscale als direkte App-zu-Box-Verbindung fuer alle mobilen Benutzer.

## Entscheidung 4: Ollama Setup auf der Strix-Box

### Empfohlene Basiskonfiguration

OS:

- Ubuntu 24.04 LTS

Ollama:

- Linux-Install nach offizieller Doku
- systemd-Service aktiv
- AMD/ROCm-Paket mitinstallieren
- aktuelle AMD-Linux-Treiber fuer bestmoegliche ROCm-Unterstuetzung

Empfohlene systemd-Overrides:

```ini
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_NO_CLOUD=1"
Environment="OLLAMA_KEEP_ALIVE=-1"
Environment="OLLAMA_MAX_QUEUE=64"
Environment="OLLAMA_NUM_PARALLEL=1"
Environment="OLLAMA_CONTEXT_LENGTH=8192"
```

Hinweise:

- `OLLAMA_HOST=127.0.0.1:11434` nur fuer internen Betrieb hinter eigenem Gateway
- `OLLAMA_NO_CLOUD=1` fuer Local-only-Betrieb
- `OLLAMA_NUM_PARALLEL=1` zuerst konservativ. Hoeher nur nach Lasttests.
- `OLLAMA_KEEP_ALIVE=-1` fuer warmes Modell, wenn der RAM dauerhaft dafuer reserviert sein darf

### Nicht empfohlen

- Port `11434` roh ins Netz haengen
- App direkt auf Ollama sprechen lassen
- gleichzeitig mehrere grosse Modelle warm halten

## Entscheidung 5: Ollama Tool Calling Format fuer die 6 BG-Tools

Die gute Nachricht:

- Euer aktuelles `Anthropic.Tool[]` aus `supabase/functions/agent-chat/index.ts:45-150` laesst sich fast 1:1 in Ollamas Tool-Format ueberfuehren.
- Die Tool-Ausfuehrung bleibt wie heute serverseitig.

### Canonical Tool Schema fuer BG

```json
[
  {
    "type": "function",
    "function": {
      "name": "query_positions",
      "description": "Angebotspositionen eines Projekts abfragen, optional nach Raum filtern. Zeigt Positionen mit Menge, Einheit und Gewerk.",
      "parameters": {
        "type": "object",
        "required": ["project_id"],
        "properties": {
          "project_id": { "type": "string", "description": "Projekt-UUID" },
          "room": { "type": "string", "description": "Optionaler Raumfilter, z. B. Kueche oder Bad" }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "check_catalog",
      "description": "Katalog durchsuchen nach Leistungspositionen. Findet passende Positionen mit Code, Beschreibung und Einheit.",
      "parameters": {
        "type": "object",
        "required": ["search_term"],
        "properties": {
          "catalog_id": { "type": "string", "description": "Katalog-UUID, optional" },
          "search_term": { "type": "string", "description": "Suchbegriff, z. B. Raufaser oder Thermostat" }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "create_change_order",
      "description": "Nachtrag anlegen fuer ein Projekt. Erstellt einen Freigabe-Eintrag im Freigabecenter. Nur GF und BL duerfen das.",
      "parameters": {
        "type": "object",
        "required": ["project_id", "description", "positions"],
        "properties": {
          "project_id": { "type": "string", "description": "Projekt-UUID" },
          "description": { "type": "string", "description": "Beschreibung des Nachtrags" },
          "positions": {
            "type": "array",
            "description": "Nachtragspositionen",
            "items": {
              "type": "object",
              "required": ["title", "quantity", "unit"],
              "properties": {
                "title": { "type": "string" },
                "quantity": { "type": "number" },
                "unit": { "type": "string" },
                "catalog_code": { "type": "string" }
              }
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "prepare_email",
      "description": "E-Mail vorbereiten und zur Freigabe ins Freigabecenter stellen. Der GF muss vor dem Versand freigeben.",
      "parameters": {
        "type": "object",
        "required": ["project_id", "to", "subject", "body"],
        "properties": {
          "project_id": { "type": "string", "description": "Projekt-UUID" },
          "to": { "type": "string", "description": "Empfaenger-Email" },
          "subject": { "type": "string", "description": "Betreff" },
          "body": { "type": "string", "description": "Email-Text" }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_project_status",
      "description": "Aktuellen Projektstatus abrufen: Status, Fortschritt, offene Aufgaben, letzte Aktivitaeten.",
      "parameters": {
        "type": "object",
        "required": ["project_id"],
        "properties": {
          "project_id": { "type": "string", "description": "Projekt-UUID" }
        }
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_schedule",
      "description": "Einsatzplan eines Projekts abrufen: Phasen, zugewiesene Monteure, Zeitraeume.",
      "parameters": {
        "type": "object",
        "required": ["project_id"],
        "properties": {
          "project_id": { "type": "string", "description": "Projekt-UUID" }
        }
      }
    }
  }
]
```

### Agent-Loop in Ollama

Der Ablauf ist derselbe wie heute bei Claude:

1. Router sendet `messages + tools` an `/api/chat`
2. Modell antwortet mit `message.tool_calls`
3. Router fuehrt alle Tool-Calls serverseitig aus
4. Router fuegt Tool-Ergebnisse als `role=tool` wieder in den Verlauf ein
5. Router ruft `/api/chat` erneut auf
6. Ende, wenn keine `tool_calls` mehr kommen

### Beispielrequest fuer Ollama

```json
{
  "model": "qwen2.5:72b-instruct-q4_K_M",
  "stream": false,
  "messages": [
    {
      "role": "system",
      "content": "Du bist der BauGenius Assistent. Antworte immer auf Deutsch. Nutze Tools statt zu raten."
    },
    {
      "role": "user",
      "content": "Wie ist der Status fuer Projekt 123?"
    }
  ],
  "tools": [/* BG tools siehe oben */],
  "options": {
    "temperature": 0.2,
    "num_ctx": 8192
  },
  "keep_alive": -1
}
```

### Empfehlung fuer BauGenius

- Tools nicht in Ollama ausfuehren lassen
- Tools immer im Router ausfuehren
- Modell nur entscheiden lassen, welches Tool gebraucht wird
- Tool-Ergebnisse serverseitig sanitizen, bevor sie wieder ins Modell gehen

## Entscheidung 6: Rollenbasierte Filterung

### Empfehlung

Rollenfilterung muss auf drei Ebenen passieren:

1. Server-authoritative Request-Gates
2. Tool-Level-Datenfilterung
3. System-Prompt

### Server-authoritative Gates

Pflichtregeln:

- User aus JWT bestimmen
- Rolle aus DB/Claims bestimmen
- erlaubte Projekte aus DB-Zuordnung bestimmen
- Projekt im Request dagegen pruefen

### Tool-Level-Filter

Diese Logik habt ihr schon in Ansätzen:

- `query_positions` entfernt `unit_price` fuer BL und Monteur
- `get_project_status` blendet `client_name` fuer Monteur aus
- `create_change_order` blockiert Monteur

Das muss weitergezogen werden:

- Kein Tool darf sich allein auf den System-Prompt verlassen
- Sensible Felder muessen vor Rueckgabe an das Modell entfernt werden
- Wenn moeglich: lieber rollengetrennte RPCs oder Views als rohe Service-Role-Queries

### System-Prompt

Der Prompt bleibt wichtig, aber ist nur die letzte Schicht.

Empfehlung:

- GF: Vollzugriff
- BL: nur zugewiesene Projekte, keine globalen Finanzdaten
- Monteur: nur Aufgaben/Positionen/Status, keine Preise und Margen

Der bestehende Prompt in `supabase/functions/agent-chat/index.ts:22-40` ist ein brauchbarer Start, aber nicht genug ohne serverseitige Pruefung.

## Latenz: realistische Erwartung auf Strix Halo 395+ 128 GB

### Harte Aussage

Es gibt fuer genau eure Kombination aus Ubuntu 24.04 + Ollama + Qwen 2.5 72B Q4 auf diesem Geraet keine belastbare offizielle End-to-End-Latenz, die ich als Fakt angeben wuerde.

### Was sich belastbar sagen laesst

- AMD bewirbt Ryzen AI Max+ 395 als stark fuer lokale LLMs und nennt fuer llama.cpp unter Windows mit LM Studio deutliche Vorteile gegenueber RTX 4090 in 70B-Szenarien.
- AMD nennt zudem fuer Llama 4 Scout lokal bis zu 15 Tokens/s.

### Daraus abgeleitete Produktionsschaetzung

Das Folgende ist eine technische Schaetzung, keine Messung:

- Reine Textantwort ohne Tool-Call: ca. 6 bis 15 s
- 1 Tool-Runde: ca. 10 bis 25 s
- 2 bis 3 Tool-Runden: ca. 18 bis 45 s
- Cold start oder Model-Swap: 30 bis 90 s

Fuer euer Produkt bedeutet das:

- Qwen 2.5 72B ist fuer GF/BL-Fachdialoge plausibel
- fuer Monteur-Alltagsfragen ist ein kleineres Modell wahrscheinlich die bessere Produktivwahl

### Meine operative Empfehlung

Messt echte BG-Queries in drei Klassen:

1. FAQ ohne Tool
2. ein Tool
3. zwei bis drei Tools

Und loggt pro Anfrage:

- provider
- model
- tool_rounds
- total_latency_ms
- first_token_ms, falls messbar
- fallback_used

## Monitoring

### Empfehlung

Monitoring in 3 Ebenen:

1. Prozess
2. API
3. synthetische Chat-Smoketests

### Prozess

- `systemd` mit `Restart=always`
- `journalctl -u ollama`
- optional Host-Monitoring fuer RAM, CPU/GPU, Temperatur, Disk

### API

Offizielle Endpunkte:

- `GET /api/version`
- `GET /api/ps`
- optional `GET /api/tags`

Praktische Health-Klassen:

- L1: Prozess lebt => `GET /api/version`
- L2: Modell geladen => `GET /api/ps`
- L3: echte Nutzbarkeit => synthetischer `POST /api/chat` mit kurzem Prompt

### Synthetischer Probe-Chat

Empfohlener Smoke-Test:

- "Antworte nur mit JSON: {\"ok\":true}"

Alternativ einmal pro Stunde mit Tool-Call:

- "Rufe get_project_status fuer ein Testprojekt auf und gib nur success true/false aus"

### Was im Repo schon da ist

Es gibt bereits produktionsnahe Monitoring- und Reporting-Bausteine:

- `n8n-workflows/MX_07_Flow_Monitor.json`
- `n8n-workflows/M6_10_Lexware_Reconciliation.json`
- `n8n-workflows/Daily_KI-Briefing.json`
- `n8n-workflows/M2_10b_Schedule_Notification.json`

Empfehlung:

- Nicht noch ein zweites Monitoring-System fuer Business-Jobs bauen
- Bestehende n8n-Workflows fuer Telegram-Reporting und Error-Alerting erweitern
- Ollama-Health als weiteren Input in `MX_07_Flow_Monitor` aufnehmen

## Night Jobs

### Empfehlung

Die Night Jobs sollten nicht als lose Cron-Skripte neu gebaut werden, solange ihr bereits produktive n8n-Workflows habt.

Besser:

- Lexware Reconciliation weiter in n8n
- Ueberfaelligkeits-Check als SQL + Telegram in n8n
- Material-Check als SQL/RPC + Telegram in n8n
- Daily Report als bestehendes Daily-Briefing erweitern

Cron auf der Box ist nur dann sinnvoll, wenn der Job stark modellnah ist und keine n8n-Orchestrierung braucht.

### Konkrete Einordnung eurer vier Jobs

- 06:00 Lexware Reconciliation: bereits sehr nah an vorhandenem `M6_10_Lexware_Reconciliation.json`
- 06:15 Ueberfaelligkeits-Check: n8n-Trigger + SQL + Telegram
- 06:30 Material-Check: n8n-Trigger + `project_material_needs` + `schedule_phases` + Telegram
- 07:00 Daily Report: bestehendes Daily-Briefing/Flow-Monitor erweitern

## Fallback-Strategie

### Empfehlung

Routing-Reihenfolge:

1. Enthalten `attachments[]` ein Bild oder PDF?
   - ja => Claude
   - nein => lokal
2. Lokaler Provider Timeout, 5xx oder Health rot?
   - auf Claude fallen
3. Claude ebenfalls down?
   - Nutzerfehler zurueckgeben

### Timeouts

Empfehlung fuer Produktion:

- Healthcheck timeout: 1 bis 2 s
- Ollama connect timeout: 1 s
- Ollama total timeout fuer Chat: 25 bis 45 s je nach Query-Klasse
- Claude timeout: 20 bis 40 s

### Logging in `chat_messages.metadata`

Empfohlene Felder:

- `provider`: `local` | `claude`
- `model`
- `route_reason`: `attachments_present` | `local_default` | `local_timeout_fallback` | `local_unhealthy_fallback`
- `fallback_used`: boolean
- `latency_ms`
- `tool_rounds`
- `attachment_count`

## Konkreter Zielaufbau

### Komponenten

1. Expo App
2. Supabase Edge Function `agent-chat-router`
3. Strix Gateway `bg-local-llm-router`
4. Ollama
5. Supabase DB/RPC
6. Claude API fuer Vision-Faelle

### Responsibility Split

Expo App:

- sendet `message`, `project_id`, `attachments[]`
- kennt keine Provider-Details

Edge Router:

- authentifiziert den User
- leitet Rolle und erlaubte Projekte serverseitig ab
- waehlt Provider
- fuehrt Tools serverseitig aus
- persistiert Verlauf und Routing-Metadaten

Strix Gateway:

- nimmt nur signierte Backend-Requests an
- spricht lokal mit Ollama
- macht Healthchecks
- kapselt Modellwahl und lokale Provider-Fehler

Ollama:

- nur Inferenz
- kein direkter Internet-/Clientkontakt

## Umsetzungsplan

### Phase 0 - Security first

1. `agent-chat` nicht mehr auf clientgesendete Rolle vertrauen
2. Rolle serverseitig aus JWT/DB aufloesen
3. Projektzuordnung serverseitig pruefen
4. sensible Tool-Felder zentral sanitizen

### Phase 1 - Router faehig machen

1. `ChatRequest` um `attachments[]` erweitern
2. Provider-Abstraktion einfuehren:
   - `runClaudeAgent()`
   - `runLocalAgent()`
3. Routing-Entscheidung in einer Stelle kapseln
4. `chat_messages.metadata` mit Provider/Fallback/Latenz anreichern

### Phase 2 - Strix Dienst

1. Ubuntu 24.04 LTS
2. Ollama + AMD/ROCm
3. Modell pullen
4. lokalen Gateway-Dienst deployen
5. systemd fuer Gateway und Ollama
6. Monitoring/Healthchecks anbinden

### Phase 3 - Night Jobs

1. vorhandene n8n-Flows erweitern
2. Telegram-Alerts vereinheitlichen
3. optional Ollama fuer textuelle Zusammenfassungen im Daily Report nutzen

### Phase 4 - Benchmark und Rollout

1. 200 reale Chatfragen samplen
2. Qwen 2.5 72B vs Qwen 3 30B benchmarken
3. Fehlerquote bei Tool-Aufrufen messen
4. Monteur/BL/GF getrennt auswerten
5. danach Provider default scharf schalten

## Klare Antworten auf die 6 offenen Fragen

### 1. Bestes Modell fuer Tool Calling + Deutsch?

Heute:

- fuer eure 70B-Frage: Qwen 2.5 72B
- als schnellere Alternative zusatzlich benchmarken: Qwen 3 30B

### 2. Wie sieht das Ollama Tool Calling Format aus?

- JSON Schema mit `tools: [{ type: "function", function: { name, description, parameters } }]`
- Tool-Calls kommen in `response.message.tool_calls`
- Tool-Ergebnisse gehen als `role: "tool"` zurueck in den Nachrichtenverlauf

### 3. Wie schnell ist Qwen 72B auf der Strix?

- belastbare Messung noch offen
- realistische Produktschaetzung: 6 bis 15 s ohne Tool, 10 bis 45 s mit Tools je nach Tiefe

### 4. Router auf Strix oder Edge?

- logische Control Plane in Supabase Edge
- lokaler Provider/Gateway auf Strix

### 5. Wie verbindet sich die App sicher mit der Box?

- gar nicht direkt
- App -> Supabase Edge
- Edge -> abgesicherter Gateway
- VPN/Tailscale fuer Admin und interne Wartung, nicht als Standardpfad fuer App-User

### 6. Wie monitoren wir Ollama?

- `systemd` + Journald
- `GET /api/version`
- `GET /api/ps`
- synthetischer `POST /api/chat`
- bestehendes n8n-Monitoring erweitern

## Naechste konkrete Umsetzung im Repo

Wenn ihr diesen Plan umsetzt, sind die ersten sinnvollen Codeaenderungen:

1. `supabase/functions/agent-chat/index.ts`
   - Router statt Claude-only
   - serverseitige Rollen-/Projektpruefung
   - `attachments[]`
2. `lib/api/chat.ts`
   - `attachments[]` in Request/Response
3. `hooks/queries/useChat.ts`
   - Mutation fuer Attachments erweitern
4. neues Strix-Gateway-Projekt
   - z. B. `services/local-llm-router/`
5. n8n Monitoring
   - Ollama Health in `MX_07_Flow_Monitor.json`

## Quellen

Technische und Produktquellen, Stand 2026-03-22:

- Ollama Tool Calling: https://docs.ollama.com/capabilities/tool-calling
- Ollama Linux Install und systemd: https://docs.ollama.com/linux
- Ollama FAQ zu `OLLAMA_HOST`, `OLLAMA_NO_CLOUD`, Netzwerk, Queue, Parallelisierung, `keep_alive`: https://docs.ollama.com/faq
- Ollama API `GET /api/ps`: https://docs.ollama.com/api/ps
- Ollama API `GET /api/version`: https://docs.ollama.com/api-reference/get-version
- Ollama Library Qwen 2.5: https://ollama.com/library/qwen2.5
- Ollama Library Qwen 3: https://ollama.com/library/qwen3
- Qwen 2.5 offizieller Blog: https://qwenlm.github.io/blog/qwen2.5/
- Qwen 3 offizieller Blog: https://qwenlm.github.io/blog/qwen3/
- Ollama Library Llama 3.1: https://ollama.com/library/llama3.1
- Ollama Library Mistral Large: https://ollama.com/library/mistral-large
- Mistral Function Calling Doku: https://docs.mistral.ai/capabilities/function_calling/
- AMD Ryzen AI Max+ 395 Produktseite: https://www.amd.com/en/products/processors/laptop/ryzen-pro/ai-max-pro-300-series/amd-ryzen-ai-max-plus-pro-395.html
- AMD lokale LLM-Benchmarks / Claims: https://www.amd.com/en/blogs/2025/amd-unveils-next-generation-ai-pcs-at-ces-2025.html
- Supabase Edge Functions Overview / Regionen: https://supabase.com/docs/guides/functions
- Supabase Hinweis zu fehlender statischer Outbound-IP fuer Edge Functions: https://supabase.com/docs/guides/troubleshooting/can-we-allow-list-the-ip-addresses-of-supabase-servers-and-edge-functions--ukv5WF
- Tailscale Serve: https://tailscale.com/kb/1312/serve
- Tailscale Subnet Routers: https://tailscale.com/kb/1019/subnets
- Tailscale ACLs / Zugriffskontrolle: https://tailscale.com/kb/1018/acls

## Status

Diese Doku beschreibt die Architektur- und Betriebsentscheidung. Es wurden in diesem Schritt keine Produktiv-Codepfade fuer den Router umgebaut.
