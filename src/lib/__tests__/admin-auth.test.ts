// Tests for isAdminEmail helper
// We test the isAdminEmail function which checks ADMIN_EMAILS env var

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('isAdminEmail', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env for each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns true when email is in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@torqr.de,other@torqr.de';
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('admin@torqr.de')).toBe(true);
  });

  it('returns true for second email in list', () => {
    process.env.ADMIN_EMAILS = 'admin@torqr.de,other@torqr.de';
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('other@torqr.de')).toBe(true);
  });

  it('returns false when email is not in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@torqr.de';
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('notadmin@torqr.de')).toBe(false);
  });

  it('returns false when ADMIN_EMAILS is not set', () => {
    delete process.env.ADMIN_EMAILS;
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('admin@torqr.de')).toBe(false);
  });

  it('is case-insensitive', () => {
    process.env.ADMIN_EMAILS = 'Admin@Torqr.de';
    const { isAdminEmail } = require('@/lib/admin-auth');
    expect(isAdminEmail('admin@torqr.de')).toBe(true);
  });
});
