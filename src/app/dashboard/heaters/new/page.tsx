'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeftIcon, Loader2Icon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heaterTypesConfig from '@/config/heater-types.json';

interface Customer {
  id: string;
  name: string;
  city: string;
}

export default function NewHeaterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Basic heater fields
  const [customerId, setCustomerId] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [maintenanceInterval, setMaintenanceInterval] = useState('12');
  const [lastMaintenance, setLastMaintenance] = useState('');
  const [requiredParts, setRequiredParts] = useState('');

  // Heating system fields
  const [heaterType, setHeaterType] = useState('');
  const [manufacturer, setManufacturer] = useState('');

  // Storage fields
  const [hasStorage, setHasStorage] = useState(false);
  const [storageManufacturer, setStorageManufacturer] = useState('');
  const [storageModel, setStorageModel] = useState('');
  const [storageCapacity, setStorageCapacity] = useState('');

  // Battery fields
  const [hasBattery, setHasBattery] = useState(false);
  const [batteryManufacturer, setBatteryManufacturer] = useState('');
  const [batteryModel, setBatteryModel] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const result = await response.json();
      if (result.success) {
        setCustomers(result.data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/heaters', {
        method: 'POST',
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
        toast.success('Heizung erfolgreich erstellt');
        router.push(`/dashboard/heaters/${result.data.id}`);
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error creating heater:', err);
      toast.error('Fehler beim Erstellen der Heizung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/heaters">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Zurück
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Neue Heizung</h1>
          <p className="mt-2 text-muted-foreground">
            Erstellen Sie eine neue Heizungsanlage
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Grundinformationen</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer (Optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kunde (optional)
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={loadingCustomers}
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

            {/* Heater Type */}
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

            {/* Manufacturer */}
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

            {/* Model */}
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
                placeholder="z.B. Vitocal 200-S"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Seriennummer
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="z.B. 1234567890"
              />
            </div>

            {/* Installation Date */}
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
            {/* Maintenance Interval */}
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

            {/* Last Maintenance */}
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

            {/* Required Parts */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Benötigte Ersatzteile
              </label>
              <textarea
                value={requiredParts}
                onChange={(e) => setRequiredParts(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="z.B. Filter, Dichtungen, etc."
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
                  placeholder="z.B. Vitocell 100-V"
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
                  placeholder="z.B. 300"
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
                  placeholder="z.B. Powerwall 2"
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
                  placeholder="z.B. 13.5"
                  min="0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Wird erstellt...
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                Heizung erstellen
              </>
            )}
          </Button>
          <Link href="/dashboard/heaters" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Abbrechen
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
