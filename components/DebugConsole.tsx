import { useState, useRef, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Dimensions,
  Modal,
  Animated as RNAnimated,
  Clipboard,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useDebugLog, type LogFilter, type LogType, type DebugLogEntry } from "@/contexts/DebugLogContext";
import { SyncQueuePanel } from "@/components/SyncQueuePanel";

const SIDEBAR_WIDTH = 320;

const FILTER_TABS: { key: LogFilter; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "api", label: "API" },
  { key: "event", label: "Events" },
  { key: "error", label: "Errors" },
  { key: "auth", label: "Auth" },
  { key: "ai", label: "AI" },
  { key: "realtime", label: "Realtime" },
];

const TYPE_CONFIG: Record<LogType, { color: string; icon: string; iconSet: "ionicons" | "feather" | "mci" }> = {
  api: { color: Colors.raw.emerald500, icon: "globe-outline", iconSet: "ionicons" },
  event: { color: Colors.raw.amber500, icon: "flash-outline", iconSet: "ionicons" },
  error: { color: Colors.raw.rose500, icon: "alert-circle-outline", iconSet: "ionicons" },
  auth: { color: "#60a5fa", icon: "shield-checkmark-outline", iconSet: "ionicons" },
  ai: { color: "#a78bfa", icon: "hardware-chip-outline", iconSet: "ionicons" },
  realtime: { color: "#22d3ee", icon: "radio-outline", iconSet: "ionicons" },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatTimeSeparator(ts: number): string {
  return formatTime(ts);
}

function LatencyBadge({ ms }: { ms: number }) {
  const color = ms > 500 ? Colors.raw.rose500 : ms > 200 ? Colors.raw.amber500 : Colors.raw.emerald500;
  return (
    <Text style={[s.latency, { color }]}>
      {ms}ms{ms > 200 ? (ms > 500 ? " slow" : " warn") : ""}
    </Text>
  );
}

function StatusDot({ status }: { status?: number }) {
  if (!status) return null;
  const color = status >= 400 ? Colors.raw.rose500 : status >= 300 ? Colors.raw.amber500 : Colors.raw.emerald500;
  return <View style={[s.statusDot, { backgroundColor: color }]} />;
}

function LogEntryRow({ entry }: { entry: DebugLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[entry.type];

  const handleLongPress = useCallback(() => {
    const text = JSON.stringify(entry, null, 2);
    try { Clipboard.setString(text); } catch {}
  }, [entry]);

  const renderContent = () => {
    switch (entry.type) {
      case "api":
        return (
          <>
            <View style={s.entryHeader}>
              <StatusDot status={entry.status} />
              <Text style={[s.mono, s.entryMethod]}>{entry.method}</Text>
              <Text style={[s.mono, s.entryEndpoint]} numberOfLines={1}>{entry.endpoint}</Text>
            </View>
            <View style={s.entryMeta}>
              <Text style={[s.mono, s.entryStatus, { color: (entry.status && entry.status >= 400) ? Colors.raw.rose400 : Colors.raw.emerald400 }]}>
                {entry.status} {entry.status && entry.status >= 400 ? "Error" : "OK"}
              </Text>
              {entry.latency != null && <LatencyBadge ms={entry.latency} />}
              {entry.rowCount != null && <Text style={[s.mono, s.entryDim]}>{entry.rowCount} rows</Text>}
            </View>
            {entry.message && <Text style={[s.mono, s.entryMsg]} numberOfLines={expanded ? 10 : 1}>{entry.message}</Text>}
          </>
        );
      case "event":
        return (
          <>
            <View style={s.entryHeader}>
              <Text style={[s.mono, s.entryMethod, { color: Colors.raw.amber400 }]}>EVENT</Text>
              <Text style={[s.mono, s.entryEndpoint]}>{entry.eventType}</Text>
            </View>
            {entry.project && <Text style={[s.mono, s.entryDim]}>project: {entry.project}</Text>}
            {entry.message && <Text style={[s.mono, s.entryMsg]} numberOfLines={expanded ? 10 : 1}>{entry.message}</Text>}
          </>
        );
      case "error":
        return (
          <>
            <View style={s.entryHeader}>
              <Text style={[s.mono, s.entryMethod, { color: Colors.raw.rose400 }]}>ERROR</Text>
              {entry.component && <Text style={[s.mono, s.entryDim]}>{entry.component}</Text>}
            </View>
            <Text style={[s.mono, s.entryMsg, { color: Colors.raw.rose400 }]} numberOfLines={expanded ? 20 : 2}>{entry.message}</Text>
            {expanded && entry.stack && <Text style={[s.mono, s.stackText]}>{entry.stack}</Text>}
          </>
        );
      case "auth":
        return (
          <>
            <View style={s.entryHeader}>
              <Text style={[s.mono, s.entryMethod, { color: "#60a5fa" }]}>AUTH</Text>
              <Text style={[s.mono, s.entryEndpoint]}>{entry.message}</Text>
            </View>
            {entry.user && <Text style={[s.mono, s.entryDim]}>{entry.user}</Text>}
            {entry.role && <Text style={[s.mono, s.entryDim]}>role: {entry.role}</Text>}
          </>
        );
      case "ai":
        return (
          <>
            <View style={s.entryHeader}>
              <Text style={[s.mono, s.entryMethod, { color: "#a78bfa" }]}>AI</Text>
              {entry.latency != null && <LatencyBadge ms={entry.latency} />}
            </View>
            {(entry.tokensIn != null || entry.tokensOut != null) && (
              <Text style={[s.mono, s.entryDim]}>
                Token: {entry.tokensIn ?? 0} in / {entry.tokensOut ?? 0} out
              </Text>
            )}
            {entry.query && <Text style={[s.mono, s.entryMsg]} numberOfLines={expanded ? 10 : 1}>{entry.query}</Text>}
          </>
        );
      case "realtime":
        return (
          <>
            <View style={s.entryHeader}>
              <Text style={[s.mono, s.entryMethod, { color: "#22d3ee" }]}>REALTIME</Text>
              <Text style={[s.mono, s.entryEndpoint]}>{entry.channel}</Text>
            </View>
            {entry.message && <Text style={[s.mono, s.entryMsg]} numberOfLines={expanded ? 10 : 1}>{entry.message}</Text>}
          </>
        );
      default:
        return <Text style={[s.mono, s.entryMsg]}>{entry.message}</Text>;
    }
  };

  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      onLongPress={handleLongPress}
      style={[s.entry, { borderLeftColor: config.color }]}
    >
      <View style={s.entryTimeRow}>
        <Ionicons name={config.icon as any} size={12} color={config.color} />
        <Text style={[s.mono, s.entryTime]}>{formatTime(entry.timestamp)}</Text>
      </View>
      {renderContent()}
      {expanded && !!entry.payload && (
        <View style={s.payloadBox}>
          <Text style={[s.mono, s.payloadText]}>{String(JSON.stringify(entry.payload, null, 2))}</Text>
        </View>
      )}
      {expanded && !!entry.request && (
        <View style={s.payloadBox}>
          <Text style={[s.mono, s.payloadLabel]}>Request:</Text>
          <Text style={[s.mono, s.payloadText]}>{String(JSON.stringify(entry.request, null, 2))}</Text>
        </View>
      )}
      {expanded && !!entry.response && (
        <View style={s.payloadBox}>
          <Text style={[s.mono, s.payloadLabel]}>Response:</Text>
          <Text style={[s.mono, s.payloadText]}>{String(JSON.stringify(entry.response, null, 2))}</Text>
        </View>
      )}
    </Pressable>
  );
}

function TimeSeparator({ timestamp }: { timestamp: number }) {
  return (
    <View style={s.timeSep}>
      <View style={s.timeSepLine} />
      <Text style={[s.mono, s.timeSepText]}>{formatTimeSeparator(timestamp)}</Text>
      <View style={s.timeSepLine} />
    </View>
  );
}

function shouldShowTimeSeparator(entry: DebugLogEntry, prevEntry: DebugLogEntry | null): boolean {
  if (!prevEntry) return true;
  return Math.abs(entry.timestamp - prevEntry.timestamp) > 30000;
}

export function DebugConsole() {
  const { logs, clearLogs, isOpen, setIsOpen } = useDebugLog();
  const [filter, setFilter] = useState<LogFilter>("all");
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (filter !== "all") {
      result = result.filter((l) => l.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        (l.endpoint?.toLowerCase().includes(q)) ||
        (l.message?.toLowerCase().includes(q)) ||
        (l.eventType?.toLowerCase().includes(q)) ||
        (l.method?.toLowerCase().includes(q)) ||
        (l.query?.toLowerCase().includes(q)) ||
        (l.channel?.toLowerCase().includes(q)) ||
        (l.user?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [logs, filter, search]);

  const handleCopyAll = useCallback(() => {
    const text = filteredLogs.map((l) => {
      const time = formatTime(l.timestamp);
      const prefix = l.type.toUpperCase();
      const info = l.method ? `${l.method} ${l.endpoint} ${l.status}` : l.message || l.eventType || "";
      return `[${time}] ${prefix}: ${info}`;
    }).join("\n");
    try { Clipboard.setString(text); } catch {}
  }, [filteredLogs]);

  const handleFeedback = useCallback(() => {
    if (!feedback.trim()) return;
    setFeedbackSent(true);
    setFeedback("");
    setTimeout(() => setFeedbackSent(false), 2000);
  }, [feedback]);

  if (!isOpen) return null;

  const content = (
    <View style={[s.sidebar, isWeb ? { width: SIDEBAR_WIDTH } : s.bottomSheet, { paddingBottom: isWeb ? 0 : insets.bottom }]}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="bug" size={18} color={Colors.raw.amber500} />
          <Text style={s.headerTitle}>Debug Console</Text>
        </View>
        <Pressable onPress={() => setIsOpen(false)} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })} testID="debug-close">
          <Ionicons name="close" size={22} color={Colors.raw.zinc400} />
        </Pressable>
      </View>

      <SyncQueuePanel />

      <View style={s.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {FILTER_TABS.map((tab) => {
            const active = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[s.filterBtn, active && s.filterBtnActive]}
              >
                <Text style={[s.filterText, active && s.filterTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={s.searchRow}>
        <Feather name="search" size={14} color={Colors.raw.zinc500} />
        <TextInput
          style={[s.mono, s.searchInput]}
          placeholder="Filter..."
          placeholderTextColor={Colors.raw.zinc600}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={Colors.raw.zinc500} />
          </Pressable>
        )}
      </View>

      <View style={s.logArea}>
        <ScrollView
          ref={scrollRef}
          style={s.logScroll}
          contentContainerStyle={s.logScrollContent}
          showsVerticalScrollIndicator={true}
        >
          {filteredLogs.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="terminal-outline" size={32} color={Colors.raw.zinc700} />
              <Text style={[s.mono, s.emptyText]}>Keine Eintr\u00E4ge</Text>
            </View>
          ) : (
            filteredLogs.map((entry, i) => {
              const prev = i > 0 ? filteredLogs[i - 1] : null;
              const showSep = shouldShowTimeSeparator(entry, prev);
              return (
                <View key={entry.id}>
                  {showSep && <TimeSeparator timestamp={entry.timestamp} />}
                  <LogEntryRow entry={entry} />
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={s.scrollControls}>
          <Pressable
            onPress={() => setAutoScroll(!autoScroll)}
            style={[s.scrollBtn, autoScroll && s.scrollBtnActive]}
          >
            <Ionicons name={autoScroll ? "play" : "pause"} size={12} color={autoScroll ? "#000" : Colors.raw.zinc400} />
          </Pressable>
          <Text style={[s.mono, s.logCount]}>{filteredLogs.length}</Text>
        </View>
      </View>

      <View style={s.bottomBar}>
        <View style={s.feedbackRow}>
          <TextInput
            style={[s.mono, s.feedbackInput]}
            placeholder="Feedback / Bug..."
            placeholderTextColor={Colors.raw.zinc600}
            value={feedback}
            onChangeText={setFeedback}
            onSubmitEditing={handleFeedback}
            returnKeyType="send"
          />
          <Pressable onPress={handleFeedback} style={({ pressed }) => [s.feedbackBtn, { opacity: pressed ? 0.5 : 1 }]}>
            <Ionicons name="send" size={16} color={feedback.trim() ? Colors.raw.amber500 : Colors.raw.zinc600} />
          </Pressable>
        </View>
        {feedbackSent && <Text style={[s.mono, s.feedbackOk]}>Feedback gespeichert</Text>}

        <View style={s.actionRow}>
          <Pressable onPress={handleCopyAll} style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.5 : 1 }]}>
            <Ionicons name="copy-outline" size={14} color={Colors.raw.zinc400} />
            <Text style={[s.mono, s.actionText]}>Copy All</Text>
          </Pressable>
          <Pressable onPress={clearLogs} style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.5 : 1 }]}>
            <Ionicons name="trash-outline" size={14} color={Colors.raw.zinc400} />
            <Text style={[s.mono, s.actionText]}>Clear</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (!isWeb) {
    return (
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={s.overlay} onPress={() => setIsOpen(false)}>
          <View />
        </Pressable>
        {content}
      </Modal>
    );
  }

  return (
    <View style={s.webOverlay}>
      <Pressable style={s.webBackdrop} onPress={() => setIsOpen(false)} />
      {content}
    </View>
  );
}

export function DebugToggle() {
  const { errorCount, toggleOpen, isOpen } = useDebugLog();

  return (
    <Pressable
      onPress={toggleOpen}
      style={({ pressed }) => [s.toggleBtn, isOpen && s.toggleBtnActive, { opacity: pressed ? 0.7 : 1 }]}
      testID="debug-toggle"
    >
      <Ionicons name="bug" size={20} color={isOpen ? "#000" : Colors.raw.zinc400} />
      {errorCount > 0 && (
        <View style={s.errorBadge}>
          <Text style={s.errorBadgeText}>{errorCount > 9 ? "9+" : errorCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  sidebar: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.raw.zinc900,
    borderLeftWidth: 1,
    borderLeftColor: Colors.raw.zinc800,
    zIndex: 999,
    flexDirection: "column",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
  },
  webOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  webBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "web" ? 72 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.raw.zinc200,
  },
  filterRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexDirection: "row",
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.raw.zinc800,
  },
  filterBtnActive: {
    backgroundColor: Colors.raw.amber500,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.raw.zinc400,
  },
  filterTextActive: {
    color: "#000",
    fontFamily: "Inter_700Bold",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.raw.zinc800,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.raw.zinc300,
    paddingVertical: 4,
  },
  logArea: {
    flex: 1,
    position: "relative",
  },
  logScroll: {
    flex: 1,
  },
  logScrollContent: {
    paddingVertical: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: Colors.raw.zinc600,
    fontSize: 12,
  },
  entry: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderLeftWidth: 3,
    marginBottom: 1,
  },
  entryTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  entryTime: {
    fontSize: 10,
    color: Colors.raw.zinc600,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  entryMethod: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.raw.zinc200,
  },
  entryEndpoint: {
    fontSize: 11,
    color: Colors.raw.zinc400,
    flexShrink: 1,
  },
  entryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 1,
  },
  entryStatus: {
    fontSize: 10,
  },
  entryDim: {
    fontSize: 10,
    color: Colors.raw.zinc500,
  },
  entryMsg: {
    fontSize: 10,
    color: Colors.raw.zinc400,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  latency: {
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  stackText: {
    fontSize: 9,
    color: Colors.raw.zinc600,
    marginTop: 4,
    lineHeight: 14,
  },
  payloadBox: {
    backgroundColor: Colors.raw.zinc950,
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  payloadLabel: {
    fontSize: 9,
    color: Colors.raw.zinc500,
    marginBottom: 4,
  },
  payloadText: {
    fontSize: 9,
    color: Colors.raw.zinc400,
    lineHeight: 14,
  },
  timeSep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.raw.zinc800,
  },
  timeSepText: {
    fontSize: 9,
    color: Colors.raw.zinc600,
  },
  scrollControls: {
    position: "absolute",
    right: 8,
    top: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scrollBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.raw.zinc800,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBtnActive: {
    backgroundColor: Colors.raw.amber500,
  },
  logCount: {
    fontSize: 9,
    color: Colors.raw.zinc600,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.raw.zinc800,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.raw.zinc800,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 8,
  },
  feedbackInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.raw.zinc300,
    paddingVertical: 8,
  },
  feedbackBtn: {
    padding: 4,
  },
  feedbackOk: {
    fontSize: 11,
    color: Colors.raw.emerald500,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 11,
    color: Colors.raw.zinc400,
  },
  toggleBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  toggleBtnActive: {
    backgroundColor: Colors.raw.amber500,
    borderRadius: 22,
  },
  errorBadge: {
    position: "absolute",
    top: 6,
    right: 4,
    backgroundColor: Colors.raw.rose500,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  errorBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: "#fff",
    lineHeight: 11,
  },
  mono: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
