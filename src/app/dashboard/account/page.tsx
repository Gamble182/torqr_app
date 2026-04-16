import { ProfileCard } from '@/components/account/ProfileCard';
import { PasswordCard } from '@/components/account/PasswordCard';
import { NotificationsCard } from '@/components/account/NotificationsCard';
import { EmailActionsCard } from '@/components/account/EmailActionsCard';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

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
    </div>
  );
}
