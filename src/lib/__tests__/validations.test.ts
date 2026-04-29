import { describe, expect, it } from 'vitest';
import { betaLeadSchema, demoRequestSchema } from '@/lib/validations';

describe('betaLeadSchema', () => {
  it('akzeptiert minimale gültige Eingabe', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', consent: true });
    expect(result.success).toBe(true);
  });

  it('lehnt fehlende E-Mail ab', () => {
    const result = betaLeadSchema.safeParse({ consent: true });
    expect(result.success).toBe(false);
  });

  it('lehnt ungültige E-Mail ab', () => {
    const result = betaLeadSchema.safeParse({ email: 'invalid', consent: true });
    expect(result.success).toBe(false);
  });

  it('lehnt fehlenden Consent ab', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', consent: false });
    expect(result.success).toBe(false);
  });

  it('akzeptiert SOLO-Tier', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', tierInterest: 'SOLO', consent: true });
    expect(result.success).toBe(true);
  });

  it('lehnt ENTERPRISE-Tier ab (geht über DemoRequest)', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', tierInterest: 'ENTERPRISE' as never, consent: true });
    expect(result.success).toBe(false);
  });

  it('lehnt befüllten Honeypot ab', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', consent: true, website: 'spam' });
    expect(result.success).toBe(false);
  });
});

describe('demoRequestSchema', () => {
  it('akzeptiert minimale gültige Eingabe', () => {
    const result = demoRequestSchema.safeParse({ email: 'test@torqr.de', name: 'Max Mustermann', consent: true });
    expect(result.success).toBe(true);
  });

  it('lehnt fehlenden Namen ab', () => {
    const result = demoRequestSchema.safeParse({ email: 'test@torqr.de', consent: true });
    expect(result.success).toBe(false);
  });

  it('lehnt fehlenden Consent ab', () => {
    const result = demoRequestSchema.safeParse({ email: 'test@torqr.de', name: 'Max', consent: false });
    expect(result.success).toBe(false);
  });

  it('lehnt befüllten Honeypot ab', () => {
    const result = demoRequestSchema.safeParse({ email: 'test@torqr.de', name: 'Max', consent: true, website: 'spam' });
    expect(result.success).toBe(false);
  });
});
