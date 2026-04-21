'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Loader2Icon,
  ArrowLeftIcon,
  WrenchIcon,
  UserIcon,
  MapPinIcon,
  ChevronRightIcon,
  CalendarIcon,
  CalendarPlusIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerSystem, useDeleteCustomerSystem } from '@/hooks/useCustomerSystems';
import { SystemAssignmentModal } from '@/components/system-form/SystemAssignmentModal';
import { MaintenanceChecklistModal } from '@/components/MaintenanceChecklistModal';
import { MaintenanceHistory } from '@/components/MaintenanceHistory';
import { FollowUpSection } from '@/components/FollowUpSection';
import { BookingFormModal } from '@/components/BookingFormModal';
import { SYSTEM_TYPE_LABELS } from '@/lib/constants';

export default function SystemDetailPage() {
  const params = useParams();
  const systemId = params.id as string;

  const { data: system, isLoading, error, refetch } = useCustomerSystem(systemId);
  const deleteSystem = useDeleteCustomerSystem();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const handleDelete = async () => {
    if (!confirm('System wirklich löschen? Alle Wartungseinträge werden ebenfalls gelöscht.')) return;
    await deleteSystem.mutateAsync(systemId);
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !system) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">System nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/systems">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {system.catalog.manufacturer} {system.catalog.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {SYSTEM_TYPE_LABELS[system.catalog.systemType] ?? system.catalog.systemType}
            {system.serialNumber && ` · SN: ${system.serialNumber}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
            Bearbeiten
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Löschen
          </Button>
        </div>
      </div>

      {/* Details cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer */}
        {system.customer && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Kunde</h2>
            <Link
              href={`/dashboard/customers/${system.customer.id}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <UserIcon className="h-4 w-4" />
              {system.customer.name}
              <ChevronRightIcon className="h-3 w-3" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="h-4 w-4" />
              {system.customer.street}, {system.customer.city}
            </div>
          </div>
        )}

        {/* Maintenance schedule */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Wartungsplan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Intervall</span>
              <span>{system.maintenanceInterval} Monate</span>
            </div>
            {system.lastMaintenance && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Letzte Wartung</span>
                <span>{format(new Date(system.lastMaintenance), 'dd. MMM yyyy', { locale: de })}</span>
              </div>
            )}
            {system.nextMaintenance && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nächste Wartung</span>
                <span className="font-medium">
                  {format(new Date(system.nextMaintenance), 'dd. MMM yyyy', { locale: de })}
                </span>
              </div>
            )}
            {system.installationDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Installiert am</span>
                <span>{format(new Date(system.installationDate), 'dd. MMM yyyy', { locale: de })}</span>
              </div>
            )}
            {system.bookings?.[0] && (
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="flex items-center gap-1.5 text-status-ok-text">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Gebuchter Termin
                </span>
                <span className="font-medium text-status-ok-text">
                  {format(new Date(system.bookings[0].startTime), 'dd. MMM yyyy, HH:mm', { locale: de })} Uhr
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up jobs */}
      <FollowUpSection systemId={systemId} />

      {/* Maintenance section */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-foreground">Wartungshistorie</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowBookingForm(true)}>
            <CalendarPlusIcon className="h-4 w-4 mr-2" />
            Termin eintragen
          </Button>
          <Button size="sm" onClick={() => setShowMaintenanceForm(true)}>
            <WrenchIcon className="h-4 w-4 mr-2" />
            Wartung eintragen
          </Button>
        </div>
      </div>

      <MaintenanceHistory maintenances={system.maintenances ?? []} onDelete={() => refetch()} />

      {/* Modals */}
      {showEditModal && (
        <SystemAssignmentModal
          customerId={system.customerId}
          system={system}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      {showMaintenanceForm && (
        <MaintenanceChecklistModal
          systemId={systemId}
          systemLabel={`${system.catalog.manufacturer} ${system.catalog.name}`}
          systemType={system.catalog.systemType}
          onClose={() => setShowMaintenanceForm(false)}
          onSuccess={() => { refetch(); setShowMaintenanceForm(false); }}
        />
      )}

      {showBookingForm && (
        <BookingFormModal
          systemId={systemId}
          systemLabel={`${system.catalog.manufacturer} ${system.catalog.name}`}
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => { refetch(); setShowBookingForm(false); }}
        />
      )}
    </div>
  );
}
