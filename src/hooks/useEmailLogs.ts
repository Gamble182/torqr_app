import { useQuery } from '@tanstack/react-query';

export interface EmailLog {
  id: string;
  type: 'REMINDER' | 'WEEKLY_SUMMARY' | 'BOOKING_CONFIRMATION';
  sentAt: string;
  error: string | null;
}

const EMAIL_TYPE_LABELS: Record<string, string> = {
  REMINDER: 'Erinnerung',
  WEEKLY_SUMMARY: 'Wochenübersicht',
  BOOKING_CONFIRMATION: 'Terminbestätigung',
};

export function getEmailTypeLabel(type: string): string {
  return EMAIL_TYPE_LABELS[type] ?? type;
}

export function useCustomerEmailLogs(customerId: string) {
  return useQuery<EmailLog[]>({
    queryKey: ['email-logs', customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}/email-logs`);
      const result = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des E-Mail-Protokolls');
      }
      return result.data;
    },
  });
}
