'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2Icon } from 'lucide-react';
import { MaintenanceSetList } from '@/components/maintenance-sets/MaintenanceSetList';

export default function WartungssetsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect non-owners (wait for session to load first)
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (status === 'authenticated' && session?.user?.role !== 'OWNER') {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wartungssets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vordefinierte Teilelisten pro Kessel-/Klimamodell
        </p>
      </div>
      <MaintenanceSetList />
    </div>
  );
}
