import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Heater {
  id: string;
  model: string;
  nextMaintenance: string | null;
}

interface Customer {
  id: string;
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string | null;
  emailOptIn: 'NONE' | 'CONFIRMED' | 'UNSUBSCRIBED';
  suppressEmail?: boolean;
  heatingType: string;
  additionalEnergySources: string[];
  energyStorageSystems: string[];
  notes: string | null;
  heaters: Heater[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetch all customers
 */
export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      const result: ApiResponse<Customer[]> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Kunden');
      }

      return result.data;
    },
  });
}

/**
 * Fetch a single customer by ID
 */
export function useCustomer(customerId: string | null) {
  return useQuery<Customer>({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Keine Kunden-ID angegeben');

      const response = await fetch(`/api/customers/${customerId}`);
      const result: ApiResponse<Customer> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Kunden');
      }

      return result.data;
    },
    enabled: !!customerId,
  });
}

/**
 * Create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });

      const result: ApiResponse<Customer> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Erstellen des Kunden');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kunde erfolgreich erstellt!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

/**
 * Update an existing customer
 */
export function useUpdateCustomer(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });

      const result: ApiResponse<Customer> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Aktualisieren des Kunden');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      toast.success('Kunde erfolgreich aktualisiert!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

/**
 * Delete a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<null> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen des Kunden');
      }

      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kunde erfolgreich gelöscht!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
