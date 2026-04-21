'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TorqrIcon } from '@/components/brand/TorqrIcon';
import {
  LayoutDashboardIcon,
  UsersIcon,
  MailIcon,
  ActivityIcon,
  LogOutIcon,
  ShieldIcon,
} from 'lucide-react';

const navigation = [
  { name: 'Übersicht', href: '/admin', icon: LayoutDashboardIcon, exact: true },
  { name: 'Benutzer', href: '/admin/users', icon: UsersIcon, exact: false },
  { name: 'E-Mail Log', href: '/admin/emails', icon: MailIcon, exact: false },
  { name: 'Cron Monitor', href: '/admin/crons', icon: ActivityIcon, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return null;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-sidebar flex flex-col fixed top-0 left-0 h-screen z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <TorqrIcon size="sm" variant="dark" />
          <div>
            <span className="text-sm font-bold text-sidebar-accent-foreground">torqr Admin</span>
            <p className="text-xs text-sidebar-foreground">Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-sidebar-primary' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold shrink-0">
              {session.user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{session.user?.name}</p>
              <p className="text-xs text-sidebar-foreground truncate">{session.user?.email}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60 rounded-lg transition-colors"
          >
            <LayoutDashboardIcon className="h-3.5 w-3.5" />
            Zum Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent/60 rounded-lg transition-colors"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-56 flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
