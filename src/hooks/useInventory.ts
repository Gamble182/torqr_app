'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Inventory item shape returned by GET /api/inventory and
 * GET /api/inventory/:id.
 *
 * NOTE: Decimal fields (`currentStock`, `minStock`) are serialized as strings
 * over the wire by Prisma's Decimal.toJSON().
 */
export interface InventoryItem {
  id: string;
  companyId: string;
  articleNumber: string | null;
  description: string;
  unit: string;
  currentStock: string;
  minStock: string;
  lastRestockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Body for POST /api/inventory — mirrors `inventoryItemCreateSchema`.
 *
 * Server defaults `unit` to `'Stck'` and `minStock` to `0` when omitted.
 * `currentStock` is NOT settable on create (server defaults to 0; managed via
 * inventory movements thereafter).
 */
export interface CreateInventoryItemInput {
  description: string;
  articleNumber?: string;
  unit?: string;
  minStock?: number;
}

/**
 * Body for PATCH /api/inventory/:id — mirrors `inventoryItemUpdateSchema`
 * (`.partial().strict()`).
 *
 * `currentStock` is intentionally NOT permitted: stock changes must go
 * through inventory movements.
 */
export type UpdateInventoryItemInput = Partial<CreateInventoryItemInput>;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * GET /api/inventory[?filter=low]
 *
 * `filter='low'` returns only items where `currentStock < minStock`.
 */
export function useInventoryItems(filter?: 'low') {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory', { filter: filter ?? null }],
    queryFn: async () => {
      const qs = filter ? `?filter=${filter}` : '';
      const res = await fetch(`/api/inventory${qs}`);
      const result: ApiResponse<InventoryItem[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Lagers');
      }
      return result.data;
    },
    staleTime: 30 * 1000,
  });
}

/**
 * GET /api/inventory/:id
 */
export function useInventoryItem(id: string | undefined) {
  return useQuery<InventoryItem>({
    queryKey: ['inventory', id],
    queryFn: async () => {
      if (!id) throw new Error('Keine Lagerteil-ID angegeben');
      const res = await fetch(`/api/inventory/${id}`);
      const result: ApiResponse<InventoryItem> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Lagerartikels');
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * POST /api/inventory — OWNER only.
 */
export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation<InventoryItem, Error, CreateInventoryItemInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result: ApiResponse<InventoryItem> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Anlegen des Lagerartikels');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export interface UpdateInventoryItemArgs {
  id: string;
  body: UpdateInventoryItemInput;
}

/**
 * PATCH /api/inventory/:id — OWNER only.
 */
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation<InventoryItem, Error, UpdateInventoryItemArgs>({
    mutationFn: async ({ id, body }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result: ApiResponse<InventoryItem> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Aktualisieren des Lagerartikels');
      }
      return result.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', vars.id] });
    },
  });
}

/**
 * DELETE /api/inventory/:id — OWNER only.
 *
 * Server rejects (400) if the item is still referenced by any
 * MaintenanceSetItem or CustomerSystemPartOverride.
 */
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation<null, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen des Lagerartikels');
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
