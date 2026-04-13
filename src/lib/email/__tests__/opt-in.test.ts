import { describe, it, expect } from 'vitest';
import { computeOptInData } from '../opt-in';

describe('computeOptInData', () => {
  it('confirms opt-in when email present and suppress is false', () => {
    const result = computeOptInData('user@example.com', false);
    expect(result.emailOptIn).toBe('CONFIRMED');
    expect(result.optInConfirmedAt).toBeInstanceOf(Date);
  });

  it('sets NONE when suppress is true', () => {
    const result = computeOptInData('user@example.com', true);
    expect(result.emailOptIn).toBe('NONE');
    expect(result.optInConfirmedAt).toBeNull();
  });

  it('sets NONE when email is null', () => {
    const result = computeOptInData(null, false);
    expect(result.emailOptIn).toBe('NONE');
    expect(result.optInConfirmedAt).toBeNull();
  });

  it('sets NONE when email is empty string', () => {
    const result = computeOptInData('', false);
    expect(result.emailOptIn).toBe('NONE');
    expect(result.optInConfirmedAt).toBeNull();
  });

  it('sets NONE when email is whitespace only', () => {
    const result = computeOptInData('   ', false);
    expect(result.emailOptIn).toBe('NONE');
    expect(result.optInConfirmedAt).toBeNull();
  });
});
