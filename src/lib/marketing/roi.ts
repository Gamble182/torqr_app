export const HOURS_SAVED_PER_CONTRACT_PER_WEEK = 0.12;
export const WORK_WEEKS_PER_YEAR = 48;
export const SOLO_TIER_ANNUAL_PRICE_EUR = 348;

export const DEFAULT_CONTRACTS = 50;
export const DEFAULT_HOURLY_RATE_EUR = 40;

export const MIN_CONTRACTS = 10;
export const MAX_CONTRACTS = 500;
export const MIN_HOURLY_RATE_EUR = 20;
export const MAX_HOURLY_RATE_EUR = 150;

export interface RoiInput {
  contracts: number;
  hourlyRate: number;
}

export interface RoiResult {
  savedHoursPerYear: number;
  annualValueEur: number;
  roiFactor: number;
  breakEvenWeeks: number;
}

export function computeRoi({ contracts, hourlyRate }: RoiInput): RoiResult {
  const savedHoursPerYear =
    contracts * HOURS_SAVED_PER_CONTRACT_PER_WEEK * WORK_WEEKS_PER_YEAR;
  const annualValueEur = savedHoursPerYear * hourlyRate;
  const roiFactor =
    annualValueEur === 0 ? 0 : annualValueEur / SOLO_TIER_ANNUAL_PRICE_EUR;
  const breakEvenWeeks = roiFactor === 0 ? Infinity : 52 / roiFactor;
  return { savedHoursPerYear, annualValueEur, roiFactor, breakEvenWeeks };
}
