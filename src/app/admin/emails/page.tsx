'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminEmails, AdminEmailLog } from '@/hooks/useAdmin';
import { Loader2Icon, ChevronLeftIcon, ChevronRightIcon, CheckCircle2Icon, XCircleIcon, MailIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const EMAIL_TYPES = [
  { value: '', label: 'Alle' },
  { value: 'REMINDER_1_WEEK', label: '1 Woche' },
  { value: 'REMINDER_4_WEEKS', label: '4 Wochen' },
  { value: 'WEEKLY_SUMMARY', label: 'Wochenübersicht' },
  { value: 'OPT_IN_CONFIRMATION', label: 'Opt-in' },
];

export default function AdminEmailsPage() {
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminEmails(type, page);

  const handleType = (value: string) => {
    setType(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">E-Mail Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.pagination.total} E-Mails gesamt` : 'Alle gesendeten E-Mails'}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {EMAIL_TYPES.map((t) => (
          <Button
            key={t.value}
            variant={type === t.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleType(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : !data || data.data.length === 0 ? (
        <Card className="p-10 text-center">
          <MailIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Keine E-Mails gefunden</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Datum</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Typ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kunde</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Benutzer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resend ID</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((log: AdminEmailLog) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.sentAt), 'dd.MM.yy HH:mm', { locale: de })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium">{log.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{log.customer.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <p>{log.customer.user.name}</p>
                      <p>{log.customer.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {log.resendId ? log.resendId.slice(0, 20) + '…' : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {log.error
                        ? <XCircleIcon className="h-4 w-4 text-destructive mx-auto" />
                        : <CheckCircle2Icon className="h-4 w-4 text-success mx-auto" />
                      }
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
