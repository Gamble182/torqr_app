'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminCrons, AdminCronRun } from '@/hooks/useAdmin';
import { Loader2Icon, ChevronLeftIcon, ChevronRightIcon, ActivityIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') return <Badge className="bg-success/10 text-success border-success/20 text-xs">Erfolgreich</Badge>;
  if (status === 'FAILED') return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Fehler</Badge>;
  return <Badge className="bg-warning/10 text-warning-foreground border-warning/20 text-xs">Läuft</Badge>;
}

export default function AdminCronsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminCrons(page);

  const running = data?.data.filter((r) => r.status === 'RUNNING') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cron Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.pagination.total} Läufe gesamt` : 'Alle Cron-Läufe'}
        </p>
      </div>

      {running.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <p className="text-sm font-semibold text-warning-foreground flex items-center gap-2">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            {running.length} Job(s) laufen aktuell
          </p>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : !data || data.data.length === 0 ? (
        <Card className="p-10 text-center">
          <ActivityIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Keine Cron-Läufe gefunden</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gestartet</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Abgeschlossen</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-Mails</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fehler</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((run: AdminCronRun) => (
                  <tr key={run.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{run.jobType}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(run.startedAt), 'dd.MM.yy HH:mm', { locale: de })}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {run.completedAt ? format(new Date(run.completedAt), 'dd.MM.yy HH:mm', { locale: de }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{run.emailsSent}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={run.status} /></td>
                    <td className="px-4 py-3 text-xs text-destructive max-w-xs truncate">
                      {run.errors ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Seite {data.pagination.page} von {data.pagination.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages}>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
