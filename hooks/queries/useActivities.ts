import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchActivities, fetchProjectActivities } from "@/lib/api/activities";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

export function useActivities() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: queryKeys.activities.list(),
    queryFn: ({ pageParam = 0 }) => fetchActivities(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === 20 ? lastPageParam + 1 : undefined,
  });

  // Realtime: neue Aktivitaeten invalidieren
  useEffect(() => {
    const channel = supabase
      .channel("activities-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "project_activities" },
        () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.activities.all,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useProjectActivities(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: [...queryKeys.activities.list(), "project", projectId],
    queryFn: ({ pageParam = 0 }) => fetchProjectActivities(projectId!, pageParam),
    initialPageParam: 0,
    enabled: !!projectId,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === 20 ? lastPageParam + 1 : undefined,
  });

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`project-activities-${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "project_activities", filter: `project_id=eq.${projectId}` },
        () => {
          void queryClient.invalidateQueries({
            queryKey: [...queryKeys.activities.list(), "project", projectId],
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient, projectId]);

  return query;
}
