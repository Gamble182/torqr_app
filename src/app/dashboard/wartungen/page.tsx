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

  // CSV Export Function
  const exportToCSV = () => {
    try {
      // CSV Headers
      const headers = [
        'Heizungsmodell',
        'Seriennummer',
        'Kunde',
        'Straße',
        'Ort',
        'Telefon',
        'Email',
        'Nächste Wartung',
        'Status',
        'Tage bis Wartung',
        'Wartungsintervall (Monate)',
        'Letzte Wartung',
      ];

      // CSV Rows
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
          heater.model,
          heater.serialNumber || '',
          heater.customer.name,
          heater.customer.street,
          heater.customer.city,
          heater.customer.phone,
          heater.customer.email || '',
          format(new Date(heater.nextMaintenance), 'dd.MM.yyyy', { locale: de }),
          status,
          diffDays.toString(),
          heater.maintenanceInterval.toString(),
          lastMaintenance ? format(new Date(lastMaintenance.date), 'dd.MM.yyyy', { locale: de }) : '',
        ];
      });

      // Create CSV content
      const csvContent = [
        headers.join(';'),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
      ].join('\n');

      // Add BOM for Excel compatibility with German characters
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // Download
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

  // PDF Export Function
  const exportToPDF = () => {
    try {
      // Create PDF content as HTML
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Wartungsübersicht</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #01204E; margin-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; font-size: 14px; }
            .stats { display: flex; gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; flex: 1; }
            .stat-card h3 { margin: 0 0 5px 0; font-size: 14px; color: #666; }
            .stat-card .value { font-size: 24px; font-weight: bold; }
            .overdue { color: #F85525; border-color: #F85525; }
            .warning { color: #FAA968; }
            .accent { color: #028391; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #01204E; color: white; padding: 12px; text-align: left; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
            tr:hover { background-color: #f5f5f5; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
            .badge-overdue { background-color: #F85525; color: white; }
            .badge-urgent { background-color: #FAA968; color: white; }
            .badge-soon { background-color: #028391; color: white; }
            .badge-scheduled { background-color: #e0e0e0; color: #666; }
          </style>
        </head>
        <body>
          <h1>Wartungsübersicht</h1>
          <div class="meta">Erstellt am ${format(new Date(), 'dd. MMMM yyyy, HH:mm', { locale: de })} Uhr</div>

          <div class="stats">
            <div class="stat-card">
              <h3>Gesamt</h3>
              <div class="value">${stats.total}</div>
            </div>
            <div class="stat-card overdue">
              <h3>Überfällig</h3>
              <div class="value">${stats.overdue}</div>
            </div>
            <div class="stat-card warning">
              <h3>Diese Woche</h3>
              <div class="value">${stats.thisWeek}</div>
            </div>
            <div class="stat-card accent">
              <h3>Dieser Monat</h3>
              <div class="value">${stats.thisMonth}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Heizung</th>
                <th>Kunde</th>
                <th>Ort</th>
                <th>Telefon</th>
                <th>Nächste Wartung</th>
                <th>Status</th>
                <th>Intervall</th>
              </tr>
            </thead>
            <tbody>
              ${heaters.map((heater) => {
                const urgency = getMaintenanceUrgency(heater.nextMaintenance);
                let badgeClass = 'badge-scheduled';
                let statusText = 'Geplant';

                if (urgency === 'overdue') {
                  badgeClass = 'badge-overdue';
                  statusText = 'Überfällig';
                } else if (urgency === 'urgent') {
                  badgeClass = 'badge-urgent';
                  statusText = 'Diese Woche';
                } else if (urgency === 'soon') {
                  badgeClass = 'badge-soon';
                  statusText = 'Bald fällig';
                }

                return `
                  <tr>
                    <td>
                      <strong>${heater.model}</strong><br>
                      ${heater.serialNumber ? `<small>SN: ${heater.serialNumber}</small>` : ''}
                    </td>
                    <td>${heater.customer.name}</td>
                    <td>${heater.customer.city}</td>
                    <td>${heater.customer.phone}</td>
                    <td>${format(new Date(heater.nextMaintenance), 'dd.MM.yyyy', { locale: de })}</td>
                    <td><span class="badge ${badgeClass}">${statusText}</span></td>
                    <td>${heater.maintenanceInterval} ${heater.maintenanceInterval === 1 ? 'Monat' : 'Monate'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print();
        };

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
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wartungen</h1>
          <p className="mt-2 text-muted-foreground">
            Übersicht aller anstehenden und überfälligen Wartungen
          </p>
        </div>
        {heaters.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
            >
              <DownloadIcon className="h-4 w-4 mr-1" />
              CSV Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
            >
              <FileTextIcon className="h-4 w-4 mr-1" />
              PDF Export
            </Button>
          </div>
        )}
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
