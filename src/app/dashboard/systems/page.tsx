'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2Icon,
  WrenchIcon,
  SearchIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ChevronRightIcon,
  FlameIcon,
  WindIcon,
  DropletIcon,
  BatteryIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useCustomerSystems } from '@/hooks/useCustomerSystems';
import type { SystemType } from '@/hooks/useCatalog';

const SYSTEM_TYPE_ICONS: Record<SystemType, React.ElementType> = {
  HEATING: FlameIcon,
  AC: WindIcon,
  WATER_TREATMENT: DropletIcon,
  ENERGY_STORAGE: BatteryIcon,
};

function getMaintenanceUrgency(dateString: string | null) {
  if (!dateString) return 'none';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'urgent';
  if (diffDays <= 30) return 'soon';
  return 'upcoming';
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { label: string; style: string }> = {
    overdue: { label: 'Überfällig', style: 'bg-status-overdue-bg text-status-overdue-text border-status-overdue-border' },
    urgent: { label: 'Diese Woche', style: 'bg-status-due-bg text-status-due-text border-status-due-border' },
    soon: { label: 'Bald fällig', style: 'bg-status-info-bg text-status-info-text border-status-info-border' },
    upcoming: { label: 'Geplant', style: 'bg-muted text-muted-foreground border-border' },
    none: { label: 'Keine Wartung', style: 'bg-muted text-muted-foreground border-border' },
  };
  const { label, style } = config[urgency] ?? config.none;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${style}`}>
      {label}
    </span>
  );
}

function TerminiertBadge() {
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-md border bg-status-ok-bg text-status-ok-text border-status-ok-border">
      Terminiert
    </span>
  );
}

export default function SystemsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: systems = [], isLoading, error } = useCustomerSystems({ search: searchQuery });

  const overdueCount = useMemo(
    () => systems.filter((s) => s.nextMaintenance && getMaintenanceUrgency(s.nextMaintenance) === 'overdue').length,
    [systems]
  );
  const totalMaintenances = useMemo(
    () => systems.reduce((sum, s) => sum + (s._count?.maintenances ?? 0), 0),
    [systems]
  );

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
          <p className="text-destructive font-medium mb-1">Fehler beim Laden der Systeme</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Systeme</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle zu wartenden Systeme Ihrer Kunden
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50">
              <WrenchIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Systeme gesamt</p>
              <p className="text-xl font-bold text-foreground">{systems.length}</p>
            </div>
          </div>
        </div>

        <div className={`bg-card rounded-xl border p-5 ${overdueCount > 0 ? 'border-destructive/30' : 'border-border'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-status-overdue-bg">
              <CalendarIcon className="h-4 w-4 text-status-overdue-text" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Überfällige Wartungen</p>
              <p className={`text-xl font-bold ${overdueCount > 0 ? 'text-status-overdue-text' : 'text-foreground'}`}>
                {overdueCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durchgeführte Wartungen</p>
              <p className="text-xl font-bold text-foreground">{totalMaintenances}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Suche nach Gerät, Hersteller, Kunde oder Ort..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-11"
        />
      </div>

      {/* Systems List */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Alle Systeme ({systems.length})</h2>
        </div>
        <div className="p-4">
          {systems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {systems.map((system) => {
                const urgency = getMaintenanceUrgency(system.nextMaintenance);
                const nextBooking = system.bookings?.[0] ?? null;
                const TypeIcon = SYSTEM_TYPE_ICONS[system.catalog.systemType as SystemType] ?? WrenchIcon;
                return (
                  <Link
                    key={system.id}
                    href={`/dashboard/systems/${system.id}`}
                    className="group block p-4 rounded-xl border border-border hover:shadow-md hover:border-brand-200 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {system.catalog.manufacturer} {system.catalog.name}
                          </h3>
                          {system.serialNumber && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              SN: {system.serialNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {nextBooking
                          ? <TerminiertBadge />
                          : system.nextMaintenance && <UrgencyBadge urgency={urgency} />
                        }
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {system.customer && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-3 w-3" />
                            <span>{system.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon className="h-3 w-3" />
                            <span>{system.customer.city}</span>
                          </div>
                        </>
                      )}
                      {nextBooking ? (
                        <div className="flex items-center gap-1.5 text-status-ok-text">
                          <CalendarIcon className="h-3 w-3" />
                          <span>
                            Termin: {format(new Date(nextBooking.startTime), 'dd. MMM yyyy, HH:mm', { locale: de })} Uhr
                          </span>
                        </div>
                      ) : system.nextMaintenance ? (
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="h-3 w-3" />
                          <span>
                            Nächste Wartung: {format(new Date(system.nextMaintenance), 'dd. MMM yyyy', { locale: de })}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1.5">
                        <WrenchIcon className="h-3 w-3" />
                        <span>
                          {system._count?.maintenances ?? 0}{' '}
                          {(system._count?.maintenances ?? 0) === 1 ? 'Wartung' : 'Wartungen'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <WrenchIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Keine Systeme gefunden' : 'Noch keine Systeme vorhanden'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
