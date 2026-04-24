import { prisma } from '@/lib/prisma';
import type { PartCategory } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export type EffectivePart = {
  source: 'DEFAULT' | 'OVERRIDE_ADD';
  setItemId?: string;
  overrideId?: string;
  category: PartCategory;
  description: string;
  articleNumber: string | null;
  quantity: Prisma.Decimal;
  unit: string;
  required: boolean;
  note: string | null;
  sortOrder: number;
  inventoryItem: {
    id: string;
    currentStock: Prisma.Decimal;
    minStock: Prisma.Decimal;
    unit: string;
    articleNumber: string | null;
    description: string;
  } | null;
};

/**
 * Resolves the effective parts list for a customer system.
 *
 * Returns DEFAULT set items minus EXCLUDE overrides, plus ADD overrides,
 * sorted ascending by sortOrder. Returns [] if the system does not exist
 * or belongs to a different company (tenant safety), or if no MaintenanceSet
 * has been configured for the system's catalog entry.
 *
 * @param customerSystemId - The customer system to resolve parts for
 * @param companyId - Caller's tenant — used to scope both the system lookup
 *                   and the maintenance set lookup
 */
export async function getEffectivePartsForSystem(
  customerSystemId: string,
  companyId: string,
): Promise<EffectivePart[]> {
  const system = await prisma.customerSystem.findFirst({
    where: { id: customerSystemId, companyId },
    select: { id: true, catalogId: true },
  });
  if (!system) return [];

  const [set, overrides] = await Promise.all([
    prisma.maintenanceSet.findUnique({
      where: { companyId_catalogId: { companyId, catalogId: system.catalogId } },
      include: {
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                currentStock: true,
                minStock: true,
                unit: true,
                articleNumber: true,
                description: true,
              },
            },
          },
        },
      },
    }),
    prisma.customerSystemPartOverride.findMany({
      where: { customerSystemId },
      include: {
        inventoryItem: {
          select: {
            id: true,
            currentStock: true,
            minStock: true,
            unit: true,
            articleNumber: true,
            description: true,
          },
        },
      },
    }),
  ]);

  const excludedIds = new Set(
    overrides
      .filter((o) => o.action === 'EXCLUDE' && o.excludedSetItemId)
      .map((o) => o.excludedSetItemId!),
  );

  const defaults: EffectivePart[] = (set?.items ?? [])
    .filter((i) => !excludedIds.has(i.id))
    .map((i) => ({
      source: 'DEFAULT',
      setItemId: i.id,
      category: i.category,
      description: i.description,
      articleNumber: i.articleNumber,
      quantity: i.quantity,
      unit: i.unit,
      required: i.required,
      note: i.note,
      sortOrder: i.sortOrder,
      inventoryItem: i.inventoryItem,
    }));

  const adds: EffectivePart[] = overrides
    .filter((o) => o.action === 'ADD')
    .map((o) => {
      if (!o.category || !o.description || !o.quantity || !o.unit) {
        throw new Error(
          `ADD override ${o.id} is missing required fields (category/description/quantity/unit)`,
        );
      }
      return {
        source: 'OVERRIDE_ADD' as const,
        overrideId: o.id,
        category: o.category,
        description: o.description,
        articleNumber: o.articleNumber,
        quantity: o.quantity,
        unit: o.unit,
        required: o.required,
        note: o.note,
        sortOrder: o.sortOrder,
        inventoryItem: o.inventoryItem,
      };
    });

  return [...defaults, ...adds].sort((a, b) => a.sortOrder - b.sortOrder);
}
