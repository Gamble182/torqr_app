'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2Icon, SearchIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/hooks/useCatalog';
import type { CatalogEntry, SystemType } from '@/hooks/useCatalog';
import { useCreateMaintenanceSet } from '@/hooks/useMaintenanceSets';
import { SYSTEM_TYPE_LABELS } from '@/lib/constants';

const SYSTEM_TYPE_ORDER: SystemType[] = ['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE'];

interface CatalogPickerForSetCreationProps {
  /** Set of catalogIds that already have a maintenance set; filtered out from the picker. */
  existingCatalogIds: Set<string>;
  onClose: () => void;
}

type SystemTypeGroup = {
  systemType: SystemType;
  manufacturers: Array<{
    manufacturer: string;
    entries: CatalogEntry[];
  }>;
};

export function CatalogPickerForSetCreation({
  existingCatalogIds,
  onClose,
}: CatalogPickerForSetCreationProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: entries = [], isLoading } = useCatalog();
  const createSet = useCreateMaintenanceSet();
  const [search, setSearch] = useState('');
  const [pendingCatalogId, setPendingCatalogId] = useState<string | null>(null);

  const groups = useMemo<SystemTypeGroup[]>(() => {
    const q = search.trim().toLowerCase();
    const filtered = entries.filter((e) => {
      if (existingCatalogIds.has(e.id)) return false;
      if (!q) return true;
      return (
        e.manufacturer.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q)
      );
    });

    const bySystemType = new Map<SystemType, Map<string, CatalogEntry[]>>();
    for (const entry of filtered) {
      if (!bySystemType.has(entry.systemType)) bySystemType.set(entry.systemType, new Map());
      const byManufacturer = bySystemType.get(entry.systemType)!;
      const list = byManufacturer.get(entry.manufacturer) ?? [];
      list.push(entry);
      byManufacturer.set(entry.manufacturer, list);
    }

    const result: SystemTypeGroup[] = [];
    for (const sysType of SYSTEM_TYPE_ORDER) {
      const byManufacturer = bySystemType.get(sysType);
      if (!byManufacturer) continue;
      const manufacturers = Array.from(byManufacturer.entries())
        .map(([manufacturer, list]) => ({
          manufacturer,
          entries: [...list].sort((a, b) => a.name.localeCompare(b.name, 'de')),
        }))
        .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer, 'de'));
      result.push({ systemType: sysType, manufacturers });
    }
    return result;
  }, [entries, existingCatalogIds, search]);

  const handlePick = async (catalogId: string) => {
    if (createSet.isPending) return;
    setPendingCatalogId(catalogId);
    try {
      const result = await createSet.mutateAsync({ catalogId });
      onClose();
      router.push(`/dashboard/wartungssets/${result.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Anlegen des Wartungssets: ${message}`);
      // Refresh the parent list so a now-taken catalog row (e.g. after a 409
      // race with another OWNER) disappears from this picker on next render.
      queryClient.invalidateQueries({ queryKey: ['maintenance-sets'] });
      setPendingCatalogId(null);
    }
  };

  const isEmpty = !isLoading && groups.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-lg mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Neues Wartungsset</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Katalogeintrag wählen, für den ein Wartungsset angelegt werden soll
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Schließen"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Hersteller oder Modell suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isEmpty ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {search.trim()
                ? 'Keine Einträge gefunden'
                : 'Für alle Katalogeinträge existiert bereits ein Wartungsset'}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {groups.map((group) => (
                <div key={group.systemType}>
                  <p className="px-3 py-1.5 text-xs font-semibold text-foreground bg-muted/60 uppercase tracking-wide">
                    {SYSTEM_TYPE_LABELS[group.systemType]}
                  </p>
                  {group.manufacturers.map((manuGroup) => (
                    <div key={`${group.systemType}-${manuGroup.manufacturer}`}>
                      <p className="px-3 py-1 text-[11px] font-semibold text-muted-foreground bg-muted/30 uppercase tracking-wide">
                        {manuGroup.manufacturer}
                      </p>
                      {manuGroup.entries.map((entry) => {
                        const isPending = pendingCatalogId === entry.id;
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            disabled={createSet.isPending}
                            onClick={() => handlePick(entry.id)}
                            className="w-full flex items-center justify-between text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <span>{entry.name}</span>
                            {isPending && (
                              <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={createSet.isPending}>
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  );
}
