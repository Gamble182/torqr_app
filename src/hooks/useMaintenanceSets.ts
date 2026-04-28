'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CatalogEntry, SystemType } from './useCatalog';

export type PartCategory = 'SPARE_PART' | 'CONSUMABLE' | 'TOOL';

export interface MaintenanceSetCatalogSummary {
  manufacturer: string;
  name: string;
  systemType: SystemType;
}

/**
 * Inventory item shape as embedded in maintenance-set items.
 * NOTE: Decimal fields (`currentStock`, `minStock`) are serialized as strings
 * over the wire by Prisma's Decimal.toJSON().
 */
export interface InventoryItemMini {
  id: string;
  description: string;
  articleNumber: string | null;
  unit: string;
  currentStock: string;
  minStock: string;
}

/**
 * Maintenance-set item.
 * NOTE: `quantity` is a Decimal serialized as string.
 */
export interface MaintenanceSetItem {
  id: string;
  maintenanceSetId: string;
  category: PartCategory;
  description: string;
  articleNumber: string | null;
  quantity: string;
  unit: string;
  required: boolean;
  note: string | null;
  sortOrder: number;
  inventoryItemId: string | null;
  inventoryItem?: InventoryItemMini | null;
  createdAt: string;
}

/**
 * List-view shape returned by GET /api/maintenance-sets.
 * `catalog` is a partial select; `_count.items` is included.
 */
export interface MaintenanceSetSummary {
  id: string;
  companyId: string;
  catalogId: string;
  createdAt: string;
  updatedAt: string;
  catalog: MaintenanceSetCatalogSummary;
  _count: { items: number };
}

/**
 * Shape returned by POST /api/maintenance-sets.
 * The create handler does NOT include `_count` in the response.
 */
export type MaintenanceSetCreated = Omit<MaintenanceSetSummary, '_count'>;

/**
 * Detail-view shape returned by GET /api/maintenance-sets/:id.
 * Full `catalog` and ordered `items` (with `inventoryItem`) are included.
 */
export interface MaintenanceSetDetail {
  id: string;
  companyId: string;
  catalogId: string;
  createdAt: string;
  updatedAt: string;
  catalog: CatalogEntry;
  items: MaintenanceSetItem[];
}

export interface CreateMaintenanceSetInput {
  catalogId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useMaintenanceSets(catalogId?: string) {
  return useQuery<MaintenanceSetSummary[]>({
    queryKey: ['maintenance-sets', { catalogId: catalogId ?? null }],
    queryFn: async () => {
      const qs = catalogId ? `?catalogId=${encodeURIComponent(catalogId)}` : '';
      const res = await fetch(`/api/maintenance-sets${qs}`);
      const result: ApiResponse<MaintenanceSetSummary[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Wartungssets');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMaintenanceSet(id: string | undefined) {
  return useQuery<MaintenanceSetDetail>({
    queryKey: ['maintenance-sets', id],
    queryFn: async () => {
      if (!id) throw new Error('Keine Wartungsset-ID angegeben');
      const res = await fetch(`/api/maintenance-sets/${id}`);
      const result: ApiResponse<MaintenanceSetDetail> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Wartungssets');
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateMaintenanceSet() {
  const queryClient = useQueryClient();

  return useMutation<MaintenanceSetCreated, Error, CreateMaintenanceSetInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/maintenance-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result: ApiResponse<MaintenanceSetCreated> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Anlegen des Wartungssets');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-sets'] });
    },
  });
}

export function useDeleteMaintenanceSet() {
  const queryClient = useQueryClient();

  return useMutation<null, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/maintenance-sets/${id}`, { method: 'DELETE' });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen des Wartungssets');
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-sets'] });
    },
  });
}
