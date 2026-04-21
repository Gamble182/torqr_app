'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarIcon, Loader2Icon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingFormModalProps {
  systemId: string;
  systemLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingFormModal({ systemId, systemLabel, onClose, onSuccess }: BookingFormModalProps) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [duration, setDuration] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    setIsSubmitting(true);
    try {
      const startTime = new Date(`${date}T${time}:00`).toISOString();
      const endTime = new Date(
        new Date(`${date}T${time}:00`).getTime() + parseInt(duration) * 60 * 1000
      ).toISOString();

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemId, startTime, endTime }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Speichern');

      await queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      await queryClient.invalidateQueries({ queryKey: ['customer-system', systemId] });
      toast.success('Termin erfolgreich eingetragen');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Termin eintragen</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* System label */}
        <div className="px-6 pt-4">
          <p className="text-sm text-muted-foreground">
            Anlage: <span className="font-medium text-foreground">{systemLabel}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 text-base bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || !date}>
              {isSubmitting && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
              Termin speichern
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
