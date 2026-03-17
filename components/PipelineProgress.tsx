import { StyleSheet, Text, View, Pressable, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import {
  AGENT_STEPS,
  type PipelineRun,
  type PipelineStep,
  type PipelineStepStatus,
} from "@/lib/api/pipeline";

// --- Status helpers ---

const STEP_STATUS_CONFIG: Record<PipelineStepStatus | "pending", {
  color: string;
  bg: string;
  icon: string;
  label: string;
}> = {
  pending:   { color: Colors.raw.zinc600, bg: Colors.raw.zinc800, icon: "ellipse-outline",      label: "Wartend" },
  running:   { color: Colors.raw.amber500, bg: Colors.raw.amber500 + "18", icon: "sync-outline",         label: "Läuft" },
  completed: { color: Colors.raw.emerald500, bg: Colors.raw.emerald500 + "18", icon: "checkmark-circle",    label: "Fertig" },
  stopped:   { color: Colors.raw.rose500, bg: Colors.raw.rose500 + "18", icon: "hand-left-outline",    label: "Gestoppt" },
  failed:    { color: Colors.raw.rose500, bg: Colors.raw.rose500 + "18", icon: "alert-circle-outline", label: "Fehler" },
  skipped:   { color: Colors.raw.zinc500, bg: Colors.raw.zinc800, icon: "remove-circle-outline", label: "Übersprungen" },
};

function getStepStatus(
  agentKey: string,
  run: PipelineRun | null,
  steps: PipelineStep[]
): PipelineStepStatus | "pending" {
  if (!run) return "pending";

  // Special case: "freigabe" step is virtual (no DB step)
  if (agentKey === "freigabe") {
    if (run.status === "completed") return "completed";
    if (run.status === "stopped" || run.status === "failed") return "stopped";
    return "pending";
  }

  const step = steps.find((s) => s.agent_name === agentKey);
  if (step) return step.status;

  // Not yet reached
  return "pending";
}

function formatDuration(ms: number | null): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// --- Pipeline Step Row ---

function StepRow({
  label,
  icon,
  status,
  warnings,
  duration,
  confidence,
  isLast,
}: {
  label: string;
  icon: string;
  status: PipelineStepStatus | "pending";
  warnings?: string[];
  duration?: number | null;
  confidence?: number | null;
  isLast?: boolean;
}) {
  const cfg = STEP_STATUS_CONFIG[status];

  return (
    <View style={stepStyles.row}>
      {/* Connector line */}
      <View style={stepStyles.connectorCol}>
        <View style={[stepStyles.dot, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
          <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
        </View>
        {!isLast && (
          <View style={[stepStyles.line, { backgroundColor: status === "completed" ? Colors.raw.emerald500 + "40" : Colors.raw.zinc800 }]} />
        )}
      </View>

      {/* Content */}
      <View style={stepStyles.content}>
        <View style={stepStyles.headerRow}>
          <View style={stepStyles.labelRow}>
            <Ionicons name={icon as any} size={16} color={cfg.color} style={{ marginRight: 6 }} />
            <Text style={[stepStyles.label, { color: status === "pending" ? Colors.raw.zinc500 : Colors.raw.white }]}>
              {label}
            </Text>
          </View>
          <View style={stepStyles.metaRow}>
            {duration != null && duration > 0 && (
              <Text style={stepStyles.duration}>{formatDuration(duration)}</Text>
            )}
            {status === "running" && (
              <ActivityIndicator size={12} color={Colors.raw.amber500} />
            )}
            {status !== "running" && status !== "pending" && (
              <View style={[stepStyles.statusPill, { backgroundColor: cfg.bg }]}>
                <Text style={[stepStyles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Confidence score (Zeitprüfer) */}
        {confidence != null && (
          <View style={stepStyles.confidenceRow}>
            <Text style={stepStyles.confidenceLabel}>Confidence</Text>
            <View style={stepStyles.confidenceBarBg}>
              <View
                style={[
                  stepStyles.confidenceBarFill,
                  {
                    width: `${Math.min(confidence * 100, 100)}%`,
                    backgroundColor: confidence >= 0.8 ? Colors.raw.emerald500 : confidence >= 0.5 ? Colors.raw.amber500 : Colors.raw.rose500,
                  },
                ]}
              />
            </View>
            <Text style={stepStyles.confidenceValue}>{Math.round(confidence * 100)}%</Text>
          </View>
        )}

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <View style={stepStyles.warningsBox}>
            {warnings.map((w, i) => (
              <View key={i} style={stepStyles.warningRow}>
                <Ionicons name="warning-outline" size={12} color={Colors.raw.amber500} />
                <Text style={stepStyles.warningText}>{w}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    minHeight: 52,
  },
  connectorCol: {
    width: 28,
    alignItems: "center",
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  duration: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.zinc500,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  confidenceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.raw.zinc500,
    width: 64,
  },
  confidenceBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.raw.zinc800,
  },
  confidenceBarFill: {
    height: 4,
    borderRadius: 2,
  },
  confidenceValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.raw.zinc300,
    width: 32,
    textAlign: "right",
  },
  warningsBox: {
    marginTop: 6,
    gap: 4,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  warningText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.raw.amber500,
    flex: 1,
  },
});

// --- Main Component ---

export function PipelineProgress({
  run,
  steps,
  onStartPlan,
  isStarting,
}: {
  run: PipelineRun | null | undefined;
  steps: PipelineStep[];
  onStartPlan: () => void;
  isStarting: boolean;
}) {
  const runStatusLabel = !run
    ? "Nicht gestartet"
    : run.status === "running"
    ? "Pipeline läuft..."
    : run.status === "completed"
    ? "Abgeschlossen"
    : run.status === "stopped"
    ? "Gestoppt"
    : "Fehlgeschlagen";

  const runStatusColor = !run
    ? Colors.raw.zinc500
    : run.status === "running"
    ? Colors.raw.amber500
    : run.status === "completed"
    ? Colors.raw.emerald500
    : Colors.raw.rose500;

  // Extract confidence from zeitpruefer step
  const zpStep = steps.find((s) => s.agent_name === "zeitpruefer");
  const confidence = zpStep?.output_data?.confidence_score ?? null;

  return (
    <View style={mainStyles.container}>
      {/* Header */}
      <View style={mainStyles.headerRow}>
        <View style={mainStyles.headerLeft}>
          <Text style={mainStyles.title}>Autoplanung</Text>
          <View style={[mainStyles.statusDot, { backgroundColor: runStatusColor }]} />
          <Text style={[mainStyles.statusLabel, { color: runStatusColor }]}>{runStatusLabel}</Text>
        </View>
        {(!run || run.status !== "running") && (
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onStartPlan();
            }}
            disabled={isStarting}
            style={({ pressed }) => [
              mainStyles.startBtn,
              { opacity: pressed || isStarting ? 0.6 : 1 },
            ]}
          >
            {isStarting ? (
              <ActivityIndicator size={14} color="#000" />
            ) : (
              <>
                <Ionicons name="play" size={14} color="#000" />
                <Text style={mainStyles.startBtnText}>
                  {run ? "Neu planen" : "Starten"}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Stop reason */}
      {run?.stop_reason && (
        <View style={mainStyles.stopReasonBox}>
          <Ionicons name="information-circle" size={14} color={Colors.raw.rose500} />
          <Text style={mainStyles.stopReasonText}>{run.stop_reason}</Text>
        </View>
      )}

      {/* Steps */}
      <View style={mainStyles.stepsContainer}>
        {AGENT_STEPS.map((agent, i) => {
          const status = getStepStatus(agent.key, run ?? null, steps);
          const step = steps.find((s) => s.agent_name === agent.key);
          return (
            <StepRow
              key={agent.key}
              label={agent.label}
              icon={agent.icon}
              status={status}
              warnings={step?.warnings}
              duration={step?.duration_ms}
              confidence={agent.key === "zeitpruefer" ? confidence : null}
              isLast={i === AGENT_STEPS.length - 1}
            />
          );
        })}
      </View>
    </View>
  );
}

// --- Pipeline Badge (compact, for lists) ---

export function PipelineBadge({ status }: { status: "running" | "completed" | "stopped" | "failed" | "not_started" }) {
  const config: Record<string, { color: string; bg: string; label: string }> = {
    not_started: { color: Colors.raw.zinc500, bg: Colors.raw.zinc800, label: "—" },
    running:     { color: Colors.raw.amber500, bg: Colors.raw.amber500 + "18", label: "Planung..." },
    completed:   { color: Colors.raw.emerald500, bg: Colors.raw.emerald500 + "18", label: "Geplant" },
    stopped:     { color: Colors.raw.rose500, bg: Colors.raw.rose500 + "18", label: "Gestoppt" },
    failed:      { color: Colors.raw.rose500, bg: Colors.raw.rose500 + "18", label: "Fehler" },
  };
  const cfg = config[status] || config.not_started;

  if (status === "not_started") return null;

  return (
    <View style={[badgeStyles.pill, { backgroundColor: cfg.bg }]}>
      {status === "running" && <ActivityIndicator size={8} color={cfg.color} style={{ marginRight: 4 }} />}
      <Text style={[badgeStyles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
});

const mainStyles = StyleSheet.create({
  container: {},
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.raw.white,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.raw.amber500,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: "#000",
  },
  stopReasonBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.raw.rose500 + "12",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  stopReasonText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.raw.rose500,
    flex: 1,
  },
  stepsContainer: {
    marginTop: 4,
  },
});
