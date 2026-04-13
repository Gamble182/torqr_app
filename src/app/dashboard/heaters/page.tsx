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
  ChevronRightIcon,
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
    const config: Record<string, { label: string; style: string }> = {
      overdue: { label: 'Überfällig', style: 'bg-destructive/10 text-destructive border-destructive/20' },
      urgent: { label: 'Diese Woche', style: 'bg-warning/10 text-warning-foreground border-warning/20' },
      soon: { label: 'Bald fällig', style: 'bg-secondary/10 text-secondary border-secondary/20' },
      upcoming: { label: 'Geplant', style: 'bg-muted text-muted-foreground border-border' },
      none: { label: 'Keine Wartung', style: 'bg-muted text-muted-foreground border-border' },
    };
    const { label, style } = config[urgency];
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${style}`}>
        {label}
      </span>
    );
  };

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
          <p className="text-destructive font-medium mb-1">Fehler beim Laden der Heizsysteme</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!heaters) return null;

  const overdueCount = heaters.filter(h => h.nextMaintenance && getMaintenanceUrgency(h.nextMaintenance) === 'overdue').length;
  const totalMaintenances = heaters.reduce((sum, h) => sum + (h._count?.maintenances || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Heizsysteme</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalten Sie alle Heizsysteme Ihrer Kunden
          </p>
        </div>
        <Link href="/dashboard/heaters/new">
          <Button>
            <PlusIcon className="h-4 w-4" />
            Neues Heizsystem
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <FlameIcon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Heizsysteme gesamt</p>
              <p className="text-xl font-bold text-foreground">{heaters.length}</p>
            </div>
          </div>
        </div>

        <div className={`bg-card rounded-xl border p-5 ${overdueCount > 0 ? 'border-destructive/30' : 'border-border'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/10">
              <CalendarIcon className="h-4.5 w-4.5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Überfällige Wartungen</p>
              <p className={`text-xl font-bold ${overdueCount > 0 ? 'text-destructive' : 'text-foreground'}`}>{overdueCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/10">
              <WrenchIcon className="h-4.5 w-4.5 text-secondary" />
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
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Suche nach Modell, Seriennummer, Kunde oder Ort..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Heaters List */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Alle Heizsysteme ({filteredHeaters.length})
          </h2>
        </div>
        <div className="p-4">
          {filteredHeaters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredHeaters.map((heater) => {
                const urgency = getMaintenanceUrgency(heater.nextMaintenance);
                return (
                  <Link
                    key={heater.id}
                    href={`/dashboard/heaters/${heater.id}`}
                    className="group block p-4 rounded-xl border border-border hover:shadow-md hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {heater.model}
                        </h3>
                        {heater.serialNumber && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            SN: {heater.serialNumber}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {heater.nextMaintenance && getUrgencyBadge(urgency)}
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {heater.customer ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-3 w-3" />
                            <span>{heater.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon className="h-3 w-3" />
                            <span>{heater.customer.city}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 italic">
                          <UserIcon className="h-3 w-3" />
                          <span>Kein Kunde zugeordnet</span>
                        </div>
                      )}
                      {heater.nextMaintenance && (
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="h-3 w-3" />
                          <span>
                            Nächste Wartung: {format(new Date(heater.nextMaintenance), 'dd. MMM yyyy', { locale: de })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <WrenchIcon className="h-3 w-3" />
                        <span>
                          {heater._count?.maintenances || 0} {(heater._count?.maintenances || 0) === 1 ? 'Wartung' : 'Wartungen'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FlameIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Keine Heizsysteme gefunden' : 'Noch keine Heizsysteme vorhanden'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
