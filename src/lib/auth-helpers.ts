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

/**
 * Middleware for API routes that require authentication
 * Returns user info or null if not authenticated
 */
export async function getAuthUser() {
  const session = await auth();
  return session?.user || null;
}

/**
 * Check if user owns a resource
 * @param userId - Current user's ID
 * @param resourceUserId - Resource owner's ID
 * @returns true if user owns resource
 */
export function checkOwnership(userId: string, resourceUserId: string): boolean {
  return userId === resourceUserId;
}
