'use client';

import { useQuery } from '@tanstack/react-query';
import type { EffectivePart } from './useEffectiveParts';
import type { CatalogEntry } from './useCatalog';

/**
 * Packing-list DTO returned by GET /api/bookings/:id/packing-list.
 *
 * Authorization (server-side):
 * - OWNER: any booking in their tenant.
 * - TECHNICIAN: only bookings where `assignedToUserId === userId`,
 *   otherwise 403.
 *
 * `system` is null when the booking has no linked CustomerSystem
 * (`booking.systemId === null`); in that case `effectiveParts` is `[]`.
 */

export interface PackingListBooking {
  id: string;
  startTime: string;
  endTime: string | null;
  title: string | null;
}

export interface PackingListCustomer {
  id: string;
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string | null;
  notes: string | null;
}

export interface PackingListAssignedTo {
  id: string;
  name: string | null;
}

/**
 * System slice as returned by the packing-list endpoint:
 * the full CustomerSystem row joined with its catalog entry and a
 * shallow `assignedTo` (system technician).
 *
 * NOTE: Date fields (`installationDate`, `lastMaintenance`,
 * `nextMaintenance`) are ISO strings on the wire.
 */
export interface PackingListSystem {
  id: string;
  serialNumber: string | null;
  installationDate: string | null;
  maintenanceInterval: number;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  storageCapacityLiters: number | null;
  photos: string[];
  catalogId: string;
  customerId: string;
  companyId: string;
  userId: string;
  assignedToUserId: string | null;
  catalog: CatalogEntry;
  assignedTo: PackingListAssignedTo | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackingListTechnician {
  id: string;
  name: string | null;
}

export interface PackingListDto {
  booking: PackingListBooking;
  customer: PackingListCustomer;
  system: PackingListSystem | null;
  technician: PackingListTechnician;
  effectiveParts: EffectivePart[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * GET /api/bookings/:bookingId/packing-list
 */
export function usePackingList(bookingId: string | undefined) {
  return useQuery<PackingListDto>({
    queryKey: ['packing-list', bookingId],
    queryFn: async () => {
      if (!bookingId) throw new Error('Keine Termin-ID angegeben');
      const res = await fetch(`/api/bookings/${bookingId}/packing-list`);
      const result: ApiResponse<PackingListDto> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Packliste');
      }
      return result.data;
    },
    enabled: !!bookingId,
    staleTime: 60 * 1000,
  });
}
