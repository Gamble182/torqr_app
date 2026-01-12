'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Loader2Icon,
  ArrowLeftIcon,
  SaveIcon,
  TrashIcon,
  FlameIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  WrenchIcon,
  PackageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Maintenance {
  id: string;
  date: string;
  notes: string | null;
}

interface Heater {
  id: string;
  model: string;
  serialNumber: string | null;
  installationDate: string | null;
  maintenanceInterval: number;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  requiredParts: string | null;
  customer: {
    id: string;
    name: string;
    street: string;
    zipCode: string;
    city: string;
    phone: string;
    email: string | null;
  };
  maintenances: Maintenance[];
}

export default function HeaterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const heaterId = params.id as string;

  const [heater, setHeater] = useState<Heater | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [maintenanceInterval, setMaintenanceInterval] = useState('12');
  const [lastMaintenance, setLastMaintenance] = useState('');
  const [requiredParts, setRequiredParts] = useState('');

  useEffect(() => {
    const fetchHeater = async () => {
      try {
        const response = await fetch(`/api/heaters/${heaterId}`);
        const result = await response.json();

        if (result.success) {
          setHeater(result.data);
          setModel(result.data.model);
          setSerialNumber(result.data.serialNumber || '');
          setInstallationDate(result.data.installationDate ? result.data.installationDate.split('T')[0] : '');
          setMaintenanceInterval(result.data.maintenanceInterval.toString());
          setLastMaintenance(result.data.lastMaintenance ? result.data.lastMaintenance.split('T')[0] : '');
          setRequiredParts(result.data.requiredParts || '');
        } else {
          toast.error(`Fehler: ${result.error}`);
          router.push('/dashboard/heaters');
        }
      } catch (err) {
        console.error('Error fetching heater:', err);
        toast.error('Fehler beim Laden der Heizung');
        router.push('/dashboard/heaters');
      } finally {
        setLoading(false);
      }
    };

    fetchHeater();
  }, [heaterId, router]);

  const handleSave = async () => {
    if (!model || !maintenanceInterval) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/heaters/${heaterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          serialNumber: serialNumber || null,
          installationDate: installationDate ? new Date(installationDate).toISOString() : null,
          maintenanceInterval: maintenanceInterval.toString(),
          lastMaintenance: lastMaintenance ? new Date(lastMaintenance).toISOString() : null,
          requiredParts: requiredParts || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the heater data
        const refreshResponse = await fetch(`/api/heaters/${heaterId}`);
        const refreshResult = await refreshResponse.json();
        if (refreshResult.success) {
          setHeater(refreshResult.data);
        }
        setIsEditing(false);
        toast.success('Heizung erfolgreich aktualisiert');
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error updating heater:', err);
      toast.error('Fehler beim Aktualisieren der Heizung');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Möchten Sie diese Heizung wirklich löschen? Alle Wartungsdaten werden ebenfalls gelöscht.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/heaters/${heaterId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Heizung erfolgreich gelöscht');
        router.push('/dashboard/heaters');
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting heater:', err);
      toast.error('Fehler beim Löschen der Heizung');
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

  if (!heater) {
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
            <h1 className="text-3xl font-bold text-foreground">{heater.model}</h1>
            {heater.serialNumber && (
              <p className="text-sm text-muted-foreground mt-1">
                Seriennummer: {heater.serialNumber}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setModel(heater.model);
                  setSerialNumber(heater.serialNumber || '');
                  setInstallationDate(heater.installationDate ? heater.installationDate.split('T')[0] : '');
                  setMaintenanceInterval(heater.maintenanceInterval.toString());
                  setLastMaintenance(heater.lastMaintenance ? heater.lastMaintenance.split('T')[0] : '');
                  setRequiredParts(heater.requiredParts || '');
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
          {/* Heater Info */}
          <div className="bg-card shadow-sm rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FlameIcon className="h-5 w-5 text-primary" />
              Heizungsinformationen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Modell *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                ) : (
                  <p className="text-foreground">{heater.model}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Seriennummer
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <p className="text-foreground">{heater.serialNumber || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Installationsdatum
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <p className="text-foreground">
                    {heater.installationDate
                      ? format(new Date(heater.installationDate), 'dd. MMMM yyyy', { locale: de })
                      : '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Wartungsintervall *
                </label>
                {isEditing ? (
                  <select
                    value={maintenanceInterval}
                    onChange={(e) => setMaintenanceInterval(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="1">1 Monat</option>
                    <option value="3">3 Monate</option>
                    <option value="6">6 Monate</option>
                    <option value="12">12 Monate</option>
                    <option value="24">24 Monate</option>
                  </select>
                ) : (
                  <p className="text-foreground">
                    {heater.maintenanceInterval} {heater.maintenanceInterval === 1 ? 'Monat' : 'Monate'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Letzte Wartung
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={lastMaintenance}
                    onChange={(e) => setLastMaintenance(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <p className="text-foreground">
                    {heater.lastMaintenance
                      ? format(new Date(heater.lastMaintenance), 'dd. MMMM yyyy', { locale: de })
                      : '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Nächste Wartung
                </label>
                <p className="text-foreground">
                  {heater.nextMaintenance
                    ? format(new Date(heater.nextMaintenance), 'dd. MMMM yyyy', { locale: de })
                    : '-'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <PackageIcon className="h-4 w-4" />
                Benötigte Ersatzteile
              </label>
              {isEditing ? (
                <textarea
                  value={requiredParts}
                  onChange={(e) => setRequiredParts(e.target.value)}
                  rows={4}
                  placeholder="Liste der benötigten Ersatzteile..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              ) : (
                <p className="text-foreground whitespace-pre-wrap">
                  {heater.requiredParts || 'Keine Ersatzteile angegeben'}
                </p>
              )}
            </div>
          </div>

          {/* Maintenance History */}
          <div className="bg-card shadow-sm rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              Wartungshistorie ({heater.maintenances.length})
            </h2>
            {heater.maintenances.length > 0 ? (
              <div className="space-y-3">
                {heater.maintenances.map((maintenance) => (
                  <Link
                    key={maintenance.id}
                    href={`/dashboard/maintenances/${maintenance.id}`}
                    className="block p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-secondary/20 p-2">
                          <WrenchIcon className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {format(new Date(maintenance.date), 'dd. MMMM yyyy', { locale: de })}
                          </p>
                          {maintenance.notes && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {maintenance.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <WrenchIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Noch keine Wartungen durchgeführt</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-card shadow-sm rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              Kunde
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-foreground font-medium">{heater.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  Adresse
                </p>
                <p className="text-foreground">
                  {heater.customer.street}<br />
                  {heater.customer.zipCode} {heater.customer.city}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <PhoneIcon className="h-3 w-3" />
                  Telefon
                </p>
                <a
                  href={`tel:${heater.customer.phone}`}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  {heater.customer.phone}
                </a>
              </div>
              {heater.customer.email && (
                <div>
                  <p className="text-sm text-muted-foreground">E-Mail</p>
                  <a
                    href={`mailto:${heater.customer.email}`}
                    className="text-foreground hover:text-accent transition-colors break-all"
                  >
                    {heater.customer.email}
                  </a>
                </div>
              )}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/customers/${heater.customer.id}`)}
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
