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

interface AssignedUser {
  id: string;
  name: string;
}

interface UpcomingSystem {
  id: string;
  nextMaintenance: string;
  catalog: CatalogEntry;
  customer: Customer;
  assignedTo?: AssignedUser | null;
}

interface RecentMaintenance {
  id: string;
  date: string;
  notes: string | null;
  system: {
    id: string;
    catalog: CatalogEntry;
    customer: {
      id: string;
      name: string;
    };
  };
}

interface DashboardStats {
  role: 'OWNER' | 'TECHNICIAN';
  totalCustomers: number;
  totalSystems: number;
  overdueMaintenances: number;
  upcomingMaintenances: number;
  upcomingSystemsList: UpcomingSystem[];
  recentMaintenances: RecentMaintenance[];
  unassignedSystemsCount: number;
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
