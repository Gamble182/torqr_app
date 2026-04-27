'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PartCategory } from './useEffectiveParts';

/**
 * Inputs for `useCreateOverride`, mirroring the discriminated union
 * `customerSystemOverrideSchema` in `src/lib/validations.ts`.
 *
 * Variants:
 * - `ADD`     → append a system-specific part/consumable/tool. May reference
 *               an existing inventory item (except for `TOOL` category).
 * - `EXCLUDE` → hide a standard MaintenanceSetItem for this system.
 *
 * NOTE: `quantity` is sent as a number; the server coerces it to Decimal.
 */
export interface CreateOverrideAddInput {
  action: 'ADD';
  category: PartCategory;
  description: string;
  articleNumber?: string;
  quantity: number;
  unit: string;
  required?: boolean;
  note?: string;
  sortOrder?: number;
  inventoryItemId?: string;
}

export interface CreateOverrideExcludeInput {
  action: 'EXCLUDE';
  excludedSetItemId: string;
}

export type CreateOverrideInput = CreateOverrideAddInput | CreateOverrideExcludeInput;

/**
 * Override row returned by POST /api/customer-systems/:id/overrides.
 * Matches the Prisma `CustomerSystemPartOverride` model.
 *
 * NOTE: `quantity` is a Decimal serialized as string. ADD-branch fields are
 * populated for `ADD` overrides and null for `EXCLUDE` overrides; vice versa
 * for `excludedSetItemId`.
 */
export interface CustomerSystemPartOverride {
  id: string;
  customerSystemId: string;
  action: 'ADD' | 'EXCLUDE';
  category: PartCategory | null;
  description: string | null;
  articleNumber: string | null;
  quantity: string | null;
  unit: string | null;
  required: boolean;
  note: string | null;
  sortOrder: number;
  inventoryItemId: string | null;
  excludedSetItemId: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useCreateOverride(customerSystemId: string) {
  const queryClient = useQueryClient();

  return useMutation<CustomerSystemPartOverride, Error, CreateOverrideInput>({
    mutationFn: async (input) => {
      const res = await fetch(
        `/api/customer-systems/${customerSystemId}/overrides`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      );
      const result: ApiResponse<CustomerSystemPartOverride> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Anlegen des Overrides');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['effective-parts', customerSystemId],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer-systems', customerSystemId],
      });
    },
  });
}

export function useDeleteOverride(customerSystemId: string) {
  const queryClient = useQueryClient();

  return useMutation<null, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/overrides/${id}`, { method: 'DELETE' });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen des Overrides');
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['effective-parts', customerSystemId],
      });
    },
  });
}
