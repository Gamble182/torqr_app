/**
 * Check if an email is in the ADMIN_EMAILS env var (comma-separated).
 * Case-insensitive. Returns false if env var is not set.
 */
export function isAdminEmail(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return false;
  return adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

/**
 * Require the current session user to be an admin.
 * Throws 'Unauthorized' if not authenticated.
 * Throws 'Forbidden' if authenticated but not an admin.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string; name: string }> {
  // Import auth only when needed to avoid issues in test environments
  const { auth } = await import('@/lib/auth');
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!session.user.email || !isAdminEmail(session.user.email)) {
    throw new Error('Forbidden');
  }

  return {
    userId: session.user.id as string,
    email: session.user.email,
    name: session.user.name ?? '',
  };
}
