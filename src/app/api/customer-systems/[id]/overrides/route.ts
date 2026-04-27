import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { customerSystemOverrideSchema } from '@/lib/validations';

/**
 * POST /api/customer-systems/:id/overrides
 *
 * Creates a per-system override on top of the catalog-level Wartungsset.
 *
 * - ADD: append a system-specific part/consumable/tool.
 * - EXCLUDE: hide a standard MaintenanceSetItem for this system.
 *
 * Cross-tenant guards (Decision §4):
 * - excludedSetItemId must belong to a MaintenanceSet of the caller's company
 *   AND match the catalogId of the target system.
 * - inventoryItemId (ADD branch) must belong to the caller's company.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, companyId } = await requireOwner();
    const rate = await rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rate) return rate;

    const body = await request.json();
    const data = customerSystemOverrideSchema.parse(body);

    const system = await prisma.customerSystem.findFirst({
      where: { id, companyId },
    });
    if (!system) {
      return NextResponse.json(
        { success: false, error: 'System nicht gefunden' },
        { status: 404 },
      );
    }

    if (data.action === 'EXCLUDE') {
      const targetItem = await prisma.maintenanceSetItem.findFirst({
        where: {
          id: data.excludedSetItemId,
          maintenanceSet: { companyId, catalogId: system.catalogId },
        },
      });
      if (!targetItem) {
        return NextResponse.json(
          { success: false, error: 'Standard-Teil nicht gefunden' },
          { status: 404 },
        );
      }
    }

    if (data.action === 'ADD' && data.inventoryItemId) {
      const inv = await prisma.inventoryItem.findFirst({
        where: { id: data.inventoryItemId, companyId },
      });
      if (!inv) {
        return NextResponse.json(
          { success: false, error: 'Lagerteil nicht gefunden' },
          { status: 404 },
        );
      }
    }

    const override = await prisma.customerSystemPartOverride.create({
      data: {
        customerSystemId: id,
        action: data.action,
        ...(data.action === 'ADD'
          ? {
              category: data.category,
              description: data.description,
              articleNumber: data.articleNumber ?? null,
              quantity: data.quantity,
              unit: data.unit,
              required: data.required,
              note: data.note ?? null,
              sortOrder: data.sortOrder,
              inventoryItemId: data.inventoryItemId ?? null,
            }
          : { excludedSetItemId: data.excludedSetItemId }),
      },
    });

    return NextResponse.json({ success: true, data: override }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: e.issues },
        { status: 400 },
      );
    }
    if (e instanceof Error) {
      if (e.message === 'Unauthorized') {
        return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
      }
      if (e.message === 'Forbidden') {
        return NextResponse.json(
          { success: false, error: 'Nur Inhaber dürfen Abweichungen anlegen' },
          { status: 403 },
        );
      }
    }
    console.error('override POST', e);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
