/**
 * Common units used in maintenance set items and inventory items.
 *
 * Surfaced as suggestions in `<datalist>` elements — users can still type
 * any free-text unit. The DB schema stores `unit` as a plain string, so
 * this list intentionally has no enforcement tier; it's UX-only.
 */
export const COMMON_UNITS = [
  'Stck',
  'Paar',
  'Set',
  'Pack',
  'Rolle',
  'Beutel',
  'l',
  'ml',
  'kg',
  'g',
  'm',
  'cm',
  'mm',
] as const;

export type CommonUnit = (typeof COMMON_UNITS)[number];
