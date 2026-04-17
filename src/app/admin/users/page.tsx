'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminUsers, AdminUserSummary } from '@/hooks/useAdmin';
import { Loader2Icon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminUsers(search, page);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Benutzer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data ? `${data.pagination.total} registrierte Benutzer` : 'Alle registrierten Benutzer'}
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Name, E-Mail oder Firma suchen..."
          className="pl-9 text-base h-11"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">{error.message}</p>
      ) : !data || data.data.length === 0 ? (
        <Card className="p-10 text-center">
          <UsersIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Keine Benutzer gefunden</p>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name / Firma</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">E-Mail</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kunden</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Heizungen</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wartungen</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Letzter Login</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Registriert</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((user: AdminUserSummary) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{user.name}</p>
                      {user.companyName && <p className="text-xs text-muted-foreground">{user.companyName}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-right font-semibold">{user._count.customers}</td>
                    <td className="px-4 py-3 text-right font-semibold">{user._count.heaters}</td>
                    <td className="px-4 py-3 text-right font-semibold">{user._count.maintenances}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {user.lastLogin ? format(new Date(user.lastLogin), 'dd.MM.yy HH:mm', { locale: de }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: de })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs">Details</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Seite {data.pagination.page} von {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pagination.totalPages}>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
