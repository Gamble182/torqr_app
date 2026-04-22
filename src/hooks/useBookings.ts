import { useQuery } from '@tanstack/react-query';

export interface Booking {
  id: string;
  calBookingUid: string;
  triggerEvent: string;
  startTime: string;
  endTime: string | null;
  title: string | null;
  attendeeName: string | null;
  attendeeEmail: string | null;
  status: 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED';
  createdAt: string;
  customerId: string | null;
  customer: { id: string; name: string } | null;
  system: { id: string; catalog: { manufacturer: string; name: string } } | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch bookings for a given customer (or all bookings if no customerId given).
 */
export function useBookings(customerId?: string) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', customerId ?? 'all'],
    staleTime: 30_000,
    queryFn: async () => {
      const url = customerId
        ? `/api/bookings?customerId=${customerId}`
        : '/api/bookings';
      const res = await fetch(url);
      const result: ApiResponse<Booking[]> = await res.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Termine');
      }

      return result.data;
    },
    enabled: true,
  });
}
