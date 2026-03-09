import { useQuery } from "@tanstack/react-query";
import { fetchProjectDetail } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";

export function useProjectDetail(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ""),
    queryFn: () => fetchProjectDetail(projectId ?? ""),
    enabled: !!projectId,
  });
}
