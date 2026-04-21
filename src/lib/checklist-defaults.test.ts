import { describe, it, expect } from 'vitest';
import { CHECKLIST_DEFAULTS } from './checklist-defaults';

const SYSTEM_TYPES = ['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE'];

describe('CHECKLIST_DEFAULTS', () => {
  it('has entries for all four system types', () => {
    SYSTEM_TYPES.forEach((type) => {
      expect(CHECKLIST_DEFAULTS[type]).toBeDefined();
      expect(Array.isArray(CHECKLIST_DEFAULTS[type])).toBe(true);
    });
  });

  it('has at least 5 items per system type', () => {
    SYSTEM_TYPES.forEach((type) => {
      expect(CHECKLIST_DEFAULTS[type].length).toBeGreaterThanOrEqual(5);
    });
  });

  it('has no empty strings in any list', () => {
    SYSTEM_TYPES.forEach((type) => {
      CHECKLIST_DEFAULTS[type].forEach((item) => {
        expect(item.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('falls back to empty array for unknown system type', () => {
    expect(CHECKLIST_DEFAULTS['UNKNOWN'] ?? []).toEqual([]);
  });
});
