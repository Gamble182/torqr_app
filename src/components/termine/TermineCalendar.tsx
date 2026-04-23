'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from 'lucide-react';
import { useBookings, type BookingListFilters, type Booking } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';

interface TermineCalendarProps {
  filters: BookingListFilters;
  onOpenDetails: (id: string) => void;
}

const WEEKDAY_HEADERS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function TermineCalendar({ filters, onOpenDetails }: TermineCalendarProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  const monthFilters: BookingListFilters = useMemo(
    () => ({
      ...filters,
      range: 'all',
      from: gridStart.toISOString(),
      to: gridEnd.toISOString(),
      limit: 500,
    }),
    [filters, gridStart, gridEnd]
  );

  const { data: bookings = [], isLoading } = useBookings(monthFilters);

  const bookingsByDay = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of bookings) {
      const key = format(new Date(b.startTime), 'yyyy-MM-dd');
      const arr = m.get(key) ?? [];
      arr.push(b);
      m.set(key, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }
    return m;
  }, [bookings]);

  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted"
            onClick={() => setCursor(subMonths(cursor, 1))}
            aria-label="Vorheriger Monat"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold text-foreground min-w-[160px] text-center">
            {format(cursor, 'MMMM yyyy', { locale: de })}
          </div>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:bg-muted"
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="Nächster Monat"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
          Heute
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_HEADERS.map((wd) => (
          <div key={wd} className="p-2 text-xs font-medium text-muted-foreground text-center">
            {wd}
          </div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-7 divide-x divide-y divide-border">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayBookings = bookingsByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const past = day < new Date() && !isSameDay(day, new Date());
            const expanded = expandedDay === key;

            return (
              <div
                key={key}
                className={`min-h-[100px] p-1.5 transition-colors ${
                  inMonth ? 'bg-card' : 'bg-muted/30'
                } ${past ? 'opacity-70' : ''} ${
                  isToday(day) ? 'ring-2 ring-primary ring-inset' : ''
                }`}
                onClick={() => setExpandedDay(expanded ? null : key)}
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {(expanded ? dayBookings : dayBookings.slice(0, 3)).map((b) => {
                    const sysLabel = b.system
                      ? b.system.catalog.manufacturer
                      : '';
                    return (
                      <button
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(b.id);
                        }}
                        className={`w-full text-left text-[11px] px-1.5 py-0.5 rounded truncate ${
                          b.status === 'CANCELLED'
                            ? 'bg-status-overdue-bg text-status-overdue-text line-through'
                            : b.status === 'RESCHEDULED'
                            ? 'bg-status-info-bg text-status-info-text'
                            : 'bg-status-ok-bg text-success'
                        }`}
                        title={`${format(new Date(b.startTime), 'HH:mm')} · ${b.customer?.name ?? b.attendeeName ?? ''}`}
                      >
                        {format(new Date(b.startTime), 'HH:mm')} · {b.customer?.name ?? sysLabel}
                      </button>
                    );
                  })}
                  {!expanded && dayBookings.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      + {dayBookings.length - 3} weitere
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
