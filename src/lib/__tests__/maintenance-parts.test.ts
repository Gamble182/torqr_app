import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Prisma } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customerSystem: {
      findFirst: vi.fn(),
    },
    maintenanceSet: {
      findUnique: vi.fn(),
    },
    customerSystemPartOverride: {
      findMany: vi.fn(),
    },
  },
}));

import { getEffectivePartsForSystem } from '@/lib/maintenance-parts';
import { prisma } from '@/lib/prisma';

// Cast string literals to Prisma.Decimal for mock data — avoids parseFloat
// precision loss. The `as unknown as` double-cast is intentional: Prisma.Decimal
// is a class, not assignable from string directly, but test mocks don't
// exercise arithmetic so the shape is sufficient.
const d = (v: string) => v as unknown as Prisma.Decimal;

const SYSTEM_ID = 'sys-1';
const COMPANY_ID = 'co-1';
const CATALOG_ID = 'cat-1';

const mockSystem = { id: SYSTEM_ID, catalogId: CATALOG_ID };

describe('getEffectivePartsForSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no MaintenanceSet exists', async () => {
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(mockSystem as never);
    vi.mocked(prisma.maintenanceSet.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.customerSystemPartOverride.findMany).mockResolvedValue([]);

    const result = await getEffectivePartsForSystem(SYSTEM_ID, COMPANY_ID);

    expect(result).toEqual([]);
  });

  it('returns default set items when no overrides', async () => {
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(mockSystem as never);
    vi.mocked(prisma.maintenanceSet.findUnique).mockResolvedValue({
      id: 'set-1',
      companyId: COMPANY_ID,
      catalogId: CATALOG_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item-1',
          maintenanceSetId: 'set-1',
          category: 'SPARE_PART',
          description: 'Injektor',
          articleNumber: null,
          quantity: d('1'),
          unit: 'Stck',
          required: true,
          note: null,
          sortOrder: 0,
          inventoryItemId: null,
          createdAt: new Date(),
          inventoryItem: null,
        },
      ],
    } as never);
    vi.mocked(prisma.customerSystemPartOverride.findMany).mockResolvedValue([]);

    const result = await getEffectivePartsForSystem(SYSTEM_ID, COMPANY_ID);

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('DEFAULT');
    expect(result[0].description).toBe('Injektor');
  });

  it('includes ADD overrides', async () => {
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(mockSystem as never);
    vi.mocked(prisma.maintenanceSet.findUnique).mockResolvedValue({
      id: 'set-1',
      companyId: COMPANY_ID,
      catalogId: CATALOG_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    } as never);
    vi.mocked(prisma.customerSystemPartOverride.findMany).mockResolvedValue([
      {
        id: 'override-1',
        customerSystemId: SYSTEM_ID,
        action: 'ADD',
        category: 'CONSUMABLE',
        description: 'Öl',
        articleNumber: null,
        quantity: d('0.5'),
        unit: 'l',
        required: false,
        note: null,
        sortOrder: 0,
        inventoryItemId: null,
        excludedSetItemId: null,
        createdAt: new Date(),
        inventoryItem: null,
      },
    ] as never);

    const result = await getEffectivePartsForSystem(SYSTEM_ID, COMPANY_ID);

    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('OVERRIDE_ADD');
    expect(result[0].overrideId).toBe('override-1');
  });

  it('suppresses default items via EXCLUDE overrides', async () => {
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(mockSystem as never);
    vi.mocked(prisma.maintenanceSet.findUnique).mockResolvedValue({
      id: 'set-1',
      companyId: COMPANY_ID,
      catalogId: CATALOG_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item-X',
          maintenanceSetId: 'set-1',
          category: 'SPARE_PART',
          description: 'Zündelektrode',
          articleNumber: null,
          quantity: d('1'),
          unit: 'Stck',
          required: true,
          note: null,
          sortOrder: 0,
          inventoryItemId: null,
          createdAt: new Date(),
          inventoryItem: null,
        },
      ],
    } as never);
    vi.mocked(prisma.customerSystemPartOverride.findMany).mockResolvedValue([
      {
        id: 'override-excl-1',
        customerSystemId: SYSTEM_ID,
        action: 'EXCLUDE',
        category: null,
        description: null,
        articleNumber: null,
        quantity: null,
        unit: null,
        required: false,
        note: null,
        sortOrder: 0,
        inventoryItemId: null,
        excludedSetItemId: 'item-X',
        createdAt: new Date(),
        inventoryItem: null,
      },
    ] as never);

    const result = await getEffectivePartsForSystem(SYSTEM_ID, COMPANY_ID);

    expect(result).toEqual([]);
  });

  it('combines defaults + ADDs minus EXCLUDEs, sorted by sortOrder', async () => {
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(mockSystem as never);
    vi.mocked(prisma.maintenanceSet.findUnique).mockResolvedValue({
      id: 'set-1',
      companyId: COMPANY_ID,
      catalogId: CATALOG_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item-A',
          maintenanceSetId: 'set-1',
          category: 'SPARE_PART',
          description: 'A',
          articleNumber: null,
          quantity: d('1'),
          unit: 'Stck',
          required: true,
          note: null,
          sortOrder: 3,
          inventoryItemId: null,
          createdAt: new Date(),
          inventoryItem: null,
        },
        {
          id: 'item-B',
          maintenanceSetId: 'set-1',
          category: 'CONSUMABLE',
          description: 'B',
          articleNumber: null,
          quantity: d('1'),
          unit: 'Stck',
          required: true,
          note: null,
          sortOrder: 1,
          inventoryItemId: null,
          createdAt: new Date(),
          inventoryItem: null,
        },
      ],
    } as never);
    vi.mocked(prisma.customerSystemPartOverride.findMany).mockResolvedValue([
      {
        id: 'override-excl-A',
        customerSystemId: SYSTEM_ID,
        action: 'EXCLUDE',
        category: null,
        description: null,
        articleNumber: null,
        quantity: null,
        unit: null,
        required: false,
        note: null,
        sortOrder: 0,
        inventoryItemId: null,
        excludedSetItemId: 'item-A',
        createdAt: new Date(),
        inventoryItem: null,
      },
      {
        id: 'override-add-C',
        customerSystemId: SYSTEM_ID,
        action: 'ADD',
        category: 'TOOL',
        description: 'C',
        articleNumber: null,
        quantity: d('1'),
        unit: 'Stck',
        required: false,
        note: null,
        sortOrder: 2,
        inventoryItemId: null,
        excludedSetItemId: null,
        createdAt: new Date(),
        inventoryItem: null,
      },
    ] as never);

    const result = await getEffectivePartsForSystem(SYSTEM_ID, COMPANY_ID);

    expect(result).toHaveLength(2);
    expect(result[0].description).toBe('B'); // sortOrder 1
    expect(result[1].description).toBe('C'); // sortOrder 2
  });

  it('returns empty and never throws when system is not found', async () => {
    vi.mocked(prisma.customerSystem.findFirst).mockResolvedValue(null);

    const result = await getEffectivePartsForSystem(SYSTEM_ID, COMPANY_ID);

    expect(result).toEqual([]);
    expect(prisma.maintenanceSet.findUnique).not.toHaveBeenCalled();
    expect(prisma.customerSystemPartOverride.findMany).not.toHaveBeenCalled();
  });
});
