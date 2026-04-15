# Sprint 4: Email-Automation & Benachrichtigungen

**Duration:** 4-5 Tage
**Goal:** Automatische Email-Benachrichtigungen für Wartungserinnerungen
**Dependencies:** Sprint 3 (Heater & Maintenance Management) muss abgeschlossen sein

---

## Übersicht

Sprint 3 ist **fast abgeschlossen** (~95%). In Sprint 4 implementieren wir ein vollständiges Email-System, das automatisch Erinnerungen für anstehende Wartungen versendet.

### Was wir bereits haben (Sprint 3 ✅)
- ✅ Vollständiges Heizungs-Management
- ✅ Wartungsverwaltung mit Foto-Upload
- ✅ Dashboard mit überfälligen/anstehenden Wartungen
- ✅ Automatische Berechnung der nächsten Wartungstermine
- ✅ Resend API Account vorhanden

---

## Sprint 4 Ziele

Am Ende von Sprint 4 hast du:
- ✅ Automatische Email-Erinnerungen für anstehende Wartungen
- ✅ Manuelle Email-Funktion "Wartung ankündigen"
- ✅ Email-Templates (schönes Design)
- ✅ Cron-Job für tägliche Prüfung
- ✅ Email-Versand-Historie
- ✅ Opt-out/Opt-in für Kunden
- ✅ Test-Email-Funktion

---

## Day 1: Email Infrastructure & Templates

### 1.1 Resend Integration Setup

Du hast bereits einen Resend API Key in `.env`:
```env
RESEND_API_KEY="re_V4UXzyBc_KrAFzes9pnXpp4aD4NrLvfVr"
```

**File:** `src/lib/email.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendMaintenanceReminderParams {
  to: string; // Customer email
  customerName: string;
  heaterModel: string;
  nextMaintenanceDate: string;
  contactEmail: string; // Your business email
  contactPhone?: string;
}

/**
 * Send a maintenance reminder email
 */
export async function sendMaintenanceReminder({
  to,
  customerName,
  heaterModel,
  nextMaintenanceDate,
  contactEmail,
  contactPhone,
}: SendMaintenanceReminderParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Torqr <noreply@yourdomain.com>', // Update with your verified domain
      to: [to],
      subject: `Wartungserinnerung: ${heaterModel}`,
      html: getMaintenanceReminderTemplate({
        customerName,
        heaterModel,
        nextMaintenanceDate,
        contactEmail,
        contactPhone,
      }),
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Error sending email:', err);
    return { success: false, error: err };
  }
}

/**
 * Send a test email to verify setup
 */
export async function sendTestEmail(to: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Torqr <noreply@yourdomain.com>',
      to: [to],
      subject: 'Test Email - Torqr Email System',
      html: '<h1>Email system is working!</h1><p>If you receive this, your email configuration is correct.</p>',
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err };
  }
}
```

---

### 1.2 Email Template (Beautiful HTML)

**File:** `src/lib/email-templates.ts`

