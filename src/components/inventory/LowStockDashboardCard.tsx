'use client';

import Link from 'next/link';
import { Package2Icon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LowStockDashboardCardProps {
  count: number;
}

export function LowStockDashboardCard({ count }: LowStockDashboardCardProps) {
  if (count === 0) return null;

  const color =
    count >= 5
      ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50'
      : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50';

  return (
    <Link href="/dashboard/lager?filter=low">
      <Card className={`p-4 border ${color} hover:shadow-sm transition-shadow`}>
        <div className="flex items-center gap-3">
          <Package2Icon className="h-5 w-5" />
          <div>
            <div className="text-sm font-medium">Lager-Warnung</div>
            <div className="text-2xl font-semibold">{count}</div>
            <div className="text-xs">Teile unter Mindestmenge</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
