import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { fetchLatestPipelineRun, fetchPipelineSteps, startAutoPlan } from "@/lib/api/pipeline";
import { queryKeys } from "@/lib/query-keys";

export function usePipelineRun(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.pipeline.run(projectId ?? ""),
    queryFn: () => fetchLatestPipelineRun(projectId!),
    enabled: !!projectId,
    refetchInterval: (query) => {
      // Poll every 3s while pipeline is running
      const status = query.state.data?.status;
      return status === "running" ? 3000 : false;
    },
  });
}

export function usePipelineSteps(runId?: string) {
  return useQuery({
    queryKey: queryKeys.pipeline.steps(runId ?? ""),
    queryFn: () => fetchPipelineSteps(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      // Poll while any step is still running
      const steps = query.state.data;
      const anyRunning = steps?.some((s) => s.status === "running");
      return anyRunning ? 3000 : false;
    },
  });
}

export function useStartPipeline() {
  const qc = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPipeline = useCallback(async (projectId: string) => {
    if (isStarting) return;
    setIsStarting(true);
    setError(null);
    try {
      const result = await startAutoPlan(projectId);
      if (!result?.success) {
        const errMsg = result?.error || "Planung fehlgeschlagen";
        setError(errMsg);
        return { success: false, error: errMsg };
      }
      // Invalidate pipeline queries so hooks refetch
      qc.invalidateQueries({ queryKey: queryKeys.pipeline.run(projectId) });
      return { success: true };
    } catch (e: any) {
      const errMsg = e?.message || "Auto-Planung fehlgeschlagen";
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, qc]);

  return { startPipeline, isStarting, error };
}

export function useInvalidatePipeline() {
  const qc = useQueryClient();
  return (projectId: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.pipeline.run(projectId) });
  };
}