```typescript
export interface MaintenanceReminderTemplateParams {
  customerName: string;
  heaterModel: string;
  nextMaintenanceDate: string;
  contactEmail: string;
  contactPhone?: string;
}

export function getMaintenanceReminderTemplate({
  customerName,
  heaterModel,
  nextMaintenanceDate,
  contactEmail,
  contactPhone,
}: MaintenanceReminderTemplateParams): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wartungserinnerung</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Wartungserinnerung
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #333333;">
                Guten Tag ${customerName},
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5; color: #333333;">
                dies ist eine freundliche Erinnerung, dass für Ihre Heizung bald eine Wartung fällig ist:
              </p>

              <!-- Heater Info Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; font-weight: 500;">
                      HEIZUNG
                    </p>
                    <p style="margin: 0 0 15px 0; font-size: 18px; color: #1e293b; font-weight: 600;">
                      ${heaterModel}
                    </p>

                    <p style="margin: 0 0 5px 0; font-size: 14px; color: #64748b; font-weight: 500;">
                      NÄCHSTE WARTUNG
                    </p>
                    <p style="margin: 0; font-size: 20px; color: #2563eb; font-weight: 700;">
                      ${nextMaintenanceDate}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; font-size: 16px; line-height: 1.5; color: #333333;">
                Eine regelmäßige Wartung ist wichtig für:
              </p>

              <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #333333;">
                <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.5;">Optimale Effizienz und niedrige Energiekosten</li>
                <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.5;">Lange Lebensdauer Ihrer Heizung</li>
                <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.5;">Sicherheit und Zuverlässigkeit</li>
                <li style="margin-bottom: 8px; font-size: 15px; line-height: 1.5;">Erhalt der Herstellergarantie</li>
              </ul>

              <p style="margin: 20px 0; font-size: 16px; line-height: 1.5; color: #333333;">
                Bitte kontaktieren Sie uns, um einen Termin zu vereinbaren:
              </p>

              <!-- Contact Info Box -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400e; font-weight: 600;">
                      📧 Email: <a href="mailto:${contactEmail}" style="color: #2563eb; text-decoration: none;">${contactEmail}</a>
                    </p>
                    ${
                      contactPhone
                        ? `<p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">
                      📞 Telefon: <a href="tel:${contactPhone}" style="color: #2563eb; text-decoration: none;">${contactPhone}</a>
                    </p>`
                        : ''
                    }
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.5; color: #333333;">
                Wir freuen uns darauf, Sie zu unterstützen!
              </p>

              <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.5; color: #333333;">
                Mit freundlichen Grüßen,<br>
                <strong>Ihr Torqr Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-align: center;">
                Diese Email wurde automatisch von Torqr generiert.
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                Sie möchten keine Wartungserinnerungen mehr erhalten?
                <a href="#" style="color: #2563eb; text-decoration: underline;">Hier abmelden</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
```

---

### 1.3 Database Schema Extension

Add email tracking to database:

**File:** `prisma/schema.prisma`

Add these models:

```prisma
model EmailLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  heaterId   String?
  heater     Heater?  @relation(fields: [heaterId], references: [id], onDelete: SetNull)

  type       String   // "maintenance_reminder", "test", etc.
  to         String   // Email address
  subject    String
  status     String   // "sent", "failed", "pending"
  error      String?  // Error message if failed

  sentAt     DateTime @default(now())

  @@index([userId])
  @@index([customerId])
  @@index([heaterId])
  @@index([sentAt])
}

// Add to Customer model
model Customer {
  // ... existing fields ...
  emailNotifications Boolean @default(true) // Opt-in/out
  emailLogs          EmailLog[]
}

// Add to Heater model
model Heater {
  // ... existing fields ...
  emailLogs EmailLog[]
}
```

Run migration:
```bash
npx prisma db push
npx prisma generate
```

---

## Day 2: Manual Email Sending

### 2.1 API Endpoint for Sending Emails

**File:** `src/app/api/emails/send-reminder/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { sendMaintenanceReminder } from '@/lib/email';
import { z } from 'zod';

const sendReminderSchema = z.object({
  customerId: z.string().uuid(),
  heaterId: z.string().uuid(),
});

/**
 * POST /api/emails/send-reminder
 * Manually send a maintenance reminder email
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    const { customerId, heaterId } = sendReminderSchema.parse(body);

    // Fetch customer and heater
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: userId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Kunde nicht gefunden' },
        { status: 404 }
      );
    }

    if (!customer.email) {
      return NextResponse.json(
        { success: false, error: 'Kunde hat keine Email-Adresse' },
        { status: 400 }
      );
    }

    if (!customer.emailNotifications) {
      return NextResponse.json(
        { success: false, error: 'Kunde hat Email-Benachrichtigungen deaktiviert' },
        { status: 400 }
      );
    }

    const heater = await prisma.heater.findFirst({
      where: {
        id: heaterId,
        customerId: customerId,
      },
    });

    if (!heater) {
      return NextResponse.json(
        { success: false, error: 'Heizung nicht gefunden' },
        { status: 404 }
      );
    }

    // Get user's contact info (you can add these fields to User model)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    });

    // Send email
    const result = await sendMaintenanceReminder({
      to: customer.email,
      customerName: customer.name,
      heaterModel: heater.model,
      nextMaintenanceDate: heater.nextMaintenance
        ? new Date(heater.nextMaintenance).toLocaleDateString('de-DE')
        : 'Bald',
      contactEmail: user?.email || 'kontakt@torqr.de',
      contactPhone: user?.phone,
    });

    // Log email
    await prisma.emailLog.create({
      data: {
        userId: userId,
        customerId: customerId,
        heaterId: heaterId,
        type: 'maintenance_reminder',
        to: customer.email,
        subject: `Wartungserinnerung: ${heater.model}`,
        status: result.success ? 'sent' : 'failed',
        error: result.success ? null : JSON.stringify(result.error),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Fehler beim Senden der Email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email erfolgreich gesendet',
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Senden der Email' },
      { status: 500 }
    );
  }
}
```

