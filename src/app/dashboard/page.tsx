'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2Icon,
  UsersIcon,
  BoltIcon,
  AlertTriangleIcon,
  CalendarIcon,
  FlameIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  WrenchIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useDashboardStats } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState(30);
  const { data: stats, isLoading, error } = useDashboardStats(timeRange);

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
          <p className="text-destructive mb-2">Fehler beim Laden der Statistiken</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const getMaintenanceUrgency = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'urgent';
    if (diffDays <= 14) return 'soon';
    return 'upcoming';
  };

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return 'bg-destructive/10 border-destructive';
      case 'urgent':
        return 'bg-warning/10 border-warning';
      case 'soon':
        return 'bg-accent/10 border-accent';
      default:
        return 'bg-muted/30 border-border';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive text-destructive-foreground">Überfällig</span>;
      case 'urgent':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-warning text-warning-foreground">Diese Woche</span>;
      case 'soon':
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent text-accent-foreground">Bald fällig</span>;
      default:
        return <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Geplant</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Übersicht über Ihre Kunden und anstehende Wartungen
        </p>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Customers */}
          <Link href="/dashboard/customers" className="block bg-card overflow-hidden shadow-sm rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-lg bg-primary p-3">
                    <UsersIcon className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Kunden gesamt
                    </dt>
                    <dd className="text-3xl font-bold text-foreground">
                      {stats?.totalCustomers || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>

          {/* Total Heaters */}
          <Link href="/dashboard/heaters" className="block bg-card overflow-hidden shadow-sm rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-lg bg-secondary p-3">
                    <BoltIcon className="h-6 w-6 text-secondary-foreground" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Heizsysteme gesamt
                    </dt>
                    <dd className="text-3xl font-bold text-foreground">
                      {stats?.totalHeaters || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>

          {/* Overdue Maintenances - Clickable */}
          <Link href="/dashboard/wartungen?status=overdue" className={`block bg-card overflow-hidden shadow-sm rounded-lg border hover:shadow-md transition-shadow cursor-pointer ${(stats?.overdueMaintenances || 0) > 0 ? 'border-destructive' : 'border-border'}`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-lg bg-destructive p-3">
                    <AlertTriangleIcon className="h-6 w-6 text-destructive-foreground" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Überfällige Wartungen
                    </dt>
                    <dd className="text-3xl font-bold text-destructive">
                      {stats?.overdueMaintenances || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>

          {/* Upcoming Maintenances */}
          <div className="bg-card overflow-hidden shadow-sm rounded-lg border border-border hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-lg bg-warning p-3">
                    <CalendarIcon className="h-6 w-6 text-warning-foreground" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Nächste 30 Tage
                    </dt>
                    <dd className="text-3xl font-bold text-foreground">
                      {stats?.upcomingMaintenances || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Maintenances Calendar */}
      <div className="bg-card shadow-sm rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Anstehende Wartungen
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Wartungen in den nächsten {timeRange} Tagen
              </p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="7">7 Tage</option>
              <option value="30">30 Tage</option>
              <option value="90">3 Monate</option>
              <option value="180">6 Monate</option>
            </select>
          </div>
        </div>
        <div className="p-6">
          {stats?.upcomingMaintenancesList && stats.upcomingMaintenancesList.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingMaintenancesList.map((maintenance) => {
                const urgency = getMaintenanceUrgency(maintenance.nextMaintenance);
                return (
                  <Link
                    key={maintenance.id}
                    href={`/dashboard/customers/${maintenance.customer.id}`}
                    className={`block p-4 rounded-lg border-2 transition-all hover:shadow-md ${getUrgencyStyles(urgency)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {maintenance.customer.name}
                          </h3>
                          {getUrgencyBadge(urgency)}
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FlameIcon className="h-4 w-4" />
                            <span>{maintenance.model}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{maintenance.customer.city}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <PhoneIcon className="h-4 w-4" />
                            <a
                              href={`tel:${maintenance.customer.phone}`}
                              className="hover:text-accent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {maintenance.customer.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {format(new Date(maintenance.nextMaintenance), 'dd. MMM yyyy', { locale: de })}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(maintenance.nextMaintenance), 'EEEE', { locale: de })}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Keine anstehenden Wartungen in den nächsten 30 Tagen</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card shadow-sm rounded-lg border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-primary" />
            Letzte Wartungen
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kürzlich durchgeführte Wartungsarbeiten
          </p>
        </div>
        <div className="p-6">
          {stats?.recentMaintenances && stats.recentMaintenances.length > 0 ? (
            <div className="space-y-4">
              {stats.recentMaintenances.map((maintenance) => (
                <Link
                  key={maintenance.id}
                  href={`/dashboard/maintenances/${maintenance.id}`}
                  className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="shrink-0">
                    <div className="rounded-lg bg-secondary/20 p-2">
                      <WrenchIcon className="h-5 w-5 text-secondary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {maintenance.heater.customer.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {maintenance.heater.model}
                    </p>
                    {maintenance.notes && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {maintenance.notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(maintenance.date), 'dd. MMM', { locale: de })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(maintenance.date), 'yyyy', { locale: de })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <WrenchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Noch keine Wartungen durchgeführt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
