# BauGenius Local AI — Strix Halo Architektur

> **Ziel:** 90% der Chat-Anfragen lokal (DSGVO, 0 EUR/Query), 10% Claude Cloud (Vision).
> **Hardware:** ASUS NUC Strix Halo 395+, 128GB RAM, Ubuntu 24.04
> **Modell:** Qwen 2.5 72B Instruct (Q5_K_M)
> **Runtime:** Ollama mit OpenAI-kompatibler API

---

## ENTSCHEIDUNGSMATRIX

| Frage | Entscheidung | Begruendung |
|-------|-------------|-------------|
| Welches Modell? | **Qwen 2.5 72B Instruct** | Bestes Tool Calling + Deutsch unter Open-Source 70B+ Modellen |
| Quantisierung? | **Q5_K_M** (~50GB) | Nahe FP16-Qualitaet, laesst 74GB frei fuer OS + Context + 2. Modell |
| Zweit-Modell? | **QwQ 32B Q4_K_M** (~20GB) | Fuer einfache Anfragen (Status, Positionen) — 2-3x schneller |
| API-Format? | **OpenAI-kompatibel** (`/v1/chat/completions`) | Gleiche Tool-Definitionen wie Claude, minimaler Code-Umbau |
| Router wo? | **In der Edge Function** | Frontend bleibt 100% unveraendert, kein neuer Service noetig |
| VPN? | **WireGuard** | Leichtgewichtig, schnell, 1 Config-File |
| Monitoring? | **Healthcheck-Script + Telegram-Alert** | Passt in bestehendes Notification-System |

---

## SYSTEM-ARCHITEKTUR

```
┌──────────────────────────────────────────────────────────────┐
│  EXPO APP (React Native)                                      │
│  Chat-UI → sendChatMessage() → Edge Function                  │
│  !! KEINE AENDERUNG AM FRONTEND !!                            │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS POST
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  SUPABASE EDGE FUNCTION: agent-chat (Privacy Router)          │
│                                                                │
│  1. Request analysieren                                        │
│  2. Routing-Entscheidung:                                      │
│     ├─ Hat Attachment/Bild → CLAUDE CLOUD (Vision)             │
│     └─ Nur Text          → OLLAMA LOKAL (Strix Halo)          │
│  3. Tool Use Loop (max 5 Iterationen)                          │
│  4. Tools ausfuehren gegen Supabase                            │
│  5. Antwort in chat_messages speichern                         │
│  6. Response an Frontend                                       │
└───────────┬──────────────────────────┬───────────────────────┘
            │                          │
    ┌───────▼───────┐         ┌───────▼───────┐
    │ OLLAMA (90%)   │         │ CLAUDE (10%)   │
    │ Strix Halo Box │         │ Anthropic API  │
    │                │         │                │
    │ Qwen 2.5 72B  │         │ Claude Sonnet  │
    │ QwQ 32B       │         │ Vision-faehig  │
    │                │         │                │
    │ 0 EUR/Query   │         │ ~0.01 EUR/Q    │
    │ DSGVO-safe    │         │ Cloud (US)     │
    └───────────────┘         └────────────────┘
```

---

## PHASE 1: STRIX HALO BOX EINRICHTEN

### 1.1 Ubuntu 24.04 LTS Setup

```bash
# Basis-System (Ubuntu Server 24.04 LTS, Minimal Install)
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git htop nvtop tmux ufw wireguard

# Hostname setzen
sudo hostnamectl set-hostname strix-halo

# Zeitzone
sudo timedatectl set-timezone Europe/Berlin
```

### 1.2 Ollama installieren

```bash
# Offizieller Installer (erstellt systemd Service automatisch)
curl -fsSL https://ollama.com/install.sh | sh
```

### 1.3 systemd Service konfigurieren

```bash
sudo systemctl stop ollama
```

Datei: `/etc/systemd/system/ollama.service`

