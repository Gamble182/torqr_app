import { useQuery } from '@tanstack/react-query';
import { EMAIL_TYPE_LABELS } from '@/lib/constants';

export interface EmailLog {
  id: string;
  type: 'OPT_IN_CONFIRMATION' | 'REMINDER_1_WEEK' | 'REMINDER_4_WEEKS' | 'WEEKLY_SUMMARY' | 'BOOKING_CONFIRMATION';
  sentAt: string;
  error: string | null;
}

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
