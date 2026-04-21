// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { userProfileUpdateSchema } from '@/lib/validations';

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, companyName: true, emailWeeklySummary: true, reminderGreeting: true, reminderBody: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const parsed = userProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Eingabe', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, phone, companyName, reminderGreeting, reminderBody } = parsed.data;

    // Check email uniqueness if changing email
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Diese E-Mail-Adresse wird bereits verwendet' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone: phone === '' ? null : phone }),
        ...(companyName !== undefined && { companyName: companyName === '' ? null : companyName }),
        ...(reminderGreeting !== undefined && { reminderGreeting: reminderGreeting === '' ? null : reminderGreeting }),
        ...(reminderBody !== undefined && { reminderBody: reminderBody === '' ? null : reminderBody }),
      },
      select: { name: true, email: true, phone: true, companyName: true, reminderGreeting: true, reminderBody: true },
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
