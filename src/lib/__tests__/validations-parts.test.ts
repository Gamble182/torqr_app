import { describe, expect, it } from 'vitest';
import {
  maintenanceSetItemCreateSchema,
  customerSystemOverrideSchema,
  inventoryItemCreateSchema,
  inventoryMovementCreateSchema,
  partsUsedEntrySchema,
} from '@/lib/validations';

describe('maintenanceSetItemCreateSchema', () => {
  it('rejects TOOL category with inventoryItemId', () => {
    const r = maintenanceSetItemCreateSchema.safeParse({
      category: 'TOOL',
      description: 'Werkzeugkoffer',
      quantity: 1,
      unit: 'Stck',
      inventoryItemId: 'acd8177d-6b22-4c82-82b4-331088095493',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('Werkzeug'))).toBe(true);
    }
  });

  it('accepts TOOL without inventoryItemId', () => {
    const r = maintenanceSetItemCreateSchema.safeParse({
      category: 'TOOL',
      description: 'Werkzeugkoffer',
      quantity: 1,
      unit: 'Stck',
    });
    expect(r.success).toBe(true);
  });

  it('accepts SPARE_PART with inventoryItemId', () => {
    const r = maintenanceSetItemCreateSchema.safeParse({
      category: 'SPARE_PART',
      description: 'Injektor',
      quantity: 2,
      unit: 'Stck',
      inventoryItemId: 'acd8177d-6b22-4c82-82b4-331088095493',
    });
    expect(r.success).toBe(true);
  });
});

describe('customerSystemOverrideSchema (discriminated union)', () => {
  it('accepts ADD with required fields', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'ADD',
      category: 'CONSUMABLE',
      description: 'Öl',
      quantity: 0.25,
      unit: 'l',
    });
    expect(r.success).toBe(true);
  });

  it('rejects ADD missing description', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'ADD',
      category: 'CONSUMABLE',
      quantity: 1,
      unit: 'Stck',
    });
    expect(r.success).toBe(false);
  });

  it('rejects ADD with TOOL + inventoryItemId', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'ADD',
      category: 'TOOL',
      description: 'Zange',
      quantity: 1,
      unit: 'Stck',
      inventoryItemId: 'acd8177d-6b22-4c82-82b4-331088095493',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message.includes('Werkzeug'))).toBe(true);
    }
  });

  it('accepts EXCLUDE with excludedSetItemId', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'EXCLUDE',
      excludedSetItemId: 'acd8177d-6b22-4c82-82b4-331088095493',
    });
    expect(r.success).toBe(true);
  });

  it('rejects EXCLUDE missing excludedSetItemId', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'EXCLUDE',
    });
    expect(r.success).toBe(false);
  });

  it('rejects EXCLUDE with ADD fields present', () => {
    const r = customerSystemOverrideSchema.safeParse({
      action: 'EXCLUDE',
      excludedSetItemId: 'acd8177d-6b22-4c82-82b4-331088095493',
      category: 'SPARE_PART',
    });
    expect(r.success).toBe(false);
  });
});

describe('inventoryItemCreateSchema', () => {
  it('accepts minimal description-only entry', () => {
    const r = inventoryItemCreateSchema.safeParse({
      description: 'Dichtung',
    });
    expect(r.success).toBe(true);
  });

  it('rejects client-supplied currentStock (security: only movements mutate stock)', () => {
    const r = inventoryItemCreateSchema.safeParse({
      description: 'Injektor',
      currentStock: 99,
      minStock: 2,
    });
    expect(r.success).toBe(false);
  });

  it('accepts valid minimal input', () => {
    const r = inventoryItemCreateSchema.safeParse({
      description: 'Injektor',
    });
    expect(r.success).toBe(true);
  });
});

describe('inventoryMovementCreateSchema', () => {
  it('rejects MAINTENANCE_USE (only RESTOCK or CORRECTION allowed via manual endpoint)', () => {
    const r = inventoryMovementCreateSchema.safeParse({
      reason: 'MAINTENANCE_USE',
      quantityChange: -1,
    });
    expect(r.success).toBe(false);
  });

  it('rejects quantityChange = 0', () => {
    const r = inventoryMovementCreateSchema.safeParse({
      reason: 'CORRECTION',
      quantityChange: 0,
    });
    expect(r.success).toBe(false);
  });

  it('accepts RESTOCK with positive delta', () => {
    const r = inventoryMovementCreateSchema.safeParse({
      reason: 'RESTOCK',
      quantityChange: 10,
    });
    expect(r.success).toBe(true);
  });

  it('accepts CORRECTION with negative delta', () => {
    const r = inventoryMovementCreateSchema.safeParse({
      reason: 'CORRECTION',
      quantityChange: -3,
      note: 'Inventur',
    });
    expect(r.success).toBe(true);
  });
});

describe('partsUsedEntrySchema', () => {
  it('accepts a DEFAULT entry', () => {
    const r = partsUsedEntrySchema.safeParse({
      sourceType: 'DEFAULT',
      setItemId: 'acd8177d-6b22-4c82-82b4-331088095493',
      description: 'Injektor',
      quantity: 1,
      unit: 'Stck',
    });
    expect(r.success).toBe(true);
  });

  it('rejects unknown sourceType', () => {
    const r = partsUsedEntrySchema.safeParse({
      sourceType: 'UNKNOWN',
      description: 'x',
      quantity: 1,
      unit: 'Stck',
    });
    expect(r.success).toBe(false);
  });

  it('rejects DEFAULT without setItemId', () => {
    const r = partsUsedEntrySchema.safeParse({
      sourceType: 'DEFAULT',
      description: 'x',
      quantity: 1,
      unit: 'Stck',
    });
    expect(r.success).toBe(false);
  });

  it('rejects OVERRIDE_ADD without overrideId', () => {
    const r = partsUsedEntrySchema.safeParse({
      sourceType: 'OVERRIDE_ADD',
      description: 'x',
      quantity: 1,
      unit: 'Stck',
    });
    expect(r.success).toBe(false);
  });

  it('accepts DEFAULT with setItemId', () => {
    const r = partsUsedEntrySchema.safeParse({
      sourceType: 'DEFAULT',
      setItemId: 'acd8177d-6b22-4c82-82b4-331088095493',
      description: 'Injektor',
      quantity: 2,
      unit: 'Stck',
    });
    expect(r.success).toBe(true);
  });

  it('accepts AD_HOC without any linkage id', () => {
    const r = partsUsedEntrySchema.safeParse({
      sourceType: 'AD_HOC',
      description: 'Zusatzteil',
      quantity: 1,
      unit: 'Stck',
    });
    expect(r.success).toBe(true);
  });
});
