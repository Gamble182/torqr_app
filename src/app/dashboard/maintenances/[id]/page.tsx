'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Loader2Icon,
  ArrowLeftIcon,
  SaveIcon,
  TrashIcon,
  CalendarIcon,
  FlameIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  FileTextIcon,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Maintenance {
  id: string;
  date: string;
  notes: string | null;
  photos: string[];
  heater: {
    id: string;
    model: string;
    customer: {
      id: string;
      name: string;
      street: string;
      city: string;
    };
  };
}

export default function MaintenanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const maintenanceId = params.id as string;

  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const response = await fetch(`/api/maintenances/${maintenanceId}`);
        const result = await response.json();

        if (result.success) {
          setMaintenance(result.data);
          setDate(result.data.date.split('T')[0]);
          setNotes(result.data.notes || '');
        } else {
          toast.error(`Fehler: ${result.error}`);
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error fetching maintenance:', err);
        toast.error('Fehler beim Laden der Wartung');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenance();
  }, [maintenanceId, router]);

  const handleSave = async () => {
    if (!date) {
      toast.error('Bitte geben Sie ein Datum an');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/maintenances/${maintenanceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          notes: notes || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMaintenance(result.data);
        setIsEditing(false);
        toast.success('Wartung erfolgreich aktualisiert');
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error updating maintenance:', err);
      toast.error('Fehler beim Aktualisieren der Wartung');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Möchten Sie diese Wartung wirklich löschen?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/maintenances/${maintenanceId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Wartung erfolgreich gelöscht');
        router.push('/dashboard');
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting maintenance:', err);
      toast.error('Fehler beim Löschen der Wartung');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!maintenance) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Wartungsdetails</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(maintenance.date), 'dd. MMMM yyyy', { locale: de })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setDate(maintenance.date.split('T')[0]);
                  setNotes(maintenance.notes || '');
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4 mr-2" />
                )}
                Speichern
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Bearbeiten
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-2" />
                )}
                Löschen
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Maintenance Info */}
          <div className="bg-card shadow-sm rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Wartungsinformationen
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Datum
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <p className="text-foreground">
                    {format(new Date(maintenance.date), 'dd. MMMM yyyy', { locale: de })}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4" />
                  Notizen
                </label>
                {isEditing ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    placeholder="Notizen zur Wartung..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                ) : (
                  <p className="text-foreground whitespace-pre-wrap">
                    {maintenance.notes || 'Keine Notizen vorhanden'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Photos */}
          {maintenance.photos && maintenance.photos.length > 0 && (
            <div className="bg-card shadow-sm rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Fotos ({maintenance.photos.length})
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {maintenance.photos.map((photo, index) => (
                  <a
                    key={index}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Heater Info */}
          <div className="bg-card shadow-sm rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FlameIcon className="h-5 w-5 text-primary" />
              Heizsystem
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Modell</p>
                <p className="text-foreground font-medium">{maintenance.heater.model}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-card shadow-sm rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              Kunde
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-foreground font-medium">{maintenance.heater.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  Adresse
                </p>
                <p className="text-foreground">
                  {maintenance.heater.customer.street}<br />
                  {maintenance.heater.customer.city}
                </p>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/customers/${maintenance.heater.customer.id}`)}
                  className="w-full"
                >
                  Kunde anzeigen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
