'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  HomeIcon,
  BatteryChargingIcon,
  CalendarIcon,
  PlusIcon
} from 'lucide-react';
import { HeaterFormModal } from '@/components/HeaterFormModal';

interface Customer {
  id: string;
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string | null;
  heatingType: string;
  additionalEnergySources: string[];
  energyStorageSystems: string[];
  notes: string | null;
  heaters: Heater[];
  createdAt: string;
  updatedAt: string;
}

interface Heater {
  id: string;
  model: string;
  serialNumber: string | null;
  installationDate: string | null;
  maintenanceInterval: number;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
}

// Helper function to get German label for heating type
const getHeatingTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'GAS': 'Gasheizung',
    'OIL': 'Ölheizung',
    'DISTRICT_HEATING': 'Fernwärme',
    'HEAT_PUMP_AIR': 'Wärmepumpe (Luft)',
    'HEAT_PUMP_GROUND': 'Wärmepumpe (Erde)',
    'HEAT_PUMP_WATER': 'Wärmepumpe (Wasser)',
    'PELLET_BIOMASS': 'Pelletheizung/Biomasse',
    'NIGHT_STORAGE': 'Nachtspeicher',
    'ELECTRIC_DIRECT': 'Elektro-Direktheizung',
    'HYBRID': 'Hybridheizung',
    'CHP': 'Blockheizkraftwerk',
  };
  return labels[type] || type;
};

// Helper function to get German label for additional energy sources
const getAdditionalEnergyLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'PHOTOVOLTAIC': 'Photovoltaik',
    'SOLAR_THERMAL': 'Solarthermie',
    'SMALL_WIND': 'Kleinwindanlage',
  };
  return labels[type] || type;
};

