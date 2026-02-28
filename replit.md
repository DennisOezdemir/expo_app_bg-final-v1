# BAUGENIUS

## Overview

BAUGENIUS is a construction management mobile application built with Expo (React Native) and an Express.js backend. The app is German-language and provides features for construction project management including project tracking (Projekte), approvals/releases (Freigaben), material management (Material), and user profiles (Profil). The app uses a dark theme with amber accent colors and targets iOS, Android, and web platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## BAUGENIUS Design Rules (aus docs/)

### NORDSTAR (docs/NORDSTAR.md)
- Vision: "Mail rein, 30 Sekunden, alles ready, Freigeben"
- Feature-Creep-Filter: "Macht es den 30-Sekunden-Flash besser?" Ja = einbauen, Nein = später oder nie
- 7 UX-Gebote: (1) Eine Sache pro Moment (2) Kontext kommt mit (3) Proaktiv - BG wartet nicht (4) Max 2 Klicks bis Action (5) Zahlen die sprechen - Vergleich/Trend/Bewertung (6) Ampel überall - grün/gelb/rot (7) Stille ist Gold - Still = läuft, Piep = handeln
- Goldener Satz: "Jeder Schritt braucht: Status, Owner, Rollback-Option"

### PERSONA AYSE (docs/PERSONA_AYSE.md)
- Ayse, 46, Projektmanagerin, Samsung, draußen (Sonne/Regen), Handschuhe, Unterbrechungen alle 5 Min
- Braucht: Große Buttons (min 44px), Ampelfarben, Deutsche Begriffe, sofort sichtbar ohne scrollen
- Hasst: Kleine Schrift, versteckte Menüs, englische Fachbegriffe
- 3-Sekunden-Regel: "Wenn sie nach 3 Sekunden nicht weiß wo sie tippen soll, ist das Design falsch"
- Checkliste: Daumen-bedienbar, Buttons >= 44px, Ampelfarben, Labels auf Deutsch, Hauptaktion sofort sichtbar, outdoor-lesbar, max 1 Tap zur Hauptaktion

### AUTOMATION MANIFEST (docs/AUTOMATION_MANIFEST.md)
- User = Entscheider, System = Arbeiter
- Unter 80% Automation ist nicht akzeptabel
- Goldene Regel: Kein Feature das regelmäßige manuelle Eingabe braucht
- Eingabe nur bei: Einmalig (Projekt anlegen), Entscheidung (Freigabe ja/nein), Ausnahme (Korrektur)
- Automation-Pyramide: Sammeln -> Analysieren -> Vorschlagen -> Entscheiden (User)

### ARBEITSWEISE (docs/ARBEITSWEISE.md)
- UI-First Hybrid: Skizze -> DB-Anforderung -> Parallel Build (DB + UI) -> Flow wenn nötig -> Test
- Anti-Pattern: DB ohne sichtbaren Output, Features ohne UI, alles durchplanen vor dem Bauen
- Jedes Feature = sichtbare Änderung

### USP VISION (docs/USP_BAUGENIUS_VISION.md)
- "Das System lernt dich" - Observe -> Pattern -> Suggest -> Confirm -> Learn
- Nach 3x gleiche Zuordnung wird Default
- Unternehmens-DNA digitalisiert: Planung, Vorsteps, Material, Zeit, Einkauf, Kommunikation, Fehler

### ARCHITEKTUR (docs/ARCHITEKTUR.md)
- Event-System: events Tabelle mit idempotency_key, processed_at, source_flow
- Flow-Template: Webhook Trigger -> Claim Step -> Business Logic -> Mark Processed -> Fire Next Event
- MX_00 Event Router dispatcht basierend auf event_routing Tabelle

