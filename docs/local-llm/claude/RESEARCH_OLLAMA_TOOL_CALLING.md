# Ollama Tool Calling Research

> Recherche-Ergebnis: Modell-Vergleich, API-Format, Hardware-Specs, Performance
> Erstellt: 2026-03-22 von Claude Opus 4.6

---

## 1. Modell-Empfehlung

### Gewinner: Qwen 2.5 72B Instruct

| Kriterium | Qwen 2.5 72B | Llama 3.3 70B | Mistral Large 2 | QwQ 32B |
|-----------|-------------|---------------|-----------------|---------|
| **Tool Calling** | Exzellent (BFCL Top) | Gut | Sehr gut | Gut |
| **Deutsch** | Sehr gut | Mittel (English-lastig) | Gut | Gut |
| **Baustellenterminologie** | Beste unter den Open-Source | Schwaecher | Gut | OK |
| **RAM-Bedarf (Q5_K_M)** | ~54 GB | ~52 GB | ~88 GB (zu gross) | ~24 GB |
| **Passt in 128GB?** | Ja, komfortabel | Ja | Knapp | Ja |

### Quantisierungs-Tabelle fuer 128GB RAM

| Quantisierung | Modellgroesse | + Context (8K) | Total RAM | Qualitaetsverlust |
|--------------|--------------|----------------|-----------|-------------------|
| Q4_K_M | ~42 GB | ~4 GB | ~46 GB | Minimal |
| **Q5_K_M** | **~50 GB** | **~4 GB** | **~54 GB** | **Sehr gering (EMPFOHLEN)** |
| Q6_K | ~58 GB | ~4 GB | ~62 GB | Fast keiner |
| Q8_0 | ~76 GB | ~4 GB | ~80 GB | Keiner |
| FP16 | ~144 GB | ~4 GB | ~148 GB | Baseline (passt nicht) |

**Empfehlung: Q5_K_M** — Laesst 74 GB frei fuer OS + zweites Modell (QwQ 32B Q4_K_M ~20 GB).

---

## 2. Ollama Tool Calling API Format

### Native API (`/api/chat`)

**Request mit Tools:**

```json
{
  "model": "qwen2.5:72b-instruct-q5_K_M",
  "messages": [
    { "role": "system", "content": "Du bist ein Baugenius Assistent." },
    { "role": "user", "content": "Was ist im Bad beauftragt?" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "query_positions",
        "description": "Angebotspositionen nach Raum abfragen",
        "parameters": {
          "type": "object",
          "properties": {
            "project_id": { "type": "string" },
            "room": { "type": "string" }
          },
          "required": ["project_id"]
        }
      }
    }
  ],
  "stream": false
}
```

**Response mit Tool Call:**

```json
{
  "message": {
    "role": "assistant",
    "content": "",
    "tool_calls": [
      {
        "function": {
          "name": "query_positions",
          "arguments": { "project_id": "abc-123", "room": "Bad" }
        }
      }
    ]
  },
  "done": true
}
```

**Tool-Ergebnis zuruecksenden:**

```json
{
  "model": "qwen2.5:72b-instruct-q5_K_M",
  "messages": [
    { "role": "user", "content": "Was ist im Bad beauftragt?" },
    {
      "role": "assistant", "content": "",
      "tool_calls": [{ "function": { "name": "query_positions", "arguments": { "project_id": "abc-123", "room": "Bad" } } }]
    },
    {
      "role": "tool",
      "content": "{\"positions\":[{\"title\":\"Wandfliesen\",\"quantity\":28,\"unit\":\"m2\"}],\"count\":1}"
    }
  ],
  "tools": [/* gleiche Tool-Definitionen */],
  "stream": false
}
```

### OpenAI-kompatible API (`/v1/chat/completions`) — EMPFOHLEN

Gleiche Request/Response-Struktur wie OpenAI. Kann mit dem OpenAI SDK genutzt werden:

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://strix-halo:11434/v1",
  apiKey: "ollama",  // Pflichtfeld, wird ignoriert
});

