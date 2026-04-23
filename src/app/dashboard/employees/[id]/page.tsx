'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Loader2Icon,
  ChevronLeftIcon,
  UserIcon,
  ShieldIcon,
  XCircleIcon,
  CheckCircleIcon,
  MailIcon,
  PhoneIcon,
  AlertTriangleIcon,
  CalendarIcon,
  UsersIcon,
  WrenchIcon,
  ClipboardCheckIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useEmployee, useEmployees, useToggleEmployee, useBulkReassignSystems } from '@/hooks/useEmployees';
import type { EmployeeDetail, AssignedSystemRow } from '@/hooks/useEmployees';

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: employee, isLoading, error } = useEmployee(id);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'OWNER') {
    router.replace('/dashboard');
    return null;
  }

  if (error) {
    return <div className="text-center py-20 text-destructive">Fehler beim Laden des Mitarbeiters</div>;
  }
  if (!employee) {
    return <div className="text-center py-20 text-muted-foreground">Mitarbeiter nicht gefunden</div>;
  }

  return (
    <EmployeeDetailView employee={employee} currentUserId={session?.user?.id ?? ''} />
  );
}

function EmployeeDetailView({ employee, currentUserId }: { employee: EmployeeDetail; currentUserId: string }) {
  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Mitarbeiter
      </Link>
      <EmployeeHeaderCard employee={employee} currentUserId={currentUserId} />
      <EmployeeStatsGrid stats={employee.stats} />
      <AssignedSystemsSection employee={employee} />
      <RecentActivitySection activity={employee.recentActivity} />
    </div>
  );
}

function EmployeeHeaderCard({ employee, currentUserId }: { employee: EmployeeDetail; currentUserId: string }) {
  const toggleMutation = useToggleEmployee();
  const isOwner = employee.role === 'OWNER';
  const isSelf = employee.id === currentUserId;
  const initials = (() => {
    const parts = employee.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0]![0]!.toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  })();

  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 text-primary font-bold text-lg shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold truncate">{employee.name}</h1>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {isOwner ? <ShieldIcon className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
            {isOwner ? 'Inhaber' : 'Techniker'}
          </span>
          {!employee.isActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
              Deaktiviert{employee.deactivatedAt ? ` seit ${format(new Date(employee.deactivatedAt), 'dd. MMM yyyy', { locale: de })}` : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><MailIcon className="h-3.5 w-3.5" />{employee.email}</span>
          {employee.phone && (
            <a href={`tel:${employee.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
              <PhoneIcon className="h-3.5 w-3.5" />{employee.phone}
            </a>
          )}
        </div>
      </div>
      {!isOwner && !isSelf && (
        <Button
          variant={employee.isActive ? 'outline' : 'default'}
          size="sm"
          onClick={() => toggleMutation.mutate({ id: employee.id, isActive: !employee.isActive })}
          disabled={toggleMutation.isPending}
        >
          {toggleMutation.isPending ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : employee.isActive ? (
            <><XCircleIcon className="h-3.5 w-3.5 mr-1.5" />Deaktivieren</>
          ) : (
            <><CheckCircleIcon className="h-3.5 w-3.5 mr-1.5" />Aktivieren</>
          )}
        </Button>
      )}
    </div>
  );
}

function EmployeeStatsGrid({ stats }: { stats: EmployeeDetail['stats'] }) {
  const tiles: Array<{ label: string; value: number; Icon: React.ElementType; tone?: 'overdue' | 'neutral' }> = [
    { label: 'Kunden', value: stats.assignedCustomersCount, Icon: UsersIcon, tone: 'neutral' },
    { label: 'Systeme', value: stats.assignedSystemsCount, Icon: WrenchIcon, tone: 'neutral' },
    { label: 'Überfällig', value: stats.overdueSystemsCount, Icon: AlertTriangleIcon, tone: 'overdue' },
    { label: 'In 30 Tagen', value: stats.dueSoonSystemsCount, Icon: CalendarIcon, tone: 'neutral' },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ label, value, Icon, tone }) => {
          const isOverdueTone = tone === 'overdue' && value > 0;
          return (
            <div
              key={label}
              className={`bg-card rounded-xl border p-5 ${isOverdueTone ? 'border-status-overdue-border bg-status-overdue-bg' : 'border-border'}`}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted mb-3">
                <Icon className={`h-4 w-4 ${isOverdueTone ? 'text-status-overdue-text' : 'text-muted-foreground'}`} />
              </div>
              <p className={`text-2xl font-bold ${isOverdueTone ? 'text-status-overdue-text' : 'text-foreground'}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ClipboardCheckIcon className="h-4 w-4" />
        <span>
          Wartungen durchgeführt (30 Tage): <strong className="text-foreground">{stats.maintenancesLast30Days}</strong>
        </span>
      </div>
    </div>
  );
}

// Placeholder subcomponents — filled in subsequent tasks
function AssignedSystemsSection(_: { employee: EmployeeDetail }) { return null; }
function RecentActivitySection(_: { activity: EmployeeDetail['recentActivity'] }) { return null; }
