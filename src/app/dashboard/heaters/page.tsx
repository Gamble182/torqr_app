'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2Icon,
  FlameIcon,
  SearchIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  WrenchIcon,
  ClockIcon,
  PlusIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useHeaters } from '@/hooks/useHeaters';

export default function HeatersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: heaters, isLoading, error } = useHeaters({ search: searchQuery });

  const filteredHeaters = useMemo(() => {
    if (!heaters) return [];
    return heaters;
  }, [heaters]);

  const getMaintenanceUrgency = (dateString: string | null) => {
    if (!dateString) return 'none';

    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'urgent';
    if (diffDays <= 30) return 'soon';
    return 'upcoming';
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive text-destructive-foreground">Überfällig</span>;
      case 'urgent':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-warning text-warning-foreground">Diese Woche</span>;
      case 'soon':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent text-accent-foreground">Bald fällig</span>;
      case 'upcoming':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Geplant</span>;
      default:
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Keine Wartung</span>;
    }
  };

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
          <p className="text-destructive mb-2">Fehler beim Laden der Heizsysteme</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!heaters) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Heizsysteme</h1>
          <p className="mt-2 text-muted-foreground">
            Verwalten Sie alle Heizsysteme Ihrer Kunden
          </p>
        </div>
        <Link href="/dashboard/heaters/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Neues Heizsystem
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-card overflow-hidden shadow-sm rounded-lg border border-border p-5">
          <div className="flex items-center">
            <div className="shrink-0">
              <div className="rounded-lg bg-primary p-3">
                <FlameIcon className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <div className="ml-5">
              <dt className="text-sm font-medium text-muted-foreground">
                Heizsysteme gesamt
              </dt>
              <dd className="text-3xl font-bold text-foreground">
                {heaters.length}
              </dd>
            </div>
          </div>
        </div>

        <div className={`bg-card overflow-hidden shadow-sm rounded-lg border p-5 ${heaters.filter(h => h.nextMaintenance && getMaintenanceUrgency(h.nextMaintenance) === 'overdue').length > 0 ? 'border-destructive' : 'border-border'}`}>
          <div className="flex items-center">
            <div className="shrink-0">
              <div className="rounded-lg bg-destructive p-3">
                <CalendarIcon className="h-6 w-6 text-destructive-foreground" />
              </div>
            </div>
            <div className="ml-5">
              <dt className="text-sm font-medium text-muted-foreground">
                Überfällige Wartungen
              </dt>
              <dd className="text-3xl font-bold text-destructive">
                {heaters.filter(h => h.nextMaintenance && getMaintenanceUrgency(h.nextMaintenance) === 'overdue').length}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow-sm rounded-lg border border-border p-5">
          <div className="flex items-center">
            <div className="shrink-0">
              <div className="rounded-lg bg-secondary p-3">
                <WrenchIcon className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
            <div className="ml-5">
              <dt className="text-sm font-medium text-muted-foreground">
                Durchgeführte Wartungen
              </dt>
              <dd className="text-3xl font-bold text-foreground">
                {heaters.reduce((sum, h) => sum + (h._count?.maintenances || 0), 0)}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card shadow-sm rounded-lg border border-border p-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Suche nach Modell, Seriennummer, Kunde oder Ort..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Heaters List */}
      <div className="bg-card shadow-sm rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FlameIcon className="h-5 w-5 text-primary" />
            Alle Heizsysteme ({filteredHeaters.length})
          </h2>
        </div>
        <div className="p-6">
          {filteredHeaters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHeaters.map((heater) => {
                const urgency = getMaintenanceUrgency(heater.nextMaintenance);
                return (
                  <Link
                    key={heater.id}
                    href={`/dashboard/heaters/${heater.id}`}
                    className="block p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {heater.model}
                        </h3>
                        {heater.serialNumber && (
                          <p className="text-sm text-muted-foreground">
                            SN: {heater.serialNumber}
                          </p>
                        )}
                      </div>
                      {heater.nextMaintenance && getUrgencyBadge(urgency)}
                    </div>

                    <div className="space-y-2 text-sm">
                      {heater.customer ? (
                        <>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <UserIcon className="h-4 w-4" />
                            <span>{heater.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{heater.customer.city}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground italic">
                          <UserIcon className="h-4 w-4" />
                          <span>Kein Kunde zugeordnet</span>
                        </div>
                      )}
                      {heater.nextMaintenance && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ClockIcon className="h-4 w-4" />
                          <span>
                            Nächste Wartung: {format(new Date(heater.nextMaintenance), 'dd. MMM yyyy', { locale: de })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <WrenchIcon className="h-4 w-4" />
                        <span>
                          {heater._count?.maintenances || 0} {(heater._count?.maintenances || 0) === 1 ? 'Wartung' : 'Wartungen'} durchgeführt
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FlameIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Keine Heizsysteme gefunden'
                  : 'Noch keine Heizsysteme vorhanden'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
