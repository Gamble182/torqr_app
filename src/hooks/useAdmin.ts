import { useQuery } from '@tanstack/react-query';

async function fetchAdmin<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (res.status === 401) throw new Error('Unauthorized');
  if (res.status === 403) throw new Error('Forbidden');
  if (!res.ok) throw new Error('Fehler beim Laden');
  const json = await res.json();
  return json.data as T;
}

// ---- Types ----

export interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalHeaters: number;
  totalMaintenances: number;
  emailsLast7Days: number;
  lastCronRuns: { jobType: string; startedAt: string; status: string; emailsSent: number }[];
  recentEmailErrors: { id: string; type: string; sentAt: string; error: string; customerId: string }[];
  recentCronErrors: { id: string; jobType: string; startedAt: string; errors: string | null }[];
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  createdAt: string;
  lastLogin: string | null;
  _count: { customers: number; heaters: number; maintenances: number };
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  createdAt: string;
  _count: { customers: number; heaters: number; maintenances: number; bookings: number };
  customers: {
    id: string; name: string; city: string; createdAt: string;
    emailOptIn: string; _count: { heaters: number };
  }[];
  emailLogs: {
    id: string; type: string; sentAt: string; resendId: string | null;
    error: string | null; customer: { name: string };
  }[];
  lastLogin: { createdAt: string; ipAddress: string | null } | null;
}

export interface AdminEmailLog {
  id: string;
  type: string;
  sentAt: string;
  resendId: string | null;
  error: string | null;
  customer: { id: string; name: string; user: { id: string; name: string; email: string } };
}

export interface AdminCronRun {
  id: string;
  jobType: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  emailsSent: number;
  errors: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}

// ---- Hooks ----

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: () => fetchAdmin('/api/admin/stats'),
    staleTime: 30_000,
  });
}

export function useAdminUsers(search: string, page: number) {
  return useQuery<PaginatedResponse<AdminUserSummary>>({
    queryKey: ['admin', 'users', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Fehler beim Laden');
      const json = await res.json();
      return { data: json.data, pagination: json.pagination };
    },
    staleTime: 30_000,
  });
}

export function useAdminUser(id: string) {
  return useQuery<AdminUserDetail>({
    queryKey: ['admin', 'user', id],
    queryFn: () => fetchAdmin(`/api/admin/users/${id}`),
    staleTime: 30_000,
  });
}

export function useAdminEmails(type: string, page: number) {
  return useQuery<PaginatedResponse<AdminEmailLog>>({
    queryKey: ['admin', 'emails', type, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (type) params.set('type', type);
      const res = await fetch(`/api/admin/emails?${params}`);
      if (!res.ok) throw new Error('Fehler beim Laden');
      const json = await res.json();
      return { data: json.data, pagination: json.pagination };
    },
    staleTime: 30_000,
  });
}

export function useAdminCrons(page: number) {
  return useQuery<PaginatedResponse<AdminCronRun>>({
    queryKey: ['admin', 'crons', page],
    queryFn: async () => {
      const res = await fetch(`/api/admin/crons?page=${page}`);
      if (!res.ok) throw new Error('Fehler beim Laden');
      const json = await res.json();
      return { data: json.data, pagination: json.pagination };
    },
    staleTime: 30_000,
  });
}
