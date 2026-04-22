import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin-email';

/**
 * Require the current session user to be an admin.
 * Throws 'Unauthorized' if not authenticated.
 * Throws 'Forbidden' if authenticated but not an admin.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string; name: string }> {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!session.user.email || !isAdminEmail(session.user.email)) {
    throw new Error('Forbidden');
  }

  if (!session.user.id) {
    throw new Error('Unauthorized');
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name ?? '',
  };
}
