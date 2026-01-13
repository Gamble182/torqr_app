import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Heater {
  id: string;
  userId: string;
  customerId: string | null;
  model: string;
  serialNumber: string | null;
  installationDate: string | null;
  maintenanceInterval: number;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  heaterType: string | null;
  manufacturer: string | null;
  hasStorage: boolean;
  storageManufacturer: string | null;
  storageModel: string | null;
  storageCapacity: number | null;
  hasBattery: boolean;
  batteryManufacturer: string | null;
  batteryModel: string | null;
  batteryCapacity: number | null;
  requiredParts: string | null;
  customer?: {
    id: string;
    name: string;
    street: string;
    city: string;
    phone: string;
  } | null;
  _count?: {
    maintenances: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch all heaters (optionally filtered)
 */
export function useHeaters(params?: { customerId?: string; search?: string }) {
  const queryKey = ['heaters', params];

  return useQuery<Heater[]>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.customerId) searchParams.set('customerId', params.customerId);
      if (params?.search) searchParams.set('search', params.search);

      const url = `/api/heaters${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url);
      const result: ApiResponse<Heater[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Heizsysteme');
      }

      return result.data;
    },
  });
}

/**
 * Fetch a single heater by ID
 */
export function useHeater(heaterId: string | null) {
  return useQuery<Heater>({
    queryKey: ['heater', heaterId],
    queryFn: async () => {
      if (!heaterId) throw new Error('Keine Heizungs-ID angegeben');

      const response = await fetch(`/api/heaters/${heaterId}`);
      const result: ApiResponse<Heater> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Heizsystems');
      }

      return result.data;
    },
    enabled: !!heaterId,
  });
}

/**
 * Create a new heater
 */
export function useCreateHeater() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (heaterData: Partial<Heater>) => {
      const response = await fetch('/api/heaters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heaterData),
      });

      const result: ApiResponse<Heater> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Erstellen des Heizsystems');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heaters'] });
      toast.success('Heizsystem erfolgreich erstellt!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

/**
 * Update an existing heater
 */
export function useUpdateHeater(heaterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (heaterData: Partial<Heater>) => {
      const response = await fetch(`/api/heaters/${heaterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heaterData),
      });

      const result: ApiResponse<Heater> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Aktualisieren des Heizsystems');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heaters'] });
      queryClient.invalidateQueries({ queryKey: ['heater', heaterId] });
      toast.success('Heizsystem erfolgreich aktualisiert!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

/**
 * Delete a heater
 */
export function useDeleteHeater() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (heaterId: string) => {
      const response = await fetch(`/api/heaters/${heaterId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<null> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen des Heizsystems');
      }

      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heaters'] });
      toast.success('Heizsystem erfolgreich gelöscht!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
