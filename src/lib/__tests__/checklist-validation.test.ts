import { describe, it, expect } from 'vitest';
import { checklistSnapshotSchema, checklistItemCreateSchema } from '../validations';

describe('checklistSnapshotSchema', () => {
  it('accepts a valid snapshot with items', () => {
    const result = checklistSnapshotSchema.safeParse({
      items: [
        { label: 'Brenner reinigen', checked: true, isCustom: false },
        { label: 'Eigener Punkt', checked: false, isCustom: true },
      ],
      confirmedAt: '2026-04-21T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty items array', () => {
    const result = checklistSnapshotSchema.safeParse({
      items: [],
      confirmedAt: '2026-04-21T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an item with an empty label', () => {
    const result = checklistSnapshotSchema.safeParse({
      items: [{ label: '', checked: true, isCustom: false }],
      confirmedAt: '2026-04-21T10:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid confirmedAt date string', () => {
    const result = checklistSnapshotSchema.safeParse({
      items: [],
      confirmedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('checklistItemCreateSchema', () => {
  it('accepts a valid label', () => {
    const result = checklistItemCreateSchema.safeParse({ label: 'Filter prüfen' });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from label', () => {
    const result = checklistItemCreateSchema.safeParse({ label: '  Filter prüfen  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.label).toBe('Filter prüfen');
  });

  it('rejects an empty label', () => {
    const result = checklistItemCreateSchema.safeParse({ label: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only label', () => {
    const result = checklistItemCreateSchema.safeParse({ label: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a label longer than 200 characters', () => {
    const result = checklistItemCreateSchema.safeParse({ label: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });
});
