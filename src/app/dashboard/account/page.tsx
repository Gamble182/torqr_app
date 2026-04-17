import { ProfileCard } from '@/components/account/ProfileCard';
import { PasswordCard } from '@/components/account/PasswordCard';
import { NotificationsCard } from '@/components/account/NotificationsCard';
import { EmailActionsCard } from '@/components/account/EmailActionsCard';
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
      <EmailActionsCard />

      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center justify-between p-4 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/15">
              <ShieldIcon className="h-4 w-4 text-destructive" />
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
