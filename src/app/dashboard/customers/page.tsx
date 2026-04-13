'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  LayoutGridIcon,
  LayoutListIcon,
  FilterIcon,
  FlameIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
  ChevronRightIcon,
} from 'lucide-react';

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

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'city' | 'maintenance' | 'heaters';
type FilterOption = 'all' | 'overdue' | 'upcoming' | 'no_maintenance';

const getHeatingTypeLabel = (type: string | null): string | null => {
  if (!type) return null;
  const labels: Record<string, string> = {
    'GAS': 'Gas',
    'OIL': 'Öl',
    'DISTRICT_HEATING': 'Fernwärme',
    'HEAT_PUMP_AIR': 'WP Luft',
    'HEAT_PUMP_GROUND': 'WP Erde',
    'HEAT_PUMP_WATER': 'WP Wasser',
    'PELLET_BIOMASS': 'Pellet',
    'NIGHT_STORAGE': 'Nachtspeicher',
    'ELECTRIC_DIRECT': 'Elektro',
    'HYBRID': 'Hybrid',
    'CHP': 'BHKW',
  };
  return labels[type] || type;
};

const getMaintenanceStatus = (nextMaintenance: string | null) => {
  if (!nextMaintenance) return 'none';
  const date = new Date(nextMaintenance);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 30) return 'upcoming';
  return 'scheduled';
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
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function CustomersPage() {
  const { data: customers, isLoading, error } = useCustomers();
  const deleteCustomer = useDeleteCustomer();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    let filtered = [...customers];

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.city.toLowerCase().includes(query) ||
        customer.street.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        customer.email?.toLowerCase().includes(query)
      );
    }

    if (filterBy !== 'all') {
      filtered = filtered.filter((customer) => {
        const nextMaintenance = getNextMaintenanceDate(customer.heaters);
        const status = getMaintenanceStatus(nextMaintenance);
        if (filterBy === 'overdue') return status === 'overdue';
        if (filterBy === 'upcoming') return status === 'upcoming';
        if (filterBy === 'no_maintenance') return status === 'none';
        return true;
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'city': return a.city.localeCompare(b.city);
        case 'maintenance': {
          const aDate = getNextMaintenanceDate(a.heaters);
          const bDate = getNextMaintenanceDate(b.heaters);
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        }
        case 'heaters': return b.heaters.length - a.heaters.length;
        default: return 0;
      }
    });

    return filtered;
  }, [customers, searchTerm, sortBy, filterBy]);

  const stats = useMemo(() => {
    if (!customers) return { total: 0, overdue: 0, upcoming: 0, totalHeaters: 0 };
    return {
      total: customers.length,
      overdue: customers.filter(c => getMaintenanceStatus(getNextMaintenanceDate(c.heaters)) === 'overdue').length,
      upcoming: customers.filter(c => getMaintenanceStatus(getNextMaintenanceDate(c.heaters)) === 'upcoming').length,
      totalHeaters: customers.reduce((sum, c) => sum + c.heaters.length, 0),
    };
  }, [customers]);

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
          <p className="text-destructive font-medium mb-1">Fehler beim Laden der Kunden</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!customers) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kunden</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verwalten Sie Ihre Kunden und deren Heizungsanlagen
          </p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button>
            <PlusIcon className="h-4 w-4" />
            Neuer Kunde
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Gesamt</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{stats.total}</p>
        </div>
        <div className={`bg-card rounded-xl border px-4 py-3 ${stats.overdue > 0 ? 'border-destructive/30' : 'border-border'}`}>
          <p className="text-xs text-muted-foreground">Überfällig</p>
          <p className={`text-xl font-bold mt-0.5 ${stats.overdue > 0 ? 'text-destructive' : 'text-foreground'}`}>{stats.overdue}</p>
        </div>
        <div className="bg-card rounded-xl border border-warning/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">Nächste 30 Tage</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{stats.upcoming}</p>
        </div>
        <div className="bg-card rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Heizsysteme</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{stats.totalHeaters}</p>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suche nach Name, Ort, Adresse oder Telefon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border-0 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
            >
              <LayoutListIcon className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-muted' : ''}
            >
              <FilterIcon className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Sortieren:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2.5 py-1.5 bg-muted border-0 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="name">Name</option>
                <option value="city">Ort</option>
                <option value="maintenance">Nächste Wartung</option>
                <option value="heaters">Anzahl Heizsysteme</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Filter:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="px-2.5 py-1.5 bg-muted border-0 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">Alle</option>
                <option value="overdue">Überfällige Wartungen</option>
                <option value="upcoming">Nächste 30 Tage</option>
                <option value="no_maintenance">Ohne Wartungstermin</option>
              </select>
            </div>
            {(searchTerm || filterBy !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchTerm(''); setFilterBy('all'); }}
                className="text-muted-foreground"
              >
                <XIcon className="h-3.5 w-3.5" />
                Zurücksetzen
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FlameIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">
            {searchTerm || filterBy !== 'all' ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm || filterBy !== 'all'
              ? 'Versuchen Sie andere Suchkriterien oder Filter.'
              : 'Erstellen Sie Ihren ersten Kunden, um zu beginnen.'}
          </p>
          {!searchTerm && filterBy === 'all' && (
            <div className="mt-5">
              <Link href="/dashboard/customers/new">
                <Button>
                  <PlusIcon className="h-4 w-4" />
                  Ersten Kunden erstellen
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-3' : 'space-y-2'}>
          {filteredCustomers.map((customer) => {
            const nextMaintenance = getNextMaintenanceDate(customer.heaters);
            const maintenanceStatus = getMaintenanceStatus(nextMaintenance);

            return (
              <Link
                key={customer.id}
                href={`/dashboard/customers/${customer.id}`}
                className="group block bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {customer.name}
                      </h3>
                      {maintenanceStatus === 'overdue' && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                          <AlertTriangleIcon className="h-3 w-3" />
                          Überfällig
                        </span>
                      )}
                      {maintenanceStatus === 'upcoming' && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-warning/10 text-warning-foreground border border-warning/20">
                          <CalendarIcon className="h-3 w-3" />
                          Bald
                        </span>
                      )}
                      {maintenanceStatus === 'scheduled' && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20">
                          <CheckCircleIcon className="h-3 w-3" />
                          OK
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{customer.street}, {customer.zipCode} {customer.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PhoneIcon className="h-3 w-3 shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1.5">
                          <MailIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>

                    {customer.heatingType && (
                      <div className="mt-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/8 text-primary border border-primary/10">
                          <FlameIcon className="h-3 w-3" />
                          {getHeatingTypeLabel(customer.heatingType)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs font-medium text-foreground">
                      {customer.heaters.length} {customer.heaters.length === 1 ? 'System' : 'Systeme'}
                    </p>
                    {nextMaintenance && (
                      <p className="text-xs text-muted-foreground">{formatDate(nextMaintenance)}</p>
                    )}
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {filteredCustomers.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filteredCustomers.length} von {customers.length} Kunde{filteredCustomers.length !== 1 ? 'n' : ''} angezeigt
        </p>
      )}
    </div>
  );
}
