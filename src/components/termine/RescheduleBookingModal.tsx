'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarIcon, Loader2Icon, XIcon, AlertCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useBooking, useRescheduleBooking } from '@/hooks/useBookings';

interface Props {
  bookingId: string;
  onClose: () => void;
}

export function RescheduleBookingModal({ bookingId, onClose }: Props) {
  const { data: booking, isLoading } = useBooking(bookingId);
  const reschedule = useRescheduleBooking();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [duration, setDuration] = useState('60');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isManual = booking?.triggerEvent === 'BOOKING_MANUAL';
  const hasEmail = !!booking?.customer?.email;
  const unsubscribed = false; // customer emailOptIn is not included on the booking drawer; check in API. Use API truth.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !booking) return;
    setErrorMsg(null);
    try {
      const startTime = new Date(`${date}T${time}:00`).toISOString();
      const endTime = isManual
        ? new Date(
            new Date(`${date}T${time}:00`).getTime() + parseInt(duration, 10) * 60 * 1000
          ).toISOString()
        : undefined;

      await reschedule.mutateAsync({
        bookingId: booking.id,
        startTime,
        endTime,
        notifyCustomer: notifyCustomer && hasEmail,
        reason: reason.trim() || null,
      });
      toast.success('Termin verschoben');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Verschieben fehlgeschlagen');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Termin verschieben</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {isLoading || !booking ? (
          <div className="flex items-center justify-center h-32">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Aktueller Termin
              </div>
              <div className="text-foreground">
                {format(new Date(booking.startTime), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </div>
              <div className="text-muted-foreground">
                {format(new Date(booking.startTime), "HH:mm 'Uhr'", { locale: de })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Neues Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-base bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className={`grid ${isManual ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Uhrzeit</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-base bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {isManual && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Dauer</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 text-base bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="30">30 Min.</option>
                    <option value="60">1 Stunde</option>
                    <option value="90">1,5 Stunden</option>
                    <option value="120">2 Stunden</option>
                    <option value="180">3 Stunden</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Grund (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Dem Kunden mitgeteilter Grund"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyCustomer && hasEmail && !unsubscribed}
                disabled={!hasEmail || unsubscribed}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Kunden per E-Mail benachrichtigen
                {!hasEmail && (
                  <span className="block text-xs text-muted-foreground">
                    Kein E-Mail-Kontakt hinterlegt — Benachrichtigung nicht möglich.
                  </span>
                )}
              </span>
            </label>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
                <AlertCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1" disabled={reschedule.isPending || !date}>
                {reschedule.isPending && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
                Termin verschieben
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
