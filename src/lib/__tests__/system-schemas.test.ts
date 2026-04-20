import { describe, it, expect } from 'vitest';
import { catalogCreateSchema, customerSystemCreateSchema, maintenanceCreateSchema } from '../validations';

describe('catalogCreateSchema', () => {
  it('accepts a valid HEATING entry', () => {
    const result = catalogCreateSchema.safeParse({
      systemType: 'HEATING',
      manufacturer: 'Vaillant',
      name: 'ecoTEC plus',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid AC entry with acSubtype', () => {
    const result = catalogCreateSchema.safeParse({
      systemType: 'AC',
      manufacturer: 'Daikin',
      name: 'Perfera 2.5kW',
      acSubtype: 'SINGLE_SPLIT',
    });
    expect(result.success).toBe(true);
  });

  it('rejects AC entry without acSubtype', () => {
    const result = catalogCreateSchema.safeParse({
      systemType: 'AC',
      manufacturer: 'Daikin',
      name: 'Perfera 2.5kW',
    });
    expect(result.success).toBe(false);
  });

  it('accepts WATER_TREATMENT without acSubtype', () => {
    const result = catalogCreateSchema.safeParse({
      systemType: 'WATER_TREATMENT',
      manufacturer: 'BWT',
      name: 'Perla Silk M',
    });
    expect(result.success).toBe(true);
  });
});

describe('customerSystemCreateSchema', () => {
  it('accepts valid minimal input', () => {
    const result = customerSystemCreateSchema.safeParse({
      catalogId: '123e4567-e89b-12d3-a456-426614174000',
      customerId: '123e4567-e89b-12d3-a456-426614174001',
      maintenanceInterval: '12',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing catalogId', () => {
    const result = customerSystemCreateSchema.safeParse({
      customerId: '123e4567-e89b-12d3-a456-426614174001',
      maintenanceInterval: '12',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid maintenanceInterval', () => {
    const result = customerSystemCreateSchema.safeParse({
      catalogId: '123e4567-e89b-12d3-a456-426614174000',
      customerId: '123e4567-e89b-12d3-a456-426614174001',
      maintenanceInterval: '7',
    });
    expect(result.success).toBe(false);
  });
});

describe('maintenanceCreateSchema', () => {
  it('uses systemId not heaterId', () => {
    const result = maintenanceCreateSchema.safeParse({
      systemId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects heaterId (old field)', () => {
    const result = maintenanceCreateSchema.safeParse({
      heaterId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(false);
  });
});
