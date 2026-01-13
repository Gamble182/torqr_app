'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { useHeaters, useDeleteHeater } from '@/hooks/useHeaters';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  HomeIcon,
  FlameIcon,
  BatteryChargingIcon,
  CalendarIcon,
  PlusIcon,
  Loader2Icon,
  SunIcon,
  ZapIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  WrenchIcon,
  InfoIcon,
} from 'lucide-react';
import { HeaterFormModal } from '@/components/HeaterFormModal';
import { MaintenanceFormModal } from '@/components/MaintenanceFormModal';
import { MaintenanceHistory } from '@/components/MaintenanceHistory';

interface Maintenance {
  id: string;
  date: string;
  notes: string | null;
  photos: string[];
}

interface Heater {
  id: string;
  model: string;
  serialNumber: string | null;
  installationDate: string | null;
  maintenanceInterval: number;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  maintenances?: Maintenance[];
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

// Helper function to get icon for heating type
const getHeatingTypeIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    'GAS': FlameIcon,
    'OIL': FlameIcon,
    'DISTRICT_HEATING': HomeIcon,
    'HEAT_PUMP_AIR': ZapIcon,
    'HEAT_PUMP_GROUND': ZapIcon,
    'HEAT_PUMP_WATER': ZapIcon,
    'PELLET_BIOMASS': FlameIcon,
    'NIGHT_STORAGE': BatteryChargingIcon,
    'ELECTRIC_DIRECT': ZapIcon,
    'HYBRID': FlameIcon,
    'CHP': ZapIcon,
  };
  return iconMap[type] || FlameIcon;
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

  const { data: customer, isLoading, error, refetch } = useCustomer(customerId);
  const { data: heaters, refetch: refetchHeaters } = useHeaters({ customerId });
  const deleteCustomer = useDeleteCustomer();
  const deleteHeater = useDeleteHeater();

  const [showHeaterForm, setShowHeaterForm] = useState(false);
  const [editingHeater, setEditingHeater] = useState<Heater | null>(null);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [selectedHeater, setSelectedHeater] = useState<Heater | null>(null);

  const handleDelete = () => {
    if (!customer) return;

    if (!confirm(`Möchten Sie den Kunden "${customer.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    deleteCustomer.mutate(customerId, {
      onSuccess: () => {
        router.push('/dashboard/customers');
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getMaintenanceStatus = (nextMaintenance: string | null): 'overdue' | 'upcoming' | 'ok' => {
    if (!nextMaintenance) return 'ok';
    const next = new Date(nextMaintenance);
    const now = new Date();

    if (next < now) return 'overdue';

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (next <= thirtyDaysFromNow) return 'upcoming';

    return 'ok';
  };

  const handleEditHeater = (heater: Heater) => {
    setEditingHeater(heater);
    setShowHeaterForm(true);
  };

  const handleDeleteHeater = (id: string, model: string) => {
    if (!confirm(`Möchten Sie das Heizsystem "${model}" wirklich löschen?`)) {
      return;
    }

    deleteHeater.mutate(id, {
      onSuccess: () => {
        refetch();
        refetchHeaters();
      },
    });
  };

  // Calculate maintenance stats
  const maintenanceStats = useMemo(() => {
    if (!heaters || heaters.length === 0) {
      return { overdue: 0, upcoming: 0, ok: 0 };
    }

    return heaters.reduce((acc, heater) => {
      const status = getMaintenanceStatus(heater.nextMaintenance);
      return {
        ...acc,
        [status]: acc[status] + 1,
      };
    }, { overdue: 0, upcoming: 0, ok: 0 });
  }, [heaters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Fehler beim Laden des Kunden</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const HeatingTypeIcon = getHeatingTypeIcon(customer.heatingType);

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="space-y-4">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Zurück zur Kundenliste
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
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
              disabled={deleteCustomer.isPending}
              className="flex items-center gap-2 text-destructive hover:bg-destructive/10"
            >
              {deleteCustomer.isPending ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
              Löschen
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <HomeIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Heizsysteme</p>
              <p className="text-2xl font-bold text-foreground">{heaters?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2Icon className="h-5 w-5 text-green-600 dark:text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wartungen OK</p>
              <p className="text-2xl font-bold text-foreground">{maintenanceStats.ok}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bald fällig</p>
              <p className="text-2xl font-bold text-foreground">{maintenanceStats.upcoming}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertCircleIcon className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Überfällig</p>
              <p className="text-2xl font-bold text-foreground">{maintenanceStats.overdue}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <InfoIcon className="h-5 w-5 text-muted-foreground" />
              Kontaktinformationen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <PhoneIcon className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Telefon</p>
                  <a href={`tel:${customer.phone}`} className="text-base font-medium text-foreground hover:text-primary transition-colors">
                    {customer.phone}
                  </a>
                </div>
              </div>

              {customer.email && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <MailIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">E-Mail</p>
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-base font-medium text-foreground hover:text-primary transition-colors break-all"
                    >
                      {customer.email}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors md:col-span-2">
                <MapPinIcon className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Adresse</p>
                  <p className="text-base font-medium text-foreground">{customer.street}</p>
                  <p className="text-base font-medium text-foreground">
                    {customer.zipCode} {customer.city}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Heating System Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <HeatingTypeIcon className="h-5 w-5 text-muted-foreground" />
              Energiesystem
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Hauptheizsystem
                </p>
                <div className="flex items-center gap-2">
                  <HeatingTypeIcon className="h-5 w-5 text-primary" />
                  <span className="text-base font-semibold text-foreground">
                    {getHeatingTypeLabel(customer.heatingType)}
                  </span>
                </div>
              </div>

              {customer.additionalEnergySources.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Zusätzliche Energiequellen
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {customer.additionalEnergySources.map((source) => (
                      <Badge
                        key={source}
                        variant="outline"
                        className="px-3 py-1.5 bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                      >
                        <SunIcon className="h-3.5 w-3.5 mr-1.5" />
                        {getAdditionalEnergyLabel(source)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {customer.energyStorageSystems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Energiespeichersysteme
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {customer.energyStorageSystems.map((system) => (
                      <Badge
                        key={system}
                        variant="outline"
                        className="px-3 py-1.5 bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                      >
                        <BatteryChargingIcon className="h-3.5 w-3.5 mr-1.5" />
                        {getEnergyStorageLabel(system)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          {customer.notes && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <InfoIcon className="h-5 w-5 text-muted-foreground" />
                Notizen
              </h2>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
              </div>
            </Card>
          )}

          {/* Heaters Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <WrenchIcon className="h-5 w-5 text-muted-foreground" />
                Heizsysteme ({heaters?.length || 0})
              </h2>
              <Button
                onClick={() => {
                  setEditingHeater(null);
                  setShowHeaterForm(true);
                }}
                size="sm"
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Hinzufügen
              </Button>
            </div>

            {(!heaters || heaters.length === 0) ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-muted rounded-full">
                    <HomeIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Noch keine Heizsysteme</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Fügen Sie das erste Heizsystem für diesen Kunden hinzu
                </p>
                <Button
                  onClick={() => setShowHeaterForm(true)}
                  size="sm"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Erstes Heizsystem hinzufügen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {heaters.map((heater) => {
                  const maintenanceStatus = getMaintenanceStatus(heater.nextMaintenance);

                  return (
                    <div
                      key={heater.id}
                      className="border border-border rounded-lg p-5 hover:shadow-md transition-all bg-card"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{heater.model}</h3>
                            {maintenanceStatus === 'overdue' && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircleIcon className="h-3 w-3" />
                                Überfällig
                              </Badge>
                            )}
                            {maintenanceStatus === 'upcoming' && (
                              <Badge variant="outline" className="flex items-center gap-1 bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400">
                                <ClockIcon className="h-3 w-3" />
                                Bald fällig
                              </Badge>
                            )}
                            {maintenanceStatus === 'ok' && heater.nextMaintenance && (
                              <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                                <CheckCircle2Icon className="h-3 w-3" />
                                OK
                              </Badge>
                            )}
                          </div>
                          {heater.serialNumber && (
                            <p className="text-sm text-muted-foreground">Seriennummer: {heater.serialNumber}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedHeater(heater);
                              setShowMaintenanceForm(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2Icon className="h-4 w-4 mr-2" />
                            Wartung erledigt
                          </Button>
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
                            disabled={deleteHeater.isPending}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            {deleteHeater.isPending ? (
                              <Loader2Icon className="h-4 w-4 animate-spin" />
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {heater.installationDate && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Installiert</p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatDate(heater.installationDate)}
                            </p>
                          </div>
                        )}
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Wartungsintervall</p>
                          <p className="text-sm font-semibold text-foreground">
                            {heater.maintenanceInterval} Monat{heater.maintenanceInterval > 1 ? 'e' : ''}
                          </p>
                        </div>
                        {heater.lastMaintenance && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Letzte Wartung</p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatDate(heater.lastMaintenance)}
                            </p>
                          </div>
                        )}
                        {heater.nextMaintenance && (
                          <div className={`p-3 rounded-lg ${
                            maintenanceStatus === 'overdue'
                              ? 'bg-destructive/10'
                              : maintenanceStatus === 'upcoming'
                                ? 'bg-amber-500/10'
                                : 'bg-muted/50'
                          }`}>
                            <p className="text-xs text-muted-foreground mb-1">Nächste Wartung</p>
                            <p className={`text-sm font-semibold ${
                              maintenanceStatus === 'overdue'
                                ? 'text-destructive'
                                : maintenanceStatus === 'upcoming'
                                  ? 'text-amber-600 dark:text-amber-500'
                                  : 'text-foreground'
                            }`}>
                              {formatDate(heater.nextMaintenance)}
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Quick Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Übersicht</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 border-b border-border">
                <span className="text-sm text-muted-foreground">Heizsysteme</span>
                <span className="text-lg font-bold text-foreground">
                  {heaters?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b border-border">
                <span className="text-sm text-muted-foreground">Letzte Änderung</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatDate(customer.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">Erstellt am</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Schnellaktionen</h2>
            <div className="space-y-2">
              <Link href={`/dashboard/customers/${customerId}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start hover:bg-accent">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Kunde bearbeiten
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start hover:bg-accent"
                onClick={() => {
                  setEditingHeater(null);
                  setShowHeaterForm(true);
                }}
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Heizsystem hinzufügen
              </Button>
            </div>
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
            refetch();
            refetchHeaters();
          }}
        />
      )}

      {/* Maintenance Form Modal */}
      {showMaintenanceForm && selectedHeater && (
        <MaintenanceFormModal
          heaterId={selectedHeater.id}
          heaterModel={selectedHeater.model}
          onClose={() => {
            setShowMaintenanceForm(false);
            setSelectedHeater(null);
          }}
          onSuccess={() => {
            setShowMaintenanceForm(false);
            setSelectedHeater(null);
            refetch();
            refetchHeaters();
          }}
        />
      )}
    </div>
  );
}
