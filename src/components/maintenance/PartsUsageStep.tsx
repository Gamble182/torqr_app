// src/components/maintenance/PartsUsageStep.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2Icon,
  Loader2Icon,
  PackageIcon,
  PlusIcon,
  TrashIcon,
  WrenchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffectiveParts } from '@/hooks/useEffectiveParts';
import type { EffectivePart } from '@/hooks/useEffectiveParts';
import type { InventoryItem } from '@/hooks/useInventory';
import type { PartsUsageEntry } from '@/hooks/useMaintenances';

interface PartsUsageStepProps {
  customerSystemId: string;
  onChange: (v: PartsUsageEntry[]) => void;
  inventoryItems: InventoryItem[];
}

/**
 * Internal row state — drives both the checkbox/quantity UI and the emission
 * of `value` to the parent. Rows where `used === false` or `quantity <= 0`
 * are filtered out before being passed to `onChange`.
 */
type EffectiveRow = {
  key: string;
  sourceType: 'DEFAULT' | 'OVERRIDE_ADD';
  setItemId?: string;
  overrideId?: string;
  inventoryItemId?: string;
  description: string;
  articleNumber?: string;
  unit: string;
  quantity: number;
  used: boolean;
  inventoryItemDescription: string | null;
  currentStock: string | null;
};

type AdHocRow = {
  key: string;
  description: string;
  articleNumber?: string;
  quantity: number;
  unit: string;
  inventoryItemId?: string;
};

const EMPTY_INVENTORY_VALUE = '__none__';

function formatPartCategoryLabel(cat: 'SPARE_PART' | 'CONSUMABLE' | 'TOOL'): string {
  switch (cat) {
    case 'SPARE_PART':
      return 'Ersatzteil';
    case 'CONSUMABLE':
      return 'Verbrauchsmaterial';
    case 'TOOL':
      return 'Werkzeug';
  }
}

// PartsUsageStep is internally state-driven. Parent receives the filtered
// `PartsUsageEntry[]` via `onChange`. To preserve user state across step
// navigation, the parent must keep this component mounted (use CSS visibility
// rather than conditional rendering).

/**
 * Build the initial row state from the resolver result. Skips TOOL entries —
 * they are surfaced separately in the read-only "Werkzeug" section.
 */
function buildInitialRows(parts: EffectivePart[]): EffectiveRow[] {
  return parts
    .filter((p) => p.category !== 'TOOL')
    .map((p, idx) => ({
      key: `${p.source}-${p.setItemId ?? p.overrideId ?? idx}`,
      sourceType: p.source,
      setItemId: p.setItemId,
      overrideId: p.overrideId,
      inventoryItemId: p.inventoryItem?.id,
      description: p.description,
      articleNumber: p.articleNumber ?? undefined,
      unit: p.unit,
      quantity: parseFloat(p.quantity),
      used: true,
      inventoryItemDescription: p.inventoryItem?.description ?? null,
      currentStock: p.inventoryItem?.currentStock ?? null,
    }));
}

