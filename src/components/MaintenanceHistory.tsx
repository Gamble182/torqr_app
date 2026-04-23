'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileTextIcon, ImageIcon, TrashIcon, XIcon } from 'lucide-react';
import { useDeleteMaintenance } from '@/hooks/useMaintenances';

interface Maintenance {
  id: string;
  date: string;
  notes: string | null;
  photos: string[];
}

interface MaintenanceHistoryProps {
  maintenances: Maintenance[];
}

export function MaintenanceHistory({ maintenances }: MaintenanceHistoryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const deleteMutation = useDeleteMaintenance();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDelete = (maintenance: Maintenance) => {
    if (
      !confirm(
        `Möchten Sie die Wartung vom ${formatDate(maintenance.date)} wirklich löschen?`
      )
    ) {
      return;
    }
    deleteMutation.mutate(maintenance.id);
  };

  if (maintenances.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">
          Noch keine Wartungen
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Wartungen werden hier angezeigt
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {maintenances.map((maintenance) => (
          <Card key={maintenance.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">
                    {formatDate(maintenance.date)}
                  </span>
                </div>

                {maintenance.notes && (
                  <div className="flex items-start gap-2 text-sm text-foreground mb-3">
                    <FileTextIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <p className="flex-1 whitespace-pre-wrap">
                      {maintenance.notes}
                    </p>
                  </div>
                )}

                {maintenance.photos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex gap-2 overflow-x-auto">
                      {maintenance.photos.map((photoUrl, index) => (
                        <img
                          key={index}
                          src={photoUrl}
                          alt="Wartungsfoto"
                          className="h-16 w-16 object-cover rounded-lg border border-border cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setSelectedPhoto(photoUrl)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleDelete(maintenance)}
                disabled={deleteMutation.isPending}
                className="ml-3 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Wartungsfoto"
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
