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
import { inventoryItemCreateSchema } from '@/lib/validations';
import {
  useCreateInventoryItem,
  useUpdateInventoryItem,
  type InventoryItem,
} from '@/hooks/useInventory';
import { COMMON_UNITS } from '@/lib/units';

interface InventoryItemFormProps {
  open: boolean;
  onClose: () => void;
  item?: InventoryItem;
}

interface FormValues {
  description: string;
  articleNumber?: string;
  unit: string;
  minStock: number;
}

export function InventoryItemForm({ open, onClose, item }: InventoryItemFormProps) {
  const isEdit = Boolean(item);
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();

  const defaultValues = useMemo<FormValues>(() => {
    if (item) {
      return {
        description: item.description,
        articleNumber: item.articleNumber ?? '',
        unit: item.unit,
        minStock: parseFloat(item.minStock),
      };
    }
    return {
      description: '',
      articleNumber: '',
      unit: 'Stck',
      minStock: 0,
    };
  }, [item]);

  // zod's `.default()` produces input/output type divergence (input optional,
  // output required). Cast to `Resolver<FormValues>` so RHF's generic stays
  // aligned with the form values we actually submit. Same pattern as Task 24.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(inventoryItemCreateSchema) as Resolver<FormValues>,
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  if (!open) return null;

  const onSubmit = async (values: FormValues) => {
    const payload = {
      description: values.description,
      articleNumber: values.articleNumber?.trim() ? values.articleNumber.trim() : undefined,
      unit: values.unit,
      minStock: values.minStock,
    };

    try {
      if (isEdit && item) {
        await updateMutation.mutateAsync({ id: item.id, body: payload });
        toast.success('Lagerteil aktualisiert');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Lagerteil angelegt');
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
            {isEdit ? 'Lagerteil bearbeiten' : 'Neues Lagerteil'}
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
            <Label htmlFor="description">Bezeichnung *</Label>
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
              <Label htmlFor="unit">Einheit *</Label>
              <Input
                id="unit"
                list="common-units-inventory"
                {...register('unit')}
                placeholder="Stck"
              />
              <datalist id="common-units-inventory">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minStock">Mindestmenge *</Label>
              <Input
                id="minStock"
                type="number"
                step="0.01"
                min="0"
                {...register('minStock', { valueAsNumber: true })}
              />
              {errors.minStock && (
                <p className="text-sm text-destructive">{errors.minStock.message}</p>
              )}
            </div>
          </div>

          {!isEdit && (
            <p className="text-xs text-muted-foreground">
              Der Anfangsbestand ist 0 und wird über Lagerbewegungen verändert.
            </p>
          )}

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
                'Anlegen'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
