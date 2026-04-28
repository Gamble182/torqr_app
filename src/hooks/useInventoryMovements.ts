'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Movement reason as accepted on the create endpoint. Note that
 * `MAINTENANCE_USE` and `MANUAL_ADJUSTMENT` exist server-side as
 * Prisma enums but are NOT user-bookable: the create input schema
 * (`inventoryMovementCreateSchema`) restricts client reasons to
 * `RESTOCK` and `CORRECTION`. Persisted movements may carry any of
 * the four enum values.
 */
export type MovementReasonInput = 'RESTOCK' | 'CORRECTION';
export type MovementReason =
  | 'MAINTENANCE_USE'
  | 'MANUAL_ADJUSTMENT'
  | 'RESTOCK'
  | 'CORRECTION';

/**
 * Audit slice of the user that booked the movement (per server `select`).
 */
export interface InventoryMovementUser {
  id: string;
  name: string | null;
}

/**
 * Inventory movement as returned by GET /api/inventory/:id/movements
 * and POST /api/inventory/:id/movements.
 *
 * NOTE: `quantityChange` is a Decimal serialized as string. Negative on
 * consumption, positive on restock.
 *
 * The list endpoint includes `user` (audit). The create endpoint returns
 * the bare row without `user`; consumers should treat it as optional.
 */
export interface InventoryMovement {
  id: string;
  companyId: string;
  inventoryItemId: string;
  quantityChange: string;
  reason: MovementReason;
  maintenanceId: string | null;
  userId: string;
  note: string | null;
  createdAt: string;
  user?: InventoryMovementUser;
}

/**
 * Body for POST /api/inventory/:itemId/movements.
 *
 * `quantityChange` is sent as a number; the server coerces to Decimal.
 * Negative values consume stock; positive values add stock. Zero is rejected.
 */
export interface CreateMovementInput {
  reason: MovementReasonInput;
  quantityChange: number;
  note?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * GET /api/inventory/:itemId/movements
 *
 * Returns the most recent 30 movements (server-side limit), newest first.
 */
export function useInventoryMovements(itemId: string | undefined) {
  return useQuery<InventoryMovement[]>({
    queryKey: ['inventory', itemId, 'movements'],
    queryFn: async () => {
      if (!itemId) throw new Error('Keine Lagerteil-ID angegeben');
      const res = await fetch(`/api/inventory/${itemId}/movements`);
      const result: ApiResponse<InventoryMovement[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Lagerbewegungen');
      }
      return result.data;
    },
    enabled: !!itemId,
    staleTime: 30 * 1000,
  });
}

/**
 * POST /api/inventory/:itemId/movements — OWNER only.
 *
 * On success, invalidates both the broader `['inventory']` cache (so list
 * stock counts refresh) and the per-item movements list.
 */
export function useCreateMovement(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation<InventoryMovement, Error, CreateMovementInput>({
    mutationFn: async (input) => {
      const res = await fetch(`/api/inventory/${itemId}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result: ApiResponse<InventoryMovement> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Anlegen der Lagerbewegung');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({
        queryKey: ['inventory', itemId, 'movements'],
      });
    },
  });
}
