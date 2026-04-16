'use client';

import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SendIcon } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

export function EmailActionsCard() {
  const { sendWeeklySummary } = useUser();

  const handleSendSummary = async () => {
    try {
      const result = await sendWeeklySummary.mutateAsync();
      if ('message' in result && result.message) {
        toast.info(result.message as string);
      } else {
        toast.success('Wochenzusammenfassung wurde gesendet');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Senden. Bitte erneut versuchen.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manuelle E-Mail-Aktionen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Wochenzusammenfassung</p>
            <p className="text-sm text-muted-foreground">
              Wochenzusammenfassung jetzt manuell an deine E-Mail-Adresse senden
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendSummary}
            disabled={sendWeeklySummary.isPending}
            className="shrink-0"
          >
            <SendIcon className="mr-2 h-4 w-4" />
            {sendWeeklySummary.isPending ? 'Wird gesendet…' : 'Jetzt senden'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