---

### 2.2 UI Button in Dashboard/Heater Detail

Add a button to manually send reminders:

**File:** Update `src/app/dashboard/heaters/[id]/page.tsx`

```typescript
// Add button in heater actions section
<Button
  onClick={async () => {
    if (!confirm('Wartungserinnerung an Kunden senden?')) return;

    try {
      const response = await fetch('/api/emails/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: heater.customerId,
          heaterId: heater.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Email erfolgreich gesendet!');
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      toast.error('Fehler beim Senden der Email');
    }
  }}
  className="bg-blue-600 hover:bg-blue-700"
>
  📧 Wartungserinnerung senden
</Button>
```

---

## Day 3: Automated Cron Job

### 3.1 Cron API Endpoint

**File:** `src/app/api/cron/send-reminders/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMaintenanceReminder } from '@/lib/email';

/**
 * GET /api/cron/send-reminders
 * Daily cron job to send maintenance reminders
 *
 * Call with: curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-app.vercel.app/api/cron/send-reminders
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);

    const in14Days = new Date();
    in14Days.setDate(today.getDate() + 14);

    // Find heaters with maintenance due in 7 or 14 days
    const heaters = await prisma.heater.findMany({
      where: {
        nextMaintenance: {
          gte: today,
          lte: in14Days,
        },
        customer: {
          emailNotifications: true,
          email: {
            not: null,
          },
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            userId: true,
          },
        },
      },
    });

    const results = [];

    for (const heater of heaters) {
      if (!heater.customer.email) continue;

      // Check if we already sent a reminder recently (within 6 days)
      const recentEmail = await prisma.emailLog.findFirst({
        where: {
          heaterId: heater.id,
          type: 'maintenance_reminder',
          status: 'sent',
          sentAt: {
            gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentEmail) {
        results.push({
          heaterId: heater.id,
          status: 'skipped',
          reason: 'Already sent recently',
        });
        continue;
      }

      // Get user contact info
      const user = await prisma.user.findUnique({
        where: { id: heater.customer.userId },
        select: { email: true, phone: true },
      });

      // Send email
      const result = await sendMaintenanceReminder({
        to: heater.customer.email,
        customerName: heater.customer.name,
        heaterModel: heater.model,
        nextMaintenanceDate: heater.nextMaintenance
          ? new Date(heater.nextMaintenance).toLocaleDateString('de-DE')
          : 'Bald',
        contactEmail: user?.email || 'kontakt@torqr.de',
        contactPhone: user?.phone,
      });

      // Log email
      await prisma.emailLog.create({
        data: {
          userId: heater.customer.userId,
          customerId: heater.customer.id,
          heaterId: heater.id,
          type: 'maintenance_reminder',
          to: heater.customer.email,
          subject: `Wartungserinnerung: ${heater.model}`,
          status: result.success ? 'sent' : 'failed',
          error: result.success ? null : JSON.stringify(result.error),
        },
      });

      results.push({
        heaterId: heater.id,
        status: result.success ? 'sent' : 'failed',
        error: result.success ? null : result.error,
      });
    }

    return NextResponse.json({
      success: true,
      totalChecked: heaters.length,
      results: results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { success: false, error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
```

---

### 3.2 Vercel Cron Configuration

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This runs daily at 8:00 AM UTC.

---

## Day 4: Email History & Settings

### 4.1 Email History API

