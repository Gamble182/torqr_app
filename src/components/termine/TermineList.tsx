'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MoreHorizontalIcon,
  GlobeIcon,
  WrenchIcon,
  CalendarIcon,
  UserIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Booking } from '@/hooks/useBookings';

interface TermineListProps {
  bookings: Booking[];
  isOwner: boolean;
  onOpenDetails: (id: string) => void;
  onReschedule: (id: string) => void;
  onCancel: (id: string) => void;
}

function isManual(b: Booking) {
  return b.triggerEvent === 'BOOKING_MANUAL';
}

function statusBadge(status: Booking['status']) {
  switch (status) {
    case 'CONFIRMED':
      return <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-status-ok-bg text-success border border-success/30">Bestätigt</span>;
    case 'RESCHEDULED':
      return <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-status-info-bg text-status-info-text border border-status-info-border">Verschoben</span>;
    case 'CANCELLED':
      return <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-status-overdue-bg text-status-overdue-text border border-status-overdue-border">Storniert</span>;
  }
}

export function TermineList({
  bookings,
  isOwner,
  onOpenDetails,
  onReschedule,
  onCancel,
}: TermineListProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-lg">
        <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">Keine Termine mit diesen Filtern.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {bookings.map((b) => {
        const systemLabel = b.system
          ? [b.system.catalog.manufacturer, b.system.catalog.name].filter(Boolean).join(' ')
          : '–';
        const isPast = new Date(b.startTime) < new Date();

        return (
          <div
            key={b.id}
            className={`flex items-center gap-3 p-3 lg:p-4 hover:bg-muted/40 cursor-pointer transition-colors ${isPast ? 'opacity-70' : ''}`}
            onClick={() => onOpenDetails(b.id)}
          >
            {/* Source icon */}
            <div className="shrink-0" title={isManual(b) ? 'Manuell' : 'Cal.com'}>
              {isManual(b) ? (
                <WrenchIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <GlobeIcon className="h-4 w-4 text-primary" />
              )}
            </div>

            {/* Date/time */}
            <div className="shrink-0 w-36 lg:w-44">
              <div className="text-sm font-medium text-foreground">
                {format(new Date(b.startTime), 'EE, dd.MM.yyyy', { locale: de })}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(b.startTime), "HH:mm 'Uhr'", { locale: de })}
              </div>
            </div>

            {/* Customer */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {b.customer?.name ?? b.attendeeName ?? 'Unbekannt'}
              </div>
              <div className="text-xs text-muted-foreground truncate">{systemLabel}</div>
            </div>

            {/* Assignee (desktop/OWNER only) */}
            {isOwner && (
              <div className="hidden lg:flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground w-32">
                <UserIcon className="h-3.5 w-3.5" />
                <span className="truncate">{b.assignedTo?.name ?? '–'}</span>
              </div>
            )}

            {/* Status */}
            <div className="shrink-0 hidden sm:block">{statusBadge(b.status)}</div>

            {/* Actions */}
            <div
              className="relative shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === b.id ? null : b.id);
              }}
            >
              <button
                className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Aktionen"
              >
                <MoreHorizontalIcon className="h-4 w-4" />
              </button>
              {openMenu === b.id && (
                <div className="absolute right-0 mt-1 w-52 rounded-lg border border-border bg-popover shadow-lg z-10 py-1">
                  <button
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(null);
                      onOpenDetails(b.id);
                    }}
                  >
                    Details
                  </button>
                  {b.status === 'CONFIRMED' && isOwner && (
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(null);
                        onReschedule(b.id);
                      }}
                    >
                      Umplanen
                    </button>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(null);
                        onCancel(b.id);
                      }}
                    >
                      Stornieren
                    </button>
                  )}
                  {b.customer && (
                    <>
                      <div className="my-1 border-t border-border" />
                      <Link
                        href={`/dashboard/customers/${b.customer.id}`}
                        className="block px-3 py-1.5 text-sm hover:bg-muted"
                      >
                        Zum Kunden
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
