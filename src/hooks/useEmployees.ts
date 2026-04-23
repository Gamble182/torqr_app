'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface EmployeeWorkload {
  assignedSystemsCount: number;
  overdueSystemsCount: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'OWNER' | 'TECHNICIAN';
  isActive: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  workload: EmployeeWorkload;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch('/api/employees');
  const result: ApiResponse<Employee[]> = await res.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Fehler beim Laden der Mitarbeiter');
  }
  return result.data;
}

export function useEmployees(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result: ApiResponse<Employee & { tempPassword: string }> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Anlegen des Mitarbeiters');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useToggleEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      const result: ApiResponse<Employee> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Aktualisieren');
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