### Weitere docs/
- docs/PATTERNS.md - n8n Flow Copy-Paste-Referenz, SQL Patterns, Webhook URLs
- docs/DATABASE_SCHEMA.md - Vollständiges DB-Schema
- docs/FLOW_REGISTER.md - Alle Flows mit Status
- docs/handover/ - Übergabe-Protokolle für einzelne Module

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture (`newArchEnabled: true`)
- **Routing**: File-based routing via `expo-router` v6 with typed routes enabled. The main navigation uses a tab layout defined in `app/(tabs)/_layout.tsx` with 5 tabs: Start (index), Projekte, Freigaben, Material, Profil
- **State Management**: TanStack React Query for server state. The query client is configured in `lib/query-client.ts` with a helper `apiRequest` function that builds URLs from `EXPO_PUBLIC_DOMAIN`
- **Styling**: React Native `StyleSheet` with a custom color system defined in `constants/colors.ts`. Dark theme only (`userInterfaceStyle: "dark"`). Uses zinc color palette for backgrounds/text and amber for accents
- **Fonts**: Inter font family (400-800 weights) loaded via `@expo-google-fonts/inter`
- **Animations**: `react-native-reanimated` for micro-interactions (e.g., press scale animations on tiles)
- **UI Libraries**: expo-blur, expo-glass-effect, expo-linear-gradient, expo-haptics for native feel. react-native-gesture-handler for touch handling. react-native-keyboard-controller for keyboard management
- **Error Handling**: Custom `ErrorBoundary` class component wrapping the entire app with a styled `ErrorFallback` component
- **Native Tab Bar**: Uses `expo-router/unstable-native-tabs` (NativeTabs) with SF Symbols on iOS, with a fallback custom tab bar for non-liquid-glass platforms
- **Authentication**: AuthContext (`contexts/AuthContext.tsx`) manages login state with AsyncStorage persistence. Animated splash screen plays once on first launch (`app/splash.tsx`), then redirects to login (`app/login.tsx`). Auth router (`app/index.tsx`) redirects based on auth state. Login supports email/password, magic link, password reset modal, and invite/first-login flow
- **Role-Based Access**: RoleContext (`contexts/RoleContext.tsx`) supports 3 personas: GF (Geschäftsführer), Bauleiter, Monteur. GF has full access including settings. Role switcher available on Profil screen for GF only
- **Debug Console**: DebugLogContext + DebugConsole component. Sidebar on web, bottom sheet on mobile. Only visible for GF role in `__DEV__` mode. Auto-logs API calls with latency tracking via `setDebugLogFn()` bridge in `lib/query-client.ts`
- **Master Data Screens** (GF only, under `app/einstellungen/`):
  - `firma.tsx` — Company settings: Firmendaten, Steuer & Recht, Bankverbindung, Zahlungsbedingungen
  - `lieferanten.tsx` — Supplier management: list view with search + detail view with contact, Konditionen, Bestellweg, orders
  - `katalog.tsx` — WABS catalog: Gewerke → Positionen → Position detail with pricing and material requirements
  - `team.tsx` — Team management: member list + invite modal with role/Gewerk selection
  - `briefpapier.tsx` — Briefpapier editor: logo upload, layout controls, header/footer config, color picker, live preview, and document templates
  - `import.tsx` — Bulk data import: 6 import types (Projekte, Kunden, Lieferanten, Produkte, Katalog/GAEB, Rechnungen/PDF), multi-step wizard (Upload → Mapping → Preview → Import), GAEB file parsing, PDF AI recognition

### Backend (Express.js)

- **Runtime**: Node.js with Express v5, written in TypeScript (compiled via `tsx` for dev, `esbuild` for production)
- **API Pattern**: RESTful API routes registered in `server/routes.ts`, prefixed with `/api`
- **CORS**: Dynamic CORS configuration supporting Replit domains and localhost for development
- **Storage Layer**: Abstracted via `IStorage` interface in `server/storage.ts`. Currently uses in-memory storage (`MemStorage`) with a Map-based implementation. Designed to be swapped for a database-backed implementation
- **Static Serving**: In production, serves a pre-built static web export of the Expo app. In development, proxies to Metro bundler

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` — currently has a `users` table with `id` (UUID), `username`, and `password` fields
- **Validation**: Uses `drizzle-zod` to generate Zod schemas from Drizzle table definitions
- **Migrations**: Drizzle Kit configured in `drizzle.config.ts`, migrations output to `./migrations` directory
- **Connection**: Uses `DATABASE_URL` environment variable for PostgreSQL connection
- **Note**: The storage layer currently uses in-memory storage, not the Postgres database. The database schema and Drizzle config are set up but the `MemStorage` class needs to be replaced with a `DatabaseStorage` class that uses Drizzle queries

### Build & Deployment

- **Development**: Two processes run concurrently — Expo dev server (`expo:dev`) and Express server (`server:dev`)
- **Production Build**: Custom build script in `scripts/build.js` that starts Metro, fetches the web bundle, and saves static assets. Server is bundled with esbuild
- **Production Run**: `server:prod` runs the bundled server which serves static files and API routes
- **Patching**: Uses `patch-package` (postinstall script) for dependency patches

### Shared Code

- The `shared/` directory contains code shared between frontend and backend (currently just the database schema and types)
- Path aliases configured: `@/*` maps to project root, `@shared/*` maps to `./shared/*`

## External Dependencies

- **PostgreSQL**: Database (connected via `DATABASE_URL` environment variable). Required for Drizzle ORM but not yet actively used by the storage layer
- **Replit Environment**: The app is designed to run on Replit, using environment variables like `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, and `REPLIT_INTERNAL_APP_DOMAIN` for URL configuration and CORS
- **Expo Services**: Uses Expo's build and development infrastructure
- **Google Fonts**: Inter font family loaded from `@expo-google-fonts/inter`
- **No external auth service**: Authentication appears to be planned but not yet implemented (user schema exists with username/password fields)