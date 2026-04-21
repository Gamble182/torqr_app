'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminUser } from '@/hooks/useAdmin';
import {
  Loader2Icon, ArrowLeftIcon, UsersIcon, HomeIcon, WrenchIcon,
  MailIcon, CalendarIcon, CheckCircle2Icon, XCircleIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { EMAIL_TYPE_LABELS } from '@/lib/constants';

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: user, isLoading, error } = useAdminUser(id);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (error || !user) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-destructive">{error?.message ?? 'Benutzer nicht gefunden'}</p>
    </div>
  );

  const counts = [
    { label: 'Kunden', value: user._count.customers, icon: UsersIcon },
    { label: 'Heizsysteme', value: user._count.heaters, icon: HomeIcon },
    { label: 'Wartungen', value: user._count.maintenances, icon: WrenchIcon },
    { label: 'Buchungen', value: user._count.bookings, icon: CalendarIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
            <ArrowLeftIcon className="h-3.5 w-3.5 mr-1" />
            Zurück zur Benutzerliste
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        {user.companyName && <p className="text-sm text-muted-foreground">{user.companyName}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {counts.map((c) => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50">
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4">Profil</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Telefon:</span> <span>{user.phone ?? '—'}</span></div>
          <div><span className="text-muted-foreground">Registriert:</span> <span>{format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}</span></div>
          <div>
            <span className="text-muted-foreground">Letzter Login:</span>{' '}
            <span>{user.lastLogin ? format(new Date(user.lastLogin.createdAt), 'dd.MM.yyyy HH:mm', { locale: de }) : '—'}</span>
          </div>
          {user.lastLogin?.ipAddress && (
            <div><span className="text-muted-foreground">IP:</span> <span className="font-mono text-xs">{user.lastLogin.ipAddress}</span></div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4">Kunden ({user._count.customers})</h2>
        {user.customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Kunden</p>
        ) : (
          <div className="space-y-2">
            {user.customers.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.city}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{c._count.heaters} Heizung(en)</span>
                  <Badge variant="outline" className="text-xs">
                    {c.emailOptIn === 'CONFIRMED' ? 'E-Mail aktiv' : c.emailOptIn === 'UNSUBSCRIBED' ? 'Abgemeldet' : 'Kein Opt-in'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <MailIcon className="h-4 w-4 text-muted-foreground" />
          E-Mail Log (letzte 20)
        </h2>
        {user.emailLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine E-Mails gesendet</p>
        ) : (
          <div className="space-y-2">
            {user.emailLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{log.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {EMAIL_TYPE_LABELS[log.type] ?? log.type} · {format(new Date(log.sentAt), 'dd.MM.yy HH:mm', { locale: de })}
                  </p>
                </div>
                {log.error ? (
                  <XCircleIcon className="h-4 w-4 text-destructive shrink-0" />
                ) : (
                  <CheckCircle2Icon className="h-4 w-4 text-success shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
