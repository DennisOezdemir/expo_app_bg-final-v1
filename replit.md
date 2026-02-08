# BAUGENIUS

## Overview

BAUGENIUS is a construction management mobile application built with Expo (React Native) and an Express.js backend. The app is German-language and provides features for construction project management including project tracking (Projekte), approvals/releases (Freigaben), material management (Material), and user profiles (Profil). The app uses a dark theme with amber accent colors and targets iOS, Android, and web platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

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