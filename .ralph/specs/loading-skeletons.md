# Loading-Skeletons Feature Specification

**Status:** Completed
**Version:** 1.0
**Last Updated:** 2026-03-12

---

## Purpose

Ersetze alle `ActivityIndicator`/`ScreenState kind="loading"` Zustände durch animierte Pulse-Skeleton-Placeholder, die die grobe UI-Struktur des jeweiligen Screens abbilden. Verbessert die wahrgenommene Ladegeschwindigkeit – besonders relevant auf der Baustelle mit schlechter Mobilverbindung – und gibt dem Nutzer sofort visuellen Kontext statt eines leeren Spinners.

---

## User Stories

- Als **Monteur auf der Baustelle** möchte ich beim Öffnen der Projektliste sofort eine strukturierte Platzhalter-Ansicht sehen, damit ich weiß dass die App lädt und nicht eingefroren ist.
- Als **Polier** möchte ich beim Öffnen der Freigaben-Übersicht einen sinnvollen Skeleton sehen, damit ich die Wartezeit einschätzen kann ohne die Orientierung zu verlieren.
- Als **Entwickler** möchte ich eine wiederverwendbare `Skeleton`-Basiskomponente nutzen, damit ich nicht für jeden Screen eigene Animationen implementieren muss.
- Als **Entwickler** möchte ich `ScreenState` mit einem optionalen `skeleton`-Prop erweitern, damit Screens eigene Skeletons übergeben können und ein generischer Fallback automatisch greift.

---

## Requirements

### Functional Requirements

#### Basiskomponente

- [x] Neue Datei `components/Skeleton.tsx` erstellen mit folgenden Exporten:
  - `SkeletonBox` – rechteckiger Block mit konfigurierbarer `width`, `height`, `borderRadius`
  - `SkeletonLine` – Textzeilen-Platzhalter mit konfigurierbarer `width`, fixer Höhe 14px
  - `SkeletonCard` – generische Karte als Fallback (kombiniert SkeletonBox-Blöcke)
- [x] Pulse-Animation via `react-native-reanimated`: Opacity wechselt zwischen `1.0` und `0.4`, Dauer 600ms pro Richtung, Loop unendlich mit `reverse: true`
- [x] Animation respektiert `AccessibilityInfo.isReduceMotionEnabled()` – bei aktiviertem Reduce Motion wird keine Animation abgespielt (statische Placeholder)
- [x] Alle Komponenten sind vollständig TypeScript-typisiert, kein `any`

#### ScreenState Erweiterung

- [x] `ScreenState` erhält neue optionale Prop `skeleton?: React.ReactNode`
- [x] Bei `kind="loading"` und vorhandenem `skeleton`-Prop: rendert den übergebenen Skeleton
- [x] Bei `kind="loading"` ohne `skeleton`-Prop: rendert `<SkeletonCard />` als generischen Fallback (ersetzt den bisherigen `ActivityIndicator`)
- [x] `kind="error"` und `kind="empty"` bleiben vollständig unverändert

#### Screen-spezifische Skeletons

- [x] **Projektliste** (`app/(tabs)/projekte.tsx`): Lokale `ProjekteListeSkeleton`-Komponente mit 4–5 Karten-Platzhaltern (Titelzeile, Adresszeile, Status-Badge-Block), wird via `skeleton`-Prop an `ScreenState` übergeben
- [x] **Freigaben** (`app/(tabs)/freigaben.tsx`): Lokale `FreigabenListeSkeleton`-Komponente mit 3–4 Listeneinträgen (Icon-Block links, Titelzeile, Betragszeile), wird via `skeleton`-Prop übergeben
- [x] **Projektdetail** (`app/project/[id].tsx`): Lokale `ProjektDetailSkeleton`-Komponente mit Header-Block (breite Titelzeile + schmale Adresszeile) und 2–3 Abschnitts-Blöcken mit je 2 Zeilen, wird via `skeleton`-Prop übergeben
- [x] Kein `ActivityIndicator` mehr in den 3 betroffenen Screens sichtbar

### Non-Functional Requirements

- [x] Animation läuft mit 60fps auf Android und iOS – ausschließlich via `react-native-reanimated` Worklets (kein JS-Thread-Blocking)
- [x] Keine neuen npm-Dependencies – ausschließlich bereits installiertes `react-native-reanimated`
- [x] `npm run lint` läuft ohne neue Fehler oder Warnungen durch
- [x] Mobile-first: Skeleton-Layouts passen sich an unterschiedliche Bildschirmbreiten an (keine fixen Pixel-Breiten die auf kleinen Screens abgeschnitten werden)
- [x] Mindest-Touch-Target 44px bleibt auf allen echten interaktiven Elementen erhalten (Skeletons selbst sind nicht interaktiv)

