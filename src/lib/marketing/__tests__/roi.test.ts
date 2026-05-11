import { describe, expect, it } from 'vitest';
import {
  computeRoi,
  DEFAULT_CONTRACTS,
  DEFAULT_HOURLY_RATE_EUR,
  HOURS_SAVED_PER_CONTRACT_PER_WEEK,
  SOLO_TIER_ANNUAL_PRICE_EUR,
  WORK_WEEKS_PER_YEAR,
} from '@/lib/marketing/roi';

describe('computeRoi', () => {
  it('matches the existing static-copy baseline (50 contracts, 40 €/h)', () => {
    const result = computeRoi({
      contracts: DEFAULT_CONTRACTS,
      hourlyRate: DEFAULT_HOURLY_RATE_EUR,
    });
    expect(result.savedHoursPerYear).toBeCloseTo(288, 5);
    expect(result.annualValueEur).toBeCloseTo(11520, 5);
    expect(result.roiFactor).toBeCloseTo(11520 / SOLO_TIER_ANNUAL_PRICE_EUR, 5);
    expect(result.breakEvenWeeks).toBeCloseTo(
      52 / (11520 / SOLO_TIER_ANNUAL_PRICE_EUR),
      5,
    );
  });

  it('scales saved hours linearly with contract count', () => {
    const a = computeRoi({ contracts: 50, hourlyRate: 40 });
    const b = computeRoi({ contracts: 100, hourlyRate: 40 });
    expect(b.savedHoursPerYear).toBeCloseTo(a.savedHoursPerYear * 2, 5);
    expect(b.annualValueEur).toBeCloseTo(a.annualValueEur * 2, 5);
    expect(b.roiFactor).toBeCloseTo(a.roiFactor * 2, 5);
  });

  it('scales annual value linearly with hourly rate but leaves saved hours unchanged', () => {
    const a = computeRoi({ contracts: 50, hourlyRate: 40 });
    const b = computeRoi({ contracts: 50, hourlyRate: 80 });
    expect(b.savedHoursPerYear).toBeCloseTo(a.savedHoursPerYear, 5);
    expect(b.annualValueEur).toBeCloseTo(a.annualValueEur * 2, 5);
    expect(b.roiFactor).toBeCloseTo(a.roiFactor * 2, 5);
  });

  it('returns roiFactor 0 and Infinity break-even for zero contracts', () => {
    const result = computeRoi({ contracts: 0, hourlyRate: 40 });
    expect(result.savedHoursPerYear).toBe(0);
    expect(result.annualValueEur).toBe(0);
    expect(result.roiFactor).toBe(0);
    expect(result.breakEvenWeeks).toBe(Infinity);
  });

  it('uses the documented constants', () => {
    expect(HOURS_SAVED_PER_CONTRACT_PER_WEEK).toBe(0.12);
    expect(WORK_WEEKS_PER_YEAR).toBe(48);
    expect(SOLO_TIER_ANNUAL_PRICE_EUR).toBe(348);
  });
});
