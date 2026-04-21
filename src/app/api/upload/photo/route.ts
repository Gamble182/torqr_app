import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const maintenanceId = formData.get('maintenanceId') as string | null;

    if (!file || !maintenanceId) {
      return NextResponse.json(
        { success: false, error: 'Datei oder maintenanceId fehlt' },
        { status: 400 }
      );
    }

    // Only verify ownership when a real maintenance ID is provided.
    // Temp IDs (e.g. "temp-1713123456") are used during pre-creation uploads
    // and are already scoped to the user via the storage path prefix.
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_REGEX.test(maintenanceId)) {
      const maintenance = await prisma.maintenance.findFirst({
        where: { id: maintenanceId, userId },
        select: { id: true },
      });
      if (!maintenance) {
        return NextResponse.json(
          { success: false, error: 'Wartung nicht gefunden' },
          { status: 404 }
        );
      }
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

    const fileExt = file.name.split('.').pop();
    const fileName = `${maintenanceId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/maintenances/${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from('maintenance-photos')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[upload-photo] Supabase error:', error);
      return NextResponse.json(
        { success: false, error: `Upload fehlgeschlagen: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage
      .from('maintenance-photos')
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: publicData.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
