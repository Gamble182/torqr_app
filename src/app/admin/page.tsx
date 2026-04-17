'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminStats } from '@/hooks/useAdmin';
import { Loader2Icon, UsersIcon, HomeIcon, WrenchIcon, MailIcon, CheckCircle2Icon, XCircleIcon, ActivityIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') return <Badge className="bg-success/10 text-success border-success/20">Erfolgreich</Badge>;
  if (status === 'FAILED') return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Fehler</Badge>;
  return <Badge className="bg-warning/10 text-warning-foreground border-warning/20">Läuft</Badge>;
}

export default function AdminOverviewPage() {
  const { data, isLoading, error } = useAdminStats();

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-destructive">{error.message === 'Forbidden' ? 'Kein Zugriff' : 'Fehler beim Laden'}</p>
    </div>
  );

  if (!data) return null;

  const stats = [
    { label: 'Benutzer', value: data.totalUsers, icon: UsersIcon },
    { label: 'Kunden', value: data.totalCustomers, icon: UsersIcon },
    { label: 'Heizsysteme', value: data.totalHeaters, icon: HomeIcon },
    { label: 'Wartungen', value: data.totalMaintenances, icon: WrenchIcon },
    { label: 'E-Mails (7 Tage)', value: data.emailsLast7Days, icon: MailIcon },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System-Übersicht</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-weite Statistiken und System-Status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          Letzter Cron-Lauf
        </h2>
        {data.lastCronRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Cron-Läufe</p>
        ) : (
          <div className="space-y-3">
            {data.lastCronRuns.map((run) => (
              <div key={run.jobType} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{run.jobType}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(run.startedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{run.emailsSent} E-Mails</span>
                  <StatusBadge status={run.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {(data.recentEmailErrors.length > 0 || data.recentCronErrors.length > 0) && (
        <Card className="p-6 border-destructive/20">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2 text-destructive">
            <XCircleIcon className="h-4 w-4" />
            Aktuelle Fehler (7 Tage)
          </h2>
          <div className="space-y-2">
            {data.recentEmailErrors.map((e) => (
              <div key={e.id} className="text-xs p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <span className="font-medium">[Email/{e.type}]</span>{' '}
                {format(new Date(e.sentAt), 'dd.MM. HH:mm')} — {e.error}
              </div>
            ))}
            {data.recentCronErrors.map((c) => (
              <div key={c.id} className="text-xs p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <span className="font-medium">[Cron/{c.jobType}]</span>{' '}
                {format(new Date(c.startedAt), 'dd.MM. HH:mm')} — {c.errors}
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.recentEmailErrors.length === 0 && data.recentCronErrors.length === 0 && (
        <Card className="p-4 border-success/20 bg-success/5">
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle2Icon className="h-4 w-4" />
            Keine Fehler in den letzten 7 Tagen
          </div>
        </Card>
      )}
    </div>
  );
}
