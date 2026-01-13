import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Maintenance {
  id: string;
  heaterId: string;
  date: string;
  type: string;
  notes: string | null;
  nextMaintenanceDate: string | null;
  performedBy: string | null;
  cost: number | null;
  partsReplaced: string | null;
  createdAt: string;
  updatedAt: string;
  heater: {
    id: string;
    model: string;
    serialNumber: string | null;
    customer: {
      id: string;
      name: string;
      city: string;
    } | null;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch all maintenances (optionally filtered)
 */
export function useMaintenances(params?: { heaterId?: string }) {
  const queryKey = ['maintenances', params];

  return useQuery<Maintenance[]>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.heaterId) searchParams.set('heaterId', params.heaterId);

      const url = `/api/maintenances${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url);
      const result: ApiResponse<Maintenance[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Wartungen');
      }

      return result.data;
    },
  });
}

/**
 * Fetch a single maintenance by ID
 */
export function useMaintenance(maintenanceId: string | null) {
  return useQuery<Maintenance>({
    queryKey: ['maintenance', maintenanceId],
    queryFn: async () => {
      if (!maintenanceId) throw new Error('Keine Wartungs-ID angegeben');

      const response = await fetch(`/api/maintenances/${maintenanceId}`);
      const result: ApiResponse<Maintenance> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Wartung');
      }

      return result.data;
    },
    enabled: !!maintenanceId,
  });
}

/**
 * Create a new maintenance
 */
export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maintenanceData: Partial<Maintenance>) => {
      const response = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceData),
      });

      const result: ApiResponse<Maintenance> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Erstellen der Wartung');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['heaters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Wartung erfolgreich erstellt!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

/**
 * Update an existing maintenance
 */
export function useUpdateMaintenance(maintenanceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maintenanceData: Partial<Maintenance>) => {
      const response = await fetch(`/api/maintenances/${maintenanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceData),
      });

      const result: ApiResponse<Maintenance> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Aktualisieren der Wartung');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', maintenanceId] });
      queryClient.invalidateQueries({ queryKey: ['heaters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Wartung erfolgreich aktualisiert!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

/**
 * Delete a maintenance
 */
export function useDeleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maintenanceId: string) => {
      const response = await fetch(`/api/maintenances/${maintenanceId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<null> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen der Wartung');
      }

      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['heaters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Wartung erfolgreich gelöscht!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
