'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useUser } from '@/hooks/useUser';
import { Trash2Icon } from 'lucide-react';

export function DangerZoneCard() {
  const { deleteAccount } = useUser();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!password) {
      setError('Passwort ist erforderlich');
      return;
    }

    try {
      await deleteAccount.mutateAsync(password);
      toast.success('Konto wurde gelöscht');
      signOut({ callbackUrl: '/login' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setPassword('');
      setError('');
    }
  };

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Gefahrenzone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Wenn du dein Konto löschst, werden alle Daten unwiderruflich entfernt — Kunden, Systeme, Wartungen, Fotos, Buchungen und E-Mail-Verlauf.
          </p>
          <Button
            variant="destructive"
            className="h-11 sm:h-9 w-full sm:w-auto"
            onClick={() => setOpen(true)}
          >
            <Trash2Icon className="h-4 w-4" />
            Konto löschen
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konto endgültig löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="delete-password">Passwort zur Bestätigung</Label>
            <Input
              id="delete-password"
              type="password"
              className="text-base h-11"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Dein aktuelles Passwort"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? 'Wird gelöscht…' : 'Endgültig löschen'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
