'use client';

import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/useUser';

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function PasswordCard() {
  const { updatePassword } = useUser();

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<PasswordFormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      await updatePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Passwort erfolgreich geändert');
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Ändern des Passworts');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passwort ändern</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
            <Input
              id="currentPassword"
              type="password"
              className="text-base h-11"
              {...register('currentPassword', { required: 'Aktuelles Passwort ist erforderlich' })}
            />
            {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Neues Passwort</Label>
            <Input
              id="newPassword"
              type="password"
              className="text-base h-11"
              {...register('newPassword', {
                required: 'Neues Passwort ist erforderlich',
                minLength: { value: 8, message: 'Mindestens 8 Zeichen' },
                pattern: { value: /[A-Z]/, message: 'Mindestens ein Großbuchstabe erforderlich' },
              })}
            />
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <Input
              id="confirmPassword"
              type="password"
              className="text-base h-11"
              {...register('confirmPassword', {
                required: 'Bitte Passwort bestätigen',
                validate: (value) => value === newPassword || 'Passwörter stimmen nicht überein',
              })}
            />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={updatePassword.isPending} className="h-11 sm:h-9 w-full sm:w-auto">
            {updatePassword.isPending ? 'Wird gespeichert…' : 'Passwort ändern'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
