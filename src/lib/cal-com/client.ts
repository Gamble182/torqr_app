export class CalComApiError extends Error {}
export async function rescheduleCalBooking(_p: { uid: string; startTime: Date; reschedulingReason?: string }): Promise<{ newUid: string }> {
  throw new Error('not implemented');
}
export async function cancelCalBooking(_p: { uid: string; cancellationReason?: string }): Promise<void> {
  throw new Error('not implemented');
}