```ini
[Unit]
Description=Ollama LLM Service
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=5

# Extern erreichbar (LAN/VPN)
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_MODELS=/data/ollama/models"
Environment="OLLAMA_NUM_PARALLEL=2"
Environment="OLLAMA_MAX_LOADED_MODELS=2"
Environment="OLLAMA_KEEP_ALIVE=30m"
Environment="OLLAMA_ORIGINS=*"

# AMD iGPU (Strix Halo RDNA 3.5)
Environment="HSA_OVERRIDE_GFX_VERSION=11.5.0"

LimitNOFILE=65535
LimitMEMLOCK=infinity

[Install]
WantedBy=multi-user.target
```

```bash
sudo mkdir -p /data/ollama/models
sudo chown ollama:ollama /data/ollama/models
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama
```

### 1.4 Modelle pullen

```bash
# Hauptmodell: Qwen 2.5 72B (Q5_K_M, ~50GB Download)
ollama pull qwen2.5:72b-instruct-q5_K_M

# Schnelles Zweitmodell: QwQ 32B (Q4_K_M, ~20GB)
ollama pull qwq:32b-q4_K_M

# Test
curl http://localhost:11434/api/ps
```

### 1.5 Firewall (nur LAN/VPN)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow from 10.0.0.0/24 to any port 11434 proto tcp comment "Ollama LAN"
sudo ufw allow 51820/udp comment "WireGuard VPN"
sudo ufw enable
```

### 1.6 WireGuard VPN

Datei: `/etc/wireguard/wg0.conf`

```ini
[Interface]
Address = 10.10.0.1/24
ListenPort = 51820
PrivateKey = <STRIX_PRIVATE_KEY>

# Buero-Router / Supabase Edge Function Relay
[Peer]
PublicKey = <PEER_PUBLIC_KEY>
AllowedIPs = 10.10.0.0/24
```

```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

**Fuer die Edge Function:** Da Supabase Edge Functions keinen WireGuard-Client haben,
braucht man entweder:
- **Option A:** Ollama ueber einen Reverse Proxy (nginx + TLS + API-Key Auth) am Router
  exponieren — der Router hat einen festen DNS (z.B. ollama.deinebauloewen.de)
- **Option B:** Einen Relay-Server (VPS) der WireGuard mit der Box hat und Requests weiterleitet
- **Option C:** Cloudflare Tunnel (Zero Trust, kostenlos) — **EMPFOHLEN**

### 1.7 Cloudflare Tunnel (Option C — EMPFOHLEN)

```bash
# Cloudflare Tunnel installieren
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Tunnel erstellen (einmalig, Browser-Auth)
cloudflared tunnel login
cloudflared tunnel create strix-halo

# Config: /etc/cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: ollama.deinebauloewen.de
    service: http://localhost:11434
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

**Zusaetzlich: API-Key Auth** via Cloudflare Access oder einen einfachen Auth-Proxy:

Datei: `/opt/ollama-proxy/server.js`

```javascript
// Minimaler Auth-Proxy vor Ollama
import http from "node:http";

const OLLAMA_KEY = process.env.OLLAMA_API_KEY || "bg-strix-secret-2026";
const OLLAMA_PORT = 11434;
const PROXY_PORT = 11435;

const server = http.createServer((req, res) => {
  // API-Key pruefen
  const key = req.headers["x-ollama-key"];
  if (key !== OLLAMA_KEY) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  // Request an Ollama weiterleiten
  const options = {
    hostname: "127.0.0.1",
    port: OLLAMA_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: "127.0.0.1:" + OLLAMA_PORT },
  };
  delete options.headers["x-ollama-key"];

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyReq, { end: true });
  proxyReq.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Ollama not reachable: " + err.message }));
  });
});

server.listen(PROXY_PORT, "127.0.0.1", () => {
  console.log(`Ollama Auth-Proxy listening on ${PROXY_PORT}`);
});
```

---

## PHASE 2: PRIVACY ROUTER (Edge Function Umbau)

### 2.1 Routing-Logik

```
Request rein
    │
    ├─ Hat attachments[] mit Bild/PDF?
    │   └─ JA → Claude Cloud (Vision)
    │
    ├─ Ollama erreichbar? (Healthcheck mit 3s Timeout)
    │   └─ NEIN → Claude Cloud (Fallback)
    │
    └─ Alles andere → Ollama Lokal
         │
         ├─ Einfache Anfrage? (Status, Positionen)
         │   └─ JA → QwQ 32B (schnell)
         │
         └─ Komplexe Anfrage? (Nachtrag, Planung)
             └─ JA → Qwen 72B (gruendlich)
