'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileTextIcon, ImageIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Maintenance {
  id: string;
  date: string;
  notes: string | null;
  photos: string[];
}

interface MaintenanceHistoryProps {
  maintenances: Maintenance[];
  onDelete: (id: string) => void;
}

export function MaintenanceHistory({
  maintenances,
  onDelete,
}: MaintenanceHistoryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDelete = async (maintenance: Maintenance) => {
    if (
      !confirm(
        `Möchten Sie die Wartung vom ${formatDate(maintenance.date)} wirklich löschen?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenances/${maintenance.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Wartung gelöscht');
        onDelete(maintenance.id);
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting maintenance:', err);
      toast.error('Fehler beim Löschen der Wartung');
    }
  };

  if (maintenances.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Noch keine Wartungen
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Wartungen werden hier angezeigt
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {maintenances.map((maintenance) => (
          <Card key={maintenance.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">
                    {formatDate(maintenance.date)}
                  </span>
                </div>

                {maintenance.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-700 mb-3">
                    <FileTextIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="flex-1 whitespace-pre-wrap">
                      {maintenance.notes}
                    </p>
                  </div>
                )}

                {maintenance.photos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                    <div className="flex gap-2 overflow-x-auto">
                      {maintenance.photos.map((photoUrl, index) => (
                        <img
                          key={index}
                          src={photoUrl}
                          alt="Wartungsfoto"
                          className="h-16 w-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setSelectedPhoto(photoUrl)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(maintenance)}
                className="ml-4 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Full-size photo viewer */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Wartungsfoto"
            className="max-w-full max-h-full object-contain"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 bg-white"
          >
            Schließen
          </Button>
        </div>
      )}
    </>
  );
}
