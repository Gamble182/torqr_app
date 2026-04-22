'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { KeyRoundIcon } from 'lucide-react';

export default function ChangePasswordPage() {
  const { update } = useSession();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Passwort muss mindestens einen Großbuchstaben enthalten');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('Passwort muss mindestens einen Kleinbuchstaben enthalten');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('Passwort muss mindestens eine Zahl enthalten');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/force-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.error || 'Fehler beim Ändern des Passworts');
        return;
      }

      toast.success('Passwort erfolgreich geändert');
      // Refresh session to clear mustChangePassword flag
      await update();
      router.push('/dashboard');
    } catch {
      setError('Fehler beim Ändern des Passworts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-100">
              <KeyRoundIcon className="h-6 w-6 text-brand-700" />
            </div>
          </div>
          <CardTitle>Passwort ändern</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Bitte lege ein neues Passwort fest, bevor du fortfährst.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input
                id="new-password"
                type="password"
                className="text-base h-11"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                placeholder="Min. 8 Zeichen, Groß-/Kleinbuchstabe, Zahl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Passwort bestätigen</Label>
              <Input
                id="confirm-password"
                type="password"
                className="text-base h-11"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Passwort wiederholen"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? 'Wird gespeichert…' : 'Passwort festlegen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
