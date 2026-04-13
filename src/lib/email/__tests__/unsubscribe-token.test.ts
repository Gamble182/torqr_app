import { describe, it, expect } from 'vitest';
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
  parseUnsubscribePath,
} from '../unsubscribe-token';

describe('generateUnsubscribeToken', () => {
  it('returns a 64-char hex string', () => {
    const token = generateUnsubscribeToken('abc-123');
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for the same input', () => {
    expect(generateUnsubscribeToken('abc-123')).toBe(generateUnsubscribeToken('abc-123'));
  });

  it('differs for different inputs', () => {
    expect(generateUnsubscribeToken('id-1')).not.toBe(generateUnsubscribeToken('id-2'));
  });
});

describe('verifyUnsubscribeToken', () => {
  it('returns true for a valid token', () => {
    const token = generateUnsubscribeToken('cust-xyz');
    expect(verifyUnsubscribeToken('cust-xyz', token)).toBe(true);
  });

  it('returns false for a wrong token', () => {
    expect(verifyUnsubscribeToken('cust-xyz', 'a'.repeat(64))).toBe(false);
  });

  it('returns false for a token from a different id', () => {
    const token = generateUnsubscribeToken('other-id');
    expect(verifyUnsubscribeToken('cust-xyz', token)).toBe(false);
  });
});

describe('parseUnsubscribePath', () => {
  it('splits customerId and token correctly', () => {
    const token = generateUnsubscribeToken('cust-123');
    const result = parseUnsubscribePath(`cust-123.${token}`);
    expect(result).toEqual({ customerId: 'cust-123', token });
  });

  it('returns null when no dot separator', () => {
    expect(parseUnsubscribePath('nodot')).toBeNull();
  });

  it('handles UUIDs with hyphens correctly', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const token = generateUnsubscribeToken(id);
    const result = parseUnsubscribePath(`${id}.${token}`);
    expect(result).toEqual({ customerId: id, token });
  });
});

describe('buildUnsubscribeUrl', () => {
  it('builds a URL containing the customerId', () => {
    const url = buildUnsubscribeUrl('cust-123');
    expect(url).toMatch(/^http:\/\/localhost:3000\/unsubscribe\//);
    expect(url).toContain('cust-123');
  });
});
