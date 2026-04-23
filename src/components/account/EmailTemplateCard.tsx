'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/hooks/useUser';

type TemplateFormValues = {
  reminderGreeting: string;
  reminderBody: string;
};

const DEFAULT_GREETING = 'Guten Tag {customerName},';
const DEFAULT_BODY = `die letzte Wartung Ihrer Heizungsanlage liegt bald ein Jahr zurück.\n\nWir empfehlen, jetzt rechtzeitig einen neuen Wartungstermin zu buchen — regelmäßige Wartungen sichern den effizienten Betrieb Ihrer Anlage und beugen teuren Reparaturen vor.`;

export function EmailTemplateCard() {
  const { data, updateProfile } = useUser();

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<TemplateFormValues>({
    defaultValues: { reminderGreeting: '', reminderBody: '' },
  });

  useEffect(() => {
    if (data) {
      reset({
        reminderGreeting: data.reminderGreeting ?? '',
        reminderBody: data.reminderBody ?? '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: TemplateFormValues) => {
    try {
      await updateProfile.mutateAsync({
        reminderGreeting: values.reminderGreeting || null,
        reminderBody: values.reminderBody || null,
      });
      toast.success('E-Mail-Vorlage gespeichert');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>E-Mail-Vorlage</CardTitle>
        <CardDescription>
          Passen Sie den Text Ihrer Wartungserinnerungen an. Leer lassen für Standardtext.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminderGreeting">Begrüßung</Label>
            <Input
              id="reminderGreeting"
              placeholder={DEFAULT_GREETING}
              className="text-base h-11"
              maxLength={200}
              {...register('reminderGreeting')}
            />
            <p className="text-xs text-muted-foreground">
              Verfügbarer Platzhalter: <code className="bg-muted px-1 rounded">{'{customerName}'}</code>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminderBody">Nachrichtentext</Label>
            <Textarea
              id="reminderBody"
              placeholder={DEFAULT_BODY}
              className="text-base min-h-[120px]"
              maxLength={1000}
              {...register('reminderBody')}
            />
            <p className="text-xs text-muted-foreground">
              Verfügbarer Platzhalter: <code className="bg-muted px-1 rounded">{'{customerName}'}</code> · Zeilenumbrüche werden übernommen
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!isDirty || updateProfile.isPending} className="h-11 w-full sm:w-auto">
            {updateProfile.isPending ? 'Wird gespeichert…' : 'Speichern'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
