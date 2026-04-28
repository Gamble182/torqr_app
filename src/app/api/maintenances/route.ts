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

    const rateLimitResponse = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
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

      const warnings: Array<{ inventoryItemId: string; newStock: string }> = [];
      const snapshot: typeof validatedData.partsUsed = [];

      for (const entry of validatedData.partsUsed ?? []) {
        snapshot.push(entry);
        if (!entry.inventoryItemId) continue;

        // Cross-tenant guard: companyId filter prevents referencing
        // InventoryItems from other tenants. Prisma cannot enforce this
        // via FK, so the application must.
        const inv = await tx.inventoryItem.findFirst({
          where: { id: entry.inventoryItemId, companyId },
        });
        if (!inv) {
          throw new Error('InventoryItem not found during maintenance');
        }

        await tx.inventoryMovement.create({
          data: {
            companyId,
            inventoryItemId: inv.id,
            quantityChange: -Math.abs(entry.quantity),
            reason: 'MAINTENANCE_USE',
            maintenanceId: maintenance.id,
            userId,
          },
        });
        const updated = await tx.inventoryItem.update({
          where: { id: inv.id },
          data: { currentStock: { decrement: entry.quantity } },
        });
        if (updated.currentStock.lt(0)) {
          warnings.push({
            inventoryItemId: inv.id,
            newStock: updated.currentStock.toString(),
          });
        }
      }

      // Merge partsUsed snapshot into checklistData JSON for audit history
      const existingChecklist = (validatedData.checklistData ?? {}) as Record<string, unknown>;
      await tx.maintenance.update({
        where: { id: maintenance.id },
        data: { checklistData: { ...existingChecklist, partsUsed: snapshot } },
      });

      await tx.customerSystem.update({
        where: { id: validatedData.systemId },
        data: { lastMaintenance: maintenanceDate, nextMaintenance },
      });

      return { maintenance, warnings };
    });

    return NextResponse.json(
      {
        success: true,
        data: result.maintenance,
        negativeStockWarnings: result.warnings,
      },
      { status: 201 },
    );
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