export function PartsUsageStep({
  customerSystemId,
  onChange,
  inventoryItems,
}: PartsUsageStepProps) {
  const {
    data: effectiveParts,
    isLoading,
    error,
  } = useEffectiveParts(customerSystemId);

  const [rows, setRows] = useState<EffectiveRow[]>([]);
  const [adHocRows, setAdHocRows] = useState<AdHocRow[]>([]);
  const [showAdHocForm, setShowAdHocForm] = useState(false);
  const [adHocDraft, setAdHocDraft] = useState<{
    description: string;
    quantity: string;
    unit: string;
    articleNumber: string;
    inventoryItemId: string;
  }>({
    description: '',
    quantity: '1',
    unit: 'Stck',
    articleNumber: '',
    inventoryItemId: EMPTY_INVENTORY_VALUE,
  });

  const toolRows = useMemo<EffectivePart[]>(
    () => (effectiveParts ?? []).filter((p) => p.category === 'TOOL'),
    [effectiveParts],
  );
  const [toolConfirmed, setToolConfirmed] = useState<Record<string, boolean>>({});

  // Initialize rows once on first successful load.
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && effectiveParts) {
      setRows(buildInitialRows(effectiveParts));
      setInitialized(true);
    }
  }, [effectiveParts, initialized]);

  // Emit the filtered usage array up to the parent on any change.
  useEffect(() => {
    const fromEffective: PartsUsageEntry[] = rows
      .filter((r) => r.used && r.quantity > 0)
      .map((r) => {
        const base = {
          description: r.description,
          articleNumber: r.articleNumber,
          quantity: r.quantity,
          unit: r.unit,
          inventoryItemId: r.inventoryItemId,
        };
        if (r.sourceType === 'DEFAULT') {
          return {
            sourceType: 'DEFAULT' as const,
            setItemId: r.setItemId,
            ...base,
          };
        }
        return {
          sourceType: 'OVERRIDE_ADD' as const,
          overrideId: r.overrideId,
          ...base,
        };
      });

    const fromAdHoc: PartsUsageEntry[] = adHocRows
      .filter((r) => r.quantity > 0 && r.description.trim().length > 0)
      .map((r) => ({
        sourceType: 'AD_HOC',
        description: r.description.trim(),
        articleNumber: r.articleNumber?.trim() || undefined,
        quantity: r.quantity,
        unit: r.unit,
        inventoryItemId: r.inventoryItemId,
      }));

    onChange([...fromEffective, ...fromAdHoc]);
    // We deliberately exclude `onChange` from deps — the parent passes a
    // stable setState dispatcher, and including it would risk infinite loops
    // if the parent ever wraps it in an unstable callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, adHocRows]);

  const sortedInventory = useMemo(() => {
    return [...inventoryItems].sort((a, b) =>
      a.description.localeCompare(b.description, 'de'),
    );
  }, [inventoryItems]);

  const updateRow = (key: string, patch: Partial<EffectiveRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeAdHoc = (key: string) => {
    setAdHocRows((prev) => prev.filter((r) => r.key !== key));
  };

  const resetAdHocDraft = () => {
    setAdHocDraft({
      description: '',
      quantity: '1',
      unit: 'Stck',
      articleNumber: '',
      inventoryItemId: EMPTY_INVENTORY_VALUE,
    });
  };

  const addAdHoc = () => {
    const description = adHocDraft.description.trim();
    const quantity = parseFloat(adHocDraft.quantity);
    if (!description || !Number.isFinite(quantity) || quantity <= 0) return;
    setAdHocRows((prev) => [
      ...prev,
      {
        key: `adhoc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        description,
        articleNumber: adHocDraft.articleNumber.trim() || undefined,
        quantity,
        unit: adHocDraft.unit.trim() || 'Stck',
        inventoryItemId:
          adHocDraft.inventoryItemId === EMPTY_INVENTORY_VALUE
            ? undefined
            : adHocDraft.inventoryItemId,
      },
    ]);
    resetAdHocDraft();
    setShowAdHocForm(false);
  };

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Teileverbrauch</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Welche Teile wurden bei dieser Wartung verbaut?
        </p>
      </div>

      {/* Loading / error states for the effective parts list */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2Icon className="h-4 w-4 animate-spin" />
          Lade Wartungsteile…
        </div>
      )}

      {error && !isLoading && (
        <p className="text-sm text-destructive">
          Fehler beim Laden der Wartungsteile: {error instanceof Error ? error.message : 'Unbekannt'}
        </p>
      )}

      {/* ── Main "Teileverbrauch" section ── */}
      {!isLoading && !error && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <PackageIcon className="h-3.5 w-3.5" />
            Teile
          </h3>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">
              Keine Standard- oder Zusatzteile für diese Anlage hinterlegt.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li
                  key={row.key}
                  className={`rounded-lg border p-3 transition-colors ${
                    row.used
                      ? 'border-success/30 bg-success/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => updateRow(row.key, { used: !row.used })}
                      aria-label={row.used ? 'Als nicht verbraucht markieren' : 'Als verbraucht markieren'}
                      className={`shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        row.used
                          ? 'bg-success border-success'
                          : 'border-muted-foreground/40 bg-card'
                      }`}
                    >
                      {row.used && (
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-success-foreground" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={`text-sm font-medium truncate ${
                            row.used ? 'text-foreground' : 'text-muted-foreground line-through'
                          }`}
                        >
                          {row.description}
                        </p>
                        {row.articleNumber && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {row.articleNumber}
                          </span>
                        )}
                      </div>
                      {row.inventoryItemDescription && row.currentStock !== null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Lager: {row.inventoryItemDescription} · Bestand {row.currentStock} {row.unit}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-2">
                        <Label
                          htmlFor={`qty-${row.key}`}
                          className="text-xs text-muted-foreground shrink-0"
                        >
                          Menge
                        </Label>
                        <Input
                          id={`qty-${row.key}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={Number.isFinite(row.quantity) ? row.quantity : 0}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            updateRow(row.key, {
                              quantity: Number.isFinite(n) ? n : 0,
                            });
                          }}
                          disabled={!row.used}
                          className="h-8 w-24 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">{row.unit}</span>

                        {row.used && (
                          <button
                            type="button"
                            onClick={() =>
                              updateRow(row.key, { used: false, quantity: 0 })
                            }
                            className="ml-auto text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            nicht verbraucht
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── AD_HOC entries ── */}
      {!isLoading && !error && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Zusatzteile
          </h3>

          {adHocRows.length > 0 && (
            <ul className="space-y-2">
              {adHocRows.map((row) => (
                <li
                  key={row.key}
                  className="flex items-start gap-2 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {row.description}
                      </p>
                      {row.articleNumber && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {row.articleNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.quantity} {row.unit}
                      {row.inventoryItemId && ' · mit Lager-Verknüpfung'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAdHoc(row.key)}
                    className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Entfernen"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!showAdHocForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdHocForm(true)}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Zusatzteil erfassen
            </Button>
          ) : (
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="adhoc-desc" className="text-xs">
                  Beschreibung *
                </Label>
                <Input
                  id="adhoc-desc"
                  value={adHocDraft.description}
                  onChange={(e) =>
                    setAdHocDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="z. B. Dichtring DN20"
                  maxLength={200}
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="adhoc-qty" className="text-xs">
                    Menge *
                  </Label>
                  <Input
                    id="adhoc-qty"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={adHocDraft.quantity}
                    onChange={(e) =>
                      setAdHocDraft((d) => ({ ...d, quantity: e.target.value }))
                    }
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adhoc-unit" className="text-xs">
                    Einheit *
                  </Label>
                  <Input
                    id="adhoc-unit"
                    value={adHocDraft.unit}
                    onChange={(e) =>
                      setAdHocDraft((d) => ({ ...d, unit: e.target.value }))
                    }
                    placeholder="Stck"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adhoc-art" className="text-xs">
                  Artikel-Nr.
                </Label>
                <Input
                  id="adhoc-art"
                  value={adHocDraft.articleNumber}
                  onChange={(e) =>
                    setAdHocDraft((d) => ({ ...d, articleNumber: e.target.value }))
                  }
                  placeholder="Optional"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adhoc-inv" className="text-xs">
                  Lager-Verknüpfung
                </Label>
                <select
                  id="adhoc-inv"
                  value={adHocDraft.inventoryItemId}
                  onChange={(e) =>
                    setAdHocDraft((d) => ({ ...d, inventoryItemId: e.target.value }))
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={EMPTY_INVENTORY_VALUE}>— Keine Verknüpfung —</option>
                  {sortedInventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.articleNumber ? `${inv.articleNumber} · ` : ''}
                      {inv.description} · Bestand {inv.currentStock} {inv.unit}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Optional — bei Auswahl wird der Bestand automatisch abgebucht.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetAdHocDraft();
                    setShowAdHocForm(false);
                  }}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={addAdHoc}
                  disabled={
                    !adHocDraft.description.trim() ||
                    !(parseFloat(adHocDraft.quantity) > 0)
                  }
                  className="flex-1"
                >
                  Hinzufügen
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Werkzeug (read-only confirmation) ── */}
      {!isLoading && !error && toolRows.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <WrenchIcon className="h-3.5 w-3.5" />
            Werkzeug
          </h3>
          <p className="text-xs text-muted-foreground">
            Erinnerung — wird nicht abgebucht.
          </p>
          <ul className="space-y-1.5">
            {toolRows.map((tool, idx) => {
              const key = `tool-${tool.setItemId ?? tool.overrideId ?? idx}`;
              const confirmed = toolConfirmed[key] ?? false;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() =>
                      setToolConfirmed((prev) => ({ ...prev, [key]: !confirmed }))
                    }
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                      confirmed
                        ? 'border-success/30 bg-success/5'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        confirmed ? 'bg-success border-success' : 'border-muted-foreground/40'
                      }`}
                    >
                      {confirmed && (
                        <CheckCircle2Icon className="h-3.5 w-3.5 text-success-foreground" />
                      )}
                    </div>
                    <span
                      className={`flex-1 text-sm ${
                        confirmed ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {tool.description}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatPartCategoryLabel(tool.category)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
