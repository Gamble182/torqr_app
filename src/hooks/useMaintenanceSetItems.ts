'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MaintenanceSetItem, PartCategory } from './useMaintenanceSets';

export interface CreateSetItemInput {
  category: PartCategory;
  description: string;
  articleNumber?: string;
  quantity?: number | string;
  unit?: string;
  required?: boolean;
  note?: string;
  sortOrder?: number;
  inventoryItemId?: string;
}

export type UpdateSetItemInput = Partial<CreateSetItemInput>;

export interface ReorderSetItemsInput {
  items: Array<{ id: string; sortOrder: number }>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useCreateSetItem(setId: string) {
  const queryClient = useQueryClient();

  return useMutation<MaintenanceSetItem, Error, CreateSetItemInput>({
    mutationFn: async (input) => {
      const res = await fetch(`/api/maintenance-sets/${setId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result: ApiResponse<MaintenanceSetItem> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Anlegen des Teils');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-sets'] });
    },
  });
}

export function useUpdateSetItem(setId: string) {
  const queryClient = useQueryClient();

  return useMutation<MaintenanceSetItem, Error, { id: string; body: UpdateSetItemInput }>({
    mutationFn: async ({ id, body }) => {
      const res = await fetch(`/api/maintenance-set-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result: ApiResponse<MaintenanceSetItem> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Aktualisieren des Teils');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-sets'] });
    },
  });
}

export function useDeleteSetItem(setId: string) {
  const queryClient = useQueryClient();

  return useMutation<null, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/maintenance-set-items/${id}`, { method: 'DELETE' });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen des Teils');
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-sets'] });
    },
  });
}

export function useReorderSetItems(setId: string) {
  const queryClient = useQueryClient();

  return useMutation<null, Error, ReorderSetItemsInput>({
    mutationFn: async (input) => {
      const res = await fetch(`/api/maintenance-sets/${setId}/items/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Sortieren der Teile');
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-sets'] });
    },
  });
}
