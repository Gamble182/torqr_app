'use client';

import { use } from 'react';
import { PackingListPrintView } from '@/components/packing-list/PackingListPrintView';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PackingListPrintView bookingId={id} />;
}
