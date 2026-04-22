import { ProfileCard } from '@/components/account/ProfileCard';
import { PasswordCard } from '@/components/account/PasswordCard';
import { NotificationsCard } from '@/components/account/NotificationsCard';
import { EmailActionsCard } from '@/components/account/EmailActionsCard';
import { EmailTemplateCard } from '@/components/account/EmailTemplateCard';
import { DangerZoneCard } from '@/components/account/DangerZoneCard';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldIcon, ArrowRightIcon } from 'lucide-react';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const isAdmin = session.user.email ? isAdminEmail(session.user.email) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Konto & Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-1">{session.user.email}</p>
      </div>

      <ProfileCard />
      <PasswordCard />
      <NotificationsCard />
      <EmailTemplateCard />
      <EmailActionsCard />
      <DangerZoneCard />

      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center justify-between p-4 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-600/15">
              <ShieldIcon className="h-4 w-4 text-brand-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Admin Panel</p>
              <p className="text-xs text-muted-foreground">Systemübersicht, Benutzer, E-Mail Log, Cron Monitor</p>
            </div>
          </div>
          <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Link>
      )}
    </div>
  );
}
