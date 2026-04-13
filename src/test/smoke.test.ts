import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('resolves env vars from setup file', () => {
    expect(process.env.UNSUBSCRIBE_SECRET).toBeDefined();
  });
});
