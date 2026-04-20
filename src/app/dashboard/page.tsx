'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2Icon,
  UsersIcon,
  WrenchIcon,
  AlertTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useDashboardStats } from '@/hooks/useDashboard';
import { MaintenanceFormModal } from '@/components/MaintenanceFormModal';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState(30);
  const { data: stats, isLoading, error, refetch } = useDashboardStats(timeRange);
  const [selectedSystem, setSelectedSystem] = useState<{ id: string; label: string } | null>(null);

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
          <p className="text-destructive font-medium mb-1">Fehler beim Laden</p>
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
      case 'overdue': return 'border-l-destructive bg-destructive/5';
      case 'urgent': return 'border-l-warning bg-warning/5';
      case 'soon': return 'border-l-secondary bg-secondary/5';
      default: return 'border-l-border bg-card';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      overdue: 'bg-destructive/10 text-destructive border-destructive/20',
      urgent: 'bg-warning/10 text-warning-foreground border-warning/20',
      soon: 'bg-secondary/10 text-secondary border-secondary/20',
      upcoming: 'bg-muted text-muted-foreground border-border',
    };
    const labels: Record<string, string> = {
      overdue: 'Überfällig',
      urgent: 'Diese Woche',
      soon: 'Bald fällig',
      upcoming: 'Geplant',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${styles[urgency]}`}>
        {labels[urgency]}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Übersicht über Ihre Kunden und anstehende Wartungen
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/customers"
          className="group bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/20 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <UsersIcon className="h-4.5 w-4.5 text-primary" />
            </div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats?.totalCustomers || 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Kunden gesamt</p>
        </Link>

        <Link
          href="/dashboard/systems"
          className="group bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-secondary/20 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/10">
              <WrenchIcon className="h-4.5 w-4.5 text-secondary" />
            </div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats?.totalSystems || 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Systeme</p>
        </Link>

        <Link
          href="/dashboard/wartungen?status=overdue"
          className={`group bg-card rounded-xl border p-5 hover:shadow-md transition-all ${
            (stats?.overdueMaintenances || 0) > 0
              ? 'border-destructive/30 hover:border-destructive/50'
              : 'border-border hover:border-destructive/20'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/10">
              <AlertTriangleIcon className="h-4.5 w-4.5 text-destructive" />
            </div>
            <ArrowRightIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className={`text-2xl font-bold ${(stats?.overdueMaintenances || 0) > 0 ? 'text-destructive' : 'text-foreground'}`}>
            {stats?.overdueMaintenances || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Überfällig</p>
        </Link>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-warning/10">
              <CalendarIcon className="h-4.5 w-4.5 text-warning" />
            </div>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats?.upcomingMaintenances || 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Nächste 30 Tage</p>
        </div>
      </div>

      {/* Upcoming Maintenances */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Anstehende Wartungen</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nächste {timeRange} Tage
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-1.5 bg-muted border-0 rounded-lg text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring h-10"
          >
            <option value="7">7 Tage</option>
            <option value="30">30 Tage</option>
            <option value="90">3 Monate</option>
            <option value="180">6 Monate</option>
          </select>
        </div>
        <div className="p-4">
          {stats?.upcomingSystemsList && stats.upcomingSystemsList.length > 0 ? (
            <div className="space-y-2">
              {stats.upcomingSystemsList.map((system) => {
                const urgency = getMaintenanceUrgency(system.nextMaintenance);
                const systemLabel = `${system.catalog.manufacturer} ${system.catalog.name}`;
                return (
                  <div
                    key={system.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-l-[3px] border border-border transition-all hover:shadow-sm cursor-pointer ${getUrgencyStyles(urgency)}`}
                    onClick={() => router.push(`/dashboard/customers/${system.customer.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {system.customer.name}
                        </h3>
                        {getUrgencyBadge(urgency)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <WrenchIcon className="h-3 w-3" />
                          {systemLabel}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPinIcon className="h-3 w-3" />
                          {system.customer.city}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <PhoneIcon className="h-3 w-3" />
                          <a
                            href={`tel:${system.customer.phone}`}
                            className="hover:text-secondary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {system.customer.phone}
                          </a>
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(system.nextMaintenance), 'dd. MMM yyyy', { locale: de })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(system.nextMaintenance), 'EEEE', { locale: de })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSystem({ id: system.id, label: systemLabel });
                        }}
                        className="bg-success hover:bg-success/90 text-success-foreground shrink-0 h-10 min-w-11"
                      >
                        <CheckCircle2Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Erledigt</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Keine anstehenden Wartungen</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Letzte Wartungen</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kürzlich durchgeführte Arbeiten
          </p>
        </div>
        <div className="p-4">
          {stats?.recentMaintenances && stats.recentMaintenances.length > 0 ? (
            <div className="space-y-1">
              {stats.recentMaintenances.map((maintenance) => (
                <Link
                  key={maintenance.id}
                  href={`/dashboard/systems/${maintenance.system.catalog.id ?? ''}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10 shrink-0">
                    <WrenchIcon className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {maintenance.system.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {maintenance.system.catalog.manufacturer} {maintenance.system.catalog.name}
                      {maintenance.notes && ` — ${maintenance.notes}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-foreground">
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
              <WrenchIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Noch keine Wartungen durchgeführt</p>
            </div>
          )}
        </div>
      </div>

      {selectedSystem && (
        <MaintenanceFormModal
          systemId={selectedSystem.id}
          systemLabel={selectedSystem.label}
          onClose={() => setSelectedSystem(null)}
          onSuccess={() => {
            setSelectedSystem(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
