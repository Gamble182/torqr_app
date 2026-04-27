'use client';

import { useQuery } from '@tanstack/react-query';

export type PartCategory = 'SPARE_PART' | 'CONSUMABLE' | 'TOOL';

/**
 * Inventory item embedded in an effective part.
 * NOTE: Decimal fields (`currentStock`, `minStock`) are serialized as strings
 * over the wire by Prisma's Decimal.toJSON().
 */
export interface EffectivePartInventoryItem {
  id: string;
  currentStock: string;
  minStock: string;
  unit: string;
  articleNumber: string | null;
  description: string;
}

/**
 * Effective part as returned by GET /api/customer-systems/:id/effective-parts.
 *
 * Mirrors the resolver output of `getEffectivePartsForSystem`
 * (`src/lib/maintenance-parts.ts`).
 *
 * Discriminator `source`:
 * - `DEFAULT`     → resolved from a MaintenanceSetItem (carries `setItemId`).
 * - `OVERRIDE_ADD`→ resolved from a CustomerSystemPartOverride with
 *                   `action === 'ADD'` (carries `overrideId`).
 *
 * NOTE: `quantity` is a Decimal serialized as string.
 */
export interface EffectivePart {
  source: 'DEFAULT' | 'OVERRIDE_ADD';
  setItemId?: string;
  overrideId?: string;
  category: PartCategory;
  description: string;
  articleNumber: string | null;
  quantity: string;
  unit: string;
  required: boolean;
  note: string | null;
  sortOrder: number;
  inventoryItem: EffectivePartInventoryItem | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useEffectiveParts(customerSystemId: string | undefined) {
  return useQuery<EffectivePart[]>({
    queryKey: ['effective-parts', customerSystemId],
    queryFn: async () => {
      if (!customerSystemId) throw new Error('Keine System-ID angegeben');
      const res = await fetch(
        `/api/customer-systems/${customerSystemId}/effective-parts`,
      );
      const result: ApiResponse<EffectivePart[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Effektivteile');
      }
      return result.data;
    },
    enabled: !!customerSystemId,
    staleTime: 30 * 1000,
  });
}
