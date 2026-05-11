// src/lib/marketing/__tests__/wartungsintervall.test.ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  computeWartungsintervall,
  DEFAULT_SYSTEM_TYPE,
  DEFAULT_BAUJAHR_OFFSET_YEARS,
  MIN_BAUJAHR,
  OLD_SYSTEM_THRESHOLD_YEARS,
  SYSTEM_TYPE_KEYS,
  type SystemTypeKey,
} from '@/lib/marketing/wartungsintervall';

const FIXED_NOW = new Date('2026-05-11T12:00:00Z');

describe('computeWartungsintervall', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 12 months mandatory for HEATING with KÜO/DIN reference', () => {
    const r = computeWartungsintervall({ systemType: 'HEATING', baujahr: 2020 });
    expect(r.empfohlenInMonaten).toBe(12);
    expect(r.gesetzlichePflicht).toBe(true);
    expect(r.begruendung).toMatch(/KÜO/);
    expect(r.begruendung).toMatch(/DIN 4795/);
    expect(r.isAltAnlage).toBe(false);
  });

  it('returns 12 months mandatory for AC with F-Gas reference', () => {
    const r = computeWartungsintervall({ systemType: 'AC', baujahr: 2022 });
    expect(r.empfohlenInMonaten).toBe(12);
    expect(r.gesetzlichePflicht).toBe(true);
    expect(r.begruendung).toMatch(/F-Gas|517\/2014/);
  });

  it('returns 12 months optional for WATER_TREATMENT', () => {
    const r = computeWartungsintervall({ systemType: 'WATER_TREATMENT', baujahr: 2018 });
    expect(r.empfohlenInMonaten).toBe(12);
    expect(r.gesetzlichePflicht).toBe(false);
    expect(r.begruendung).toMatch(/Trinkwasser/);
  });

  it('returns 24 months optional for ENERGY_STORAGE with Anoden reference', () => {
    const r = computeWartungsintervall({ systemType: 'ENERGY_STORAGE', baujahr: 2015 });
    expect(r.empfohlenInMonaten).toBe(24);
    expect(r.gesetzlichePflicht).toBe(false);
    expect(r.begruendung).toMatch(/Anode/);
    expect(r.isAltAnlage).toBe(false);
  });

  it('appends Anlagenalter-Hinweis when system is >= 15 years old (HEATING)', () => {
    const r = computeWartungsintervall({ systemType: 'HEATING', baujahr: 2026 - 15 });
    expect(r.isAltAnlage).toBe(true);
    expect(r.empfohlenInMonaten).toBe(12);
    expect(r.begruendung).toMatch(/Anlagenalter von 15 Jahren/);
    expect(r.begruendung).toMatch(/Sicht- und Funktionskontrollen/);
  });

  it('does NOT append Anlagenalter-Hinweis when system is 14 years old', () => {
    const r = computeWartungsintervall({ systemType: 'HEATING', baujahr: 2026 - 14 });
    expect(r.isAltAnlage).toBe(false);
    expect(r.begruendung).not.toMatch(/Sicht- und Funktionskontrollen/);
  });

  it('throws RangeError for baujahr in the future', () => {
    expect(() =>
      computeWartungsintervall({ systemType: 'HEATING', baujahr: 2027 }),
    ).toThrow(RangeError);
  });

  it('throws RangeError for baujahr before MIN_BAUJAHR', () => {
    expect(() =>
      computeWartungsintervall({ systemType: 'HEATING', baujahr: 1899 }),
    ).toThrow(RangeError);
  });

  it('throws RangeError for non-integer baujahr', () => {
    expect(() =>
      computeWartungsintervall({ systemType: 'HEATING', baujahr: 2020.5 }),
    ).toThrow(RangeError);
  });

  it('throws RangeError for NaN baujahr', () => {
    expect(() =>
      computeWartungsintervall({ systemType: 'HEATING', baujahr: Number.NaN }),
    ).toThrow(RangeError);
  });

  it('throws RangeError for Infinity baujahr', () => {
    expect(() =>
      computeWartungsintervall({ systemType: 'HEATING', baujahr: Number.POSITIVE_INFINITY }),
    ).toThrow(RangeError);
  });

  it('exposes SYSTEM_TYPE_KEYS with all 4 SystemType enum values', () => {
    const expected: SystemTypeKey[] = ['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE'];
    expect(SYSTEM_TYPE_KEYS).toEqual(expected);
  });

  it('exposes documented defaults and constants', () => {
    expect(DEFAULT_SYSTEM_TYPE).toBe('HEATING');
    expect(DEFAULT_BAUJAHR_OFFSET_YEARS).toBe(5);
    expect(MIN_BAUJAHR).toBe(1900);
    expect(OLD_SYSTEM_THRESHOLD_YEARS).toBe(15);
  });
});
