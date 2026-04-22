import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { customerSystemCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * GET /api/customer-systems?customerId=xxx&search=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { companyId } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search') || '';

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId, companyId },
      });
      if (!customer) {
        return NextResponse.json({ success: false, error: 'Kunde nicht gefunden' }, { status: 404 });
      }
    }

    const where: Prisma.CustomerSystemWhereInput = {
      companyId,
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { serialNumber: { contains: search, mode: 'insensitive' } },
          { catalog: { name: { contains: search, mode: 'insensitive' } } },
          { catalog: { manufacturer: { contains: search, mode: 'insensitive' } } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { city: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const now = new Date();
    const systems = await prisma.customerSystem.findMany({
      where,
      include: {
        catalog: true,
        customer: {
          select: { id: true, name: true, street: true, city: true, phone: true },
        },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { maintenances: true, followUpJobs: { where: { completed: false } } } },
        maintenances: customerId
          ? { orderBy: { date: 'desc' }, take: 5 }
          : false,
        bookings: {
          where: { startTime: { gte: now }, status: 'CONFIRMED' },
          orderBy: { startTime: 'asc' },
          take: 1,
          select: { id: true, startTime: true, endTime: true, calBookingUid: true },
        },
      },
      orderBy: [{ nextMaintenance: 'asc' }, { customer: { name: 'asc' } }],
    });

    return NextResponse.json({ success: true, data: systems });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching customer systems:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Systeme' }, { status: 500 });
  }
}

/**
 * POST /api/customer-systems
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validated = customerSystemCreateSchema.parse(body);

    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId, companyId },
    });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    const catalog = await prisma.systemCatalog.findUnique({
      where: { id: validated.catalogId },
    });
    if (!catalog) {
      return NextResponse.json({ success: false, error: 'Katalogeintrag nicht gefunden' }, { status: 404 });
    }

    const interval = validated.maintenanceInterval;
    const lastMaintenance = validated.lastMaintenance
      ? new Date(validated.lastMaintenance)
      : new Date();
    const nextMaintenance = new Date(lastMaintenance);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + interval);

    const system = await prisma.customerSystem.create({
      data: {
        catalogId: validated.catalogId,
        customerId: validated.customerId,
        companyId,
        userId,
        serialNumber: validated.serialNumber ?? null,
        installationDate: validated.installationDate ? new Date(validated.installationDate) : null,
        maintenanceInterval: interval,
        lastMaintenance,
        nextMaintenance,
        storageCapacityLiters: validated.storageCapacityLiters ?? null,
        requiredParts: validated.requiredParts ?? null,
      },
      include: {
        catalog: true,
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: system }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error creating customer system:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Erstellen des Systems' }, { status: 500 });
  }
}
