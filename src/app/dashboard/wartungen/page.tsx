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
  DownloadIcon,
  FileTextIcon,
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

type FilterStatus = 'all' | 'overdue' | 'upcoming' | 'thisWeek' | 'thisMonth';

export default function WartungenPage() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('status') as FilterStatus) || 'all';

  const [heaters, setHeaters] = useState<Heater[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, overdue: 0, thisWeek: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialFilter);
  const [timeRange, setTimeRange] = useState(30);
  const [showFilters, setShowFilters] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);

  useEffect(() => {
    if (!useCustomDateRange || (useCustomDateRange && dateFrom && dateTo)) {
      fetchWartungen();
    }
  }, [filterStatus, timeRange, dateFrom, dateTo, useCustomDateRange]);

  const fetchWartungen = async () => {
    try {
      setLoading(true);
      let queryString = `status=${filterStatus}`;
      if (useCustomDateRange && dateFrom && dateTo) {
        queryString += `&dateFrom=${dateFrom}&dateTo=${dateTo}`;
      } else {
        queryString += `&days=${timeRange}`;
      }
      const response = await fetch(`/api/wartungen?${queryString}`);
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
    const config: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
      overdue: {
        label: 'Überfällig',
        style: 'bg-status-overdue-bg text-status-overdue-text border-status-overdue-border',
        icon: <AlertTriangleIcon className="h-3 w-3" />,
      },
      urgent: {
        label: 'Diese Woche',
        style: 'bg-status-due-bg text-status-due-text border-status-due-border',
        icon: <CalendarIcon className="h-3 w-3" />,
      },
      soon: {
        label: 'Bald fällig',
        style: 'bg-status-info-bg text-status-info-text border-status-info-border',
        icon: <ClockIcon className="h-3 w-3" />,
      },
      upcoming: {
        label: 'Geplant',
        style: 'bg-status-ok-bg text-status-ok-text border-status-ok-border',
        icon: <CheckCircleIcon className="h-3 w-3" />,
      },
    };
    const { label, style, icon } = config[urgency];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${style}`}>
        {icon}
        {label}
      </span>
    );
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} Tag${Math.abs(diffDays) !== 1 ? 'e' : ''} überfällig`;
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Morgen';
    return `in ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`;
  };

  const displayedHeaters = heaters.slice(0, displayLimit);
  const hasMore = heaters.length > displayLimit;

  const exportToCSV = () => {
    try {
      const headers = [
        'Heizungsmodell', 'Seriennummer', 'Kunde', 'Straße', 'Ort', 'Telefon',
        'Email', 'Nächste Wartung', 'Status', 'Tage bis Wartung',
        'Wartungsintervall (Monate)', 'Letzte Wartung',
      ];
      const rows = heaters.map((heater) => {
        const urgency = getMaintenanceUrgency(heater.nextMaintenance);
        const date = new Date(heater.nextMaintenance);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const lastMaintenance = heater.maintenances[0];
        let status = 'Geplant';
        if (urgency === 'overdue') status = 'Überfällig';
        else if (urgency === 'urgent') status = 'Diese Woche';
        else if (urgency === 'soon') status = 'Bald fällig';
        return [
          heater.model, heater.serialNumber || '', heater.customer.name,
          heater.customer.street, heater.customer.city, heater.customer.phone,
          heater.customer.email || '',
          format(new Date(heater.nextMaintenance), 'dd.MM.yyyy', { locale: de }),
          status, diffDays.toString(), heater.maintenanceInterval.toString(),
          lastMaintenance ? format(new Date(lastMaintenance.date), 'dd.MM.yyyy', { locale: de }) : '',
        ];
      });
      const csvContent = [
        headers.join(';'),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
      ].join('\n');
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `wartungen_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV-Export erfolgreich');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      toast.error('Fehler beim CSV-Export');
    }
  };

  const exportToPDF = () => {
    try {
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Wartungsübersicht</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 20px; color: #1A1A1A; }
            h1 { color: #008000; margin-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; font-size: 14px; }
            .stats { display: flex; gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; flex: 1; }
            .stat-card h3 { margin: 0 0 5px 0; font-size: 14px; color: #666; }
            .stat-card .value { font-size: 24px; font-weight: bold; }
            .overdue { color: #712B13; border-color: #F5C4B3; }
            .warning { color: #633806; }
            .accent { color: #008000; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #008000; color: white; padding: 12px; text-align: left; font-size: 12px; border-radius: 0; }
            th:first-child { border-radius: 8px 0 0 0; }
            th:last-child { border-radius: 0 8px 0 0; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
            tr:hover { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; }
            .badge-overdue { background-color: #FAECE7; color: #712B13; }
            .badge-urgent { background-color: #FAEEDA; color: #633806; }
            .badge-soon { background-color: #E6F1FB; color: #0C447C; }
            .badge-scheduled { background-color: #E6F2E6; color: #006600; }
          </style>
        </head>
        <body>
          <h1>Wartungsübersicht</h1>
          <div class="meta">Erstellt am ${format(new Date(), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr</div>
          <div class="stats">
            <div class="stat-card"><h3>Gesamt</h3><div class="value">${stats.total}</div></div>
            <div class="stat-card overdue"><h3>Überfällig</h3><div class="value">${stats.overdue}</div></div>
            <div class="stat-card warning"><h3>Diese Woche</h3><div class="value">${stats.thisWeek}</div></div>
            <div class="stat-card accent"><h3>Dieser Monat</h3><div class="value">${stats.thisMonth}</div></div>
          </div>
          <table>
            <thead><tr><th>Heizung</th><th>Kunde</th><th>Ort</th><th>Telefon</th><th>Nächste Wartung</th><th>Status</th><th>Intervall</th></tr></thead>
            <tbody>
              ${heaters.map((heater) => {
                const urgency = getMaintenanceUrgency(heater.nextMaintenance);
                let badgeClass = 'badge-scheduled';
                let statusText = 'Geplant';
                if (urgency === 'overdue') { badgeClass = 'badge-overdue'; statusText = 'Überfällig'; }
                else if (urgency === 'urgent') { badgeClass = 'badge-urgent'; statusText = 'Diese Woche'; }
                else if (urgency === 'soon') { badgeClass = 'badge-soon'; statusText = 'Bald fällig'; }
                return `<tr>
                  <td><strong>${heater.model}</strong><br>${heater.serialNumber ? `<small>SN: ${heater.serialNumber}</small>` : ''}</td>
                  <td>${heater.customer.name}</td><td>${heater.customer.city}</td><td>${heater.customer.phone}</td>
                  <td>${format(new Date(heater.nextMaintenance), 'dd.MM.yyyy', { locale: de })}</td>
                  <td><span class="badge ${badgeClass}">${statusText}</span></td>
                  <td>${heater.maintenanceInterval} ${heater.maintenanceInterval === 1 ? 'Monat' : 'Monate'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </body></html>`;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => printWindow.print();
        toast.success('PDF-Druckvorschau geöffnet');
      } else {
        toast.error('Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.');
      }
    } catch (err) {
      console.error('Error exporting PDF:', err);
      toast.error('Fehler beim PDF-Export');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wartungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Übersicht aller anstehenden und überfälligen Wartungen
          </p>
        </div>
        {heaters.length > 0 && (
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <DownloadIcon className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileTextIcon className="h-4 w-4" />
              PDF
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterStatus('all')}
          className={`bg-card rounded-xl border px-4 py-3 min-h-11 text-left hover:shadow-md transition-all cursor-pointer ${
            filterStatus === 'all' ? 'ring-2 ring-primary border-primary' : 'border-border'
          }`}
        >
          <p className="text-xs text-muted-foreground">Gesamt</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{stats.total}</p>
        </button>
        <button
          onClick={() => setFilterStatus('overdue')}
          className={`bg-card rounded-xl border px-4 py-3 min-h-11 text-left hover:shadow-md transition-all cursor-pointer ${
            filterStatus === 'overdue' ? 'ring-2 ring-destructive border-destructive' : stats.overdue > 0 ? 'border-destructive/30' : 'border-border'
          }`}
        >
          <p className="text-xs text-muted-foreground">Überfällig</p>
          <p className={`text-xl font-bold mt-0.5 ${stats.overdue > 0 ? 'text-destructive' : 'text-foreground'}`}>{stats.overdue}</p>
        </button>
        <button
          onClick={() => setFilterStatus('thisWeek')}
          className={`bg-card rounded-xl border px-4 py-3 min-h-11 text-left hover:shadow-md transition-all cursor-pointer ${
            filterStatus === 'thisWeek' ? 'ring-2 ring-warning border-warning' : 'border-warning/30'
          }`}
        >
          <p className="text-xs text-muted-foreground">Diese Woche</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{stats.thisWeek}</p>
        </button>
        <button
          onClick={() => setFilterStatus('thisMonth')}
          className={`bg-card rounded-xl border px-4 py-3 min-h-11 text-left hover:shadow-md transition-all cursor-pointer ${
            filterStatus === 'thisMonth' ? 'ring-2 ring-primary border-primary' : 'border-brand-200'
          }`}
        >
          <p className="text-xs text-muted-foreground">Dieser Monat</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{stats.thisMonth}</p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'overdue', 'upcoming'] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === 'overdue' && <AlertTriangleIcon className="h-3.5 w-3.5" />}
                {status === 'upcoming' && <CalendarIcon className="h-3.5 w-3.5" />}
                {status === 'all' ? 'Alle' : status === 'overdue' ? 'Überfällig' : 'Anstehend'}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-muted' : ''}
          >
            <FilterIcon className="h-3.5 w-3.5" />
            Zeitraum
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-col gap-4 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useCustomDateRange"
                checked={useCustomDateRange}
                onChange={(e) => {
                  setUseCustomDateRange(e.target.checked);
                  if (!e.target.checked) { setDateFrom(''); setDateTo(''); }
                }}
                className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
              />
              <label htmlFor="useCustomDateRange" className="text-sm text-muted-foreground cursor-pointer">
                Benutzerdefinierten Zeitraum verwenden
              </label>
            </div>

            {useCustomDateRange ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Von:</label>
                  <input
                    type="date" value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)} max={dateTo || undefined}
                    className="px-3 py-1.5 bg-muted border-0 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground font-medium">Bis:</label>
                  <input
                    type="date" value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)} min={dateFrom || undefined}
                    className="px-3 py-1.5 bg-muted border-0 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Zeitraum:</span>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-muted border-0 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="7">Nächste 7 Tage</option>
                  <option value="30">Nächste 30 Tage</option>
                  <option value="90">Nächste 3 Monate</option>
                  <option value="180">Nächste 6 Monate</option>
                  <option value="365">Nächstes Jahr</option>
                </select>
              </div>
            )}

            {(filterStatus !== 'all' || timeRange !== 30 || useCustomDateRange) && (
              <Button
                variant="ghost" size="sm" className="text-muted-foreground w-fit"
                onClick={() => {
                  setFilterStatus('all'); setTimeRange(30);
                  setUseCustomDateRange(false); setDateFrom(''); setDateTo('');
                }}
              >
                <XIcon className="h-3.5 w-3.5" />
                Zurücksetzen
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Wartungen List */}
      {heaters.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Keine Wartungen gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {filterStatus === 'overdue'
              ? 'Keine überfälligen Wartungen vorhanden.'
              : 'Keine anstehenden Wartungen im gewählten Zeitraum.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayedHeaters.map((heater) => {
              const urgency = getMaintenanceUrgency(heater.nextMaintenance);
              const lastMaintenance = heater.maintenances[0];

              return (
                <div
                  key={heater.id}
                  className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/dashboard/heaters/${heater.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {heater.model}
                        </Link>
                        {getUrgencyBadge(urgency)}
                        {heater.serialNumber && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            SN: {heater.serialNumber}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-3 w-3" />
                            <Link href={`/dashboard/customers/${heater.customer.id}`} className="hover:text-primary transition-colors">
                              {heater.customer.name}
                            </Link>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon className="h-3 w-3" />
                            <span>{heater.customer.street}, {heater.customer.city}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <PhoneIcon className="h-3 w-3" />
                            <a href={`tel:${heater.customer.phone}`} className="hover:text-primary transition-colors">
                              {heater.customer.phone}
                            </a>
                          </div>
                        </div>
                        <div className="space-y-1 text-muted-foreground">
                          <p>
                            <span className="font-medium">Intervall:</span>{' '}
                            {heater.maintenanceInterval} {heater.maintenanceInterval === 1 ? 'Monat' : 'Monate'}
                          </p>
                          {lastMaintenance && (
                            <p>
                              <span className="font-medium">Letzte Wartung:</span>{' '}
                              {format(new Date(lastMaintenance.date), 'dd. MMM yyyy', { locale: de })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(heater.nextMaintenance), 'dd. MMM yyyy', { locale: de })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(heater.nextMaintenance), 'EEEE', { locale: de })}
                      </p>
                      <p className={`text-xs font-medium mt-1 ${urgency === 'overdue' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {getDaysUntil(heater.nextMaintenance)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Link href={`/dashboard/heaters/${heater.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <FlameIcon className="h-3.5 w-3.5" />
                        Heizsystem
                      </Button>
                    </Link>
                    <Link href={`/dashboard/customers/${heater.customer.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <UserIcon className="h-3.5 w-3.5" />
                        Kunde
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setDisplayLimit(displayLimit + 20)}>
                Mehr laden ({heaters.length - displayLimit} weitere)
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            {displayedHeaters.length} von {heaters.length} Wartung{heaters.length !== 1 ? 'en' : ''} angezeigt
          </p>
        </>
      )}
    </div>
  );
}