const response = await client.chat.completions.create({
  model: "qwen2.5:72b-instruct-q5_K_M",
  messages: [/* ... */],
  tools: [/* OpenAI-Format, identisch zu Ollama native */],
  tool_choice: "auto",
});
```

**Wichtiger Unterschied:** Native API gibt `arguments` als Object zurueck, OpenAI-API gibt `arguments` als JSON-String zurueck (wie echtes OpenAI).

---

## 3. Strix Halo 395+ Hardware-Specs

| Komponente | Spezifikation |
|-----------|--------------|
| **CPU** | AMD Ryzen AI Max+ 395 — 16 Zen 5 Kerne / 32 Threads, bis 5.1 GHz |
| **GPU** | Radeon 8060S integriert — 40 RDNA 3.5 CUs (2560 Shader) |
| **NPU** | XDNA 2 — 50 TOPS INT8 |
| **RAM** | 128 GB LPDDR5X-8000, unified (geteilt CPU/GPU) |
| **Bandbreite** | ~256 GB/s (8-Kanal LPDDR5X) |
| **TDP** | 120W (NUC-Variante) |
| **Storage** | PCIe 4.0 NVMe |
| **Netzwerk** | WiFi 7, 2.5 GbE, Thunderbolt 4, USB4 |

### Verfuegbarer RAM fuer Inference

- OS + System: ~4-6 GB
- Ollama-Prozess: ~1-2 GB
- **Verfuegbar: ~120-122 GB** fuer Modelle + Context

### Performance-Erwartungen

| Modell | Prompt tok/s | Generation tok/s | Engpass |
|--------|-------------|-----------------|---------|
| Qwen 72B Q5_K_M (50GB) | 15-30 | **4-6** | Speicherbandbreite (256/50 = 5.1 max) |
| QwQ 32B Q4_K_M (20GB) | 30-60 | **10-14** | Speicherbandbreite (256/20 = 12.8 max) |

**Bottleneck:** Token-Generation ist speicherbandbreiten-limitiert. Jeder Token erfordert einen vollstaendigen Lese-Pass ueber alle Modellgewichte.

---

## 4. Ollama systemd Service

### Automatisch erstellt bei Installation:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Konfiguration (`/etc/systemd/system/ollama.service`):

```ini
[Unit]
Description=Ollama LLM Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=5

Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_NUM_PARALLEL=2"
Environment="OLLAMA_MAX_LOADED_MODELS=2"
Environment="OLLAMA_KEEP_ALIVE=30m"
Environment="HSA_OVERRIDE_GFX_VERSION=11.5.0"

LimitNOFILE=65535
LimitMEMLOCK=infinity

[Install]
WantedBy=multi-user.target
```

### Health-Checks:

```bash
# Service laeuft?
curl http://localhost:11434/
# → "Ollama is running"

# Geladene Modelle?
curl http://localhost:11434/api/ps

# Alle verfuegbaren Modelle?
curl http://localhost:11434/api/tags
```

---

## 5. OpenAI API Kompatibilitaet

| Feature | Unterstuetzt | Anmerkung |
|---------|-------------|-----------|
| `/v1/chat/completions` | Ja | Voll kompatibel |
| `tools` / `tool_calls` | Ja | Seit Ollama ~v0.3.x |
| `tool_choice: "auto"` | Ja | |
| `tool_choice: "none"` | Ja | |
| `tool_choice: {function}` | Ja | Erzwingt bestimmtes Tool |
| `response_format: json` | Ja | JSON-Modus |
| Streaming + Tools | Ja | |
| `temperature`, `top_p` | Ja | |
| `max_tokens` | Ja | Mappt auf `num_predict` |
| `/v1/models` | Ja | Listet verfuegbare Modelle |
| `/v1/embeddings` | Ja | Mit Embedding-Modellen |

**Fazit:** Code der gegen OpenAI geschrieben ist, laeuft mit Ollama durch Aendern von `baseURL`.
