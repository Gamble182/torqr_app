'use client';

import Link from 'next/link';
import {
  XIcon,
  Loader2Icon,
  GlobeIcon,
  WrenchIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/hooks/useBookings';

interface Props {
  bookingId: string;
  isOwner: boolean;
  onClose: () => void;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
}

export function BookingDetailsDrawer({
  bookingId,
  isOwner,
  onClose,
  onReschedule,
  onCancel,
}: Props) {
  const { data: booking, isLoading, error } = useBooking(bookingId);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <aside
        className="w-full sm:max-w-md bg-background border-l border-border h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Termin-Details</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Schließen"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error || !booking ? (
          <div className="p-6 text-sm text-destructive">
            {error?.message || 'Termin nicht gefunden'}
          </div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Termin */}
            <section>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Termin</h3>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {format(new Date(booking.startTime), 'EEEE, dd. MMMM yyyy', { locale: de })} ·{' '}
                {format(new Date(booking.startTime), "HH:mm 'Uhr'", { locale: de })}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Status: {booking.status === 'CONFIRMED' ? 'Bestätigt' : booking.status === 'RESCHEDULED' ? 'Verschoben' : 'Storniert'}
              </div>
              {booking.rescheduledFromUid && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Verschoben von Termin <code className="font-mono">{booking.rescheduledFromUid.slice(0, 8)}</code>
                  {booking.rescheduledAt && ` am ${format(new Date(booking.rescheduledAt), 'dd.MM.yyyy')}`}
                </div>
              )}
              {booking.status === 'CANCELLED' && booking.cancelledAt && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Storniert am {format(new Date(booking.cancelledAt), 'dd.MM.yyyy')}
                  {booking.cancelReason && ` · Grund: ${booking.cancelReason}`}
                </div>
              )}
            </section>

            {/* Kunde */}
            {booking.customer && (
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Kunde</h3>
                <Link
                  href={`/dashboard/customers/${booking.customer.id}`}
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  {booking.customer.name}
                </Link>
                {booking.customer.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <PhoneIcon className="h-3.5 w-3.5" />
                    <a href={`tel:${booking.customer.phone}`} className="hover:text-foreground">
                      {booking.customer.phone}
                    </a>
                  </div>
                )}
                {booking.customer.email && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MailIcon className="h-3.5 w-3.5" />
                    <a href={`mailto:${booking.customer.email}`} className="hover:text-foreground">
                      {booking.customer.email}
                    </a>
                  </div>
                )}
              </section>
            )}

            {/* System */}
            {booking.system && (
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Anlage</h3>
                <div className="text-sm text-foreground">
                  {[booking.system.catalog.manufacturer, booking.system.catalog.name].filter(Boolean).join(' ')}
                </div>
                {booking.system.serialNumber && (
                  <div className="text-xs text-muted-foreground">
                    Serien-Nr.: {booking.system.serialNumber}
                  </div>
                )}
              </section>
            )}

            {/* Assignee */}
            {isOwner && (
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Zugewiesen</h3>
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  {booking.assignedTo?.name ?? 'Nicht zugewiesen'}
                </div>
              </section>
            )}

            {/* Source */}
            <section>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Quelle</h3>
              <div className="flex items-center gap-2 text-sm">
                {booking.triggerEvent === 'BOOKING_MANUAL' ? (
                  <>
                    <WrenchIcon className="h-4 w-4 text-muted-foreground" />
                    Manuell eingetragen
                  </>
                ) : (
                  <>
                    <GlobeIcon className="h-4 w-4 text-primary" />
                    Cal.com
                  </>
                )}
              </div>
            </section>

            {/* Actions */}
            {booking.status === 'CONFIRMED' && (
              <div className="space-y-2 pt-3 border-t border-border">
                {booking.system && (
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={`/dashboard/termine/${booking.id}/packliste`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Packliste drucken
                    </a>
                  </Button>
                )}
                <div className="flex gap-2">
                  {isOwner && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => onReschedule(booking.id)}
                    >
                      Umplanen
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => onCancel(booking.id)}
                  >
                    Stornieren
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
