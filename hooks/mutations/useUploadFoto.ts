import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadFoto, UploadFotoInput } from "@/lib/api/foto-upload";
import { queryKeys } from "@/lib/query-keys";

export function useUploadFoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadFotoInput) => uploadFoto(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fotos.all });
    },
  });
}
