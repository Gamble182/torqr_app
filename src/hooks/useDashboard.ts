import { useQuery } from '@tanstack/react-query';

interface CatalogEntry {
  id: string;
  systemType: string;
  manufacturer: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  city: string;
  phone: string;
}

interface UpcomingSystem {
  id: string;
  nextMaintenance: string;
  catalog: CatalogEntry;
  customer: Customer;
}

interface RecentMaintenance {
  id: string;
  date: string;
  notes: string | null;
  system: {
    catalog: CatalogEntry;
    customer: {
      id: string;
      name: string;
    };
  };
}

interface DashboardStats {
  totalCustomers: number;
  totalSystems: number;
  overdueMaintenances: number;
  upcomingMaintenances: number;
  upcomingSystemsList: UpcomingSystem[];
  recentMaintenances: RecentMaintenance[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useDashboardStats(days: number = 30) {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', days],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/stats?days=${days}`);
      const result: ApiResponse<DashboardStats> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Statistiken');
      }

      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}
