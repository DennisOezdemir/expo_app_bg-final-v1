# Learnings

Accumulated knowledge from feature implementations. Reference before starting new tasks.

## Patterns (What Works)

<!-- Add successful patterns here -->
- [YYYY-MM-DD] [feature] Pattern description
- [2026-03-12] [loading-skeletons] Shared `usePulseAnimation()` hook inside Skeleton.tsx keeps animation logic DRY across SkeletonBox and SkeletonLine without extra files
- [2026-03-12] [loading-skeletons] `AccessibilityInfo.isReduceMotionEnabled()` returns a Promise — wrap in useEffect with active flag to avoid setState after unmount
- [2026-03-12] [loading-skeletons] ScreenState skeleton prop: render skeleton directly (no centered container) so skeletons fill top-aligned instead of being vertically centered

## Anti-Patterns (What to Avoid)

<!-- Add mistakes and issues to avoid -->
- [YYYY-MM-DD] [feature] Anti-pattern description
- [2026-03-12] [loading-skeletons] Spec verification: grep for `ActivityIndicator` in ScreenState.tsx too — fallback path must also be clean, not just the 3 screen files

### E2E Pitfalls
<!-- E2E testing specific issues -->

## Tool Usage

<!-- Tips for using MCP tools and CLI -->

## Codebase Conventions

<!-- Project-specific conventions discovered -->
