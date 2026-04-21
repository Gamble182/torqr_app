'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { useCustomerSystems, useDeleteCustomerSystem } from '@/hooks/useCustomerSystems';
import type { CustomerSystem } from '@/hooks/useCustomerSystems';
import { useBookings } from '@/hooks/useBookings';
import { useCustomerEmailLogs, getEmailTypeLabel } from '@/hooks/useEmailLogs';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CalendarIcon,
  PlusIcon,
  Loader2Icon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  WrenchIcon,
  InfoIcon,
  BellOffIcon,
  CalendarCheckIcon,
  XCircleIcon,
  SendIcon,
  InboxIcon,
} from 'lucide-react';
import { SystemAssignmentModal } from '@/components/system-form/SystemAssignmentModal';
import { MaintenanceChecklistModal } from '@/components/MaintenanceChecklistModal';
import { SystemChecklistManager } from '@/components/SystemChecklistManager';
import { SYSTEM_TYPE_LABELS } from '@/lib/constants';

const getEmailOptInDisplay = (status: 'NONE' | 'CONFIRMED' | 'UNSUBSCRIBED', hasEmail: boolean) => {
  if (!hasEmail) return null;
  if (status === 'CONFIRMED') return { label: 'E-Mail-Erinnerungen aktiv', color: 'text-success', bg: 'bg-success/10 border-success/20' };
  if (status === 'UNSUBSCRIBED') return { label: 'Abgemeldet', color: 'text-warning-foreground', bg: 'bg-warning/10 border-warning/20' };
  return { label: 'Keine E-Mail-Erinnerungen', color: 'text-muted-foreground', bg: 'bg-muted/50 border-border' };
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const { data: customer, isLoading, error, refetch } = useCustomer(customerId);
  const { data: systems = [], refetch: refetchSystems } = useCustomerSystems({ customerId });
  const { data: bookings } = useBookings(customerId);
  const { data: emailLogs } = useCustomerEmailLogs(customerId);
  const deleteCustomer = useDeleteCustomer();
  const deleteSystem = useDeleteCustomerSystem();

  const [showSystemForm, setShowSystemForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState<CustomerSystem | null>(null);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<CustomerSystem | null>(null);
  const [sendingReminder, setSendingReminder] = useState<Record<string, boolean>>({});

  const handleSendReminder = async (systemId: string, systemLabel: string) => {
    if (!customer?.email) {
      toast.error('Dieser Kunde hat keine E-Mail-Adresse hinterlegt');
      return;
    }
    if (!confirm(`Erinnerung für "${systemLabel}" an ${customer.email} senden?`)) return;

    setSendingReminder((prev) => ({ ...prev, [systemId]: true }));
    try {
      const res = await fetch(`/api/customers/${customerId}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Erinnerungs-E-Mail wurde gesendet');
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch {
      toast.error('Fehler beim Senden der E-Mail');
    } finally {
      setSendingReminder((prev) => ({ ...prev, [systemId]: false }));
    }
  };

  const handleDelete = () => {
    if (!customer) return;
    if (!confirm(`Möchten Sie den Kunden "${customer.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    deleteCustomer.mutate(customerId, {
      onSuccess: () => router.push('/dashboard/customers'),
    });
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getMaintenanceStatus = (nextMaintenance: string | null): 'overdue' | 'upcoming' | 'ok' => {
    if (!nextMaintenance) return 'ok';
    const next = new Date(nextMaintenance);
    const now = new Date();
    if (next < now) return 'overdue';
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    if (next <= thirtyDays) return 'upcoming';
    return 'ok';
  };

  const handleEditSystem = (system: CustomerSystem) => {
    setEditingSystem(system);
    setShowSystemForm(true);
  };

  const handleDeleteSystem = (id: string, label: string) => {
    if (!confirm(`Möchten Sie das System "${label}" wirklich löschen?`)) return;
    deleteSystem.mutate(id, {
      onSuccess: () => { refetch(); refetchSystems(); },
    });
  };

  const maintenanceStats = useMemo(() => {
    if (systems.length === 0) return { overdue: 0, upcoming: 0, ok: 0 };
    return systems.reduce((acc, system) => {
      const status = getMaintenanceStatus(system.nextMaintenance);
      return { ...acc, [status]: acc[status] + 1 };
    }, { overdue: 0, upcoming: 0, ok: 0 });
  }, [systems]);

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
          <p className="text-destructive font-medium mb-1">Fehler beim Laden des Kunden</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Zurück zur Kundenliste
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <CalendarIcon className="h-3.5 w-3.5" />
              Kunde seit {formatDate(customer.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/customers/${customerId}/edit`}>
              <Button variant="outline" size="sm" className="h-9 min-w-11">
                <PencilIcon className="h-3.5 w-3.5" />
                Bearbeiten
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteCustomer.isPending}
              className="h-9 min-w-11 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
            >
              {deleteCustomer.isPending ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <TrashIcon className="h-3.5 w-3.5" />}
              Löschen
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <WrenchIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Systeme</p>
              <p className="text-xl font-bold text-foreground">{systems.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success/10">
              <CheckCircle2Icon className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wartungen OK</p>
              <p className="text-xl font-bold text-foreground">{maintenanceStats.ok}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-warning/10">
              <ClockIcon className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bald fällig</p>
              <p className="text-xl font-bold text-foreground">{maintenanceStats.upcoming}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/10">
              <AlertCircleIcon className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Überfällig</p>
              <p className="text-xl font-bold text-foreground">{maintenanceStats.overdue}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
              Kontaktinformationen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <PhoneIcon className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Telefon</p>
                  <a href={`tel:${customer.phone}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    {customer.phone}
                  </a>
                </div>
              </div>
              {customer.email && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MailIcon className="h-4 w-4 text-primary mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">E-Mail</p>
                    <a href={`mailto:${customer.email}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors break-all">
                      {customer.email}
                    </a>
                    {(() => {
                      const d = getEmailOptInDisplay(customer.emailOptIn, !!customer.email);
                      if (!d) return null;
                      return (
                        <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${d.bg} ${d.color}`}>
                          {customer.emailOptIn === 'CONFIRMED'
                            ? <CheckCircle2Icon className="h-3 w-3" />
                            : <BellOffIcon className="h-3 w-3" />}
                          {d.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 md:col-span-2">
                <MapPinIcon className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Adresse</p>
                  <p className="text-sm font-medium text-foreground">{customer.street}</p>
                  <p className="text-sm font-medium text-foreground">{customer.zipCode} {customer.city}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {customer.notes && (
            <Card className="p-6">
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
                Notizen
              </h2>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
              </div>
            </Card>
          )}

          {/* Systems Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <WrenchIcon className="h-4 w-4 text-muted-foreground" />
                Systeme ({systems.length})
              </h2>
              <Button
                onClick={() => { setEditingSystem(null); setShowSystemForm(true); }}
                size="sm"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Hinzufügen
              </Button>
            </div>

            {systems.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20">
                <WrenchIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Noch keine Systeme</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Fügen Sie das erste System für diesen Kunden hinzu
                </p>
                <Button onClick={() => setShowSystemForm(true)} size="sm">
                  <PlusIcon className="h-3.5 w-3.5" />
                  Erstes System hinzufügen
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {systems.map((system) => {
                  const maintenanceStatus = getMaintenanceStatus(system.nextMaintenance);
                  const systemLabel = `${system.catalog.manufacturer} ${system.catalog.name}`;
                  return (
                    <div key={system.id} className="border border-border rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-foreground">{systemLabel}</h3>
                            <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50 border border-border">
                              {SYSTEM_TYPE_LABELS[system.catalog.systemType] ?? system.catalog.systemType}
                            </span>
                            {maintenanceStatus === 'overdue' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                                <AlertCircleIcon className="h-3 w-3" />
                                Überfällig
                              </span>
                            )}
                            {maintenanceStatus === 'upcoming' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-warning/10 text-warning-foreground border border-warning/20">
                                <ClockIcon className="h-3 w-3" />
                                Bald fällig
                              </span>
                            )}
                            {maintenanceStatus === 'ok' && system.nextMaintenance && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20">
                                <CheckCircle2Icon className="h-3 w-3" />
                                OK
                              </span>
                            )}
                          </div>
                          {system.serialNumber && (
                            <p className="text-xs text-muted-foreground">SN: {system.serialNumber}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => { setSelectedSystem(system); setShowMaintenanceForm(true); }}
                            className="bg-success hover:bg-success/90 text-success-foreground h-9 min-w-11"
                          >
                            <CheckCircle2Icon className="h-3.5 w-3.5" />
                            Erledigt
                          </Button>
                          {customer.email && (
                            <Button
                              variant="outline" size="icon-sm"
                              onClick={() => handleSendReminder(system.id, systemLabel)}
                              disabled={!!sendingReminder[system.id]}
                              title="Erinnerung senden"
                              className="w-9 h-9"
                            >
                              {sendingReminder[system.id]
                                ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                                : <SendIcon className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          <Button variant="outline" size="icon-sm" onClick={() => handleEditSystem(system)} className="w-9 h-9">
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline" size="icon-sm"
                            onClick={() => handleDeleteSystem(system.id, systemLabel)}
                            disabled={deleteSystem.isPending}
                            className="w-9 h-9 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                          >
                            {deleteSystem.isPending ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : <TrashIcon className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {system.installationDate && (
                          <div className="p-2.5 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-0.5">Installiert</p>
                            <p className="text-xs font-semibold text-foreground">{formatDate(system.installationDate)}</p>
                          </div>
                        )}
                        <div className="p-2.5 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-0.5">Intervall</p>
                          <p className="text-xs font-semibold text-foreground">
                            {system.maintenanceInterval} Monat{system.maintenanceInterval > 1 ? 'e' : ''}
                          </p>
                        </div>
                        {system.lastMaintenance && (
                          <div className="p-2.5 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-0.5">Letzte Wartung</p>
                            <p className="text-xs font-semibold text-foreground">{formatDate(system.lastMaintenance)}</p>
                          </div>
                        )}
                        {system.nextMaintenance && (
                          <div className={`p-2.5 rounded-lg ${
                            maintenanceStatus === 'overdue' ? 'bg-destructive/10'
                              : maintenanceStatus === 'upcoming' ? 'bg-warning/10'
                              : 'bg-muted/50'
                          }`}>
                            <p className="text-xs text-muted-foreground mb-0.5">Nächste Wartung</p>
                            <p className={`text-xs font-semibold ${
                              maintenanceStatus === 'overdue' ? 'text-destructive'
                                : maintenanceStatus === 'upcoming' ? 'text-warning-foreground'
                                : 'text-foreground'
                            }`}>
                              {formatDate(system.nextMaintenance)}
                            </p>
                          </div>
                        )}
                      </div>

                      <SystemChecklistManager systemId={system.id} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Cal.com Bookings */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <CalendarCheckIcon className="h-4 w-4 text-muted-foreground" />
                Gebuchte Termine ({bookings?.length || 0})
              </h2>
            </div>

            {(!bookings || bookings.length === 0) ? (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/20">
                <CalendarCheckIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Keine Termine gebucht</p>
                <p className="text-xs text-muted-foreground">
                  Termine erscheinen hier automatisch, sobald der Kunde über Cal.com bucht.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const isPast = new Date(booking.startTime) < new Date();
                  const isCancelled = booking.status === 'CANCELLED';
                  return (
                    <div
                      key={booking.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                        isCancelled
                          ? 'border-border bg-muted/30 opacity-60'
                          : isPast
                          ? 'border-border bg-muted/20'
                          : 'border-primary/20 bg-primary/5'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                        isCancelled ? 'bg-muted' : isPast ? 'bg-muted' : 'bg-primary/10'
                      }`}>
                        {isCancelled
                          ? <XCircleIcon className="h-4 w-4 text-muted-foreground" />
                          : <CalendarCheckIcon className={`h-4 w-4 ${isPast ? 'text-muted-foreground' : 'text-primary'}`} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">
                            {booking.title || 'Termin'}
                          </p>
                          {isCancelled && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                              Storniert
                            </span>
                          )}
                          {!isPast && !isCancelled && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              Bevorstehend
                            </span>
                          )}
                          {isPast && !isCancelled && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                              Vergangen
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="block sm:inline">
                            {new Date(booking.startTime).toLocaleDateString('de-DE', {
                              weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                            })}
                          </span>
                          <span className="sm:inline">{', '}</span>
                          <span className="block sm:inline">
                            {new Date(booking.startTime).toLocaleTimeString('de-DE', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          {booking.endTime && (
                            <> – {new Date(booking.endTime).toLocaleTimeString('de-DE', {
                              hour: '2-digit', minute: '2-digit',
                            })}</>
                          )}
                          {' Uhr'}
                        </p>
                        {booking.attendeeName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Gebucht von: {booking.attendeeName}
                            {booking.attendeeEmail && ` (${booking.attendeeEmail})`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Email Log */}
          {emailLogs && emailLogs.length > 0 && (
            <Card className="p-6">
              <h2 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
                <InboxIcon className="h-4 w-4 text-muted-foreground" />
                E-Mail-Protokoll ({emailLogs.length})
              </h2>
              <div className="space-y-2">
                {emailLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {getEmailTypeLabel(log.type)}
                      </p>
                      {log.error && (
                        <p className="text-xs text-destructive mt-0.5 truncate">Fehler: {log.error}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.sentAt).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.sentAt).toLocaleTimeString('de-DE', {
                          hour: '2-digit', minute: '2-digit',
                        })} Uhr
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
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Übersicht</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Systeme</span>
                <span className="text-sm font-bold text-foreground">{systems.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Letzte Änderung</span>
                <span className="text-xs font-semibold text-foreground">{formatDate(customer.updatedAt)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Erstellt am</span>
                <span className="text-xs font-semibold text-foreground">{formatDate(customer.createdAt)}</span>
              </div>
              {customer.email && (() => {
                const d = getEmailOptInDisplay(customer.emailOptIn, !!customer.email);
                if (!d) return null;
                return (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">E-Mail Status</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${d.bg} ${d.color}`}>
                      {customer.emailOptIn === 'CONFIRMED'
                        ? <CheckCircle2Icon className="h-3 w-3" />
                        : <BellOffIcon className="h-3 w-3" />}
                      {d.label}
                    </span>
                  </div>
                );
              })()}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Schnellaktionen</h2>
            <div className="space-y-3">
              <Link href={`/dashboard/customers/${customerId}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start py-2.5" size="sm">
                  <PencilIcon className="h-3.5 w-3.5" />
                  Kunde bearbeiten
                </Button>
              </Link>
              <Button
                variant="outline" className="w-full justify-start py-2.5" size="sm"
                onClick={() => { setEditingSystem(null); setShowSystemForm(true); }}
              >
                <WrenchIcon className="h-3.5 w-3.5" />
                System hinzufügen
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {showSystemForm && (
        <SystemAssignmentModal
          customerId={customerId}
          system={editingSystem}
          onClose={() => { setShowSystemForm(false); setEditingSystem(null); }}
          onSuccess={() => { setShowSystemForm(false); setEditingSystem(null); refetch(); refetchSystems(); }}
        />
      )}

      {showMaintenanceForm && selectedSystem && (
        <MaintenanceChecklistModal
          systemId={selectedSystem.id}
          systemLabel={`${selectedSystem.catalog.manufacturer} ${selectedSystem.catalog.name}`}
          systemType={selectedSystem.catalog.systemType}
          onClose={() => { setShowMaintenanceForm(false); setSelectedSystem(null); }}
          onSuccess={() => { setShowMaintenanceForm(false); setSelectedSystem(null); refetch(); refetchSystems(); }}
        />
      )}
    </div>
  );
}
