import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-auth';
import { AdminLayoutShell } from './AdminLayoutShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let admin: { userId: string; email: string; name: string };
  try {
    admin = await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    redirect(message === 'Forbidden' ? '/dashboard' : '/login');
  }

  return (
    <AdminLayoutShell userName={admin.name} userEmail={admin.email}>
      {children}
    </AdminLayoutShell>
  );
}
