import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject, type CreateProjectInput } from "@/lib/api/projects";
import { queryKeys } from "@/lib/query-keys";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}
