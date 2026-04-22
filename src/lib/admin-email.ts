/**
 * Check if an email is in the ADMIN_EMAILS env var (comma-separated).
 * Case-insensitive. Returns false if env var is not set.
 *
 * Server-only: ADMIN_EMAILS is not exposed to the client bundle.
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return false;
  return adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}
