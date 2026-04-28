import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CatalogEntry } from './useCatalog';
import type { CustomerSystemPartOverride } from './useCustomerSystemOverrides';

export interface CustomerSystem {
  id: string;
  userId: string;
  companyId: string;
  customerId: string;
  catalogId: string;
  catalog: CatalogEntry;
  serialNumber: string | null;
  installationDate: string | null;
  maintenanceInterval: number;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  storageCapacityLiters: number | null;
  photos: string[];
  assignedToUserId: string | null;
  assignedTo?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    street: string;
    city: string;
    phone: string;
  } | null;
  _count?: { maintenances: number; followUpJobs?: number };
  maintenances?: Array<{ id: string; date: string; notes: string | null; photos: string[] }>;
  bookings?: Array<{ id: string; startTime: string; endTime: string | null; calBookingUid: string }>;
  /**
   * Tenant-scoped part overrides (added via Wartungsteile Phase A).
   * Only present on the detail GET response, not on list responses.
   */
  partOverrides?: CustomerSystemPartOverride[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useCustomerSystems(params?: { customerId?: string; search?: string; assignee?: string }) {
  return useQuery<CustomerSystem[]>({
    queryKey: ['customer-systems', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.customerId) sp.set('customerId', params.customerId);
      if (params?.search) sp.set('search', params.search);
      if (params?.assignee) sp.set('assignee', params.assignee);
      const url = `/api/customer-systems${sp.toString() ? `?${sp}` : ''}`;
      const res = await fetch(url);
      const result: ApiResponse<CustomerSystem[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Systeme');
      }
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useCustomerSystem(systemId: string | null) {
  return useQuery<CustomerSystem>({
    queryKey: ['customer-system', systemId],
    queryFn: async () => {
      if (!systemId) throw new Error('Keine System-ID angegeben');
      const res = await fetch(`/api/customer-systems/${systemId}`);
      const result: ApiResponse<CustomerSystem> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Systems');
      }
      return result.data;
    },
    enabled: !!systemId,
    staleTime: 30_000,
  });
}

export function useCreateCustomerSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CustomerSystem>) => {
      const res = await fetch('/api/customer-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<CustomerSystem> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Erstellen des Systems');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      toast.success('System erfolgreich erstellt!');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}

export function useUpdateCustomerSystem(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CustomerSystem>) => {
      const res = await fetch(`/api/customer-systems/${systemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<CustomerSystem> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Aktualisieren');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      queryClient.invalidateQueries({ queryKey: ['customer-system', systemId] });
      // Reassignment changes employee workload + assigned-systems list — bust both caches.
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      toast.success('System erfolgreich aktualisiert!');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}

export function useDeleteCustomerSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (systemId: string) => {
      const res = await fetch(`/api/customer-systems/${systemId}`, { method: 'DELETE' });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Löschen');
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      toast.success('System erfolgreich gelöscht!');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}
