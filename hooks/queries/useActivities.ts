import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchActivities } from "@/lib/api/activities";
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