```

### 2.2 Modell-Auswahl Heuristik

```typescript
function selectModel(message: string, hasAttachments: boolean): {
  provider: "ollama" | "claude";
  model: string;
} {
  // Vision-Anfragen → immer Claude
  if (hasAttachments) {
    return { provider: "claude", model: "claude-sonnet-4-20250514" };
  }

  // Komplexe Aktionen → Qwen 72B
  const complexPatterns = [
    /nachtrag/i, /anlegen/i, /erstell/i, /mail.*schreib/i,
    /email.*vorbereit/i, /warum/i, /erklaer/i, /vergleich/i,
    /kalkul/i, /plan/i, /umplan/i,
  ];
  if (complexPatterns.some((p) => p.test(message))) {
    return { provider: "ollama", model: "qwen2.5:72b-instruct-q5_K_M" };
  }

  // Alles andere → QwQ 32B (schnell)
  return { provider: "ollama", model: "qwq:32b-q4_K_M" };
}
```

### 2.3 Neuer agent-chat/index.ts (Privacy Router)

Die zentrale Aenderung: Der Tool-Use-Loop wird provider-agnostisch.
Die Anthropic SDK wird durch einen Wrapper ersetzt der beide Backends bedient.

```typescript
// ── Provider Abstraction ──────────────────────────────────────

interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ContentBlock[];
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

interface ToolCall {
  id: string;
  function: { name: string; arguments: string };
}

interface LLMResponse {
  content: string;
  tool_calls: ToolCall[];
  stop_reason: "stop" | "tool_calls";
}

// ── Ollama Provider (OpenAI-kompatibel) ────────────────────────

