'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2Icon, PlusIcon, ClipboardListIcon, WrenchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMaintenanceSets } from '@/hooks/useMaintenanceSets';
import type { MaintenanceSetSummary } from '@/hooks/useMaintenanceSets';
import type { SystemType } from '@/hooks/useCatalog';
import { SYSTEM_TYPE_LABELS } from '@/lib/constants';
import { CatalogPickerForSetCreation } from './CatalogPickerForSetCreation';

const SYSTEM_TYPE_ORDER: SystemType[] = ['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE'];

type SystemTypeGroup = {
  systemType: SystemType;
  manufacturers: Array<{
    manufacturer: string;
    sets: MaintenanceSetSummary[];
  }>;
};

export function MaintenanceSetList() {
  const router = useRouter();
  const { data: sets, isLoading, error } = useMaintenanceSets();
  const [showPicker, setShowPicker] = useState(false);

  const groups = useMemo<SystemTypeGroup[]>(() => {
    if (!sets) return [];
    const bySystemType = new Map<SystemType, Map<string, MaintenanceSetSummary[]>>();
    for (const set of sets) {
      const sysType = set.catalog.systemType;
      if (!bySystemType.has(sysType)) bySystemType.set(sysType, new Map());
      const byManufacturer = bySystemType.get(sysType)!;
      const list = byManufacturer.get(set.catalog.manufacturer) ?? [];
      list.push(set);
      byManufacturer.set(set.catalog.manufacturer, list);
    }

    const result: SystemTypeGroup[] = [];
    for (const sysType of SYSTEM_TYPE_ORDER) {
      const byManufacturer = bySystemType.get(sysType);
      if (!byManufacturer) continue;
      const manufacturers = Array.from(byManufacturer.entries())
        .map(([manufacturer, list]) => ({
          manufacturer,
          sets: [...list].sort((a, b) => a.catalog.name.localeCompare(b.catalog.name, 'de')),
        }))
        .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer, 'de'));
      result.push({ systemType: sysType, manufacturers });
    }
    return result;
  }, [sets]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        Fehler beim Laden der Wartungssets
      </div>
    );
  }

  const isEmpty = !sets || sets.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowPicker(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Neues Set
        </Button>
      </div>

      {isEmpty ? (
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
          Noch keine Wartungssets angelegt
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.systemType} className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {SYSTEM_TYPE_LABELS[group.systemType]}
              </h2>
              <div className="space-y-4">
                {group.manufacturers.map((manuGroup) => (
                  <div key={manuGroup.manufacturer} className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground bg-muted/40 uppercase tracking-wide px-3 py-1.5 rounded-md">
                      {manuGroup.manufacturer}
                    </h3>
                    <div className="grid gap-2">
                      {manuGroup.sets.map((set) => (
                        <MaintenanceSetRow
                          key={set.id}
                          set={set}
                          onClick={() => router.push(`/dashboard/wartungssets/${set.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {showPicker && (
        <CatalogPickerForSetCreation
          existingCatalogIds={new Set((sets ?? []).map((s) => s.catalogId))}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

function MaintenanceSetRow({
  set,
  onClick,
}: {
  set: MaintenanceSetSummary;
  onClick: () => void;
}) {
  const itemCount = set._count.items;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex items-center gap-4 p-4 rounded-lg border bg-card cursor-pointer hover:shadow-sm hover:border-brand-200 transition-all"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
        <WrenchIcon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{set.catalog.name}</p>
        <p className="text-xs text-muted-foreground truncate">{set.catalog.manufacturer}</p>
      </div>
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground shrink-0">
        <ClipboardListIcon className="h-3.5 w-3.5" />
        {itemCount} {itemCount === 1 ? 'Teil' : 'Teile'}
      </span>
    </div>
  );
}
