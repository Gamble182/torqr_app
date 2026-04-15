'use client';

import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/useUser';

export function NotificationsCard() {
  const { data, updatePreferences } = useUser();

  const handleToggle = async (checked: boolean) => {
    try {
      await updatePreferences.mutateAsync({ emailWeeklySummary: checked });
      toast.success('Einstellung gespeichert');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benachrichtigungen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="weekly-summary" className="text-base font-medium">
              Wochenzusammenfassung
            </Label>
            <p className="text-sm text-muted-foreground">
              Wöchentliche E-Mail mit offenen Wartungen und Buchungsübersicht erhalten
            </p>
          </div>
          <Switch
            id="weekly-summary"
            checked={data?.emailWeeklySummary ?? true}
            onCheckedChange={handleToggle}
            disabled={updatePreferences.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
