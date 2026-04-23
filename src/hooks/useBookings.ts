import { useQuery } from '@tanstack/react-query';

export type BookingSource = 'cal' | 'manual' | 'all';
export type BookingRange = 'upcoming' | 'week' | 'month' | 'past' | 'all';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED';

export interface BookingListFilters {
  range?: BookingRange;
  status?: BookingStatus[];
  assignee?: string; // userId | 'unassigned'
  customerId?: string;
  systemType?: 'HEATING' | 'AC' | 'WATER_TREATMENT' | 'ENERGY_STORAGE' | 'all';
  source?: BookingSource;
  from?: string; // ISO datetime
  to?: string;   // ISO datetime
  limit?: number;
}

export interface Booking {
  id: string;
  calBookingUid: string;
  triggerEvent: string;
  startTime: string;
  endTime: string | null;
  title: string | null;
  attendeeName: string | null;
  attendeeEmail: string | null;
  status: BookingStatus;
  cancelReason: string | null;
  cancelledAt: string | null;
  rescheduledFromUid: string | null;
  rescheduledToUid: string | null;
  rescheduledAt: string | null;
  createdAt: string;
  customerId: string | null;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  system: {
    id: string;
    serialNumber: string | null;
    catalog: { manufacturer: string; name: string; systemType: string };
  } | null;
  assignedToUserId: string | null;
  assignedTo: { id: string; name: string } | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function buildSearchParams(filters: BookingListFilters): string {
  const sp = new URLSearchParams();
  if (filters.range) sp.set('range', filters.range);
  if (filters.status) {
    for (const s of filters.status) sp.append('status', s);
  }
  if (filters.assignee) sp.set('assignee', filters.assignee);
  if (filters.customerId) sp.set('customerId', filters.customerId);
  if (filters.systemType && filters.systemType !== 'all') sp.set('systemType', filters.systemType);
  if (filters.source && filters.source !== 'all') sp.set('source', filters.source);
  if (filters.from) sp.set('from', filters.from);
  if (filters.to) sp.set('to', filters.to);
  if (filters.limit) sp.set('limit', String(filters.limit));
  return sp.toString();
}

/**
 * Fetch bookings. Accepts either a customerId (legacy short form) or a full filter object.
 */
export function useBookings(input?: string | BookingListFilters) {
  const filters: BookingListFilters =
    typeof input === 'string' ? { customerId: input } : input ?? {};

  const query = buildSearchParams(filters);

  return useQuery<Booking[]>({
    queryKey: ['bookings', filters],
    staleTime: 30_000,
    queryFn: async () => {
      const url = query ? `/api/bookings?${query}` : '/api/bookings';
      const res = await fetch(url);
      const result: ApiResponse<Booking[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Termine');
      }
      return result.data;
    },
  });
}

/**
 * Fetch a single booking by id with full detail (customer email, phone, system catalog).
 */
export function useBooking(id: string | null | undefined) {
  return useQuery<Booking>({
    queryKey: ['booking', id],
    enabled: !!id,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${id}`);
      const result: ApiResponse<Booking> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Termins');
      }
      return result.data;
    },
  });
}
