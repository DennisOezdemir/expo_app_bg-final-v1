import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  saveCompanySettings,
  createClient,
  updateClient,
  deleteClient,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "@/lib/api/settings";
import type { Client } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query-keys";

export function useSaveCompanySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: { key: string; value: string }[]) =>
      saveCompanySettings(settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.company() });
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Client, "id">) => createClient(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<Omit<Client, "id">>) =>
      updateClient(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clients.all });
    },
  });
}

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.team() });
    },
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      role: string;
      role_label: string;
      gewerk: string | null;
    }) => updateTeamMember(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.team() });
    },
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeamMember(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.team() });
    },
  });
}
