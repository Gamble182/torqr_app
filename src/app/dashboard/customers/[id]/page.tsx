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
  BellOffIcon,
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

const getHeatingTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'GAS': 'Gasheizung', 'OIL': 'Ölheizung', 'DISTRICT_HEATING': 'Fernwärme',
    'HEAT_PUMP_AIR': 'Wärmepumpe (Luft)', 'HEAT_PUMP_GROUND': 'Wärmepumpe (Erde)',
    'HEAT_PUMP_WATER': 'Wärmepumpe (Wasser)', 'PELLET_BIOMASS': 'Pelletheizung/Biomasse',
    'NIGHT_STORAGE': 'Nachtspeicher', 'ELECTRIC_DIRECT': 'Elektro-Direktheizung',
    'HYBRID': 'Hybridheizung', 'CHP': 'Blockheizkraftwerk',
  };
  return labels[type] || type;
};

const getHeatingTypeIcon = (type: string) => {
  const map: Record<string, any> = {
    'GAS': FlameIcon, 'OIL': FlameIcon, 'DISTRICT_HEATING': HomeIcon,
    'HEAT_PUMP_AIR': ZapIcon, 'HEAT_PUMP_GROUND': ZapIcon, 'HEAT_PUMP_WATER': ZapIcon,
    'PELLET_BIOMASS': FlameIcon, 'NIGHT_STORAGE': BatteryChargingIcon,
    'ELECTRIC_DIRECT': ZapIcon, 'HYBRID': FlameIcon, 'CHP': ZapIcon,
  };
  return map[type] || FlameIcon;
};

const getAdditionalEnergyLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'PHOTOVOLTAIC': 'Photovoltaik', 'SOLAR_THERMAL': 'Solarthermie', 'SMALL_WIND': 'Kleinwindanlage',
  };
  return labels[type] || type;
};

const getEnergyStorageLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'BATTERY_STORAGE': 'Stromspeicher/Batterie', 'HEAT_STORAGE': 'Wärmespeicher (Pufferspeicher)',
  };
  return labels[type] || type;
};

