'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  LayoutGridIcon,
  LayoutListIcon,
  FilterIcon,
  ArrowUpDownIcon,
  FlameIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
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

// Helper functions
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
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers');
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data);
        setFilteredCustomers(result.data);
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error('Fehler beim Laden der Kunden');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...customers];

    // Search filter
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

    // Maintenance status filter
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

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'city':
          return a.city.localeCompare(b.city);
        case 'maintenance': {
          const aDate = getNextMaintenanceDate(a.heaters);
          const bDate = getNextMaintenanceDate(b.heaters);
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        }
        case 'heaters':
          return b.heaters.length - a.heaters.length;
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, sortBy, filterBy]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Möchten Sie den Kunden "${name}" wirklich löschen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setCustomers(customers.filter(c => c.id !== id));
        toast.success(`Kunde "${name}" wurde gelöscht`);
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Fehler beim Löschen');
    }
  };

  // Calculate stats
  const stats = {
    total: customers.length,
    overdue: customers.filter(c => getMaintenanceStatus(getNextMaintenanceDate(c.heaters)) === 'overdue').length,
    upcoming: customers.filter(c => getMaintenanceStatus(getNextMaintenanceDate(c.heaters)) === 'upcoming').length,
    totalHeaters: customers.reduce((sum, c) => sum + c.heaters.length, 0),
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kunden</h1>
          <p className="mt-2 text-muted-foreground">
            Verwalten Sie Ihre Kunden und deren Heizungsanlagen
          </p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Neuer Kunde
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">Gesamt</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats.total}</div>
        </div>
        <div className="bg-card rounded-lg border border-destructive/50 p-4">
          <div className="text-sm text-muted-foreground">Überfällig</div>
          <div className="text-2xl font-bold text-destructive mt-1">{stats.overdue}</div>
        </div>
        <div className="bg-card rounded-lg border border-warning/50 p-4">
          <div className="text-sm text-muted-foreground">Nächste 30 Tage</div>
          <div className="text-2xl font-bold text-warning mt-1">{stats.upcoming}</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">Heizungen</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats.totalHeaters}</div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="bg-card rounded-lg border border-border p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suche nach Name, Stadt, Adresse oder Telefon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <LayoutListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sortieren:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="name">Name</option>
                <option value="city">Stadt</option>
                <option value="maintenance">Nächste Wartung</option>
                <option value="heaters">Anzahl Heizungen</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter:</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                className="px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                onClick={() => {
                  setSearchTerm('');
                  setFilterBy('all');
                }}
              >
                <XIcon className="h-4 w-4 mr-1" />
                Filter zurücksetzen
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <div className="mx-auto max-w-sm">
            <FlameIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">
              {searchTerm || filterBy !== 'all' ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || filterBy !== 'all'
                ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                : 'Erstellen Sie Ihren ersten Kunden, um zu beginnen.'}
            </p>
            {!searchTerm && filterBy === 'all' && (
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
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
          {filteredCustomers.map((customer) => {
            const nextMaintenance = getNextMaintenanceDate(customer.heaters);
            const maintenanceStatus = getMaintenanceStatus(nextMaintenance);

            return (
              <Link
                key={customer.id}
                href={`/dashboard/customers/${customer.id}`}
                className="block bg-card rounded-lg border border-border p-4 hover:shadow-md hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Name and Status */}
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-semibold text-foreground text-lg truncate">
                        {customer.name}
                      </h3>
                      {maintenanceStatus === 'overdue' && (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive text-destructive-foreground">
                          <AlertTriangleIcon className="h-3 w-3 mr-1" />
                          Überfällig
                        </span>
                      )}
                      {maintenanceStatus === 'upcoming' && (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-warning text-warning-foreground">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Bald
                        </span>
                      )}
                      {maintenanceStatus === 'scheduled' && (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/20 text-secondary">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          OK
                        </span>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{customer.street}, {customer.zipCode} {customer.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <MailIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Heating Type Badge */}
                    {customer.heatingType && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                          <FlameIcon className="h-3 w-3 mr-1" />
                          {getHeatingTypeLabel(customer.heatingType)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-foreground">
                      {customer.heaters.length} {customer.heaters.length === 1 ? 'Heizung' : 'Heizungen'}
                    </div>
                    {nextMaintenance && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(nextMaintenance)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Results Count */}
      {filteredCustomers.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {filteredCustomers.length} von {customers.length} Kunde{filteredCustomers.length !== 1 ? 'n' : ''} angezeigt
        </div>
      )}
    </div>
  );
}
