'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CameraIcon, ImageIcon, Loader2Icon, TrashIcon, XIcon } from 'lucide-react';
import { useUploadSystemPhoto, useDeleteSystemPhoto } from '@/hooks/useSystemPhotos';

interface SystemPhotosCardProps {
  systemId: string;
  photos: string[];
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function SystemPhotosCard({ systemId, photos }: SystemPhotosCardProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === 'OWNER';

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useUploadSystemPhoto(systemId);
  const del = useDeleteSystemPhoto(systemId);

  const remainingSlots = MAX_PHOTOS - photos.length;
  const canAdd = remainingSlots > 0;

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // reset input so the same file can be picked again later
    e.target.value = '';

    const valid: File[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Nur JPEG, PNG oder WebP erlaubt`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: Datei zu groß (max. 5MB)`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) return;

    if (valid.length > remainingSlots) {
      toast.error(
        `Nur ${remainingSlots} weitere${remainingSlots === 1 ? 's' : ''} Foto${
          remainingSlots === 1 ? '' : 's'
        } möglich`
      );
      return;
    }

    setIsUploading(true);
    try {
      await Promise.all(valid.map((file) => upload.mutateAsync(file)));
      toast.success(
        `${valid.length} Foto${valid.length === 1 ? '' : 's'} hochgeladen`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Fehler beim Hochladen'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Foto wirklich löschen?')) return;
    await del.mutateAsync(url).catch(() => {
      // toast already shown by hook
    });
  };

  return (
    <>
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Fotos</h2>
            <span className="text-xs text-muted-foreground">
              {photos.length}/{MAX_PHOTOS}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePickFiles}
            disabled={!canAdd || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                Hochladen…
              </>
            ) : (
              <>
                <CameraIcon className="h-3.5 w-3.5" />
                Hinzufügen
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </div>

        {photos.length === 0 ? (
          <div className="py-8 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">Noch keine Fotos</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              z.B. Installationsfotos für Angebote
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((url) => (
              <div key={url} className="relative group aspect-square">
                <img
                  src={url}
                  alt="Systemfoto"
                  className="w-full h-full object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedPhoto(url)}
                />
                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(url, e)}
                    disabled={del.isPending}
                    className="absolute top-1.5 right-1.5 bg-destructive/90 hover:bg-destructive text-white rounded-md p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-50"
                    aria-label="Foto löschen"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Systemfoto"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 bg-card"
          >
            <XIcon className="h-4 w-4" />
            Schließen
          </Button>
        </div>
      )}
    </>
  );
}
