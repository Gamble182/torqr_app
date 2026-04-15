'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/useUser';

type ProfileFormValues = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
};

export function ProfileCard() {
  const { data, updateProfile } = useUser();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    defaultValues: { name: '', email: '', phone: '', companyName: '' },
  });

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        email: data.email,
        phone: data.phone ?? '',
        companyName: data.companyName ?? '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync(values);
      toast.success('Profil erfolgreich gespeichert');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Vollständiger Name</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name ist erforderlich', minLength: { value: 2, message: 'Mindestens 2 Zeichen' } })}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: 'E-Mail ist erforderlich' })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input id="phone" type="tel" placeholder="Optional" {...register('phone')} />
              <p className="text-xs text-muted-foreground">Erscheint in Wartungserinnerungen</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Firmenname</Label>
              <Input id="companyName" placeholder="Optional" {...register('companyName')} />
              <p className="text-xs text-muted-foreground">Erscheint in Wartungserinnerungen</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
            {updateProfile.isPending ? 'Wird gespeichert…' : 'Speichern'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
