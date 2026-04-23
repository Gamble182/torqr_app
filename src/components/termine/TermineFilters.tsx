'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCustomers } from '@/hooks/useCustomers';
import { useEmployees } from '@/hooks/useEmployees';
import { FilterIcon } from 'lucide-react';

interface TermineFiltersProps {
  isOwner: boolean;
}

const RANGE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'upcoming', label: 'Anstehend' },
  { value: 'week', label: 'Diese Woche' },
  { value: 'month', label: 'Dieser Monat' },
  { value: 'past', label: 'Vergangen' },
  { value: 'all', label: 'Alle' },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Aktiv (Standard)' },
  { value: 'CONFIRMED', label: 'Bestätigt' },
  { value: 'RESCHEDULED', label: 'Verschoben' },
  { value: 'CANCELLED', label: 'Storniert' },
];

const SYSTEM_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Alle Anlagen' },
  { value: 'HEATING', label: 'Heizung' },
  { value: 'AC', label: 'Klima' },
  { value: 'WATER_TREATMENT', label: 'Wasser' },
  { value: 'ENERGY_STORAGE', label: 'Energiespeicher' },
];

const SOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Alle Quellen' },
  { value: 'cal', label: 'Cal.com' },
  { value: 'manual', label: 'Manuell' },
];

export function TermineFilters({ isOwner }: TermineFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const { data: customers = [] } = useCustomers();
  const { data: employees = [] } = useEmployees();

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(sp.toString());
    if (value === null || value === '') params.delete(key);
    else params.set(key, value);
    router.replace(`/dashboard/termine?${params.toString()}`);
  };

  const selectClass =
    'w-full px-2.5 py-1.5 text-sm bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
        <FilterIcon className="h-4 w-4 text-muted-foreground" />
        Filter
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        <select
          className={selectClass}
          value={sp.get('range') ?? 'upcoming'}
          onChange={(e) => setParam('range', e.target.value)}
          aria-label="Zeitraum"
        >
          {RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={sp.get('status') ?? ''}
          onChange={(e) => setParam('status', e.target.value || null)}
          aria-label="Status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {isOwner ? (
          <select
            className={selectClass}
            value={sp.get('assignee') ?? ''}
            onChange={(e) => setParam('assignee', e.target.value || null)}
            aria-label="Techniker"
          >
            <option value="">Alle Techniker</option>
            <option value="unassigned">Nicht zugewiesen</option>
            {employees.filter((emp) => emp.isActive).map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        ) : (
          <div className="px-2.5 py-1.5 text-sm text-muted-foreground italic">
            Meine Termine
          </div>
        )}

        <select
          className={selectClass}
          value={sp.get('customerId') ?? ''}
          onChange={(e) => setParam('customerId', e.target.value || null)}
          aria-label="Kunde"
        >
          <option value="">Alle Kunden</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={sp.get('systemType') ?? 'all'}
          onChange={(e) => setParam('systemType', e.target.value === 'all' ? null : e.target.value)}
          aria-label="Anlage"
        >
          {SYSTEM_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={sp.get('source') ?? 'all'}
          onChange={(e) => setParam('source', e.target.value === 'all' ? null : e.target.value)}
          aria-label="Quelle"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
