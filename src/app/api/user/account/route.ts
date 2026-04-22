import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    // Only OWNER can delete the account (which deletes the entire Company)
    const { userId, companyId } = await requireOwner();
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

    // Clean up Supabase storage for all company users
    try {
      const supabase = getSupabaseAdmin();
      const companyUsers = await prisma.user.findMany({
        where: { companyId },
        select: { id: true },
      });

      for (const u of companyUsers) {
        const { data: maintenanceFiles } = await supabase.storage
          .from('maintenance-photos')
          .list(`${u.id}/maintenances`, { limit: 1000 });

        if (maintenanceFiles && maintenanceFiles.length > 0) {
          const paths = maintenanceFiles.map(f => `${u.id}/maintenances/${f.name}`);
          await supabase.storage
            .from('maintenance-photos')
            .remove(paths);
        }
      }
    } catch (storageError) {
      console.error('[delete-account] Storage cleanup error (non-blocking):', storageError);
    }

    // Delete Company — cascades to all Users and all tenant-scoped data
    await prisma.company.delete({ where: { id: companyId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'Forbidden') {
      return NextResponse.json({ success: false, error: 'Nur der Kontoinhaber kann das Konto löschen' }, { status: 403 });
    }
    console.error('[delete-account] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Löschen des Kontos' },
      { status: 500 }
    );
  }
}
