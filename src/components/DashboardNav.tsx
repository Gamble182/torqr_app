'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { TorqrIcon, TorqrWordmark } from '@/components/brand/TorqrIcon';
import {
  LayoutDashboardIcon,
  UsersIcon,
  WrenchIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  UserCogIcon,
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboardIcon;
  ownerOnly?: boolean;
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Kunden', href: '/dashboard/customers', icon: UsersIcon },
  { name: 'Systeme', href: '/dashboard/systems', icon: WrenchIcon },
  { name: 'Wartungen', href: '/dashboard/wartungen', icon: WrenchIcon },
  { name: 'Mitarbeiter', href: '/dashboard/employees', icon: UserCogIcon, ownerOnly: true },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const formatDate = () =>
    currentDateTime.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = () =>
    currentDateTime.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          {collapsed ? (
            <TorqrIcon size="sm" variant="ghost" />
          ) : (
            <TorqrWordmark size="sm" theme="green" showTagline={false} />
          )}
        </Link>
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
        >
          <ChevronLeftIcon
            className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.filter((item) => !item.ownerOnly || session?.user?.role === 'OWNER').map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={`h-4.5 w-4.5 shrink-0 ${
                  active ? 'text-sidebar-primary' : 'text-sidebar-foreground group-hover:text-sidebar-primary'
                }`}
              />
              {!collapsed && <span>{item.name}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-sidebar-border">
        {/* Date & Time */}
        {!collapsed && (
          <div className="px-5 py-3 flex items-center gap-4 text-xs text-sidebar-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatDate()}
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              {formatTime()}
            </span>
          </div>
        )}

        {/* User section */}
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <Link
              href="/dashboard/account"
              className={`flex items-center gap-3 min-w-0 flex-1 rounded-lg hover:bg-sidebar-accent/60 transition-colors ${collapsed ? 'justify-center p-1' : 'p-1'}`}
              title="Konto & Einstellungen"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-sidebar-primary/20 text-sidebar-primary text-xs font-bold shrink-0">
                {userInitials}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-sidebar-foreground truncate">
                    {session?.user?.email}
                  </p>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center justify-center w-8 h-8 rounded-md text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent transition-colors shrink-0"
                title="Abmelden"
              >
                <LogOutIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="mt-2 flex items-center justify-center w-9 h-9 rounded-md text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent transition-colors mx-auto"
              title="Abmelden"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-card border-b border-border">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-foreground hover:bg-muted transition-colors"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <TorqrWordmark size="sm" theme="light" showTagline={false} />
        </Link>
        <div className="w-9" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="w-70 h-full bg-sidebar flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-md text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-sidebar z-30 transition-all duration-200 ease-in-out ${
          collapsed ? 'w-17' : 'w-65'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
