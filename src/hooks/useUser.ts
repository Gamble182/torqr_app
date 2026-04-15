// src/hooks/useUser.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface UserProfile {
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  emailWeeklySummary: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/user/profile');
  const result: ApiResponse<UserProfile> = await res.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Fehler beim Laden des Profils');
  }
  return result.data;
}

export function useUser() {
  const queryClient = useQueryClient();

  const query = useQuery<UserProfile>({
    queryKey: ['user'],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  });

  const updateProfile = useMutation({
    mutationFn: async (fields: Partial<Pick<UserProfile, 'name' | 'email' | 'phone' | 'companyName'>>) => {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result: ApiResponse<UserProfile> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Speichern');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const updatePassword = useMutation({
    mutationFn: async (fields: { currentPassword: string; newPassword: string }) => {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Ändern des Passworts');
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (fields: { emailWeeklySummary: boolean }) => {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const result: ApiResponse<{ emailWeeklySummary: boolean }> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Speichern');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const sendWeeklySummary = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/send-weekly-summary', { method: 'POST' });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Senden');
      return result;
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile,
    updatePassword,
    updatePreferences,
    sendWeeklySummary,
  };
}
