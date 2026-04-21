/**
 * Shared display labels and constants used across the app.
 */

/** Maps SystemType enum values to German display labels */
export const SYSTEM_TYPE_LABELS: Record<string, string> = {
  HEATING: 'Heizung',
  AC: 'Klimaanlage',
  WATER_TREATMENT: 'Wasseraufbereitung',
  ENERGY_STORAGE: 'Energiespeicher',
};

/** Maps EmailType enum values to German display labels */
export const EMAIL_TYPE_LABELS: Record<string, string> = {
  OPT_IN_CONFIRMATION: 'Opt-in',
  REMINDER_1_WEEK: '1 Woche',
  REMINDER_4_WEEKS: '4 Wochen',
  WEEKLY_SUMMARY: 'Wochenübersicht',
  BOOKING_CONFIRMATION: 'Terminbestätigung',
};
