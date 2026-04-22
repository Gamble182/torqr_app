import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export interface AuthContext {
  userId: string;
  companyId: string;
  role: UserRole;
  email: string;
  name: string;
}

/**
 * Get authenticated user with company context.
 * Loads role and companyId from the database (not from JWT) to ensure freshness.
 * @throws Error('Unauthorized') if not authenticated or account is deactivated
 */
export async function requireAuth(): Promise<AuthContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true, isActive: true, email: true, name: true },
  });

  if (!user || !user.isActive) {
    throw new Error('Unauthorized');
  }

  return {
    userId: session.user.id,
    companyId: user.companyId,
    role: user.role,
    email: user.email,
    name: user.name,
  };
}

/**
 * Require OWNER role. Use for owner-only operations
 * (employee management, company settings, delete actions).
 * @throws Error('Forbidden') if user is not an OWNER
 */
export async function requireOwner(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (ctx.role !== 'OWNER') {
    throw new Error('Forbidden');
  }
  return ctx;
}

/**
 * Require one of the specified roles.
 * @throws Error('Forbidden') if user's role is not in the allowed list
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!allowedRoles.includes(ctx.role)) {
    throw new Error('Forbidden');
  }
  return ctx;
}
