'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Loader2Icon,
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircleIcon,
  FlameIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  FilterIcon,
  XIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface Customer {
  id: string;
  name: string;
  street: string;
  city: string;
  phone: string;
  email: string | null;
}

interface Maintenance {
  id: string;
  date: string;
  notes: string | null;
}

interface Heater {
  id: string;
  model: string;
  serialNumber: string | null;
  nextMaintenance: string;
  maintenanceInterval: number;
  customer: Customer;
  maintenances: Maintenance[];
}

interface Stats {
  total: number;
  overdue: number;
  thisWeek: number;
  thisMonth: number;
}

type FilterStatus = 'all' | 'overdue' | 'upcoming';

export default function WartungenPage() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('status') as FilterStatus) || 'all';

  const [heaters, setHeaters] = useState<Heater[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, overdue: 0, thisWeek: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialFilter);
  const [timeRange, setTimeRange] = useState(30); // days
  const [showFilters, setShowFilters] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20);

  useEffect(() => {
    fetchWartungen();
  }, [filterStatus, timeRange]);

  const fetchWartungen = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/wartungen?status=${filterStatus}&days=${timeRange}`);
      const result = await response.json();

      if (result.success) {
        setHeaters(result.data);
        setStats(result.stats);
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error fetching wartungen:', err);
      toast.error('Fehler beim Laden der Wartungen');
    } finally {
      setLoading(false);
    }
  };

  const getMaintenanceUrgency = (dateString: string) => {
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
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground">
            <AlertTriangleIcon className="h-3 w-3 mr-1" />
            Überfällig
          </span>
        );
      case 'urgent':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-warning text-warning-foreground">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Diese Woche
          </span>
        );
      case 'soon':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
            <ClockIcon className="h-3 w-3 mr-1" />
            Bald fällig
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/20 text-secondary">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Geplant
          </span>
        );
    }
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} Tag${Math.abs(diffDays) !== 1 ? 'e' : ''} überfällig`;
    } else if (diffDays === 0) {
      return 'Heute';
    } else if (diffDays === 1) {
      return 'Morgen';
    } else {
      return `in ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`;
    }
  };

  const displayedHeaters = heaters.slice(0, displayLimit);
  const hasMore = heaters.length > displayLimit;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Wartungen</h1>
        <p className="mt-2 text-muted-foreground">
          Übersicht aller anstehenden und überfälligen Wartungen
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">Gesamt</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats.total}</div>
        </div>
        <div className={`bg-card rounded-lg border p-4 ${stats.overdue > 0 ? 'border-destructive/50' : 'border-border'}`}>
          <div className="text-sm text-muted-foreground">Überfällig</div>
          <div className="text-2xl font-bold text-destructive mt-1">{stats.overdue}</div>
        </div>
        <div className="bg-card rounded-lg border border-warning/50 p-4">
          <div className="text-sm text-muted-foreground">Diese Woche</div>
          <div className="text-2xl font-bold text-warning mt-1">{stats.thisWeek}</div>
        </div>
        <div className="bg-card rounded-lg border border-accent/50 p-4">
          <div className="text-sm text-muted-foreground">Dieser Monat</div>
          <div className="text-2xl font-bold text-accent mt-1">{stats.thisMonth}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Alle
            </Button>
            <Button
              variant={filterStatus === 'overdue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('overdue')}
            >
              <AlertTriangleIcon className="h-4 w-4 mr-1" />
              Überfällig
            </Button>
            <Button
              variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('upcoming')}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Anstehend
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="h-4 w-4 mr-1" />
            Zeitraum
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Zeitraum:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="7">Nächste 7 Tage</option>
                <option value="30">Nächste 30 Tage</option>
                <option value="90">Nächste 3 Monate</option>
                <option value="180">Nächste 6 Monate</option>
                <option value="365">Nächstes Jahr</option>
              </select>
            </div>

            {(filterStatus !== 'all' || timeRange !== 30) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatus('all');
                  setTimeRange(30);
                }}
              >
                <XIcon className="h-4 w-4 mr-1" />
                Filter zurücksetzen
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Wartungen List */}
      {heaters.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground">Keine Wartungen gefunden</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {filterStatus === 'overdue'
              ? 'Keine überfälligen Wartungen vorhanden.'
              : 'Keine anstehenden Wartungen im gewählten Zeitraum.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayedHeaters.map((heater) => {
              const urgency = getMaintenanceUrgency(heater.nextMaintenance);
              const lastMaintenance = heater.maintenances[0];

              return (
                <div
                  key={heater.id}
                  className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header with status */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/dashboard/heaters/${heater.id}`}
                              className="font-semibold text-foreground text-lg hover:text-primary transition-colors"
                            >
                              {heater.model}
                            </Link>
                            {getUrgencyBadge(urgency)}
                          </div>
                          {heater.serialNumber && (
                            <p className="text-sm text-muted-foreground">
                              SN: {heater.serialNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <UserIcon className="h-3.5 w-3.5" />
                            <Link
                              href={`/dashboard/customers/${heater.customer.id}`}
                              className="hover:text-accent transition-colors"
                            >
                              {heater.customer.name}
                            </Link>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPinIcon className="h-3.5 w-3.5" />
                            <span>{heater.customer.street}, {heater.customer.city}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <PhoneIcon className="h-3.5 w-3.5" />
                            <a
                              href={`tel:${heater.customer.phone}`}
                              className="hover:text-accent transition-colors"
                            >
                              {heater.customer.phone}
                            </a>
                          </div>
                        </div>

                        <div>
                          <div className="text-muted-foreground mb-1">
                            <span className="font-medium">Wartungsintervall:</span>{' '}
                            {heater.maintenanceInterval} {heater.maintenanceInterval === 1 ? 'Monat' : 'Monate'}
                          </div>
                          {lastMaintenance && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">Letzte Wartung:</span>{' '}
                              {format(new Date(lastMaintenance.date), 'dd. MMM yyyy', { locale: de })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Next Maintenance Info */}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-foreground mb-1">
                        {format(new Date(heater.nextMaintenance), 'dd. MMMM yyyy', { locale: de })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(heater.nextMaintenance), 'EEEE', { locale: de })}
                      </div>
                      <div className={`text-xs font-medium mt-2 ${
                        urgency === 'overdue' ? 'text-destructive' : 'text-muted-foreground'
                      }`}>
                        {getDaysUntil(heater.nextMaintenance)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Link href={`/dashboard/heaters/${heater.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <FlameIcon className="h-4 w-4 mr-1" />
                        Heizung anzeigen
                      </Button>
                    </Link>
                    <Link href={`/dashboard/customers/${heater.customer.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <UserIcon className="h-4 w-4 mr-1" />
                        Kunde anzeigen
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setDisplayLimit(displayLimit + 20)}
              >
                Mehr laden ({heaters.length - displayLimit} weitere)
              </Button>
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-muted-foreground text-center">
            {displayedHeaters.length} von {heaters.length} Wartung{heaters.length !== 1 ? 'en' : ''} angezeigt
          </div>
        </>
      )}
    </div>
  );
}
