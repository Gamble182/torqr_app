import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ChecklistItem {
  id: string;
  label: string;
  sortOrder: number;
  createdAt: string;
}

export function useChecklistItems(systemId: string) {
  return useQuery<ChecklistItem[]>({
    queryKey: ['checklist-items', systemId],
    queryFn: async () => {
      const res = await fetch(`/api/systems/${systemId}/checklist-items`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Laden der Checkliste');
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddChecklistItem(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (label: string): Promise<ChecklistItem> => {
      const res = await fetch(`/api/systems/${systemId}/checklist-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Hinzufügen');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', systemId] });
    },
  });
}

export function useDeleteChecklistItem(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      const res = await fetch(`/api/systems/${systemId}/checklist-items/${itemId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Löschen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', systemId] });
    },
  });
}
