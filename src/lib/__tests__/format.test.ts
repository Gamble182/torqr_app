import { describe, expect, it } from 'vitest';
import { formatPartCategory } from '@/lib/format';

describe('formatPartCategory', () => {
  it.each([
    ['SPARE_PART', 'Ersatzteil'],
    ['CONSUMABLE', 'Verbrauchsmaterial'],
    ['TOOL', 'Werkzeug'],
  ] as const)('maps %s → %s', (cat, expected) => {
    expect(formatPartCategory(cat)).toBe(expected);
  });
});
