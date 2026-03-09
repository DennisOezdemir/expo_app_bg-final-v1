import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface UseRealtimeInvalidationOptions {
  channelName: string;
  table: string;
  queryKeys: readonly (readonly unknown[])[];
}

export function useRealtimeInvalidation(options: UseRealtimeInvalidationOptions) {
  const queryClient = useQueryClient();
  const keySignature = JSON.stringify(options.queryKeys);

  useEffect(() => {
    const channel = supabase
      .channel(options.channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: options.table },
        () => {
          options.queryKeys.forEach((queryKey) => {
            void queryClient.invalidateQueries({ queryKey });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.channelName, options.table, options.queryKeys, queryClient, keySignature]);
}
