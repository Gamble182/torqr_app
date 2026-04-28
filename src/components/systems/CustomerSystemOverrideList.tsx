'use client';

import { useMemo, useState } from 'react';
import { Loader2Icon, PlusIcon, MinusCircleIcon, Trash2Icon, XIcon } from 'lucide-react';
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
  useCreateOverride,
  useDeleteOverride,
  type CustomerSystemPartOverride,
} from '@/hooks/useCustomerSystemOverrides';
import { useMaintenanceSet } from '@/hooks/useMaintenanceSets';
import { formatPartCategory } from '@/lib/format';
import type { PartCategory } from '@/hooks/useEffectiveParts';
import { CustomerSystemOverrideForm } from './CustomerSystemOverrideForm';

interface CustomerSystemOverrideListProps {
  systemId: string;
  overrides: CustomerSystemPartOverride[];
  /** ID of the standard MaintenanceSet for this system's catalog (if any). */
  standardSetId: string | undefined;
  isOwner: boolean;
}

/**
 * Two-grouped list: ADD overrides ("Hinzugefügt") and EXCLUDE overrides
 * ("Ausgeschlossen"). OWNER can mutate via inline actions.
 */
export function CustomerSystemOverrideList({
  systemId,
  overrides,
  standardSetId,
  isOwner,
}: CustomerSystemOverrideListProps) {
  // Detail of the standard set — needed to (a) populate the EXCLUDE picker
  // and (b) resolve excludedSetItemId → human label for displayed EXCLUDE rows.
  const { data: standardSet } = useMaintenanceSet(standardSetId);

  const deleteOverride = useDeleteOverride(systemId);
  const createOverride = useCreateOverride(systemId);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showExcludePicker, setShowExcludePicker] = useState(false);
  const [excludeSelection, setExcludeSelection] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<CustomerSystemPartOverride | null>(
    null,
  );

  const addOverrides = useMemo(
    () =>
      overrides
        .filter((o) => o.action === 'ADD')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [overrides],
  );

  const excludeOverrides = useMemo(
    () => overrides.filter((o) => o.action === 'EXCLUDE'),
    [overrides],
  );

  // Items still excludable (in standard set but not yet excluded).
  const excludedSetItemIds = useMemo(
    () =>
      new Set(
        overrides
          .filter((o) => o.action === 'EXCLUDE' && o.excludedSetItemId)
          .map((o) => o.excludedSetItemId as string),
      ),
    [overrides],
  );

  const excludablePicks = useMemo(
    () => standardSet?.items.filter((it) => !excludedSetItemIds.has(it.id)) ?? [],
    [standardSet, excludedSetItemIds],
  );

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    try {
      await deleteOverride.mutateAsync(pendingDelete.id);
      toast.success('Abweichung gelöscht');
      setPendingDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Löschen: ${message}`);
    }
  };

  const toggleExcludeSelection = (setItemId: string) => {
    setExcludeSelection((prev) => {
      const next = new Set(prev);
      if (next.has(setItemId)) next.delete(setItemId);
      else next.add(setItemId);
      return next;
    });
  };

  const closeExcludePicker = () => {
    setShowExcludePicker(false);
    setExcludeSelection(new Set());
  };

  const handleExcludeConfirm = async () => {
    const ids = Array.from(excludeSelection);
    if (ids.length === 0) return;
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          createOverride.mutateAsync({
            action: 'EXCLUDE',
            excludedSetItemId: id,
          }),
        ),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      const succeeded = ids.length - failed;
      if (succeeded > 0 && failed === 0) {
        toast.success(
          succeeded === 1
            ? 'Standard-Teil ausgeschlossen'
            : `${succeeded} Standard-Teile ausgeschlossen`,
        );
      } else if (succeeded > 0) {
        toast.warning(`${succeeded} ausgeschlossen, ${failed} fehlgeschlagen`);
      } else {
        toast.error('Ausschluss fehlgeschlagen');
      }
      closeExcludePicker();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Fehler: ${message}`);
    }
  };

  const isMutating = deleteOverride.isPending || createOverride.isPending;
  const hasNothing = addOverrides.length === 0 && excludeOverrides.length === 0;

  return (
    <>
      <div className="space-y-3">
        {/* Hinzugefügt */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-foreground">Hinzugefügt</div>
          {addOverrides.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Keine Ergänzungen.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {addOverrides.map((o) => (
                <li
                  key={o.id}
                  className="flex items-start justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {formatPartCategory(o.category as PartCategory)}
                      </Badge>
                      <span className="text-sm font-medium text-foreground truncate">
                        {o.description ?? '—'}
                      </span>
                    </div>
                    {o.note && (
                      <div className="text-xs text-muted-foreground italic">
                        {o.note}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-sm text-foreground">
                      {o.quantity} {o.unit}
                    </span>
                    {isOwner && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setPendingDelete(o)}
                        disabled={isMutating}
                        aria-label="Löschen"
                      >
                        {deleteOverride.isPending && pendingDelete?.id === o.id ? (
                          <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2Icon className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ausgeschlossen */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-foreground">Ausgeschlossen</div>
          {excludeOverrides.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Keine Standard-Teile ausgeschlossen.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {excludeOverrides.map((o) => {
                const excluded = standardSet?.items.find(
                  (it) => it.id === o.excludedSetItemId,
                );
                return (
                  <li
                    key={o.id}
                    className="flex items-start justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {excluded && (
                          <Badge variant="outline">
                            {formatPartCategory(excluded.category)}
                          </Badge>
                        )}
                        <span className="text-sm font-medium text-foreground line-through truncate">
                          {excluded?.description ?? 'Unbekanntes Standard-Teil'}
                        </span>
                      </div>
                      {excluded?.articleNumber && (
                        <div className="text-xs text-muted-foreground">
                          Art-Nr. {excluded.articleNumber}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {excluded && (
                        <span className="text-sm text-muted-foreground">
                          {excluded.quantity} {excluded.unit}
                        </span>
                      )}
                      {isOwner && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setPendingDelete(o)}
                          disabled={isMutating}
                          aria-label="Ausschluss aufheben"
                        >
                          {deleteOverride.isPending && pendingDelete?.id === o.id ? (
                            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2Icon className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* OWNER actions */}
        {isOwner && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(true)}
              disabled={isMutating}
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Teil hinzufügen
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowExcludePicker(true)}
              disabled={isMutating || !standardSetId}
              title={
                !standardSetId
                  ? 'Kein Standard-Wartungsset vorhanden'
                  : undefined
              }
            >
              <MinusCircleIcon className="h-4 w-4 mr-1.5" />
              Standard ausschließen
            </Button>
          </div>
        )}

        {!isOwner && hasNothing && (
          <p className="text-xs text-muted-foreground italic">
            Diese Anlage folgt vollständig dem Standard-Wartungsset.
          </p>
        )}
      </div>

      {/* ADD modal */}
      {showAddForm && (
        <CustomerSystemOverrideForm
          systemId={systemId}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* EXCLUDE picker */}
      {showExcludePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Standard-Teil ausschließen</h3>
              <button
                type="button"
                onClick={closeExcludePicker}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Schließen"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            {excludablePicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine weiteren Standard-Teile zum Ausschließen vorhanden.
              </p>
            ) : (
              <>
                <p className="mb-2 text-xs text-muted-foreground">
                  Wähle ein oder mehrere Teile zum Ausschließen.
                </p>
                <ul className="divide-y divide-border rounded-md border border-border">
                  {excludablePicks.map((it) => {
                    const checked = excludeSelection.has(it.id);
                    return (
                      <li key={it.id}>
                        <label
                          className={`flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/40 hover:ring-1 hover:ring-inset hover:ring-primary/40 ${
                            checked ? 'bg-accent/60 ring-1 ring-inset ring-primary/60' : ''
                          } ${createOverride.isPending ? 'pointer-events-none opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleExcludeSelection(it.id)}
                            disabled={createOverride.isPending}
                            className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                          />
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">
                                {formatPartCategory(it.category)}
                              </Badge>
                              <span className="text-sm font-medium text-foreground truncate">
                                {it.description}
                              </span>
                            </div>
                            {it.articleNumber && (
                              <div className="text-xs text-muted-foreground">
                                Art-Nr. {it.articleNumber}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {it.quantity} {it.unit}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeExcludePicker}
                disabled={createOverride.isPending}
              >
                Abbrechen
              </Button>
              {excludablePicks.length > 0 && (
                <Button
                  type="button"
                  onClick={handleExcludeConfirm}
                  disabled={excludeSelection.size === 0 || createOverride.isPending}
                >
                  {createOverride.isPending ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                      Schließt aus…
                    </>
                  ) : (
                    `Ausschließen${excludeSelection.size > 0 ? ` (${excludeSelection.size})` : ''}`
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteOverride.isPending) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.action === 'EXCLUDE'
                ? 'Ausschluss aufheben?'
                : 'Abweichung löschen?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.action === 'EXCLUDE'
                ? 'Das Standard-Teil wird wieder Teil dieser Anlage.'
                : `„${pendingDelete?.description ?? 'Diese Abweichung'}" wird unwiderruflich entfernt.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOverride.isPending}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirmed();
              }}
              disabled={deleteOverride.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOverride.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Löscht…
                </>
              ) : (
                'Bestätigen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
