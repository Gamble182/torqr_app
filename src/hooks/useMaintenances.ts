import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ChecklistSnapshot } from '@/types/checklist';

/**
 * Single entry in MaintenancePayload.partsUsed.
 *
 * Mirrors `partsUsedEntrySchema` from `src/lib/validations.ts`.
 * Quantity must be > 0 — zero/unchecked rows must be filtered before submit.
 */
export interface PartsUsageEntry {
  sourceType: 'DEFAULT' | 'OVERRIDE_ADD' | 'AD_HOC';
  setItemId?: string;
  overrideId?: string;
  inventoryItemId?: string;
  description: string;
  articleNumber?: string;
  quantity: number;
  unit: string;
}

export interface MaintenancePayload {
  systemId: string;
  date: string;
  notes: string | null;
  photos: string[];
  checklistData: ChecklistSnapshot;
  partsUsed?: PartsUsageEntry[];
}

export interface Maintenance {
  id: string;
  systemId: string;
  date: string;
  notes: string | null;
  photos: string[];
  checklistData: ChecklistSnapshot | null;
}

/**
 * Negative-stock warning emitted by POST /api/maintenances when a referenced
 * inventory item drops below zero after the maintenance is recorded.
 *
 * `newStock` is a Decimal serialized as string.
 */
export interface NegativeStockWarning {
  inventoryItemId: string;
  newStock: string;
}

/**
 * Result returned by the create-maintenance mutation.
 *
 * `negativeStockWarnings` is a sibling of `data` in the server response, so we
 * surface it as a top-level field of the hook's resolved value.
 */
export interface MaintenanceCreateResult {
  maintenance: Maintenance;
  negativeStockWarnings: NegativeStockWarning[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  negativeStockWarnings?: NegativeStockWarning[];
}

const SHARED_INVALIDATION_KEYS = [
  ['customer-systems'],
  ['customer-system'],
  ['wartungen'],
  ['dashboard-stats'],
  ['customer'],
  ['inventory'],
  ['effective-parts'],
] as const;

function invalidateRelated(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of SHARED_INVALIDATION_KEYS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MaintenancePayload): Promise<MaintenanceCreateResult> => {
      const res = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result: ApiResponse<Maintenance> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Speichern der Wartung');
      }
      return {
        maintenance: result.data,
        negativeStockWarnings: result.negativeStockWarnings ?? [],
      };
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
