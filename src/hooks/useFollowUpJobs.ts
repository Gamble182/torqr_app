import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface FollowUpJob {
  id: string;
  label: string;
  description: string | null;
  photos: string[];
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  systemId: string;
  maintenanceId: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useFollowUpJobs(systemId: string) {
  return useQuery<FollowUpJob[]>({
    queryKey: ['follow-up-jobs', systemId],
    queryFn: async () => {
      const res = await fetch(`/api/systems/${systemId}/follow-ups`);
      const result: ApiResponse<FollowUpJob[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Nachfolgeaufträge');
      }
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateFollowUpJob(systemId: string, options?: { silent?: boolean }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      label: string;
      description?: string | null;
      maintenanceId?: string | null;
    }): Promise<FollowUpJob> => {
      const res = await fetch(`/api/systems/${systemId}/follow-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<FollowUpJob> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Erstellen');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-jobs', systemId] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      if (!options?.silent) toast.success('Nachfolgeauftrag erstellt');
    },
    onError: (error: Error) => {
      if (!options?.silent) toast.error(`Fehler: ${error.message}`);
    },
  });
}

export function useUpdateFollowUpJob(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      label?: string;
      description?: string | null;
      completed?: boolean;
    }): Promise<FollowUpJob> => {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<FollowUpJob> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Aktualisieren');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-jobs', systemId] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}

export function useDeleteFollowUpJob(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (followUpId: string): Promise<void> => {
      const res = await fetch(`/api/follow-ups/${followUpId}`, {
        method: 'DELETE',
      });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-jobs', systemId] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      toast.success('Nachfolgeauftrag gelöscht');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}
