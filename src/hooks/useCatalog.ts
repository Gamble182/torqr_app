import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type SystemType = 'HEATING' | 'AC' | 'WATER_TREATMENT' | 'ENERGY_STORAGE';
export type AcSubtype = 'SINGLE_SPLIT' | 'MULTI_SPLIT_2' | 'MULTI_SPLIT_3' | 'MULTI_SPLIT_4' | 'MULTI_SPLIT_5';
export type StorageSubtype = 'BOILER' | 'BUFFER_TANK';

export interface CatalogEntry {
  id: string;
  systemType: SystemType;
  manufacturer: string;
  name: string;
  acSubtype: AcSubtype | null;
  storageSubtype: StorageSubtype | null;
  createdByUserId: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useCatalog(systemType?: SystemType) {
  return useQuery<CatalogEntry[]>({
    queryKey: ['catalog', systemType],
    queryFn: async () => {
      const url = systemType ? `/api/catalog?systemType=${systemType}` : '/api/catalog';
      const res = await fetch(url);
      const result: ApiResponse<CatalogEntry[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Katalogs');
      }
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateCatalogEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CatalogEntry, 'id' | 'createdByUserId' | 'createdAt'>) => {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<CatalogEntry> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Erstellen des Eintrags');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      toast.success('Katalogeintrag erfolgreich erstellt!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
