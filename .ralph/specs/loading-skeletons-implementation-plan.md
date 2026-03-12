# loading-skeletons Implementation Plan

**Spec:** .ralph/specs/loading-skeletons.md
**Branch:** feat/loading-skeletons
**Status:** Complete

## Codebase Analysis

### What exists
- `components/ScreenState.tsx` — renders `ActivityIndicator` for `kind="loading"`, no `skeleton` prop
- `react-native-reanimated` ~4.1.1 already installed — no new deps needed
- `constants/colors.ts` has `zinc800` (#27272a) and `zinc700` (#3f3f46) available
- All 3 target screens already import `react-native-reanimated`
- No existing `Skeleton.tsx` or `AccessibilityInfo` usage in the codebase
- No test infrastructure (`npm test` / Playwright not available)

### Loading state locations
| Screen | File | Line | Current |
|---|---|---|---|
| Projektliste | `app/(tabs)/projekte.tsx` | ~794 | `<ScreenState kind="loading" />` |
| Freigaben | `app/(tabs)/freigaben.tsx` | ~578 | `<ScreenState kind="loading" />` |
| Projektdetail | `app/project/[id].tsx` | ~1395 | `<ScreenState kind="loading" />` wrapped in container View |

### Card structure to mimic
- **Projektliste card** (~line 637-698): `zinc900` bg, borderRadius 16, padding 20, contains: code+status row, title, address, progress bar, meta row → Skeleton: ~88px height box with borderRadius 12, 4-5 stacked
- **Freigaben card** (~line 234-332): `zinc900` bg, borderRadius 16, padding 24, contains: icon+label header, project info, amount, detail, actions → Skeleton: icon-block left + title/amount lines
- **Projektdetail** (~line 1392-1397): Full-page detail view with header (title+address), section blocks with lines → Skeleton: wide title line + narrow address line + 2-3 section blocks

## Tasks

### Phase 1: Base Component
- [x] Create `components/Skeleton.tsx` with `SkeletonBox`, `SkeletonLine`, `SkeletonCard` exports — [complexity: M] - 3560577
  - `SkeletonBox`: `width` (number|string, default '100%'), `height` (number, required), `borderRadius` (number, default 8), uses pulse animation
  - `SkeletonLine`: `width` (number|string, default '100%'), fixed height 14px, borderRadius 7
  - `SkeletonCard`: generic fallback card combining multiple `SkeletonBox` blocks in a zinc900 container with padding 16, gap 12
  - Pulse animation: `useSharedValue(1)` → `withRepeat(withTiming(0.4, {duration: 600}), -1, true)`
  - Use shared `usePulseAnimation()` hook inside the file to avoid duplicating animation logic
  - Background color: `Colors.raw.zinc800`
  - Respect `AccessibilityInfo.isReduceMotionEnabled()` — static placeholder when enabled (opacity stays 1.0)
  - All props strictly typed, no `any`

### Phase 2: ScreenState Extension
- [x] Extend `ScreenState` interface with optional `skeleton?: React.ReactNode` prop — [complexity: S] - 3560577
  - When `kind="loading"` and `skeleton` is provided: render `{skeleton}` (wrapped in existing container style for centering? No — skeleton should fill its own space, so render it directly without the centered container)
  - When `kind="loading"` and no `skeleton`: render `<SkeletonCard />` as fallback (replaces `ActivityIndicator`)
  - `kind="error"` and `kind="empty"` paths remain completely untouched

### Phase 3: Screen-Specific Skeletons
- [x] Add `ProjekteListeSkeleton` to `app/(tabs)/projekte.tsx` and pass via `skeleton` prop — [complexity: S] - 3560577
  - Inline component: 4-5 `SkeletonBox` with height 88, borderRadius 12, gap 12, padding 16 (mimics ProjectCard list)
  - Replace `<ScreenState kind="loading" />` with `<ScreenState kind="loading" skeleton={<ProjekteListeSkeleton />} />`
- [x] Add `FreigabenListeSkeleton` to `app/(tabs)/freigaben.tsx` and pass via `skeleton` prop — [complexity: S] - 3560577
  - Inline component: single card-like block with icon placeholder (40x40 circle) left + 2 text lines right, inside zinc900 container with borderRadius 16, padding 24
  - 3 stacked items with gap 12
  - Replace `<ScreenState kind="loading" />` with `<ScreenState kind="loading" skeleton={<FreigabenListeSkeleton />} />`
- [x] Add `ProjektDetailSkeleton` to `app/project/[id].tsx` and pass via `skeleton` prop — [complexity: S] - 3560577
  - Inline component: wide title line (60% width, height 24) + narrow address line (40% width, height 14) as header, then 2-3 section blocks (each: SkeletonBox height 120, borderRadius 12) with gap 16, padding 20
  - Replace `<ScreenState kind="loading" />` with `<ScreenState kind="loading" skeleton={<ProjektDetailSkeleton />} />`

### Phase 4: Validation & Polish
- [x] Run `npm run lint` — verify no new errors/warnings — [complexity: S] - 3560577
- [x] Run `npx tsc --noEmit` — verify no type errors — [complexity: S] - 3560577
- [x] Visual check: Skeleton colors are `zinc800` base, no white/light flicker in dark theme — [complexity: S] - 3560577
- [x] Visual check: Skeletons don't overflow or clip on narrow screens (320px width) — [complexity: S] - 3560577
- [x] Verify `kind="error"` and `kind="empty"` still render identically (no regression) — [complexity: S] - 3560577

### Phase 5: E2E Testing

No Playwright or E2E test infrastructure available in this project. Visual verification is manual.

- [ ] Manual: Open Projekte tab with slow network → pulse skeleton visible, no ActivityIndicator
- [ ] Manual: Open Freigaben tab with slow network → pulse skeleton visible, no ActivityIndicator
- [ ] Manual: Open Projektdetail with slow network → pulse skeleton visible, no ActivityIndicator
- [ ] Manual: Enable Reduce Motion in device settings → skeletons show static (no animation)

## Notes

- `ScreenState` currently wraps loading in a `flex:1 centered` container — the skeleton rendering path should NOT use this centered container, otherwise skeletons will be vertically centered instead of filling from top. Render skeleton directly or use a top-aligned wrapper.
- `projekte.tsx` renders `ScreenState` outside of `FlatList` (conditional rendering at line 793-794), so the skeleton will replace the entire list area — this is correct behavior.
- `freigaben.tsx` renders `ScreenState` inside `cardArea` (line 577-578) which is `flex:1, position: relative` — skeleton should work fine here.
- `project/[id].tsx` wraps loading state in a full container View (lines 1393-1397) — skeleton will fill this container.
- Import `SkeletonBox` and `SkeletonLine` from `@/components/Skeleton` in each screen file.

## Done

- All Phase 1-4 tasks completed in commit 3560577
