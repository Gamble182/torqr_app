'use client';

import { useState } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  PackageIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { MaintenanceSetItem, PartCategory } from '@/hooks/useMaintenanceSets';
import { useDeleteSetItem, useReorderSetItems } from '@/hooks/useMaintenanceSetItems';
import { formatPartCategory } from '@/lib/format';

interface MaintenanceSetItemsTableProps {
  setId: string;
  items: MaintenanceSetItem[];
  onEdit: (item: MaintenanceSetItem) => void;
}

const categoryVariant: Record<PartCategory, 'default' | 'secondary' | 'outline'> = {
  SPARE_PART: 'default',
  CONSUMABLE: 'secondary',
  TOOL: 'outline',
};

export function MaintenanceSetItemsTable({
  setId,
  items,
  onEdit,
}: MaintenanceSetItemsTableProps) {
  const reorderMutation = useReorderSetItems(setId);
  const deleteMutation = useDeleteSetItem(setId);

  const [pendingDelete, setPendingDelete] = useState<MaintenanceSetItem | null>(null);

  const handleSwap = async (indexA: number, indexB: number) => {
    if (reorderMutation.isPending) return;
    const a = items[indexA];
    const b = items[indexB];
    if (!a || !b) return;
    try {
      await reorderMutation.mutateAsync({
        items: [
          { id: a.id, sortOrder: b.sortOrder },
          { id: b.id, sortOrder: a.sortOrder },
        ],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Sortieren: ${message}`);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast.success('Teil gelöscht');
      setPendingDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Löschen: ${message}`);
    }
  };

  const isMutating = reorderMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Kategorie</th>
              <th className="px-3 py-2.5 text-left font-medium">Beschreibung</th>
              <th className="px-3 py-2.5 text-left font-medium">Artikel-Nr.</th>
              <th className="px-3 py-2.5 text-left font-medium">Menge</th>
              <th className="px-3 py-2.5 text-center font-medium">Erforderlich</th>
              <th className="px-3 py-2.5 text-left font-medium">Lager</th>
              <th className="px-3 py-2.5 text-right font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === items.length - 1;
              return (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5">
                    <Badge variant={categoryVariant[item.category]}>
                      {formatPartCategory(item.category)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{item.description}</div>
                    {item.note && (
                      <div className="text-xs text-muted-foreground mt-0.5">{item.note}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {item.articleNumber ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {item.required ? (
                      <span className="text-foreground" aria-label="Pflichtteil">
                        ✓
                      </span>
                    ) : (
                      <span className="text-muted-foreground" aria-label="Optional">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {item.inventoryItem ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <PackageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[12rem]">
                          {item.inventoryItem.description}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSwap(index, index - 1)}
                        disabled={isFirst || isMutating}
                        aria-label="Nach oben verschieben"
                      >
                        <ChevronUpIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSwap(index, index + 1)}
                        disabled={isLast || isMutating}
                        aria-label="Nach unten verschieben"
                      >
                        <ChevronDownIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(item)}
                        disabled={isMutating}
                        aria-label="Bearbeiten"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setPendingDelete(item)}
                        disabled={isMutating}
                        aria-label="Löschen"
                      >
                        {deleteMutation.isPending && pendingDelete?.id === item.id ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2Icon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teil löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.description
                ? `„${pendingDelete.description}" wird unwiderruflich aus diesem Wartungsset entfernt.`
                : 'Dieses Teil wird unwiderruflich aus dem Wartungsset entfernt.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirmed();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Löscht…
                </>
              ) : (
                'Löschen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