**File:** `src/app/api/emails/history/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/emails/history
 * Get email sending history for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const customerId = searchParams.get('customerId');

    const where: any = {
      userId: userId,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    const emails = await prisma.emailLog.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        heater: {
          select: {
            id: true,
            model: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: emails,
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Laden der Email-Historie' },
      { status: 500 }
    );
  }
}
```

---

### 4.2 Email Settings Page

**File:** `src/app/dashboard/settings/emails/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function EmailSettingsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/emails/history?limit=20');
      const result = await response.json();

      if (result.success) {
        setHistory(result.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      const response = await fetch('/api/emails/test', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Test-Email gesendet!');
        fetchHistory();
      } else {
        toast.error('Fehler beim Senden');
      }
    } catch (err) {
      toast.error('Fehler beim Senden der Test-Email');
    }
  };

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email-Einstellungen</h1>
      </div>

      {/* Test Email Section */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Email-System testen</h2>
        <p className="text-gray-600 mb-4">
          Sende eine Test-Email an deine eigene Adresse, um das Email-System zu
          überprüfen.
        </p>
        <Button onClick={sendTestEmail}>Test-Email senden</Button>
      </Card>

      {/* Email History */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Email-Historie</h2>

        {loading ? (
          <p className="text-gray-500">Laden...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-500">Noch keine Emails gesendet</p>
        ) : (
          <div className="space-y-3">
            {history.map((email: any) => (
              <div
                key={email.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{email.subject}</p>
                    <p className="text-sm text-gray-600">An: {email.to}</p>
                    {email.customer && (
                      <p className="text-sm text-gray-600">
                        Kunde: {email.customer.name}
                      </p>
                    )}
                    {email.heater && (
                      <p className="text-sm text-gray-600">
                        Heizung: {email.heater.model}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${
                        email.status === 'sent'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {email.status === 'sent' ? 'Gesendet' : 'Fehlgeschlagen'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(email.sentAt).toLocaleString('de-DE')}
                    </p>
                  </div>
                </div>
                {email.error && (
                  <p className="text-xs text-red-600 mt-2">
                    Fehler: {email.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

## Day 5: Testing & Polish

### 5.1 Testing Checklist

**Manual Testing:**
- [ ] Test email with real email address works
- [ ] Email template displays correctly (desktop & mobile)
- [ ] Manual "Send Reminder" button works
- [ ] Cron job runs successfully (test with API call)
- [ ] Email history logs correctly
- [ ] Opt-out functionality works
- [ ] Error handling for invalid emails

**Email Template Testing:**
- [ ] Test in Gmail
- [ ] Test in Outlook
- [ ] Test on mobile email clients
- [ ] All links clickable
- [ ] Images display correctly
- [ ] German characters (ä, ö, ü) display correctly

---

### 5.2 Production Setup

**Resend Domain Verification:**

1. Go to Resend Dashboard
2. Add your domain (e.g., `yourdomain.com`)
3. Add DNS records as instructed
4. Verify domain
5. Update `from` email in `src/lib/email.ts`

**Vercel Cron Setup:**

1. Deploy to Vercel
2. Cron jobs run automatically
3. Monitor in Vercel Dashboard → Cron

**Environment Variables:**

Add to Vercel:
```env
RESEND_API_KEY=your_key
CRON_SECRET=generate_with_openssl
```

---

## Success Criteria

By the end of Sprint 4:

- [ ] Resend integration working
- [ ] Beautiful email templates
- [ ] Manual email sending works
- [ ] Automated daily cron job runs
- [ ] Email history tracked in database
- [ ] Opt-out functionality
- [ ] Settings page for email management
- [ ] Test emails successful
- [ ] All features tested and working

---

## Next Steps (Sprint 5)

After Sprint 4, consider:

1. **PDF Reports** - Generate PDF maintenance reports
2. **SMS Notifications** - Alternative to email
3. **Calendar Integration** - Add to Google Calendar
4. **Multi-language Support** - English version
5. **Advanced Analytics** - Email open rates, click rates

---

**Dokument Version:** 1.0
**Erstellt:** 13. Januar 2026
**Status:** Ready for Development
