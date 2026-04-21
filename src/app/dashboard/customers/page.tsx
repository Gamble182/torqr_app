'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCustomers } from '@/hooks/useCustomers';
import {
  PlusIcon,
  SearchIcon,
  Loader2Icon,
  LayoutGridIcon,
  LayoutListIcon,
  FilterIcon,
  WrenchIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  XIcon,
  ChevronRightIcon,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'city';

export default function CustomersPage() {
  const { data: customers, isLoading, error } = useCustomers();

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
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

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'city': return a.city.localeCompare(b.city);
        default: return 0;
      }
    });

    return filtered;
  }, [customers, searchTerm, sortBy]);

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
            Verwalten Sie Ihre Kunden und deren Systeme
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="bg-card rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Kunden gesamt</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{customers.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Gefiltert</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{filteredCustomers.length}</p>
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
              className="w-full pl-10 pr-4 py-2.5 bg-muted border-0 rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-11"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
              className="w-10 h-10"
            >
              <LayoutGridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
              className="w-10 h-10"
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
                className="px-2.5 py-1.5 bg-muted border-0 rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring h-10"
              >
                <option value="name">Name</option>
                <option value="city">Ort</option>
              </select>
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
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
          <WrenchIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">
            {searchTerm ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? 'Versuchen Sie andere Suchkriterien.'
              : 'Erstellen Sie Ihren ersten Kunden, um zu beginnen.'}
          </p>
          {!searchTerm && (
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
          {filteredCustomers.map((customer) => (
            <Link
              key={customer.id}
              href={`/dashboard/customers/${customer.id}`}
              className="group block bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-brand-200 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate mb-2">
                    {customer.name}
                  </h3>

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
                </div>

                <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </Link>
          ))}
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
