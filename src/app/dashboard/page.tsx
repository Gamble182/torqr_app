'use client';

import { useEffect, useState } from 'react';
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
        <Loader2Icon className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Willkommen bei Torqr. Ihr Kundenverwaltungs-Dashboard.
      </p>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Customers */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-blue-500 p-3">
                    <UsersIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Kunden gesamt
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.totalCustomers || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Heaters */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-green-500 p-3">
                    <BoltIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Heizungen gesamt
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.totalHeaters || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Maintenances */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-red-500 p-3">
                    <AlertTriangleIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Überfällige Wartungen
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
                      {stats?.overdueMaintenances || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Maintenances */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-amber-500 p-3">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Anstehende Wartungen
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900">
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
