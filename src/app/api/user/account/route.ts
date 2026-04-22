import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Passwort ist erforderlich' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Passwort ist falsch' },
        { status: 400 }
      );
    }

    // Delete all user photos from Supabase storage
    try {
      const supabase = getSupabaseAdmin();
      const { data: files } = await supabase.storage
        .from('maintenance-photos')
        .list(userId, { limit: 1000 });

      if (files && files.length > 0) {
        // List files in subdirectories (e.g. userId/maintenances/*)
        const { data: maintenanceFiles } = await supabase.storage
          .from('maintenance-photos')
          .list(`${userId}/maintenances`, { limit: 1000 });

        if (maintenanceFiles && maintenanceFiles.length > 0) {
          const paths = maintenanceFiles.map(f => `${userId}/maintenances/${f.name}`);
          await supabase.storage
            .from('maintenance-photos')
            .remove(paths);
        }
      }
    } catch (storageError) {
      console.error('[delete-account] Storage cleanup error (non-blocking):', storageError);
    }

    // Delete user — cascades to customers, systems, maintenances, sessions, bookings, followUpJobs
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[delete-account] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Löschen des Kontos' },
      { status: 500 }
    );
  }
}
