'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  CalendarIcon,
  ListIcon,
  PlusIcon,
  Loader2Icon,
  GlobeIcon,
  WrenchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBookings, type BookingListFilters } from '@/hooks/useBookings';
import { TermineFilters } from '@/components/termine/TermineFilters';
import { TermineList } from '@/components/termine/TermineList';
import { TermineCalendar } from '@/components/termine/TermineCalendar';
import { BookingDetailsDrawer } from '@/components/termine/BookingDetailsDrawer';
import { RescheduleBookingModal } from '@/components/termine/RescheduleBookingModal';
import { CancelBookingModal } from '@/components/termine/CancelBookingModal';

type View = 'list' | 'calendar';

function parseFilters(sp: URLSearchParams): BookingListFilters {
  const statusAll = sp.getAll('status');
  return {
    range: (sp.get('range') as BookingListFilters['range']) ?? 'upcoming',
    status: statusAll.length > 0 ? (statusAll as BookingListFilters['status']) : undefined,
    assignee: sp.get('assignee') ?? undefined,
    customerId: sp.get('customerId') ?? undefined,
    systemType: (sp.get('systemType') as BookingListFilters['systemType']) ?? 'all',
    source: (sp.get('source') as BookingListFilters['source']) ?? 'all',
  };
}

function TermineInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { data: session } = useSession();
  const isOwner = session?.user?.role === 'OWNER';

  const view: View = (sp.get('view') as View) === 'calendar' ? 'calendar' : 'list';
  const filters = useMemo(() => parseFilters(sp), [sp]);

  const { data: bookings, isLoading, error } = useBookings(filters);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const setView = (next: View) => {
    const params = new URLSearchParams(sp.toString());
    params.set('view', next);
    router.replace(`/dashboard/termine?${params.toString()}`);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Termine</h1>
          <p className="text-sm text-muted-foreground">
            Alle Wartungstermine – anstehend, vergangen, storniert
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
            <button
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'list'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setView('list')}
            >
              <ListIcon className="h-4 w-4" />
              Liste
            </button>
            <button
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                view === 'calendar'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setView('calendar')}
            >
              <CalendarIcon className="h-4 w-4" />
              Kalender
            </button>
          </div>
          {isOwner && (
            <Link href="/dashboard/systems">
              <Button size="sm">
                <PlusIcon className="h-4 w-4 mr-1" />
                Termin erstellen
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <TermineFilters isOwner={isOwner} />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <GlobeIcon className="h-3.5 w-3.5 text-primary" />
          Cal.com
        </span>
        <span className="inline-flex items-center gap-1.5">
          <WrenchIcon className="h-3.5 w-3.5 text-muted-foreground" />
          Manuell
        </span>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center text-destructive p-8">
          Fehler beim Laden: {error.message}
        </div>
      ) : view === 'list' ? (
        <TermineList
          bookings={bookings ?? []}
          isOwner={isOwner}
          onOpenDetails={setDetailId}
          onReschedule={setRescheduleId}
          onCancel={setCancelId}
        />
      ) : (
        <TermineCalendar
          filters={filters}
          onOpenDetails={setDetailId}
        />
      )}

      {/* Drawer + modals */}
      {detailId && (
        <BookingDetailsDrawer
          bookingId={detailId}
          isOwner={isOwner}
          onClose={() => setDetailId(null)}
          onReschedule={(id) => {
            setDetailId(null);
            setRescheduleId(id);
          }}
          onCancel={(id) => {
            setDetailId(null);
            setCancelId(id);
          }}
        />
      )}
      {rescheduleId && (
        <RescheduleBookingModal
          bookingId={rescheduleId}
          onClose={() => setRescheduleId(null)}
        />
      )}
      {cancelId && (
        <CancelBookingModal
          bookingId={cancelId}
          onClose={() => setCancelId(null)}
        />
      )}
    </div>
  );
}

export default function TerminePage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2Icon className="h-6 w-6 animate-spin" /></div>}>
      <TermineInner />
    </Suspense>
  );
}
