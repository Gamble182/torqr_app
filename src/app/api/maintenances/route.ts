import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { maintenanceCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * POST /api/maintenances
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validatedData = maintenanceCreateSchema.parse(body);

    const system = await prisma.customerSystem.findFirst({
      where: { id: validatedData.systemId, companyId },
    });

    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const maintenanceDate = validatedData.date ? new Date(validatedData.date) : new Date();
    const nextMaintenance = new Date(maintenanceDate);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + system.maintenanceInterval);

    const result = await prisma.$transaction(async (tx) => {
      const maintenance = await tx.maintenance.create({
        data: {
          systemId: validatedData.systemId,
          companyId,
          userId,
          date: maintenanceDate,
          notes: validatedData.notes || null,
          photos: validatedData.photos || [],
          checklistData: validatedData.checklistData ?? undefined,
        },
        include: {
          system: {
            include: {
              catalog: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
      });

      await tx.customerSystem.update({
        where: { id: validatedData.systemId },
        data: { lastMaintenance: maintenanceDate, nextMaintenance },
      });

      return maintenance;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error creating maintenance:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Erstellen der Wartung' }, { status: 500 });
  }
}

/**
 * GET /api/maintenances?systemId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireAuth();

    const systemId = request.nextUrl.searchParams.get('systemId');
    if (!systemId) {
      return NextResponse.json({ success: false, error: 'System-ID fehlt' }, { status: 400 });
    }

    const system = await prisma.customerSystem.findFirst({
      where: { id: systemId, companyId },
    });

    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const maintenances = await prisma.maintenance.findMany({
      where: { systemId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: maintenances });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching maintenances:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Wartungen' }, { status: 500 });
  }
}
