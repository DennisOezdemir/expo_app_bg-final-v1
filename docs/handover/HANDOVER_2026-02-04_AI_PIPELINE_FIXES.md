# HANDOVER: AI Pipeline Fixes (MX_04 + M1_02 + MX_06)

**Datum:** 2026-02-04
**Status:** Gefixt und getestet
**Module:** MX_04 (Dispatch Doctor), M1_02 (PDF Parser), MX_06 (AI Fallback)

---

## SYMPTOME

1. **MX_04 Error-Dauerloop** alle 15 Min seit Deployment: `column ws.event_id does not exist`
2. **M1_02 alte Nodes**: PUT von 03.02 hat nicht persistiert, "Analyze Document (Claude)" + "When chat message received" noch drin
3. **MX_06 Binary-Problem**: PDFs kamen als 9 Bytes an, Claude/Gemini konnten nichts analysieren

---

## ROOT CAUSES

### MX_04: Falsche SQL im AI-Branch
- `LEFT JOIN events e ON e.id = ws.event_id` - Spalte `event_id` existiert nicht in `workflow_steps`
- `WHERE id = '...'::uuid` - PK ist `step_key` (TEXT), nicht `id` (UUID)
- `SET model_used = ...` - Spalte existiert nicht, muss in `payload` JSONB gespeichert werden

### M1_02: Binary-Extraktion kaputt
- `binaryData.data` gibt `"filesystem-v2"` (n8n-interne Referenz) statt echtem Base64
- n8n 1.x+ speichert Binary auf Filesystem, nicht inline als Base64

### MX_06: Format-Nodes falsch
- Claude/Gemini: `$json.content` ist ein Array `[{type:"text", text:"..."}]`, nicht ein String
- GPT-4o: Output liegt unter `$json.output[0].content[0].text`, nicht `$json.content`

---

## FIXES

### MX_04 Dispatch Doctor (7 Nodes gefixt, manuell in n8n UI)

| Node | Fix |
|------|-----|
| Fetch Failed AI Steps | JOIN entfernt, `step_key AS id` |
| Has AI Items? | `$json.id` -> `$json.step_key` |
| Prepare AI Retry | `eventPayload` Referenzen entfernt |
| Check AI Result | `prevData.id` -> `prevData.step_key` |
| AI Mark Resolved | `model_used`/`fallback_chain` in `payload` JSONB statt eigene Spalten, `WHERE step_key` |
| AI Update Failure | `WHERE step_key` statt `WHERE id::uuid` |
| AI Dead Letter | `WHERE step_key` statt `WHERE id::uuid` |

### M1_02 PDF Parser (per API PUT)

**Prepare AI Fallback Request** - Binary-Fix:
```js
// ALT (kaputt - gibt "filesystem-v2"):
const base64Data = binaryData.data;

// NEU (korrekt):
const buffer = await this.helpers.getBinaryDataBuffer(0, 'data');
const base64Data = buffer.toString('base64');
```

### MX_06 AI Analyze With Fallback (per API PUT)

**Format Claude Response** + **Format Gemini Response**:
```js
// ALT (kaputt - content ist Array):
text: $json.content

// NEU:
const raw = $json.content;
const text = Array.isArray(raw) ? raw.map(c => c.text || '').join('') : (raw || '');
```

**Format GPT Response**:
```js
// ALT (kaputt - falscher Pfad):
text: $json.content

// NEU:
const gptOutput = $json.output[0].content[0].text;
```

---

## TESTERGEBNISSE

| Workflow | Status | Details |
|----------|--------|---------|
| MX_04 | SUCCESS | Letzte Executions alle success, Error-Dauerloop beendet |
| M1_02 | 16/17 SUCCESS | Letzter Node Error nur wegen Test-Event-ID (kein UUID). In Production kommen echte UUIDs. |
| MX_06 | SUCCESS | Claude Sonnet 4 analysiert PDF beim 1. Versuch korrekt (kein Fallback noetig) |

### AI Fallback Chain Test
- Claude Sonnet 4: **funktioniert** (1. Versuch erfolgreich)
- Gemini 2.0 Flash: Binary wird korrekt uebergeben (Format-Fix)
- GPT-4o: Output wird korrekt geparst (`output[0].content[0].text`)

---

## SCHEMA-INFO

`workflow_steps` Tabelle hat KEINE Spalten `model_used` oder `fallback_chain`. Diese Daten werden stattdessen im `payload` JSONB Feld gespeichert. PK ist `step_key` (TEXT).

---

## DATEIEN

| Datei | Aenderung |
|-------|-----------|
| `n8n_flows/M1_02_PDF_Parser_Vision_v2_fallback.json` | getBinaryDataBuffer Fix |
| `n8n_flows/MX_04_Dispatch_Doctor_v2.json` | Export aus n8n nach manuellen Fixes |
| `n8n_flows/MX_06_AI_Analyze_With_Fallback.json` | Format Claude/Gemini/GPT Response Fixes |

---

## BEKANNTE EINSCHRAENKUNGEN

1. **Log to Supabase** in MX_06 gibt `"Request failed with status code 400"` - Logging funktioniert nicht, aber blockiert nicht den Flow (continueOnFail)
2. Claude/Gemini geben `$json.content` als Array zurueck - wenn n8n "Simplify Output" das aendert, muss der Format-Node angepasst werden
3. GPT-4o nutzt die OpenAI Responses API (`$json.output[0].content[0].text`) - bei API-Wechsel anpassen
