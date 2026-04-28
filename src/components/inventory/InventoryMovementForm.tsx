'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Loader2Icon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateMovement,
  type MovementReasonInput,
} from '@/hooks/useInventoryMovements';

interface InventoryMovementFormProps {
  open: boolean;
  onClose: () => void;
  itemId: string;
  reason: MovementReasonInput;
  unit: string;
}

interface FormValues {
  quantityChange: number;
  note?: string;
}

export function InventoryMovementForm({
  open,
  onClose,
  itemId,
  reason,
  unit,
}: InventoryMovementFormProps) {
  const createMutation = useCreateMovement(itemId);

  const defaultValues = useMemo<FormValues>(
    () => ({
      quantityChange: reason === 'RESTOCK' ? 1 : 0,
      note: '',
    }),
    [reason],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  if (!open) return null;

  const isRestock = reason === 'RESTOCK';
  const title = isRestock ? 'Zugang buchen' : 'Korrektur buchen';

  const onSubmit = async (values: FormValues) => {
    const qty = Number(values.quantityChange);

    if (Number.isNaN(qty) || qty === 0) {
      toast.error('Menge darf nicht 0 sein');
      return;
    }
    if (isRestock && qty <= 0) {
      toast.error('Zugang muss eine positive Menge haben');
      return;
    }

    try {
      await createMutation.mutateAsync({
        reason,
        quantityChange: qty,
        note: values.note?.trim() ? values.note.trim() : undefined,
      });
      toast.success(isRestock ? 'Zugang gebucht' : 'Korrektur gebucht');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Buchen: ${message}`);
    }
  };

  const isPending = createMutation.isPending || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
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
            <Label htmlFor="quantityChange">
              {isRestock ? `Menge (${unit})` : `Menge (+ = Zugang, − = Abgang)`}
            </Label>
            <Input
              id="quantityChange"
              type="number"
              step="0.01"
              min={isRestock ? '0.01' : undefined}
              {...register('quantityChange', { valueAsNumber: true })}
            />
            {errors.quantityChange && (
              <p className="text-sm text-destructive">{errors.quantityChange.message}</p>
            )}
            {!isRestock && (
              <p className="text-xs text-muted-foreground">
                Positive Menge bucht zu, negative bucht ab. 0 ist nicht zulässig.
              </p>
            )}
            {isRestock && (
              <p className="text-xs text-muted-foreground">
                Wird als Zugang gebucht und aktualisiert „Letzter Zugang".
              </p>
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
                  Bucht…
                </>
              ) : (
                'Buchen'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
