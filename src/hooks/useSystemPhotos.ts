import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UploadResponse {
  success: boolean;
  url?: string;
  photos?: string[];
  error?: string;
}

interface DeleteResponse {
  success: boolean;
  photos?: string[];
  error?: string;
}

export function useUploadSystemPhoto(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string; photos: string[] }> => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/systems/${systemId}/photos`, {
        method: 'POST',
        body: fd,
      });
      const result: UploadResponse = await res.json();
      if (!result.success || !result.url || !result.photos) {
        throw new Error(result.error || 'Upload fehlgeschlagen');
      }
      return { url: result.url, photos: result.photos };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-system', systemId] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
    },
  });
}

export function useDeleteSystemPhoto(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string): Promise<string[]> => {
      const res = await fetch(`/api/systems/${systemId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const result: DeleteResponse = await res.json();
      if (!result.success || !result.photos) {
        throw new Error(result.error || 'Fehler beim Löschen');
      }
      return result.photos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-system', systemId] });
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      toast.success('Foto gelöscht');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}

export type { ApiResponse };
