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
  EditIcon,
  XIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import heaterTypesConfig from '@/config/heater-types.json';

interface Maintenance {
  id: string;
  date: string;
  notes: string | null;
}

interface Customer {
  id: string;
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string | null;
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
  heaterType: string | null;
  manufacturer: string | null;
  hasStorage: boolean;
  storageManufacturer: string | null;
  storageModel: string | null;
  storageCapacity: number | null;
  hasBattery: boolean;
  batteryManufacturer: string | null;
  batteryModel: string | null;
  batteryCapacity: number | null;
  customer: Customer | null;
  maintenances: Maintenance[];
}

export default function HeaterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const heaterId = params.id as string;

  const [heater, setHeater] = useState<Heater | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state - Basic
  const [customerId, setCustomerId] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [maintenanceInterval, setMaintenanceInterval] = useState('12');
  const [lastMaintenance, setLastMaintenance] = useState('');
  const [requiredParts, setRequiredParts] = useState('');

  // Form state - Heating system
  const [heaterType, setHeaterType] = useState('');
  const [manufacturer, setManufacturer] = useState('');

  // Form state - Storage
  const [hasStorage, setHasStorage] = useState(false);
  const [storageManufacturer, setStorageManufacturer] = useState('');
  const [storageModel, setStorageModel] = useState('');
  const [storageCapacity, setStorageCapacity] = useState('');

  // Form state - Battery
  const [hasBattery, setHasBattery] = useState(false);
  const [batteryManufacturer, setBatteryManufacturer] = useState('');
  const [batteryModel, setBatteryModel] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');

  useEffect(() => {
    fetchHeater();
    fetchCustomers();
  }, [heaterId]);

  const fetchHeater = async () => {
    try {
      const response = await fetch(`/api/heaters/${heaterId}`);
      const result = await response.json();

      if (result.success) {
        const data = result.data;
        setHeater(data);
        setCustomerId(data.customer?.id || '');
        setModel(data.model);
        setSerialNumber(data.serialNumber || '');
        setInstallationDate(data.installationDate ? data.installationDate.split('T')[0] : '');
        setMaintenanceInterval(data.maintenanceInterval.toString());
        setLastMaintenance(data.lastMaintenance ? data.lastMaintenance.split('T')[0] : '');
        setRequiredParts(data.requiredParts || '');
        setHeaterType(data.heaterType || '');
        setManufacturer(data.manufacturer || '');
        setHasStorage(data.hasStorage);
        setStorageManufacturer(data.storageManufacturer || '');
        setStorageModel(data.storageModel || '');
        setStorageCapacity(data.storageCapacity?.toString() || '');
        setHasBattery(data.hasBattery);
        setBatteryManufacturer(data.batteryManufacturer || '');
        setBatteryModel(data.batteryModel || '');
        setBatteryCapacity(data.batteryCapacity?.toString() || '');
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

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const result = await response.json();
      if (result.success) {
        setCustomers(result.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/heaters/${heaterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || null,
          model,
          serialNumber: serialNumber || null,
          installationDate: installationDate ? new Date(installationDate).toISOString() : null,
          maintenanceInterval,
          lastMaintenance: lastMaintenance ? new Date(lastMaintenance).toISOString() : null,
          requiredParts: requiredParts || null,
          heaterType: heaterType || null,
          manufacturer: manufacturer || null,
          hasStorage,
          storageManufacturer: hasStorage ? (storageManufacturer || null) : null,
          storageModel: hasStorage ? (storageModel || null) : null,
          storageCapacity: hasStorage && storageCapacity ? parseInt(storageCapacity) : null,
          hasBattery,
          batteryManufacturer: hasBattery ? (batteryManufacturer || null) : null,
          batteryModel: hasBattery ? (batteryModel || null) : null,
          batteryCapacity: hasBattery && batteryCapacity ? parseFloat(batteryCapacity) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Heizung erfolgreich aktualisiert');
        setIsEditing(false);
        fetchHeater();
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
    if (!confirm('Möchten Sie diese Heizung wirklich löschen?')) return;

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
          <Link href="/dashboard/heaters">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{heater.model}</h1>
            {heater.serialNumber && (
              <p className="mt-1 text-muted-foreground">SN: {heater.serialNumber}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <EditIcon className="h-4 w-4 mr-2" />
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
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <XIcon className="h-4 w-4 mr-2" />
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <SaveIcon className="h-4 w-4 mr-2" />
                )}
                Speichern
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        /* EDIT MODE */
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Grundinformationen</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kunde
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Kein Kunde zugeordnet</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Heizungstyp
                </label>
                <select
                  value={heaterType}
                  onChange={(e) => setHeaterType(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Bitte wählen...</option>
                  {heaterTypesConfig.heaterTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hersteller
                </label>
                <select
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Bitte wählen...</option>
                  {heaterTypesConfig.manufacturers.map((mfr) => (
                    <option key={mfr} value={mfr}>
                      {mfr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Modell <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seriennummer
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Installationsdatum
                </label>
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Maintenance Information */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Wartungsinformationen</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Wartungsintervall <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={maintenanceInterval}
                  onChange={(e) => setMaintenanceInterval(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="1">1 Monat</option>
                  <option value="3">3 Monate</option>
                  <option value="6">6 Monate</option>
                  <option value="12">12 Monate</option>
                  <option value="24">24 Monate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Letzte Wartung
                </label>
                <input
                  type="date"
                  value={lastMaintenance}
                  onChange={(e) => setLastMaintenance(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Benötigte Ersatzteile
                </label>
                <textarea
                  value={requiredParts}
                  onChange={(e) => setRequiredParts(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Heat Storage */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasStorage"
                checked={hasStorage}
                onChange={(e) => setHasStorage(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <label htmlFor="hasStorage" className="text-lg font-semibold text-foreground cursor-pointer">
                Wärmespeicher vorhanden
              </label>
            </div>

            {hasStorage && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hersteller
                  </label>
                  <select
                    value={storageManufacturer}
                    onChange={(e) => setStorageManufacturer(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Bitte wählen...</option>
                    {heaterTypesConfig.storageManufacturers.map((mfr) => (
                      <option key={mfr} value={mfr}>
                        {mfr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Modell
                  </label>
                  <input
                    type="text"
                    value={storageModel}
                    onChange={(e) => setStorageModel(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Kapazität (Liter)
                  </label>
                  <input
                    type="number"
                    value={storageCapacity}
                    onChange={(e) => setStorageCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Battery */}
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasBattery"
                checked={hasBattery}
                onChange={(e) => setHasBattery(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <label htmlFor="hasBattery" className="text-lg font-semibold text-foreground cursor-pointer">
                Batteriespeicher vorhanden
              </label>
            </div>

            {hasBattery && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hersteller
                  </label>
                  <select
                    value={batteryManufacturer}
                    onChange={(e) => setBatteryManufacturer(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Bitte wählen...</option>
                    {heaterTypesConfig.batteryManufacturers.map((mfr) => (
                      <option key={mfr} value={mfr}>
                        {mfr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Modell
                  </label>
                  <input
                    type="text"
                    value={batteryModel}
                    onChange={(e) => setBatteryModel(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Kapazität (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={batteryCapacity}
                    onChange={(e) => setBatteryCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VIEW MODE */
        <div className="space-y-6">
          {/* Customer Info */}
          {heater.customer && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Kunde
              </h2>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/customers/${heater.customer.id}`}
                  className="text-primary hover:underline font-medium"
                >
                  {heater.customer.name}
                </Link>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPinIcon className="h-4 w-4" />
                  <span>
                    {heater.customer.street}, {heater.customer.zipCode} {heater.customer.city}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon className="h-4 w-4" />
                  <a href={`tel:${heater.customer.phone}`} className="hover:text-accent">
                    {heater.customer.phone}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Heater Details */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FlameIcon className="h-5 w-5 text-primary" />
              Heizungsinformationen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {heater.heaterType && (
                <div>
                  <div className="text-sm text-muted-foreground">Heizungstyp</div>
                  <div className="font-medium">{heater.heaterType}</div>
                </div>
              )}
              {heater.manufacturer && (
                <div>
                  <div className="text-sm text-muted-foreground">Hersteller</div>
                  <div className="font-medium">{heater.manufacturer}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Modell</div>
                <div className="font-medium">{heater.model}</div>
              </div>
              {heater.serialNumber && (
                <div>
                  <div className="text-sm text-muted-foreground">Seriennummer</div>
                  <div className="font-medium">{heater.serialNumber}</div>
                </div>
              )}
              {heater.installationDate && (
                <div>
                  <div className="text-sm text-muted-foreground">Installationsdatum</div>
                  <div className="font-medium">
                    {format(new Date(heater.installationDate), 'dd. MMMM yyyy', { locale: de })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Storage Info */}
          {heater.hasStorage && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Wärmespeicher
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {heater.storageManufacturer && (
                  <div>
                    <div className="text-sm text-muted-foreground">Hersteller</div>
                    <div className="font-medium">{heater.storageManufacturer}</div>
                  </div>
                )}
                {heater.storageModel && (
                  <div>
                    <div className="text-sm text-muted-foreground">Modell</div>
                    <div className="font-medium">{heater.storageModel}</div>
                  </div>
                )}
                {heater.storageCapacity && (
                  <div>
                    <div className="text-sm text-muted-foreground">Kapazität</div>
                    <div className="font-medium">{heater.storageCapacity} Liter</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Battery Info */}
          {heater.hasBattery && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Batteriespeicher
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {heater.batteryManufacturer && (
                  <div>
                    <div className="text-sm text-muted-foreground">Hersteller</div>
                    <div className="font-medium">{heater.batteryManufacturer}</div>
                  </div>
                )}
                {heater.batteryModel && (
                  <div>
                    <div className="text-sm text-muted-foreground">Modell</div>
                    <div className="font-medium">{heater.batteryModel}</div>
                  </div>
                )}
                {heater.batteryCapacity && (
                  <div>
                    <div className="text-sm text-muted-foreground">Kapazität</div>
                    <div className="font-medium">{heater.batteryCapacity} kWh</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Maintenance Info */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <WrenchIcon className="h-5 w-5 text-primary" />
              Wartungsinformationen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Wartungsintervall</div>
                <div className="font-medium">
                  {heater.maintenanceInterval} {heater.maintenanceInterval === 1 ? 'Monat' : 'Monate'}
                </div>
              </div>
              {heater.lastMaintenance && (
                <div>
                  <div className="text-sm text-muted-foreground">Letzte Wartung</div>
                  <div className="font-medium">
                    {format(new Date(heater.lastMaintenance), 'dd. MMMM yyyy', { locale: de })}
                  </div>
                </div>
              )}
              {heater.nextMaintenance && (
                <div>
                  <div className="text-sm text-muted-foreground">Nächste Wartung</div>
                  <div className="font-medium">
                    {format(new Date(heater.nextMaintenance), 'dd. MMMM yyyy', { locale: de })}
                  </div>
                </div>
              )}
              {heater.requiredParts && (
                <div className="md:col-span-2">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <PackageIcon className="h-4 w-4" />
                    Benötigte Ersatzteile
                  </div>
                  <div className="font-medium whitespace-pre-wrap">{heater.requiredParts}</div>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance History */}
          {heater.maintenances.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Wartungshistorie
              </h2>
              <div className="space-y-3">
                {heater.maintenances.map((maintenance) => (
                  <Link
                    key={maintenance.id}
                    href={`/dashboard/maintenances/${maintenance.id}`}
                    className="block p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(maintenance.date), 'dd. MMMM yyyy', { locale: de })}
                          </div>
                          {maintenance.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {maintenance.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
