'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
      const result: ApiResponse<Employee & { reassignedCount?: number }> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Aktualisieren');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (!variables.isActive) {
        const count = data.reassignedCount ?? 0;
        if (count > 0) {
          toast.success(`Mitarbeiter deaktiviert. ${count} System(e) wurden dem Inhaber zugewiesen.`);
        } else {
          toast.success('Mitarbeiter deaktiviert.');
        }
      } else {
        toast.success('Mitarbeiter aktiviert.');
      }
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}

export type SystemStatus = 'overdue' | 'due-soon' | 'ok' | 'scheduled';

export interface EmployeeDetailStats {
  assignedSystemsCount: number;
  assignedCustomersCount: number;
  overdueSystemsCount: number;
  dueSoonSystemsCount: number;
  maintenancesLast30Days: number;
}

export interface AssignedSystemRow {
  id: string;
  label: string;
  systemType: string;
  nextMaintenance: string | null;
  status: SystemStatus;
  bookedAt: string | null;
}

export interface AssignedSystemGrouped {
  customer: { id: string; name: string; city: string };
  systems: AssignedSystemRow[];
}

export interface RecentMaintenanceRow {
  id: string;
  date: string;
  customer: { id: string; name: string };
  system: { id: string; label: string };
}

export interface EmployeeDetail extends Employee {
  stats: EmployeeDetailStats;
  assignedSystems: AssignedSystemGrouped[];
  recentActivity: RecentMaintenanceRow[];
}

export function useEmployee(id: string | null) {
  return useQuery<EmployeeDetail>({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) throw new Error('Keine Mitarbeiter-ID');
      const res = await fetch(`/api/employees/${id}`);
      const result: ApiResponse<EmployeeDetail> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Mitarbeiters');
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export interface BulkReassignInput {
  systemIds: string[];
  assignedToUserId: string | null;
}

export interface BulkReassignResult {
  succeeded: string[];
  failed: Array<{ systemId: string; error: string }>;
}

export function useBulkReassignSystems() {
  const queryClient = useQueryClient();

  return useMutation<BulkReassignResult, Error, BulkReassignInput>({
    mutationFn: async ({ systemIds, assignedToUserId }) => {
      const results = await Promise.allSettled(
        systemIds.map(async (id) => {
          const res = await fetch(`/api/customer-systems/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignedToUserId }),
          });
          const body: ApiResponse<unknown> = await res.json();
          if (!body.success) throw new Error(body.error || 'Fehler');
          return id;
        })
      );
      const succeeded: string[] = [];
      const failed: Array<{ systemId: string; error: string }> = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') succeeded.push(r.value);
        else failed.push({ systemId: systemIds[i]!, error: (r.reason as Error).message });
      });
      return { succeeded, failed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      queryClient.invalidateQueries({ queryKey: ['customer-system'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      if (result.failed.length === 0) {
        toast.success(`${result.succeeded.length} System(e) neu zugewiesen`);
      } else if (result.succeeded.length === 0) {
        toast.error(`${result.failed.length} System(e) konnten nicht zugewiesen werden`);
      } else {
        toast.warning(
          `${result.succeeded.length} zugewiesen, ${result.failed.length} fehlgeschlagen`
        );
      }
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
