# BauGenius Local-LLM (Gemini/Ollama) Implementation Report

> **Stand:** 21. März 2026
> **Projekt:** 90% Lokale Verarbeitung (DSGVO, Kosten), 10% Claude Cloud (Vision)
> **Hardware:** ASUS NUC Strix Halo (128GB Unified RAM)
> **Modell:** Qwen 2.5 72B (Q4 Quantisierung via Ollama)

---

## 1. ARCHITEKTUR-ÜBERSICHT

Der **Privacy Router** in der Supabase Edge Function `agent-chat` entscheidet nun dynamisch:

1.  **Claude-Route (Cloud):** Wenn die Nachricht Anhänge (`attachments`) enthält, wird das Vision-Modell (Claude 3.5 Sonnet) genutzt.
2.  **Ollama-Route (Lokal):** Für alle anderen Anfragen wird der lokale NUC kontaktiert.
3.  **Fallback-Logik:** Wenn die Strix Box offline ist oder ein Timeout (>2s) beim Healthcheck auftritt, wird automatisch auf Claude Cloud ausgewichen.

---

## 2. KOMPONENTEN IM ORDNER

| Datei | Beschreibung |
|-------|--------------|
| `setup.sh` | Bash-Script zur Installation von Ollama, Pulling des 72B Modells und LAN-Konfiguration auf Ubuntu. |
| `night-jobs.js` | Node.js Automatisierung für Reconciliation, Material-Check und GF-Briefing (Cron-Jobs). |
| `agent-chat.ts` | Vollständiger Code für die `agent-chat` Edge Function (Privacy Router + Tool Calling). |
| `migration.sql` | SQL Migration zum Hinzufügen der `attachments` Spalte in `chat_messages`. |

---

## 3. SETUP-ANLEITUNG FÜR DIE STRIX BOX

1.  **Server vorbereiten:** Ubuntu 24.04 LTS installieren.
2.  **Setup ausführen:**
    ```bash
    chmod +x setup.sh
    ./setup.sh
    ```
3.  **Secrets in Supabase setzen:**
    ```bash
    supabase secrets set OLLAMA_API_URL="https://dein-tunnel.com/api/chat"
    supabase secrets set OLLAMA_MODEL="qwen2.5:72b"
    ```
4.  **Telegram-Bot:** Erstelle einen Bot via BotFather und trage den Token in die `.env` auf der Box ein.

---

## 4. ROLE-ENFORCEMENT (LOKAL & CLOUD)

Der System-Prompt wurde für beide Routen vereinheitlicht:

- **GF:** Volle Transparenz (Margen, Finanzen, Projekte).
- **Bauleiter:** Nur projektbezogene Daten, keine Margen/Finanzen anderer Projekte.
- **Monteur:** Nur Aufgaben und Materialien. Keine Preise, keine Margen.

---

## 5. MONITORING

Die Box loggt alle Anfragen. In Supabase kann über das Feld `metadata->model` in `chat_messages` ausgewertet werden, wie hoch der Anteil der lokalen vs. Cloud-Anfragen ist.

**Zielmetrik:** > 90% der Anfragen sollten `ollama:qwen2.5-72b` als Modell anzeigen.
