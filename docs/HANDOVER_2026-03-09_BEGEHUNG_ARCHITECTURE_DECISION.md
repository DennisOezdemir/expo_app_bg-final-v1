# Begehungsarchitektur Entscheidung

> **Datum:** 2026-03-09  
> **Entscheidung:** Frontend liest und schreibt Begehungsdaten ueber Supabase-Tabellen und RPC-nahe Strukturen, nicht ueber den Express-`/api/begehungen`-Pfad.

## Problem

Im Repo existierten parallel zwei Modelle fuer denselben Fachprozess:

1. `inspection_protocols` + `inspection_protocol_items` in Supabase
2. `begehungen` + `begehung_positions` hinter `server/routes.ts`

Zusätzlich sagte [docs/CORE_FLOW_API.md](/Users/DBL/Projects/Projekt%20Baugenius%20Stand%2028.02.2026/expo_app_bg-final-v1/docs/CORE_FLOW_API.md), dass die Logik ueber PostgreSQL-/Supabase-Funktionen laufen soll, waehrend `app/begehung/[type].tsx` teilweise den Express-API-Pfad `/api/begehungen/...` nutzte.

## Entscheidung

Die App verwendet fuer den aktiven Begehungsflow ab jetzt nur noch die Supabase-Seite als Quelle der Wahrheit:

- Laden aus `inspection_protocols`
- Laden aus `inspection_protocol_items`
- Schreiben in dieselben Tabellen
- Folgeausbau optional ueber `supabase.rpc(...)`, aber weiterhin auf derselben Datenbasis

Der Express-Pfad fuer `begehungen` gilt damit als Altpfad und nicht als Zielarchitektur fuer neue Frontend-Arbeit.

## Begruendung

- passt zur bestehenden Produktdoku
- reduziert doppelte Fachlogik
- vermeidet Mapping zwischen zwei konkurrierenden Datenmodellen
- erleichtert RLS, Realtime und mobile/offline-nahe Frontend-Integration

## Konkrete Folge

- `app/begehung/[type].tsx` liest den letzten ZB-Stand nicht mehr ueber `/api/begehungen/...`, sondern ueber Supabase-Protokolle
- neue API-Helfer liegen unter `lib/api/inspections.ts`
- neue Arbeiten an Begehungen sollen auf `inspection_protocols` / `inspection_protocol_items` aufsetzen

## Offener Rest

- `server/routes.ts` enthaelt weiterhin den Altpfad fuer `begehungen`
- dieser Pfad sollte erst entfernt werden, wenn sicher ist, dass keine externen Integrationen mehr darauf zugreifen
