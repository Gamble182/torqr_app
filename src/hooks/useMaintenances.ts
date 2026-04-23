import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSnapshot } from '@/types/checklist';

export interface MaintenancePayload {
  systemId: string;
  date: string;
  notes: string | null;
  photos: string[];
  checklistData: ChecklistSnapshot;
}

export interface Maintenance {
  id: string;
  systemId: string;
  date: string;
  notes: string | null;
  photos: string[];
  checklistData: ChecklistSnapshot | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const SHARED_INVALIDATION_KEYS = [
  ['customer-systems'],
  ['customer-system'],
  ['wartungen'],
  ['dashboard-stats'],
  ['customer'],
] as const;

function invalidateRelated(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of SHARED_INVALIDATION_KEYS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MaintenancePayload): Promise<Maintenance> => {
      const res = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result: ApiResponse<Maintenance> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Speichern der Wartung');
      }
      return result.data;
    },
    onSuccess: () => invalidateRelated(queryClient),
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (maintenanceId: string): Promise<void> => {
      const res = await fetch(`/api/maintenances/${maintenanceId}`, {
        method: 'DELETE',
      });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen der Wartung');
      }
    },
    onSuccess: () => {
      invalidateRelated(queryClient);
      toast.success('Wartung gelöscht');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}
