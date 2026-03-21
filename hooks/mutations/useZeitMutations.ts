import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkIn, checkOut, CheckInInput, CheckOutInput } from "@/lib/api/zeiterfassung";
import { queryKeys } from "@/lib/query-keys";

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckInInput) => checkIn(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zeiterfassung.all });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckOutInput) => checkOut(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.zeiterfassung.all });
    },
  });
}
