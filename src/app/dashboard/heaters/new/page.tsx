'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeftIcon, Loader2Icon, PlusIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddNewEntryBody {
  type: 'category' | 'manufacturer' | 'model';
  category?: string;
  manufacturer?: string;
  model?: string;
}

interface Customer {
  id: string;
  name: string;
  city: string;
}

interface Model {
  manufacturer: string;
  models: string[];
}

interface Category {
  category: string;
  manufacturers: Model[];
}

interface HeatingSystemsConfig {
  heating_categories: Category[];
}

export default function NewHeaterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [heatingConfig, setHeatingConfig] = useState<HeatingSystemsConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Basic heater fields
  const [customerId, setCustomerId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [maintenanceInterval, setMaintenanceInterval] = useState('12');
  const [lastMaintenance, setLastMaintenance] = useState('');
  const [requiredParts, setRequiredParts] = useState('');

  // Heating system fields with cascading dropdowns
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');

  // Available options based on selection
  const [availableManufacturers, setAvailableManufacturers] = useState<Model[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

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

  // Add new entry modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<'category' | 'manufacturer' | 'model'>('category');
  const [newEntryValue, setNewEntryValue] = useState('');
  const [addingEntry, setAddingEntry] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchHeatingConfig();
  }, []);

  // Update available manufacturers when category changes
  useEffect(() => {
    if (category && heatingConfig) {
      const selectedCategory = heatingConfig.heating_categories.find(
        (cat) => cat.category === category
      );
      setAvailableManufacturers(selectedCategory?.manufacturers || []);
      setManufacturer('');
      setModel('');
      setAvailableModels([]);
    } else {
      setAvailableManufacturers([]);
      setManufacturer('');
      setModel('');
      setAvailableModels([]);
    }
  }, [category, heatingConfig]);

  // Update available models when manufacturer changes
  useEffect(() => {
    if (manufacturer && availableManufacturers.length > 0) {
      const selectedManufacturer = availableManufacturers.find(
        (mfr) => mfr.manufacturer === manufacturer
      );
      setAvailableModels(selectedManufacturer?.models || []);
      setModel('');
    } else {
      setAvailableModels([]);
      setModel('');
    }
  }, [manufacturer, availableManufacturers]);

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

  const fetchHeatingConfig = async () => {
    try {
      const response = await fetch('/api/heating-systems');
      const result = await response.json();
      if (result.success) {
        setHeatingConfig(result.data);
      } else {
        toast.error('Fehler beim Laden der Heizungssysteme');
      }
    } catch (err) {
      console.error('Error fetching heating config:', err);
      toast.error('Fehler beim Laden der Heizungssysteme');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleAddNewEntry = async () => {
    if (!newEntryValue.trim()) {
      toast.error('Bitte geben Sie einen Wert ein');
      return;
    }

    setAddingEntry(true);

    try {
      const body: AddNewEntryBody = { type: addModalType };

      if (addModalType === 'category') {
        body.category = newEntryValue.trim();
      } else if (addModalType === 'manufacturer') {
        if (!category) {
          toast.error('Bitte wählen Sie zuerst eine Kategorie');
          return;
        }
        body.category = category;
        body.manufacturer = newEntryValue.trim();
      } else if (addModalType === 'model') {
        if (!category || !manufacturer) {
          toast.error('Bitte wählen Sie zuerst Kategorie und Hersteller');
          return;
        }
        body.category = category;
        body.manufacturer = manufacturer;
        body.model = newEntryValue.trim();
      }

      const response = await fetch('/api/heating-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Erfolgreich hinzugefügt');
        setHeatingConfig(result.data);

        // Auto-select the newly added entry
        if (addModalType === 'category') {
          setCategory(newEntryValue.trim());
        } else if (addModalType === 'manufacturer') {
          setManufacturer(newEntryValue.trim());
        } else if (addModalType === 'model') {
          setModel(newEntryValue.trim());
        }

        setShowAddModal(false);
        setNewEntryValue('');
      } else {
        toast.error(result.error || 'Fehler beim Hinzufügen');
      }
    } catch (err) {
      console.error('Error adding entry:', err);
      toast.error('Fehler beim Hinzufügen');
    } finally {
      setAddingEntry(false);
    }
  };

  const openAddModal = (type: 'category' | 'manufacturer' | 'model') => {
    setAddModalType(type);
    setNewEntryValue('');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!model) {
      toast.error('Bitte geben Sie ein Modell ein');
      return;
    }

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
          heaterType: category || null,
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
        toast.success('Heizsystem erfolgreich erstellt');
        router.push(`/dashboard/heaters/${result.data.id}`);
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error creating heater:', err);
      toast.error('Fehler beim Erstellen des Heizsystems');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (addModalType) {
      case 'category':
        return 'Neue Kategorie hinzufügen';
      case 'manufacturer':
        return 'Neuen Hersteller hinzufügen';
      case 'model':
        return 'Neues Modell hinzufügen';
    }
  };

  const getModalPlaceholder = () => {
    switch (addModalType) {
      case 'category':
        return 'z.B. Gasheizung';
      case 'manufacturer':
        return 'z.B. Viessmann';
      case 'model':
        return 'z.B. Vitodens 200-W';
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-semibold text-foreground">Neues Heizsystem</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Erstellen Sie ein neues Heizsystem
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
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

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kategorie
              </label>
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Bitte wählen...</option>
                  {heatingConfig?.heating_categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openAddModal('category')}
                  title="Neue Kategorie hinzufügen"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Hersteller
              </label>
              <div className="flex gap-2">
                <select
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  disabled={!category}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">Bitte wählen...</option>
                  {availableManufacturers.map((mfr) => (
                    <option key={mfr.manufacturer} value={mfr.manufacturer}>
                      {mfr.manufacturer}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openAddModal('manufacturer')}
                  disabled={!category}
                  title="Neuen Hersteller hinzufügen"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              {!category && (
                <p className="text-xs text-muted-foreground mt-1">
                  Bitte wählen Sie zuerst eine Kategorie
                </p>
              )}
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Modell <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                {availableModels.length > 0 ? (
                  <select
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Bitte wählen...</option>
                    {availableModels.map((mdl) => (
                      <option key={mdl} value={mdl}>
                        {mdl}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="z.B. Vitocal 200-S"
                  />
                )}
                {manufacturer && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openAddModal('model')}
                    title="Neues Modell hinzufügen"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!manufacturer && category && (
                <p className="text-xs text-muted-foreground mt-1">
                  Bitte wählen Sie zuerst einen Hersteller oder geben Sie das Modell manuell ein
                </p>
              )}
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
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Information */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
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
                max={new Date().toISOString().split('T')[0]}
                min={installationDate || undefined}
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
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
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
                <input
                  type="text"
                  value={storageManufacturer}
                  onChange={(e) => setStorageManufacturer(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="z.B. Viessmann"
                />
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
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
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
                <input
                  type="text"
                  value={batteryManufacturer}
                  onChange={(e) => setBatteryManufacturer(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="z.B. Tesla"
                />
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
                Heizsystem erstellen
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

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {getModalTitle()}
              </h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowAddModal(false)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {addModalType === 'manufacturer' && category && (
                <p className="text-sm text-muted-foreground">
                  Für Kategorie: <span className="font-medium text-foreground">{category}</span>
                </p>
              )}
              {addModalType === 'model' && category && manufacturer && (
                <p className="text-sm text-muted-foreground">
                  Für {category} - <span className="font-medium text-foreground">{manufacturer}</span>
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {addModalType === 'category' && 'Kategorie'}
                  {addModalType === 'manufacturer' && 'Hersteller'}
                  {addModalType === 'model' && 'Modell'}
                </label>
                <input
                  type="text"
                  value={newEntryValue}
                  onChange={(e) => setNewEntryValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewEntry();
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={getModalPlaceholder()}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleAddNewEntry}
                  disabled={addingEntry || !newEntryValue.trim()}
                  className="flex-1"
                >
                  {addingEntry ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      Wird hinzugefügt...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Hinzufügen
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={addingEntry}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
