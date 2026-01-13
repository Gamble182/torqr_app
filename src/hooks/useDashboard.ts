import { useQuery } from '@tanstack/react-query';

interface Customer {
  id: string;
  name: string;
  city: string;
  phone: string;
}

interface UpcomingMaintenance {
  id: string;
  model: string;
  nextMaintenance: string;
  customer: Customer;
}

interface Maintenance {
  id: string;
  date: string;
  notes: string | null;
  heater: {
    model: string;
    customer: {
      id: string;
      name: string;
    };
  };
}

interface DashboardStats {
  totalCustomers: number;
  totalHeaters: number;
  overdueMaintenances: number;
  upcomingMaintenances: number;
  upcomingMaintenancesList: UpcomingMaintenance[];
  recentMaintenances: Maintenance[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch dashboard statistics
 */
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
    // Refetch every 5 minutes for dashboard
    staleTime: 1000 * 60 * 5,
    // Refetch on window focus for dashboard
    refetchOnWindowFocus: true,
  });
}
