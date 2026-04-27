'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2Icon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { maintenanceSetItemCreateSchema } from '@/lib/validations';
import { useCreateSetItem, useUpdateSetItem } from '@/hooks/useMaintenanceSetItems';
import { useInventoryItems } from '@/hooks/useInventory';
import type { MaintenanceSetItem, PartCategory } from '@/hooks/useMaintenanceSets';
import { formatPartCategory } from '@/lib/format';

interface MaintenanceSetItemFormProps {
  open: boolean;
  onClose: () => void;
  setId: string;
  item?: MaintenanceSetItem;
}

interface FormValues {
  category: PartCategory;
  description: string;
  articleNumber?: string;
  quantity: number;
  unit: string;
  required: boolean;
  note?: string;
  inventoryItemId?: string;
}

const CATEGORY_OPTIONS: PartCategory[] = ['SPARE_PART', 'CONSUMABLE', 'TOOL'];

const EMPTY_INVENTORY_VALUE = '__none__';

export function MaintenanceSetItemForm({
  open,
  onClose,
  setId,
  item,
}: MaintenanceSetItemFormProps) {
  const isEdit = Boolean(item);
  const createMutation = useCreateSetItem(setId);
  const updateMutation = useUpdateSetItem(setId);
  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems();

  const defaultValues = useMemo<FormValues>(() => {
    if (item) {
      return {
        category: item.category,
        description: item.description,
        articleNumber: item.articleNumber ?? '',
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        required: item.required,
        note: item.note ?? '',
        inventoryItemId: item.inventoryItemId ?? undefined,
      };
    }
    return {
      category: 'SPARE_PART',
      description: '',
      articleNumber: '',
      quantity: 1,
      unit: 'Stck',
      required: true,
      note: '',
      inventoryItemId: undefined,
    };
  }, [item]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(maintenanceSetItemCreateSchema) as Resolver<FormValues>,
    defaultValues,
  });

  // Reset form when item or open state changes (modal re-opens with different mode/item)
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const category = watch('category');
  const isToolSelected = category === 'TOOL';

  // When category switches to TOOL, clear inventoryItemId so the schema refine never fires.
  useEffect(() => {
    if (isToolSelected) {
      setValue('inventoryItemId', undefined);
    }
  }, [isToolSelected, setValue]);

  const sortedInventory = useMemo(() => {
    return [...inventoryItems].sort((a, b) =>
      a.description.localeCompare(b.description, 'de')
    );
  }, [inventoryItems]);

  if (!open) return null;

  const onSubmit = async (values: FormValues) => {
    const payload = {
      category: values.category,
      description: values.description,
      articleNumber: values.articleNumber?.trim() ? values.articleNumber.trim() : undefined,
      quantity: values.quantity,
      unit: values.unit,
      required: values.required,
      note: values.note?.trim() ? values.note.trim() : undefined,
      inventoryItemId: values.inventoryItemId ?? undefined,
    };

    try {
      if (isEdit && item) {
        await updateMutation.mutateAsync({ id: item.id, body: payload });
        toast.success('Teil aktualisiert');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Teil hinzugefügt');
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Speichern: ${message}`);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {isEdit ? 'Teil bearbeiten' : 'Teil hinzufügen'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Schließen"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Kategorie *</Label>
            <select
              id="category"
              {...register('category')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {formatPartCategory(cat)}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Beschreibung *</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="z. B. Düsenstock"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="articleNumber">Artikel-Nr.</Label>
            <Input
              id="articleNumber"
              {...register('articleNumber')}
              placeholder="Optional"
            />
            {errors.articleNumber && (
              <p className="text-sm text-destructive">{errors.articleNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Menge *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Einheit *</Label>
              <Input id="unit" {...register('unit')} placeholder="Stck" />
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-input px-3 py-2">
            <div>
              <Label htmlFor="required" className="cursor-pointer">
                Pflichtteil
              </Label>
              <p className="text-xs text-muted-foreground">
                Muss bei jeder Wartung verbaut werden
              </p>
            </div>
            <Switch
              id="required"
              checked={watch('required')}
              onCheckedChange={(checked) => setValue('required', checked, { shouldDirty: true })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inventoryItemId">Lager-Verknüpfung</Label>
            <select
              id="inventoryItemId"
              disabled={isToolSelected || inventoryLoading}
              value={watch('inventoryItemId') ?? EMPTY_INVENTORY_VALUE}
              onChange={(e) => {
                const v = e.target.value;
                setValue(
                  'inventoryItemId',
                  v === EMPTY_INVENTORY_VALUE ? undefined : v,
                  { shouldDirty: true },
                );
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={EMPTY_INVENTORY_VALUE}>— Keine Verknüpfung —</option>
              {sortedInventory.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.description}
                  {inv.articleNumber ? ` · ${inv.articleNumber}` : ''}
                </option>
              ))}
            </select>
            {isToolSelected ? (
              <p className="text-xs text-muted-foreground">
                Werkzeuge können nicht an ein Lagerteil gebunden werden.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Optional — verknüpft das Teil mit einem Lagerartikel für automatische Abbuchungen.
              </p>
            )}
            {errors.inventoryItemId && (
              <p className="text-sm text-destructive">{errors.inventoryItemId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Notiz</Label>
            <Textarea
              id="note"
              {...register('note')}
              placeholder="Optional"
              rows={2}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Speichert…
                </>
              ) : isEdit ? (
                'Speichern'
              ) : (
                'Hinzufügen'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
