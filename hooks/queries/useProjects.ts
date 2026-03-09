import { useQuery } from "@tanstack/react-query";
import { fetchProjects } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: fetchProjects,
  });
}
