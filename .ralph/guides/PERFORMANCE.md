# Performance Guide — BauGenius

## Kontext

BauGenius ist eine **Mobile-First React Native App** für Handwerker auf der Baustelle.
Performance-Ziel: **Alles unter 3 Sekunden**, idealerweise sofort.

---

## Mobile Performance (Priorität 1)

### Netzwerk auf der Baustelle

- Oft schlechtes Mobilfunknetz (Edge/3G)
- WLAN selten verfügbar
- Optimistic Updates sind Pflicht für gute UX

### Patterns

```typescript
// Optimistic Update mit React Query
const mutation = useMutation({
  mutationFn: updateProject,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['project', id] })
    const previous = queryClient.getQueryData(['project', id])
    queryClient.setQueryData(['project', id], newData)
    return { previous }
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['project', id], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['project', id] })
  },
})
```

### Realtime statt Polling

```typescript
// Supabase Realtime für Live-Updates
supabase
  .channel('project-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'projects',
    filter: `id=eq.${projectId}`
  }, (payload) => {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] })
  })
  .subscribe()
```

---

## React Native Performance

### Vermeiden

| Problem | Lösung |
|---------|--------|
| Inline Styles in render | `StyleSheet.create()` außerhalb |
| Schwere Bilder | Expo Image mit Caching |
| Große Listen ohne Virtualisierung | `FlatList` statt `ScrollView` + `.map()` |
| Unnötige Re-Renders | `React.memo`, `useMemo`, `useCallback` |
| Synchrone Storage-Calls | `AsyncStorage` mit React Query cachen |

### FlatList Best Practices

```typescript
<FlatList
  data={items}
  renderItem={renderItem}           // Stabile Referenz (useCallback)
  keyExtractor={keyExtractor}       // Stabile Referenz
  getItemLayout={getItemLayout}     // Wenn Items gleich hoch
  removeClippedSubviews={true}      // Offscreen-Items entfernen
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Animations

- Nur `react-native-reanimated` für Animationen (läuft auf UI-Thread)
- Nie `Animated` API für komplexe Animationen
- `transform` und `opacity` bevorzugen

---

## Datenbank Performance

### Supabase Queries

```typescript
// Nur benötigte Spalten laden
const { data } = await supabase
  .from('projects')
  .select('id, name, status, address')  // NICHT select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20)

// Parallele Queries
const [projects, stats] = await Promise.all([
  supabase.from('projects').select('...'),
  supabase.from('v_project_stats').select('...')
])
```

### Indexes (DB-seitig)

- `idx_events_unprocessed` — Sweeper-Performance
- Composite Indexes für häufige Filter-Kombinationen
- `EXPLAIN ANALYZE` vor neuen Queries in Prod

---

## Bundle Size

### Expo-spezifisch

- Tree-Shaking funktioniert mit Expo
- Direkte Imports statt Barrel-Imports
- Lazy Loading für selten genutzte Screens

```typescript
// Gut: Direkt importieren
import { formatCurrency } from '@/lib/formatters'

// Schlecht: Barrel-Import
import { formatCurrency } from '@/lib'  // Zieht alles rein
```

---

## Caching-Strategie

### React Query Defaults

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30s — Daten gelten als frisch
      gcTime: 5 * 60_000,     // 5min — Cache behalten
      retry: 2,               // 2 Retries bei Fehler
      refetchOnWindowFocus: false,  // Mobile: kein Window-Focus
    },
  },
})
```

### Offline-First (Zukunft)

- AsyncStorage als Offline-Cache
- Queue für Mutations bei Offline
- Sync bei Reconnect

---

## Monitoring

### Was messen

| Metrik | Ziel |
|--------|------|
| App Start (Cold) | < 3s |
| Screen Navigation | < 500ms |
| API Response | < 1s |
| Optimistic Update | Sofort (< 100ms) |
| FlatList Scroll | 60 FPS |

### Quick Check

```bash
# Port 8081 oft blockiert — vor Neustart prüfen
lsof -ti :8081 | xargs kill

# Expo Start mit Profiling
npx expo start --dev-client
```

---

## Checkliste

- [ ] Optimistic Updates für User-facing Mutations
- [ ] FlatList statt ScrollView + map für Listen
- [ ] Nur benötigte DB-Spalten laden (kein `select('*')`)
- [ ] Parallele Queries wo möglich (Promise.all)
- [ ] StyleSheet.create außerhalb der Komponente
- [ ] Realtime-Subscriptions aufräumen (unsubscribe in cleanup)
- [ ] Bilder mit Expo Image (Caching)
