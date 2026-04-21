import { auth } from '@/lib/auth';

/**
 * Get authenticated user from session
 * @throws Error if user is not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

