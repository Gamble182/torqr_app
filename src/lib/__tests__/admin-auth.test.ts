import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAdminEmail } from '@/lib/admin-auth';

describe('isAdminEmail', () => {
  beforeEach(() => {
    delete process.env.ADMIN_EMAILS;
  });

  it('returns true when email is in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@torqr.de,other@torqr.de';
    expect(isAdminEmail('admin@torqr.de')).toBe(true);
  });

  it('returns true for second email in list', () => {
    process.env.ADMIN_EMAILS = 'admin@torqr.de,other@torqr.de';
    expect(isAdminEmail('other@torqr.de')).toBe(true);
  });

  it('returns false when email is not in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@torqr.de';
    expect(isAdminEmail('notadmin@torqr.de')).toBe(false);
  });

  it('returns false when ADMIN_EMAILS is not set', () => {
    delete process.env.ADMIN_EMAILS;
    expect(isAdminEmail('admin@torqr.de')).toBe(false);
  });

  it('is case-insensitive', () => {
    process.env.ADMIN_EMAILS = 'Admin@Torqr.de';
    expect(isAdminEmail('admin@torqr.de')).toBe(true);
  });
});
