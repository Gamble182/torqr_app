import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { systemPhotoDeleteSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { getSupabaseAdmin, deleteMaintenancePhoto } from '@/lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PHOTOS = 5;
const BUCKET = 'maintenance-photos';

/**
 * POST /api/systems/[id]/photos
 * Upload a single photo for a CustomerSystem.
 * OWNER: any system in their company.
 * TECHNICIAN: only systems assigned to them.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId, role } = await requireAuth();

    const rateLimitResponse = await rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.FILE_UPLOAD);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: systemId } = await params;

    const system = await prisma.customerSystem.findFirst({
      where: { id: systemId, companyId },
      select: { id: true, assignedToUserId: true, photos: true },
    });

    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    if (role === 'TECHNICIAN' && system.assignedToUserId !== userId) {
      return NextResponse.json({ success: false, error: 'Zugriff verweigert' }, { status: 403 });
    }

    if (system.photos.length >= MAX_PHOTOS) {
      return NextResponse.json(
        { success: false, error: `Maximal ${MAX_PHOTOS} Fotos pro System` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Datei fehlt' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Nur JPEG, PNG und WebP erlaubt' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Datei zu groß (max. 5MB)' },
        { status: 400 }
      );
    }

    const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/systems/${systemId}/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[system-photos] Supabase upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `Upload fehlgeschlagen: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    const url = publicData.publicUrl;

    const updated = await prisma.customerSystem.update({
      where: { id: systemId },
      data: { photos: { push: url } },
      select: { photos: true },
    });

    return NextResponse.json({ success: true, url, photos: updated.photos });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error uploading system photo:', err);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Hochladen des Fotos' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/systems/[id]/photos
 * Remove a photo from a CustomerSystem. OWNER only (Variant B permissions).
 * Body: { url: string }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId } = await requireOwner();

    const rateLimitResponse = await rateLimitByUser(req, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: systemId } = await params;

    const body = await req.json();
    const { url } = systemPhotoDeleteSchema.parse(body);

    const system = await prisma.customerSystem.findFirst({
      where: { id: systemId, companyId },
      select: { id: true, photos: true },
    });

    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    if (!system.photos.includes(url)) {
      return NextResponse.json({ success: false, error: 'Foto nicht gefunden' }, { status: 404 });
    }

    const updated = await prisma.customerSystem.update({
      where: { id: systemId },
      data: { photos: { set: system.photos.filter((p) => p !== url) } },
      select: { photos: true },
    });

    // Best-effort storage cleanup — orphan file is acceptable if this fails
    try {
      await deleteMaintenancePhoto(url);
    } catch (storageErr) {
      console.warn('[system-photos] Storage delete failed (orphan file):', storageErr);
    }

    return NextResponse.json({ success: true, photos: updated.photos });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validierungsfehler', details: err.issues },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    if (err instanceof Error && err.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: 'Nur Inhaber können Fotos löschen' },
        { status: 403 }
      );
    }
    console.error('Error deleting system photo:', err);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Löschen des Fotos' },
      { status: 500 }
    );
  }
}
