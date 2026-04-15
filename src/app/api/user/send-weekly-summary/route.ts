// src/app/api/user/send-weekly-summary/route.ts
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { sendWeeklySummary } from '@/lib/email/service';

export async function POST() {
  try {
    const { userId } = await requireAuth();
    const { emailsSent } = await sendWeeklySummary();

    if (emailsSent === 0) {
      return NextResponse.json({
        success: true,
        message: 'Wochenzusammenfassung ist deaktiviert. Aktiviere sie in den Benachrichtigungseinstellungen.',
      });
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