---

## Technical Notes

### Dateistruktur

```
components/
├── Skeleton.tsx          ← NEU: Basiskomponente
├── ScreenState.tsx       ← ERWEITERT: skeleton-Prop + Fallback
├── TopBar.tsx            (unverändert)
├── ErrorBoundary.tsx     (unverändert)
└── ...
```

### Skeleton.tsx – Implementierungsdetail

```tsx
// Pulse-Animation (Reanimated Worklet)
const opacity = useSharedValue(1);

useEffect(() => {
  if (!reduceMotion) {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 600 }),
      -1,    // unendlich
      true   // reverse: true → zurück zu 1.0
    );
  }
}, [reduceMotion]);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));
```

### Farb-Tokens (Dark Theme, zinc-basiert)

| Token | Hex-Wert | Verwendung |
|---|---|---|
| `Colors.raw.zinc800` | `#27272a` | Skeleton-Basis-Hintergrund |
| `Colors.raw.zinc700` | `#3f3f46` | Skeleton-Highlight (Pulse-Zielfarbe) |

Skeletons verwenden `backgroundColor: Colors.raw.zinc800` als Basis – kein weißes Flackern im Dark Theme.

### ScreenState.tsx – Interface-Erweiterung

```tsx
interface ScreenStateProps {
  kind: "loading" | "error" | "empty";
  skeleton?: React.ReactNode;  // NEU
  // ...alle bestehenden Props bleiben unverändert
}

// Render-Logik für kind="loading":
// skeleton prop vorhanden? → {skeleton}
// kein skeleton?           → <SkeletonCard />
```

### Screen-spezifische Skeleton-Pattern (Inline im Screen-File)

```tsx
// Lokale Komponente im selben File wie der Screen
function ProjekteListeSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[...Array(4)].map((_, i) => (
        <SkeletonBox key={i} height={88} borderRadius={12} />
      ))}
    </View>
  );
}

// Verwendung im Screen:
<ScreenState
  kind="loading"
  skeleton={<ProjekteListeSkeleton />}
/>
```

### Betroffene Screens

| Screen | Datei | Aktueller Zustand |
|---|---|---|
| Projektliste | `app/(tabs)/projekte.tsx` | `ScreenState kind="loading"` mit ActivityIndicator |
| Freigaben | `app/(tabs)/freigaben.tsx` | `ScreenState kind="loading"` mit ActivityIndicator |
| Projektdetail | `app/project/[id].tsx` | `ScreenState kind="loading"` mit ActivityIndicator |

---

## Acceptance Criteria

- [x] `components/Skeleton.tsx` existiert und exportiert `SkeletonBox`, `SkeletonLine` und `SkeletonCard`
- [x] Pulse-Animation ist auf allen 3 betroffenen Screens sichtbar beim Laden
- [x] Kein `ActivityIndicator` mehr in `projekte.tsx`, `freigaben.tsx` und `project/[id].tsx` sichtbar
- [x] `ScreenState kind="loading"` ohne `skeleton`-Prop rendert `<SkeletonCard />` Fallback
- [x] `ScreenState kind="loading"` mit `skeleton`-Prop rendert den übergebenen Skeleton
- [x] `kind="error"` und `kind="empty"` verhalten sich identisch wie vor dem Feature (kein Regressionsrisiko)
- [x] Bei aktiviertem Reduce Motion (Accessibility): keine Animation, nur statische Placeholder
- [x] Skeleton-Farben sind `zinc800`/`zinc700` – kein weißes oder helles Flackern im Dark Theme
- [x] Animation blockiert nicht den JS-Thread (Reanimated Worklet, prüfbar via Flipper/Profiler)
- [x] Kein `any`-Typ in `Skeleton.tsx` oder den geänderten Screen-Dateien
- [x] `npm run lint` läuft ohne neue Fehler durch
- [x] Skeletons brechen nicht auf kleinen Screens (320px Breite) ab oder werden abgeschnitten

---

## Out of Scope

- Skeletons für `kind="error"` oder `kind="empty"` States
- Screens außerhalb der 3 identifizierten (`projekte`, `freigaben`, `project/[id]`)
- Skeletons für Modals, Bottom Sheets oder Overlays
- Externe Skeleton-Library (z.B. `react-native-skeleton-placeholder`)
- Automatische Skeleton-Generierung aus Komponenten-Struktur
- Light-Theme Variante (Projekt ist Dark-Theme only)
- Skeleton für Inline-Loading-Zustände innerhalb bereits geladener Screens (z.B. Pagination)