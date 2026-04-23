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

function AssignedSystemsSection({ employee }: { employee: EmployeeDetail }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reassignOpen, setReassignOpen] = useState<{ systemIds: string[] } | null>(null);

  const totalSystems = employee.assignedSystems.reduce((n, g) => n + g.systems.length, 0);
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (employee.assignedSystems.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Noch keine Kunden zugewiesen.</p>
        <Link
          href="/dashboard/systems?assignee=unassigned"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          Nicht zugewiesene Systeme anzeigen →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Zugewiesene Systeme ({totalSystems})</h2>
      </div>
      <div className="p-4 space-y-5">
        {employee.assignedSystems.map((group) => (
          <div key={group.customer.id}>
            <div className="flex items-center justify-between mb-2 px-1">
              <Link
                href={`/dashboard/customers/${group.customer.id}`}
                className="text-sm font-semibold hover:underline"
              >
                {group.customer.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {group.customer.city} · {group.systems.length} {group.systems.length === 1 ? 'System' : 'Systeme'}
              </span>
            </div>
            <div className="space-y-1.5">
              {group.systems.map((s) => (
                <AssignedSystemRowItem
                  key={s.id}
                  row={s}
                  selected={selectedIds.has(s.id)}
                  onToggle={() => toggleSelect(s.id)}
                  onReassign={() => setReassignOpen({ systemIds: [s.id] })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {selectedIds.size > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 px-6 py-3 border-t border-border bg-card/95 backdrop-blur rounded-b-xl">
          <span className="text-sm">{selectedIds.size} ausgewählt</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              Abbrechen
            </Button>
            <Button size="sm" onClick={() => setReassignOpen({ systemIds: Array.from(selectedIds) })}>
              Zuweisen an …
            </Button>
          </div>
        </div>
      )}
      {reassignOpen && (
        <ReassignModal
          systemIds={reassignOpen.systemIds}
          currentAssigneeId={employee.id}
          onClose={() => {
            setReassignOpen(null);
            setSelectedIds(new Set());
          }}
        />
      )}
    </div>
  );
}

function AssignedSystemRowItem({
  row,
  selected,
  onToggle,
  onReassign,
}: {
  row: AssignedSystemRow;
  selected: boolean;
  onToggle: () => void;
  onReassign: () => void;
}) {
  const statusStyles: Record<AssignedSystemRow['status'], string> = {
    overdue: 'bg-status-overdue-bg text-status-overdue-text border-status-overdue-border',
    'due-soon': 'bg-status-due-bg text-status-due-text border-status-due-border',
    ok: 'bg-muted text-muted-foreground border-border',
    scheduled: 'bg-status-ok-bg text-status-ok-text border-status-ok-border',
  };
  const statusLabels: Record<AssignedSystemRow['status'], string> = {
    overdue: 'Überfällig',
    'due-soon': 'Bald fällig',
    ok: 'OK',
    scheduled: 'Terminiert',
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:shadow-sm transition-all">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="h-4 w-4 rounded border-input"
        aria-label="System auswählen"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/systems/${row.id}`} className="text-sm font-medium hover:underline truncate">
            {row.label}
          </Link>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${statusStyles[row.status]}`}>
            {statusLabels[row.status]}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {row.bookedAt
            ? `Termin: ${format(new Date(row.bookedAt), 'dd. MMM yyyy, HH:mm', { locale: de })} Uhr`
            : row.nextMaintenance
              ? `Nächste Wartung: ${format(new Date(row.nextMaintenance), 'dd. MMM yyyy', { locale: de })}`
              : 'Keine Wartung geplant'}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onReassign}>
        Zuweisung ändern
      </Button>
    </div>
  );
}

function ReassignModal({
  systemIds,
  currentAssigneeId,
  onClose,
}: {
  systemIds: string[];
  currentAssigneeId: string;
  onClose: () => void;
}) {
  const { data: employees = [] } = useEmployees();
  const bulkReassign = useBulkReassignSystems();
  const [target, setTarget] = useState<string>('');

  const eligible = employees
    .filter((e) => e.isActive && e.id !== currentAssigneeId)
    .sort((a, b) => {
      if (a.role === 'OWNER' && b.role !== 'OWNER') return -1;
      if (b.role === 'OWNER' && a.role !== 'OWNER') return 1;
      return a.name.localeCompare(b.name);
    });

  const handleConfirm = async () => {
    if (!target) return;
    const assignedToUserId = target === 'unassigned' ? null : target;
    await bulkReassign.mutateAsync({ systemIds, assignedToUserId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-md mx-4 space-y-4">
        <h3 className="text-lg font-semibold">
          {systemIds.length === 1 ? 'System neu zuweisen' : `${systemIds.length} Systeme neu zuweisen`}
        </h3>
        <div>
          <label htmlFor="reassign-target" className="block text-sm font-medium mb-1.5">
            Zuweisen an
          </label>
          <select
            id="reassign-target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10"
          >
            <option value="">Bitte auswählen …</option>
            <option value="unassigned">Nicht zugewiesen</option>
            {eligible.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{e.role === 'OWNER' ? ' (Inhaber)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={bulkReassign.isPending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleConfirm}
            disabled={!target || bulkReassign.isPending}
          >
            {bulkReassign.isPending ? (
              <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Zuweisen
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecentActivitySection({ activity }: { activity: EmployeeDetail['recentActivity'] }) {
  if (activity.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Keine Wartungen in den letzten 30 Tagen.</p>
      </div>
    );
  }
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold">Letzte Aktivität</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Die letzten 10 Wartungen dieses Mitarbeiters</p>
      </div>
      <div className="p-4 space-y-1">
        {activity.map((m) => (
          <Link
            key={m.id}
            href={`/dashboard/systems/${m.system.id}`}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 shrink-0">
              <WrenchIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.customer.name}</p>
              <p className="text-xs text-muted-foreground truncate">{m.system.label}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-foreground">
                {format(new Date(m.date), 'dd. MMM', { locale: de })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(m.date), 'yyyy', { locale: de })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
