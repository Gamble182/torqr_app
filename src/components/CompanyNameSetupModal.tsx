'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/useUser';
import { Loader2Icon } from 'lucide-react';

/**
 * One-time modal shown to OWNER users when Company.name is null (post-migration).
 * Sets the company name via PATCH /api/user/profile.
 */
export function CompanyNameSetupModal() {
  const { data: session } = useSession();
  const { data: profile, isLoading: profileLoading, updateProfile } = useUser();
  const [companyName, setCompanyName] = useState('');

  // Only show for OWNER with null company name
  if (
    profileLoading ||
    !profile ||
    profile.companyName !== null ||
    session?.user?.role !== 'OWNER'
  ) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    await updateProfile.mutateAsync({ companyName: companyName.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl border shadow-lg p-6 w-full max-w-md mx-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Firmenname einrichten</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Geben Sie den Namen Ihres Betriebs ein. Dieser wird in E-Mails und auf Dokumenten angezeigt.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium mb-1.5">
              Firmenname
            </label>
            <input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="z.B. Mustermann Heizungsbau"
            />
          </div>

          {updateProfile.error && (
            <p className="text-sm text-destructive">
              {updateProfile.error.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={updateProfile.isPending || !companyName.trim()}>
            {updateProfile.isPending && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
            Speichern
          </Button>
        </form>
      </div>
    </div>
  );
}
