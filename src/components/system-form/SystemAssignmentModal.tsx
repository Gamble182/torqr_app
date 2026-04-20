'use client';

import { useState } from 'react';
import { XIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SystemTypeSelector } from './SystemTypeSelector';
import { CatalogPicker } from './CatalogPicker';
import { useCreateCustomerSystem, useUpdateCustomerSystem } from '@/hooks/useCustomerSystems';
import type { CustomerSystem } from '@/hooks/useCustomerSystems';
import type { CatalogEntry, SystemType } from '@/hooks/useCatalog';

const MAINTENANCE_INTERVALS = [
  { value: '1', label: '1 Monat' },
  { value: '3', label: '3 Monate' },
  { value: '6', label: '6 Monate' },
  { value: '12', label: '12 Monate' },
  { value: '24', label: '24 Monate' },
];

interface SystemAssignmentModalProps {
  customerId: string;
  system?: CustomerSystem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function SystemAssignmentModal({
  customerId,
  system,
  onClose,
  onSuccess,
}: SystemAssignmentModalProps) {
  const isEdit = !!system;
  const createSystem = useCreateCustomerSystem();
  const updateSystem = useUpdateCustomerSystem(system?.id ?? '');

  const [systemType, setSystemType] = useState<SystemType | ''>(
    (system?.catalog.systemType as SystemType) ?? ''
  );
  const [catalogId, setCatalogId] = useState(system?.catalogId ?? '');
  const [serialNumber, setSerialNumber] = useState(system?.serialNumber ?? '');
  const [installationDate, setInstallationDate] = useState(
    system?.installationDate ? system.installationDate.substring(0, 10) : ''
  );
  const [maintenanceInterval, setMaintenanceInterval] = useState(
    system ? String(system.maintenanceInterval) : '12'
  );
  const [lastMaintenance, setLastMaintenance] = useState(
    system?.lastMaintenance ? system.lastMaintenance.substring(0, 10) : ''
  );

  const handleCatalogChange = (id: string, _entry: CatalogEntry) => {
    setCatalogId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogId) return;

    const payload = {
      catalogId,
      customerId,
      serialNumber: serialNumber || null,
      installationDate: installationDate ? new Date(installationDate).toISOString() : null,
      maintenanceInterval: Number(maintenanceInterval),
      lastMaintenance: lastMaintenance ? new Date(lastMaintenance).toISOString() : null,
    };

    if (isEdit) {
      await updateSystem.mutateAsync(payload);
    } else {
      await createSystem.mutateAsync(payload);
    }
    onSuccess();
    onClose();
  };

  const isPending = createSystem.isPending || updateSystem.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? 'System bearbeiten' : 'System zuweisen'}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* System Type */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>Systemtyp</Label>
              <SystemTypeSelector value={systemType} onChange={setSystemType} />
            </div>
          )}

          {/* Catalog Picker */}
          {(systemType || isEdit) && (
            <div className="space-y-2">
              <Label>Gerät aus Katalog</Label>
              <CatalogPicker
                systemType={(systemType as SystemType) || system!.catalog.systemType as SystemType}
                value={catalogId}
                onChange={handleCatalogChange}
              />
            </div>
          )}

          {/* Instance fields */}
          {catalogId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Seriennummer (optional)</Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="z. B. VSN-2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installationDate">Installationsdatum (optional)</Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceInterval">Wartungsintervall</Label>
                <select
                  id="maintenanceInterval"
                  value={maintenanceInterval}
                  onChange={(e) => setMaintenanceInterval(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {MAINTENANCE_INTERVALS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastMaintenance">Letzte Wartung (optional)</Label>
                <Input
                  id="lastMaintenance"
                  type="date"
                  value={lastMaintenance}
                  onChange={(e) => setLastMaintenance(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" disabled={!catalogId || isPending} className="flex-1">
              {isPending && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? 'Speichern' : 'System zuweisen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
