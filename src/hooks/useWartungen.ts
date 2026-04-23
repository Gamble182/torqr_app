import { useQuery } from '@tanstack/react-query';

export type WartungenStatus = 'all' | 'overdue' | 'upcoming' | 'thisWeek' | 'thisMonth';

export interface WartungenFilters {
  status: WartungenStatus;
  days?: number;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface WartungCustomer {
  id: string;
  name: string;
  street: string;
  city: string;
  phone: string;
  email: string | null;
}

export interface WartungMaintenance {
  id: string;
  date: string;
  notes: string | null;
}

export interface WartungSystem {
  id: string;
  serialNumber: string | null;
  nextMaintenance: string;
  maintenanceInterval: number;
  catalog: { manufacturer: string; name: string };
  customer: WartungCustomer;
  maintenances: WartungMaintenance[];
}

export interface WartungenStats {
  total: number;
  overdue: number;
  thisWeek: number;
  thisMonth: number;
}

interface ApiResponse {
  success: boolean;
  data?: WartungSystem[];
  stats?: WartungenStats;
  error?: string;
}

export interface WartungenResult {
  systems: WartungSystem[];
  stats: WartungenStats;
}

function buildQueryString(filters: WartungenFilters): string {
  const sp = new URLSearchParams();
  sp.set('status', filters.status);
  if (filters.dateFrom && filters.dateTo) {
    sp.set('dateFrom', filters.dateFrom);
    sp.set('dateTo', filters.dateTo);
  } else {
    sp.set('days', String(filters.days ?? 30));
  }
  return sp.toString();
}

export function useWartungen(filters: WartungenFilters) {
  return useQuery<WartungenResult>({
    queryKey: ['wartungen', filters],
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(`/api/wartungen?${buildQueryString(filters)}`);
      const result: ApiResponse = await res.json();
      if (!result.success || !result.data || !result.stats) {
        throw new Error(result.error || 'Fehler beim Laden der Wartungen');
      }
      return { systems: result.data, stats: result.stats };
    },
  });
}
