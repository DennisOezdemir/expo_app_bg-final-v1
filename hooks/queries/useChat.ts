import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchChatHistory,
  sendChatMessage,
  ChatMessageRow,
} from "@/lib/api/chat";
import { queryKeys } from "@/lib/query-keys";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Chat-Verlauf laden + Realtime-Updates
 */
export function useChatHistory(projectId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.chat.history(projectId),
    queryFn: () => fetchChatHistory(projectId),
    enabled: !!projectId,
  });

  // Realtime: Neue Nachrichten automatisch anzeigen
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`chat:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessageRow;
          queryClient.setQueryData<ChatMessageRow[]>(
            queryKeys.chat.history(projectId),
            (old) => {
              if (!old) return [newMsg];
              if (old.some((m) => m.id === newMsg.id)) return old;
              return [...old, newMsg];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return query;
}

/**
 * Nachricht senden (Mutation)
 */
export function useSendMessage(projectId: string) {
  const queryClient = useQueryClient();
  const { role, user } = useRole();
  const { user: authUser } = useAuth();

  return useMutation({
    mutationFn: (message: string) =>
      sendChatMessage({
        project_id: projectId,
        message,
        user_role: role,
        user_name: user.name,
        user_id: authUser?.id || "anonymous",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.history(projectId),
      });
      // Approvals könnten sich geändert haben (create_change_order, prepare_email)
      queryClient.invalidateQueries({
        queryKey: queryKeys.approvals.all,
      });
    },
  });
}
