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

// Placeholder subcomponents — filled in subsequent tasks
function EmployeeHeaderCard(_: { employee: EmployeeDetail; currentUserId: string }) { return null; }
function EmployeeStatsGrid(_: { stats: EmployeeDetail['stats'] }) { return null; }
function AssignedSystemsSection(_: { employee: EmployeeDetail }) { return null; }
function RecentActivitySection(_: { activity: EmployeeDetail['recentActivity'] }) { return null; }
