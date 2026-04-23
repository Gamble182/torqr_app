'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircleIcon, Loader2Icon, XIcon, XCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useBooking, useCancelBooking } from '@/hooks/useBookings';

interface Props {
  bookingId: string;
  onClose: () => void;
}

export function CancelBookingModal({ bookingId, onClose }: Props) {
  const { data: booking, isLoading } = useBooking(bookingId);
  const cancel = useCancelBooking();

  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasEmail = !!booking?.customer?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setErrorMsg(null);
    try {
      await cancel.mutateAsync({
        bookingId: booking.id,
        notifyCustomer: notifyCustomer && hasEmail,
        reason: reason.trim() || null,
      });
      toast.success('Termin storniert');
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Stornieren fehlgeschlagen');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <XCircleIcon className="h-4 w-4 text-destructive" />
            <h2 className="text-base font-semibold text-foreground">Termin stornieren</h2>
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
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
              <div className="text-xs text-destructive uppercase tracking-wide mb-1">
                Wird storniert
              </div>
              <div className="text-foreground">
                {format(new Date(booking.startTime), 'EEEE, dd. MMMM yyyy', { locale: de })}
              </div>
              <div className="text-muted-foreground">
                {format(new Date(booking.startTime), "HH:mm 'Uhr'", { locale: de })} ·{' '}
                {booking.customer?.name ?? '—'}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Grund (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Dem Kunden mitgeteilter Grund"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyCustomer && hasEmail}
                disabled={!hasEmail}
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
                Zurück
              </Button>
              <Button type="submit" variant="destructive" className="flex-1" disabled={cancel.isPending}>
                {cancel.isPending && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
                Termin stornieren
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
