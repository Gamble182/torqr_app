import { Badge } from '@/components/ui/badge';

/**
 * Stock-level badge for an inventory item.
 *
 * `currentStock` and `minStock` are accepted as `string | number` to match
 * the wire format from `useInventoryItems` (Prisma's `Decimal` is serialized
 * as a string by `Decimal.toJSON()`, see `src/hooks/useInventory.ts`).
 *
 * Thresholds:
 *   - `currentStock <= 0`           → "Leer"    (rot)
 *   - `currentStock <  minStock`    → "Niedrig" (amber)
 *   - else                          → "OK"      (outline)
 */
export function InventoryStatusBadge({
  currentStock,
  minStock,
}: {
  currentStock: string | number;
  minStock: string | number;
}) {
  const curr = Number(currentStock);
  const min = Number(minStock);
  if (curr <= 0) return <Badge variant="destructive">Leer</Badge>;
  if (curr < min)
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-transparent">
        Niedrig
      </Badge>
    );
  return <Badge variant="outline">OK</Badge>;
}