// Helper function to get German label for energy storage systems
const getEnergyStorageLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'BATTERY_STORAGE': 'Stromspeicher/Batterie',
    'HEAT_STORAGE': 'Wärmespeicher (Pufferspeicher)',
  };
  return labels[type] || type;
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHeaterForm, setShowHeaterForm] = useState(false);
  const [editingHeater, setEditingHeater] = useState<Heater | null>(null);

  const fetchCustomer = useCallback(async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      const result = await response.json();

      if (result.success) {
        setCustomer(result.data);
      } else {
        toast.error(`Fehler: ${result.error}`);
        router.push('/dashboard/customers');
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      toast.error('Fehler beim Laden des Kunden');
      router.push('/dashboard/customers');
    } finally {
      setLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleDelete = async () => {
    if (!customer) return;

    if (!confirm(`Möchten Sie den Kunden "${customer.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Kunde "${customer.name}" wurde gelöscht`);
        router.push('/dashboard/customers');
      } else {
        toast.error(`Fehler beim Löschen: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Fehler beim Löschen des Kunden');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isMaintenanceSoon = (nextMaintenance: string | null): boolean => {
    if (!nextMaintenance) return false;
    const next = new Date(nextMaintenance);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return next >= now && next <= thirtyDaysFromNow;
  };

  const handleEditHeater = (heater: Heater) => {
    setEditingHeater(heater);
    setShowHeaterForm(true);
  };

  const handleDeleteHeater = async (id: string, model: string) => {
    if (!confirm(`Möchten Sie die Heizung "${model}" wirklich löschen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/heaters/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Heizung "${model}" wurde gelöscht`);
        fetchCustomer(); // Refresh data
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting heater:', err);
      toast.error('Fehler beim Löschen der Heizung');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Zurück zur Kundenliste
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kunde seit {formatDate(customer.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/customers/${customerId}/edit`}>
              <Button variant="outline" className="flex items-center gap-2">
                <PencilIcon className="h-4 w-4" />
                Bearbeiten
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <TrashIcon className="h-4 w-4" />
              Löschen
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              Kontaktinformationen
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Telefon</p>
                  <p className="text-base text-gray-900">{customer.phone}</p>
                </div>
              </div>
              {customer.email && (
                <div className="flex items-start gap-3">
                  <MailIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">E-Mail</p>
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-base text-blue-600 hover:text-blue-700"
                    >
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Adresse</p>
                  <p className="text-base text-gray-900">{customer.street}</p>
                  <p className="text-base text-gray-900">
                    {customer.zipCode} {customer.city}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Heating System Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HomeIcon className="h-5 w-5 text-gray-400" />
              Heizsystem
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Art der Heizung</p>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                  {getHeatingTypeLabel(customer.heatingType)}
                </span>
              </div>

              {customer.additionalEnergySources.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Zusätzliche Energiequellen</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.additionalEnergySources.map((source) => (
                      <span
                        key={source}
                        className="inline-flex items-center rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700"
                      >
                        {getAdditionalEnergyLabel(source)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {customer.energyStorageSystems.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Energiespeichersysteme</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.energyStorageSystems.map((system) => (
                      <span
                        key={system}
                        className="inline-flex items-center rounded-md bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700"
                      >
                        <BatteryChargingIcon className="h-4 w-4 mr-1" />
                        {getEnergyStorageLabel(system)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          {customer.notes && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notizen</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
            </Card>
          )}

          {/* Heaters Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <HomeIcon className="h-5 w-5 text-gray-400" />
                Heizungen ({customer.heaters?.length || 0})
              </h2>
              <Button
                onClick={() => setShowHeaterForm(true)}
                className="flex items-center gap-2"
                size="sm"
              >
                <PlusIcon className="h-4 w-4" />
                Heizung hinzufügen
              </Button>
            </div>

            {(!customer.heaters || customer.heaters.length === 0) ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Noch keine Heizungen</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Fügen Sie die erste Heizung für diesen Kunden hinzu
                </p>
                <Button
                  onClick={() => setShowHeaterForm(true)}
                  className="mt-4"
                  size="sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Erste Heizung hinzufügen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {customer.heaters.map((heater) => (
                  <div
                    key={heater.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{heater.model}</h3>
                        {heater.serialNumber && (
                          <p className="text-sm text-gray-600">SN: {heater.serialNumber}</p>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          {heater.installationDate && (
                            <div>
                              <p className="text-gray-500">Installiert</p>
                              <p className="font-medium text-gray-900">
                                {formatDate(heater.installationDate)}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500">Wartungsintervall</p>
                            <p className="font-medium text-gray-900">
                              {heater.maintenanceInterval} Monat{heater.maintenanceInterval > 1 ? 'e' : ''}
                            </p>
                          </div>
                          {heater.lastMaintenance && (
                            <div>
                              <p className="text-gray-500">Letzte Wartung</p>
                              <p className="font-medium text-gray-900">
                                {formatDate(heater.lastMaintenance)}
                              </p>
                            </div>
                          )}
                          {heater.nextMaintenance && (
                            <div>
                              <p className="text-gray-500">Nächste Wartung</p>
                              <p className={`font-medium ${
                                isMaintenanceSoon(heater.nextMaintenance)
                                  ? 'text-amber-600'
                                  : 'text-gray-900'
                              }`}>
                                {formatDate(heater.nextMaintenance)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditHeater(heater)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteHeater(heater.id, heater.model)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isMaintenanceSoon(heater.nextMaintenance) && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-200">
                        <p className="text-sm text-amber-800">
                          ⚠️ Wartung fällig in den nächsten 30 Tagen
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Übersicht</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Heizungen</span>
                <span className="text-lg font-semibold text-gray-900">
                  {customer.heaters?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Letzte Änderung</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(customer.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Erstellt am</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktionen</h2>
            <div className="space-y-2">
              <Link href={`/dashboard/customers/${customerId}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Kunde bearbeiten
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setEditingHeater(null);
                  setShowHeaterForm(true);
                }}
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Heizung hinzufügen
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-gray-400 cursor-not-allowed"
                disabled
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Wartung planen
              </Button>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Hinweis: Einige Funktionen werden in Sprint 3 verfügbar sein
            </p>
          </Card>
        </div>
      </div>

      {/* Heater Form Modal */}
      {showHeaterForm && (
        <HeaterFormModal
          customerId={customer.id}
          heater={editingHeater}
          onClose={() => {
            setShowHeaterForm(false);
            setEditingHeater(null);
          }}
          onSuccess={() => {
            setShowHeaterForm(false);
            setEditingHeater(null);
            fetchCustomer(); // Refresh customer data
          }}
        />
      )}
    </div>
  );
}