const getEmailOptInDisplay = (status: 'NONE' | 'CONFIRMED' | 'UNSUBSCRIBED', hasEmail: boolean) => {
  if (!hasEmail) return null;
  if (status === 'CONFIRMED') return { label: 'E-Mail-Erinnerungen aktiv', color: 'text-success', bg: 'bg-success/10 border-success/20' };
  if (status === 'UNSUBSCRIBED') return { label: 'Abgemeldet', color: 'text-warning-foreground', bg: 'bg-warning/10 border-warning/20' };
  return { label: 'Keine E-Mail-Erinnerungen', color: 'text-muted-foreground', bg: 'bg-muted/50 border-border' };
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
    if (!confirm(`Möchten Sie den Kunden "${customer.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    deleteCustomer.mutate(customerId, {
      onSuccess: () => router.push('/dashboard/customers'),
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getMaintenanceStatus = (nextMaintenance: string | null): 'overdue' | 'upcoming' | 'ok' => {
    if (!nextMaintenance) return 'ok';
    const next = new Date(nextMaintenance);
    const now = new Date();
    if (next < now) return 'overdue';
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    if (next <= thirtyDays) return 'upcoming';
    return 'ok';
  };

  const handleEditHeater = (heater: Heater) => {
    setEditingHeater(heater);
    setShowHeaterForm(true);
  };

  const handleDeleteHeater = (id: string, model: string) => {
    if (!confirm(`Möchten Sie das Heizsystem "${model}" wirklich löschen?`)) return;
    deleteHeater.mutate(id, {
      onSuccess: () => { refetch(); refetchHeaters(); },
    });
  };

  const maintenanceStats = useMemo(() => {
    if (!heaters || heaters.length === 0) return { overdue: 0, upcoming: 0, ok: 0 };
    return heaters.reduce((acc, heater) => {
      const status = getMaintenanceStatus(heater.nextMaintenance);
      return { ...acc, [status]: acc[status] + 1 };
    }, { overdue: 0, upcoming: 0, ok: 0 });
  }, [heaters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive font-medium mb-1">Fehler beim Laden des Kunden</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const HeatingTypeIcon = getHeatingTypeIcon(customer.heatingType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Zurück zur Kundenliste
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              Kunde seit {formatDate(customer.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/customers/${customerId}/edit`}>
              <Button variant="outline" size="sm">
                <PencilIcon className="h-3.5 w-3.5" />
                Bearbeiten
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteCustomer.isPending}
              className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
            >
              {deleteCustomer.isPending ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <TrashIcon className="h-3.5 w-3.5" />}
              Löschen
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <HomeIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Heizsysteme</p>
              <p className="text-xl font-bold text-foreground">{heaters?.length || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success/10">
              <CheckCircle2Icon className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wartungen OK</p>
              <p className="text-xl font-bold text-foreground">{maintenanceStats.ok}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-warning/10">
              <ClockIcon className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bald fällig</p>
              <p className="text-xl font-bold text-foreground">{maintenanceStats.upcoming}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/10">
              <AlertCircleIcon className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Überfällig</p>
              <p className="text-xl font-bold text-foreground">{maintenanceStats.overdue}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
              Kontaktinformationen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <PhoneIcon className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Telefon</p>
                  <a href={`tel:${customer.phone}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {customer.phone}
                  </a>
                </div>
              </div>
              {customer.email && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MailIcon className="h-4 w-4 text-primary mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">E-Mail</p>
                    <a href={`mailto:${customer.email}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors break-all">
                      {customer.email}
                    </a>
                    {(() => {
                      const d = getEmailOptInDisplay(customer.emailOptIn, !!customer.email);
                      if (!d) return null;
                      return (
                        <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${d.bg} ${d.color}`}>
                          {customer.emailOptIn === 'CONFIRMED'
                            ? <CheckCircle2Icon className="h-3 w-3" />
                            : <BellOffIcon className="h-3 w-3" />}
                          {d.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 md:col-span-2">
                <MapPinIcon className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Adresse</p>
                  <p className="text-sm font-medium text-foreground">{customer.street}</p>
                  <p className="text-sm font-medium text-foreground">{customer.zipCode} {customer.city}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Heating System */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <HeatingTypeIcon className="h-4 w-4 text-muted-foreground" />
              Energiesystem
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Hauptheizsystem</p>
                <div className="flex items-center gap-2">
                  <HeatingTypeIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {getHeatingTypeLabel(customer.heatingType)}
                  </span>
                </div>
              </div>

              {customer.additionalEnergySources.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Zusätzliche Energiequellen</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.additionalEnergySources.map((source) => (
                      <Badge key={source} variant="outline" className="px-2.5 py-1 bg-success/10 border-success/20 text-success">
                        <SunIcon className="h-3 w-3 mr-1" />
                        {getAdditionalEnergyLabel(source)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {customer.energyStorageSystems.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Energiespeichersysteme</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.energyStorageSystems.map((system) => (
                      <Badge key={system} variant="outline" className="px-2.5 py-1 bg-warning/10 border-warning/20 text-warning-foreground">
                        <BatteryChargingIcon className="h-3 w-3 mr-1" />
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
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                Notizen
              </h2>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
              </div>
            </Card>
          )}

          {/* Heaters Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <WrenchIcon className="h-4 w-4 text-muted-foreground" />
                Heizsysteme ({heaters?.length || 0})
              </h2>
              <Button
                onClick={() => { setEditingHeater(null); setShowHeaterForm(true); }}
                size="sm"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Hinzufügen
              </Button>
            </div>

            {(!heaters || heaters.length === 0) ? (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20">
                <HomeIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Noch keine Heizsysteme</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Fügen Sie das erste Heizsystem für diesen Kunden hinzu
                </p>
                <Button onClick={() => setShowHeaterForm(true)} size="sm">
                  <PlusIcon className="h-3.5 w-3.5" />
                  Erstes Heizsystem hinzufügen
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {heaters.map((heater) => {
                  const maintenanceStatus = getMaintenanceStatus(heater.nextMaintenance);
                  return (
                    <div key={heater.id} className="border border-border rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{heater.model}</h3>
                            {maintenanceStatus === 'overdue' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                                <AlertCircleIcon className="h-3 w-3" />
                                Überfällig
                              </span>
                            )}
                            {maintenanceStatus === 'upcoming' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-warning/10 text-warning-foreground border border-warning/20">
                                <ClockIcon className="h-3 w-3" />
                                Bald fällig
                              </span>
                            )}
                            {maintenanceStatus === 'ok' && heater.nextMaintenance && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20">
                                <CheckCircle2Icon className="h-3 w-3" />
                                OK
                              </span>
                            )}
                          </div>
                          {heater.serialNumber && (
                            <p className="text-xs text-muted-foreground">SN: {heater.serialNumber}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => { setSelectedHeater(heater); setShowMaintenanceForm(true); }}
                            className="bg-success hover:bg-success/90 text-success-foreground"
                          >
                            <CheckCircle2Icon className="h-3.5 w-3.5" />
                            Erledigt
                          </Button>
                          <Button variant="outline" size="icon-sm" onClick={() => handleEditHeater(heater)}>
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline" size="icon-sm"
                            onClick={() => handleDeleteHeater(heater.id, heater.model)}
                            disabled={deleteHeater.isPending}
                            className="text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                          >
                            {deleteHeater.isPending ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <TrashIcon className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {heater.installationDate && (
                          <div className="p-2.5 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-0.5">Installiert</p>
                            <p className="text-xs font-semibold text-foreground">{formatDate(heater.installationDate)}</p>
                          </div>
                        )}
                        <div className="p-2.5 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-0.5">Intervall</p>
                          <p className="text-xs font-semibold text-foreground">
                            {heater.maintenanceInterval} Monat{heater.maintenanceInterval > 1 ? 'e' : ''}
                          </p>
                        </div>
                        {heater.lastMaintenance && (
                          <div className="p-2.5 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-0.5">Letzte Wartung</p>
                            <p className="text-xs font-semibold text-foreground">{formatDate(heater.lastMaintenance)}</p>
                          </div>
                        )}
                        {heater.nextMaintenance && (
                          <div className={`p-2.5 rounded-lg ${
                            maintenanceStatus === 'overdue' ? 'bg-destructive/10'
                              : maintenanceStatus === 'upcoming' ? 'bg-warning/10'
                              : 'bg-muted/50'
                          }`}>
                            <p className="text-xs text-muted-foreground mb-0.5">Nächste Wartung</p>
                            <p className={`text-xs font-semibold ${
                              maintenanceStatus === 'overdue' ? 'text-destructive'
                                : maintenanceStatus === 'upcoming' ? 'text-warning-foreground'
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

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Übersicht</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Heizsysteme</span>
                <span className="text-sm font-bold text-foreground">{heaters?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Letzte Änderung</span>
                <span className="text-xs font-semibold text-foreground">{formatDate(customer.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Erstellt am</span>
                <span className="text-xs font-semibold text-foreground">{formatDate(customer.createdAt)}</span>
              </div>
              {customer.email && (() => {
                const d = getEmailOptInDisplay(customer.emailOptIn, !!customer.email);
                if (!d) return null;
                return (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">E-Mail Status</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${d.bg} ${d.color}`}>
                      {customer.emailOptIn === 'CONFIRMED'
                        ? <CheckCircle2Icon className="h-3 w-3" />
                        : <BellOffIcon className="h-3 w-3" />}
                      {d.label}
                    </span>
                  </div>
                );
              })()}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Schnellaktionen</h2>
            <div className="space-y-2">
              <Link href={`/dashboard/customers/${customerId}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <PencilIcon className="h-3.5 w-3.5" />
                  Kunde bearbeiten
                </Button>
              </Link>
              <Button
                variant="outline" className="w-full justify-start" size="sm"
                onClick={() => { setEditingHeater(null); setShowHeaterForm(true); }}
              >
                <HomeIcon className="h-3.5 w-3.5" />
                Heizsystem hinzufügen
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {showHeaterForm && (
        <HeaterFormModal
          customerId={customer.id} heater={editingHeater}
          onClose={() => { setShowHeaterForm(false); setEditingHeater(null); }}
          onSuccess={() => { setShowHeaterForm(false); setEditingHeater(null); refetch(); refetchHeaters(); }}
        />
      )}

      {showMaintenanceForm && selectedHeater && (
        <MaintenanceFormModal
          heaterId={selectedHeater.id} heaterModel={selectedHeater.model}
          onClose={() => { setShowMaintenanceForm(false); setSelectedHeater(null); }}
          onSuccess={() => { setShowMaintenanceForm(false); setSelectedHeater(null); refetch(); refetchHeaters(); }}
        />
      )}
    </div>
  );
}
