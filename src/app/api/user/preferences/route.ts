// src/app/api/user/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { userPreferencesUpdateSchema } from '@/lib/validations';

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = userPreferencesUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Eingabe', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { emailWeeklySummary: parsed.data.emailWeeklySummary },
      select: { emailWeeklySummary: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
