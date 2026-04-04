# Local LLM Ergebnisse

Stand: 2026-03-22

Dieser Ordner enthaelt die von Codex erarbeitete Empfehlung fuer den BauGenius Local-LLM-Rollout.

- Hauptbericht: `LOCAL_LLM_ARCHITEKTUR_2026-03-22.md`

Kernaussage:

- Fuer den aktuellen Stack ist eine Supabase-Edge-Function als Control Plane plus Strix-Box als Inference-Worker die beste Zielarchitektur.
- Die App sollte nicht direkt per VPN auf die Box zugreifen.
- Vor dem Rollout muss die serverseitige Rollen- und Projektpruefung gehaertet werden, weil der aktuelle Chat-Endpoint Rollen aus dem Client-Request vertraut.
