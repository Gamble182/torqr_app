import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { passwordSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    const parsed = passwordSchema.safeParse(body.newPassword);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Ungültiges Passwort' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[force-change-password] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Ändern des Passworts' },
      { status: 500 }
    );
  }
}