async function callOllama(
  model: string,
  systemPrompt: string,
  messages: LLMMessage[],
  tools: OllamaToolDef[]
): Promise<LLMResponse> {
  const ollamaUrl = Deno.env.get("OLLAMA_URL") || "https://ollama.deinebauloewen.de";
  const ollamaKey = Deno.env.get("OLLAMA_API_KEY") || "";

  const ollamaMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map(formatForOpenAI),
  ];

  const res = await fetch(`${ollamaUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ollama-key": ollamaKey,
    },
    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      tools,
      tool_choice: "auto",
      max_tokens: 2048,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(60_000), // 60s Timeout
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  const choice = data.choices[0];

  return {
    content: choice.message.content || "",
    tool_calls: choice.message.tool_calls || [],
    stop_reason: choice.finish_reason === "tool_calls" ? "tool_calls" : "stop",
  };
}

// ── Claude Provider (bestehender Code) ─────────────────────────

async function callClaude(
  model: string,
  systemPrompt: string,
  messages: LLMMessage[],
  tools: AnthropicToolDef[]
): Promise<LLMResponse> {
  const anthropic = new Anthropic({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
  });

  const claudeMessages = messages.map(formatForAnthropic);

  const response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    tools,
    messages: claudeMessages,
  });

  // Claude-Format in einheitliches Format konvertieren
  const textBlocks = response.content.filter(b => b.type === "text");
  const toolUseBlocks = response.content.filter(b => b.type === "tool_use");

  const toolCalls: ToolCall[] = toolUseBlocks.map(b => ({
    id: b.id,
    function: {
      name: b.name,
      arguments: JSON.stringify(b.input),
    },
  }));

  return {
    content: textBlocks.map(b => b.text).join("\n"),
    tool_calls: toolCalls,
    stop_reason: toolUseBlocks.length > 0 ? "tool_calls" : "stop",
  };
}

// ── Unified Tool Use Loop ──────────────────────────────────────

async function agentLoop(
  provider: "ollama" | "claude",
  model: string,
  systemPrompt: string,
  initialMessages: LLMMessage[],
  tools: any[],
  userRole: string,
  sb: SupabaseClient
): Promise<{ text: string; toolCalls: any[]; toolResults: any[] }> {
  let messages = [...initialMessages];
  let finalText = "";
  const allToolCalls = [];
  const allToolResults = [];

  for (let i = 0; i < 5; i++) {
    const response = provider === "ollama"
      ? await callOllama(model, systemPrompt, messages, tools)
      : await callClaude(model, systemPrompt, messages, tools);

    if (response.content) finalText += response.content;

    if (response.tool_calls.length === 0 || response.stop_reason === "stop") {
      break;
    }

    // Tools ausfuehren
    const toolResultMessages: LLMMessage[] = [];
    for (const tc of response.tool_calls) {
      const args = JSON.parse(tc.function.arguments);
      allToolCalls.push({ name: tc.function.name, input: args });

      const result = await executeTool(tc.function.name, args, userRole, sb);
      allToolResults.push({ name: tc.function.name, result: JSON.parse(result) });

      toolResultMessages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result,
      });
    }

    // Konversation erweitern
    messages = [
      ...messages,
      { role: "assistant", content: "", tool_calls: response.tool_calls },
      ...toolResultMessages,
    ];
  }

  return { text: finalText, toolCalls: allToolCalls, toolResults: allToolResults };
}
```

### 2.4 Tool-Definitionen (OpenAI-Format, funktioniert fuer Ollama UND Claude)

```typescript
const TOOLS_OPENAI_FORMAT = [
  {
    type: "function",
    function: {
      name: "query_positions",
      description: "Angebotspositionen eines Projekts abfragen, optional nach Raum filtern.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
          room: { type: "string", description: "Optional: Raumfilter (z.B. 'Kueche', 'Bad')" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_catalog",
      description: "Katalog durchsuchen nach Leistungspositionen.",
      parameters: {
        type: "object",
        properties: {
          catalog_id: { type: "string", description: "Katalog-UUID (optional, Default: DBL-2026)" },
          search_term: { type: "string", description: "Suchbegriff (z.B. 'Raufaser', 'Thermostat')" },
        },
        required: ["search_term"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_change_order",
      description: "Nachtrag anlegen fuer ein Projekt. Nur GF und BL duerfen das.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
          description: { type: "string", description: "Beschreibung des Nachtrags" },
          positions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                catalog_code: { type: "string" },
              },
              required: ["title", "quantity", "unit"],
            },
          },
        },
        required: ["project_id", "description", "positions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_email",
      description: "E-Mail vorbereiten, geht ins Freigabecenter.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
          to: { type: "string", description: "Empfaenger-Email" },
          subject: { type: "string", description: "Betreff" },
          body: { type: "string", description: "Email-Text" },
        },
        required: ["project_id", "to", "subject", "body"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_status",
      description: "Aktuellen Projektstatus mit Ampel abrufen.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_schedule",
      description: "Einsatzplan eines Projekts abrufen.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projekt-UUID" },
        },
        required: ["project_id"],
      },
    },
  },
];
```

### 2.5 Fallback-Strategie im Detail

```typescript
async function routeAndExecute(req: ChatRequest, sb: SupabaseClient) {
  const hasAttachments = (req.attachments?.length ?? 0) > 0;
  const routing = selectModel(req.message, hasAttachments);

  // Versuch 1: Primaerer Provider
  try {
    if (routing.provider === "ollama") {
      // Healthcheck (schnell, 3s timeout)
      const health = await fetch(
        `${Deno.env.get("OLLAMA_URL")}/`,
        { signal: AbortSignal.timeout(3000) }
      ).catch(() => null);

      if (!health?.ok) {
        console.warn("Ollama nicht erreichbar, Fallback auf Claude");
        return await callClaudeAgent(req, sb);
      }

      return await callOllamaAgent(routing.model, req, sb);
    } else {
      return await callClaudeAgent(req, sb);
    }
  } catch (err) {
    console.error(`Provider ${routing.provider} failed:`, err);

    // Versuch 2: Fallback
    try {
      if (routing.provider === "ollama") {
        console.warn("Ollama failed, Fallback auf Claude");
        return await callClaudeAgent(req, sb);
      } else {
        // Claude auch down? Fehlermeldung.
        throw err;
      }
    } catch (fallbackErr) {
      return {
        text: "Ich bin gerade nicht erreichbar. Bitte versuch es in 5 Minuten noch einmal.",
        toolCalls: [],
        toolResults: [],
        provider: "error",
      };
    }
  }
}
```

### 2.6 Neue Environment Variables (Edge Function)

```
# Supabase Edge Function Secrets
ANTHROPIC_API_KEY=sk-ant-...          # Bestehend
OLLAMA_URL=https://ollama.deinebauloewen.de  # NEU
OLLAMA_API_KEY=bg-strix-secret-2026          # NEU
```

```bash
# Secrets setzen via Supabase CLI
supabase secrets set OLLAMA_URL=https://ollama.deinebauloewen.de
supabase secrets set OLLAMA_API_KEY=bg-strix-secret-2026
```

---

## PHASE 3: NACHT-JOBS AUF DER STRIX BOX

Die Box laeuft 24/7, hat Supabase-Zugang und Ollama. Perfekt fuer Batch-Jobs.

### 3.1 Verzeichnisstruktur

```
/opt/baugenius-jobs/
├── package.json
├── .env
├── lib/
│   ├── supabase.ts        # Supabase Service Client
│   ├── ollama.ts          # Ollama Client
│   └── telegram.ts        # Telegram Bot API
├── jobs/
│   ├── lexware-reconciliation.ts   # 06:00
│   ├── overdue-check.ts            # 06:15
│   ├── material-check.ts           # 06:30
│   └── daily-report.ts             # 07:00
└── cron-setup.sh
```

### 3.2 Crontab

```bash
# /etc/cron.d/baugenius-jobs
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

# Lexware Reconciliation
0  6 * * 1-5  root  cd /opt/baugenius-jobs && npx tsx jobs/lexware-reconciliation.ts >> /var/log/bg-jobs.log 2>&1

# Ueberfaelligkeits-Check
15 6 * * 1-5  root  cd /opt/baugenius-jobs && npx tsx jobs/overdue-check.ts >> /var/log/bg-jobs.log 2>&1

# Material-Check
30 6 * * 1-5  root  cd /opt/baugenius-jobs && npx tsx jobs/material-check.ts >> /var/log/bg-jobs.log 2>&1

# Daily Report
0  7 * * 1-5  root  cd /opt/baugenius-jobs && npx tsx jobs/daily-report.ts >> /var/log/bg-jobs.log 2>&1
```

### 3.3 Job-Beispiel: Daily Report

```typescript
// jobs/daily-report.ts
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_GF_CHAT_ID!;

async function dailyReport() {
  // Aktive Projekte
  const { count: activeProjects } = await sb
    .from("projects")
    .select("id", { count: "exact", head: true })
    .in("status", ["ACTIVE", "PLANNING", "IN_PROGRESS", "INSPECTION"]);

  // Offene Freigaben
  const { count: pendingApprovals } = await sb
    .from("approvals")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");

  // Ueberfaellige Rechnungen
  const { data: overdue } = await sb
    .from("purchase_invoices")
    .select("id, invoice_number, due_date")
    .eq("status", "PENDING")
    .lt("due_date", new Date().toISOString().split("T")[0]);

  // Ollama fuer Zusammenfassung nutzen (optional)
  const summary = [
    `📊 *BauGenius Daily Report*`,
    ``,
    `📋 ${activeProjects} aktive Projekte`,
    `⏳ ${pendingApprovals} offene Freigaben`,
    `🔴 ${overdue?.length || 0} ueberfaellige Rechnungen`,
  ];

  if (overdue && overdue.length > 0) {
    summary.push(``);
    summary.push(`*Ueberfaellige Rechnungen:*`);
    for (const inv of overdue.slice(0, 5)) {
      summary.push(`  • ${inv.invoice_number} (faellig: ${inv.due_date})`);
    }
  }

  // Telegram senden
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: summary.join("\n"),
      parse_mode: "Markdown",
    }),
  });

  console.log(`[${new Date().toISOString()}] Daily report sent.`);
}

dailyReport().catch(console.error);
```

---

## PHASE 4: MONITORING

### 4.1 Healthcheck-Service

Datei: `/opt/ollama-monitor/healthcheck.sh`

```bash
#!/bin/bash
# Alle 5 Minuten via Cron ausfuehren

OLLAMA_URL="http://localhost:11434"
TELEGRAM_BOT="<BOT_TOKEN>"
TELEGRAM_CHAT="<GF_CHAT_ID>"
ALERT_FILE="/tmp/ollama_alert_sent"

# Test 1: Ollama erreichbar?
RESPONSE=$(curl -sf --max-time 5 "$OLLAMA_URL/" 2>&1)
if [ "$RESPONSE" != "Ollama is running" ]; then
  if [ ! -f "$ALERT_FILE" ]; then
    curl -s "https://api.telegram.org/bot$TELEGRAM_BOT/sendMessage" \
      -d "chat_id=$TELEGRAM_CHAT" \
      -d "text=🔴 Ollama ist DOWN! Response: $RESPONSE" \
      -d "parse_mode=Markdown"
    touch "$ALERT_FILE"
  fi
  exit 1
fi

# Test 2: Modell geladen?
MODELS=$(curl -sf "$OLLAMA_URL/api/ps" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('models',[])))" 2>/dev/null)
if [ "$MODELS" = "0" ]; then
  # Modell vorladen
  curl -sf "$OLLAMA_URL/api/generate" -d '{"model":"qwen2.5:72b-instruct-q5_K_M","prompt":"hi","stream":false}' > /dev/null 2>&1 &
fi

# Alles OK — Alert-Flag loeschen
if [ -f "$ALERT_FILE" ]; then
  curl -s "https://api.telegram.org/bot$TELEGRAM_BOT/sendMessage" \
    -d "chat_id=$TELEGRAM_CHAT" \
    -d "text=🟢 Ollama ist wieder online!" \
    -d "parse_mode=Markdown"
  rm -f "$ALERT_FILE"
fi
```

```bash
# Cron: Alle 5 Minuten
echo "*/5 * * * * root /opt/ollama-monitor/healthcheck.sh >> /var/log/ollama-health.log 2>&1" | sudo tee /etc/cron.d/ollama-health
```

### 4.2 Metriken in chat_messages

Jede Antwort wird mit Provider-Info gespeichert:

```typescript
await sb.from("chat_messages").insert({
  project_id,
  user_id,
  role: "assistant",
  content: finalText,
  tool_calls: allToolCalls.length > 0 ? allToolCalls : null,
  tool_results: allToolResults.length > 0 ? allToolResults : null,
  metadata: {
    provider: routing.provider,    // "ollama" oder "claude"
    model: routing.model,          // "qwen2.5:72b-instruct-q5_K_M"
    latency_ms: Date.now() - startTime,
    user_role,
    user_name,
    fallback_used: fallbackUsed,   // true wenn Ollama → Claude Fallback
  },
});
```

### 4.3 Kosten-Dashboard Query

```sql
-- Chat-Agent Kosten-Analyse
SELECT
  date_trunc('week', created_at) AS woche,
  (metadata->>'provider') AS provider,
  count(*) AS anfragen,
  round(avg((metadata->>'latency_ms')::int)) AS avg_latency_ms,
  count(*) FILTER (WHERE metadata->>'fallback_used' = 'true') AS fallbacks
FROM chat_messages
WHERE role = 'assistant'
  AND metadata->>'provider' IS NOT NULL
GROUP BY 1, 2
ORDER BY 1 DESC, 2;
```

---

## PHASE 5: PERFORMANCE-ERWARTUNGEN

### Strix Halo 395+ mit 128GB LPDDR5X

| Modell | Groesse | Prompt (tok/s) | Generation (tok/s) | Typische Antwortzeit |
|--------|---------|---------------|-------------------|---------------------|
| Qwen 2.5 72B Q5_K_M | ~50GB | 15-30 | 4-6 | 8-15 Sekunden |
| QwQ 32B Q4_K_M | ~20GB | 30-60 | 10-14 | 3-6 Sekunden |
| Claude Sonnet (Cloud) | — | — | ~80 | 2-4 Sekunden |

**Engpass: Speicherbandbreite.** 256 GB/s LPDDR5X ist der limitierende Faktor.
Jeder generierte Token muss die gesamten Modellgewichte lesen (~50GB fuer 72B Q5).
256 / 50 = ~5.1 tok/s theoretisches Maximum.

**Fuer den BauGenius Chat ist das akzeptabel:**
- Einfache Anfragen (Status, Positionen) → QwQ 32B → 3-6 Sekunden
- Komplexe Anfragen (Nachtraege, Erklaerungen) → Qwen 72B → 8-15 Sekunden
- Vision-Anfragen (PDF lesen) → Claude Cloud → 2-4 Sekunden

Zum Vergleich: WhatsApp-Antwortzeit-Erwartung ist 5-30 Sekunden. Passt.

---

## PHASE 6: IMPLEMENTIERUNGS-REIHENFOLGE

| Schritt | Was | Dauer | Abhaengigkeit |
|---------|-----|-------|---------------|
| **1** | Strix Halo bestellen + Ubuntu installieren | 1-2 Wochen | Hardware-Lieferung |
| **2** | Ollama + Qwen 72B + QwQ 32B installieren | 1 Tag | Schritt 1 |
| **3** | Cloudflare Tunnel + Auth-Proxy einrichten | 0.5 Tag | Schritt 2 |
| **4** | Edge Function: Provider-Abstraction + Ollama-Client | 1 Tag | Schritt 3 |
| **5** | Edge Function: Privacy Router + Fallback | 0.5 Tag | Schritt 4 |
| **6** | Tool-Definitionen auf OpenAI-Format migrieren | 0.5 Tag | Schritt 4 |
| **7** | Testen: Alle 6 Tools lokal, Rollen-Enforcement | 1 Tag | Schritt 6 |
| **8** | chat_messages.metadata mit Provider-Info erweitern | 0.5 Tag | Schritt 5 |
| **9** | Healthcheck + Telegram-Alert einrichten | 0.5 Tag | Schritt 2 |
| **10** | Nacht-Jobs (Daily Report, Overdue, Material) | 1 Tag | Schritt 2 |
| **11** | 1 Woche Parallelbetrieb (Ollama + Claude) | 1 Woche | Schritt 7 |
| **12** | Claude-Kosten analysieren, Router-Schwelle anpassen | 0.5 Tag | Schritt 11 |

**Gesamt: ~2 Wochen ab Hardware-Lieferung bis Produktiv**

---

## OFFENE ENTSCHEIDUNGEN

| # | Frage | Empfehlung | Entscheidung durch |
|---|-------|-----------|-------------------|
| 1 | Cloudflare Tunnel vs eigener VPS-Relay? | Cloudflare (kostenlos, Zero Trust) | Dennis |
| 2 | Ollama API-Key: Einfacher Header vs Cloudflare Access? | Einfacher Header (weniger Overhead) | Dennis |
| 3 | QwQ 32B als Fast-Path oder nur Qwen 72B? | Beide (QwQ fuer einfach, 72B fuer komplex) | Test nach Schritt 7 |
| 4 | Nacht-Jobs: Node.js oder Python? | Node.js (TypeScript, gleicher Stack wie Rest) | Team |
| 5 | Godmode-Learner auch auf Strix Box? | Ja, als Nacht-Job (SOLL/IST mit Ollama) | Spaeter |

---

## SICHERHEIT

| Massnahme | Status |
|-----------|--------|
| Ollama nur ueber Auth-Proxy erreichbar | Geplant |
| Supabase Service-Role-Key nur auf Strix Box + Edge Function | Bestehend |
| WireGuard/Cloudflare Tunnel fuer Transport-Verschluesselung | Geplant |
| Keine Kundendaten an Claude (nur bei expliziter Vision-Anfrage) | Architektur-Prinzip |
| Rollen-Enforcement im System-Prompt + Tool-Ausfuehrung | Bestehend |
| Chat-Messages mit Provider-Tag fuer DSGVO-Audit | Geplant (metadata.provider) |

---

## DER GOLDENE SATZ

> **90% lokal, 0 EUR, DSGVO-safe. 10% Cloud, nur wenn ein Auge noetig ist.**
> **Wenn die Box ausfaellt, merkt Ayse nichts — Claude springt ein.**

---

**Dokument erstellt: 2026-03-22**
**Autor: Claude Opus 4.6 (Architektur) + Dennis (Anforderungen)**
