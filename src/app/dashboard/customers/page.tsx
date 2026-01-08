'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PlusIcon, SearchIcon, PencilIcon, TrashIcon } from 'lucide-react';

interface Heater {
  id: string;
  model: string;
  nextMaintenance: string | null;
}

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

// Helper function to get German label for heating type
const getHeatingTypeLabel = (type: string | null): string | null => {
  if (!type) return null;

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
    'BATTERY_STORAGE': 'Batterie',
    'HEAT_STORAGE': 'Wärmespeicher',
  };

  return labels[type] || type;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const url = search
        ? `/api/customers?search=${encodeURIComponent(search)}`
        : '/api/customers';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data);
      } else {
        setError(result.error || 'Fehler beim Laden der Kunden');
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Fehler beim Laden der Kunden');
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchCustomers(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Möchten Sie den Kunden "${name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove from list
        setCustomers(customers.filter(c => c.id !== id));
        toast.success(`Kunde "${name}" wurde gelöscht`);
      } else {
        toast.error(`Fehler beim Löschen: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Fehler beim Löschen des Kunden');
    }
  };

  const getNextMaintenanceDate = (heaters: Heater[]): string | null => {
    const dates = heaters
      .map(h => h.nextMaintenance)
      .filter((d): d is string => d !== null)
      .sort();

    return dates.length > 0 ? dates[0] : null;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isMaintenanceSoon = (dateString: string | null): boolean => {
    if (!dateString) return false;

    const date = new Date(dateString);
    const today = new Date();
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return daysUntil <= 30 && daysUntil >= 0;
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kunden</h1>
          <p className="mt-2 text-sm text-gray-600">
            Verwalten Sie Ihre Kunden und deren Heizungen
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/dashboard/customers/new">
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Neuer Kunde
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Suchen nach Name, Adresse oder Telefon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Customers List */}
      <div className="mt-6">
        {customers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto max-w-sm">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Versuchen Sie es mit einem anderen Suchbegriff.'
                  : 'Erstellen Sie Ihren ersten Kunden, um zu beginnen.'}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Link href="/dashboard/customers/new">
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Ersten Kunden erstellen
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {customers.map((customer) => {
              const nextMaintenance = getNextMaintenanceDate(customer.heaters);
              const maintenanceSoon = isMaintenanceSoon(nextMaintenance);

              return (
                <Card key={customer.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                              {customer.name}
                            </h3>
                          </Link>
                          <div className="mt-1 space-y-1 text-sm text-gray-600">
                            <p>{customer.street}</p>
                            <p>{customer.zipCode} {customer.city}</p>
                            <p>{customer.phone}</p>
                            {customer.email && <p>{customer.email}</p>}
                          </div>

                          {/* Heating info */}
                          {(customer.heatingType || customer.additionalEnergySources?.length > 0 || customer.energyStorageSystems?.length > 0) && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {customer.heatingType && (
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                  {getHeatingTypeLabel(customer.heatingType)}
                                </span>
                              )}
                              {customer.additionalEnergySources?.map((source) => (
                                <span key={source} className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                  + {getAdditionalEnergyLabel(source)}
                                </span>
                              ))}
                              {customer.energyStorageSystems?.map((system) => (
                                <span key={system} className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                                  🔋 {getEnergyStorageLabel(system)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Heizungen:</span>{' '}
                            {customer.heaters.length}
                          </div>
                          {nextMaintenance && (
                            <div className="mt-2">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                maintenanceSoon
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {maintenanceSoon ? '⚠️ ' : ''}
                                Nächste Wartung: {formatDate(nextMaintenance)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {customer.notes && (
                        <div className="mt-3 rounded-md bg-gray-50 p-3">
                          <p className="text-sm text-gray-700">{customer.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex shrink-0 gap-2">
                      <Link href={`/dashboard/customers/${customer.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      {customers.length > 0 && (
        <div className="mt-6 text-sm text-gray-500">
          {customers.length} Kunde{customers.length !== 1 ? 'n' : ''} gefunden
        </div>
      )}
    </div>
  );
}
