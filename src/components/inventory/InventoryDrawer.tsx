'use client';

import { useState } from 'react';
import {
  XIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
  PlusIcon,
  ArrowUpDownIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
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
import {
  useInventoryItem,
  useDeleteInventoryItem,
} from '@/hooks/useInventory';
import {
  useInventoryMovements,
  type MovementReason,
  type MovementReasonInput,
} from '@/hooks/useInventoryMovements';
import { InventoryStatusBadge } from './InventoryStatusBadge';
import { InventoryItemForm } from './InventoryItemForm';
import { InventoryMovementForm } from './InventoryMovementForm';

interface InventoryDrawerProps {
  itemId: string;
  isOwner: boolean;
  onClose: () => void;
}

const REASON_LABEL: Record<MovementReason, string> = {
  RESTOCK: 'Zugang',
  CORRECTION: 'Korrektur',
  MAINTENANCE_USE: 'Wartung',
  MANUAL_ADJUSTMENT: 'Manuell',
};

const REASON_VARIANT: Record<MovementReason, 'default' | 'secondary' | 'outline'> = {
  RESTOCK: 'default',
  CORRECTION: 'secondary',
  MAINTENANCE_USE: 'outline',
  MANUAL_ADJUSTMENT: 'outline',
};

function formatSignedQuantity(value: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  if (n > 0) return `+${value}`;
  return value;
}

export function InventoryDrawer({ itemId, isOwner, onClose }: InventoryDrawerProps) {
  const { data: item, isLoading, error } = useInventoryItem(itemId);
  const { data: movements, isLoading: movementsLoading } = useInventoryMovements(itemId);
  const deleteMutation = useDeleteInventoryItem();

  const [editing, setEditing] = useState(false);
  const [movementMode, setMovementMode] = useState<MovementReasonInput | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(itemId);
      toast.success('Lagerteil gelöscht');
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Löschen: ${message}`);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 flex justify-end"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <aside
          className="w-full sm:max-w-md bg-background border-l border-border h-full overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Lager-Details</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Schließen"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error || !item ? (
            <div className="p-6 text-sm text-destructive">
              {error?.message || 'Lagerteil nicht gefunden'}
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {/* Stammdaten */}
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Stammdaten
                </h3>
                <div className="text-sm font-medium text-foreground">
                  {item.description}
                </div>
                {item.articleNumber && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Artikel-Nr.: {item.articleNumber}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Einheit: {item.unit}
                </div>
              </section>

              {/* Bestand */}
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Bestand
                </h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-2xl font-semibold text-foreground">
                    {item.currentStock}
                  </span>
                  <span className="text-muted-foreground">{item.unit}</span>
                  <InventoryStatusBadge
                    currentStock={item.currentStock}
                    minStock={item.minStock}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Mindestmenge: {item.minStock} {item.unit}
                </div>
                <div className="text-xs text-muted-foreground">
                  Letzter Zugang:{' '}
                  {item.lastRestockedAt
                    ? format(new Date(item.lastRestockedAt), 'dd.MM.yyyy', { locale: de })
                    : '—'}
                </div>
              </section>

              {/* Aktionen (OWNER) */}
              {isOwner && (
                <section className="border-t border-border pt-4">
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Aktionen
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setMovementMode('RESTOCK')}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Zugang buchen
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setMovementMode('CORRECTION')}
                    >
                      <ArrowUpDownIcon className="h-4 w-4 mr-1" />
                      Korrektur buchen
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Bearbeiten
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(true)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2Icon className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Trash2Icon className="h-4 w-4 mr-1" />
                      )}
                      Löschen
                    </Button>
                  </div>
                </section>
              )}

              {/* Bewegungshistorie */}
              <section className="border-t border-border pt-4">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Bewegungshistorie
                </h3>
                {movementsLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : !movements || movements.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Noch keine Bewegungen
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {movements.map((mv) => {
                      const qtyNum = Number(mv.quantityChange);
                      const qtyClass = qtyNum > 0 ? 'text-emerald-600' : 'text-destructive';
                      return (
                        <li
                          key={mv.id}
                          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(mv.createdAt), 'dd.MM.yy HH:mm', {
                                locale: de,
                              })}
                            </span>
                            <Badge variant={REASON_VARIANT[mv.reason]}>
                              {REASON_LABEL[mv.reason]}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {mv.user?.name ?? 'Unbekannt'}
                            </span>
                            <span className={`font-medium tabular-nums ${qtyClass}`}>
                              {formatSignedQuantity(mv.quantityChange)} {item.unit}
                            </span>
                          </div>
                          {mv.note && (
                            <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                              {mv.note}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}
        </aside>
      </div>

      {/* Edit form modal */}
      {item && (
        <InventoryItemForm
          open={editing}
          onClose={() => setEditing(false)}
          item={item}
        />
      )}

      {/* Movement form modal */}
      {item && movementMode && (
        <InventoryMovementForm
          open={movementMode !== null}
          onClose={() => setMovementMode(null)}
          itemId={item.id}
          reason={movementMode}
          unit={item.unit}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setConfirmDelete(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lagerteil löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {item?.description
                ? `„${item.description}" wird unwiderruflich gelöscht. Wenn das Teil noch in Wartungssets oder Anlagen verwendet wird, schlägt das Löschen fehl.`
                : 'Dieses Lagerteil wird unwiderruflich gelöscht.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
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
