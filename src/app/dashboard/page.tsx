'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2Icon, UsersIcon, BoltIcon, AlertTriangleIcon, CalendarIcon } from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  totalHeaters: number;
  overdueMaintenances: number;
  upcomingMaintenances: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const result = await response.json();

        if (result.success) {
          setStats(result.data);
        } else {
          toast.error(`Fehler: ${result.error}`);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        toast.error('Fehler beim Laden der Statistiken');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <div className="bg-card overflow-hidden shadow-sm rounded-lg border border-border hover:shadow-md transition-shadow">
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
                      Heizungen gesamt
                    </dt>
                    <dd className="text-3xl font-bold text-foreground">
                      {stats?.totalHeaters || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Maintenances */}
          <div className={`bg-card overflow-hidden shadow-sm rounded-lg border hover:shadow-md transition-shadow ${(stats?.overdueMaintenances || 0) > 0 ? 'border-destructive' : 'border-border'}`}>
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
          </div>

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
    </div>
  );
}
