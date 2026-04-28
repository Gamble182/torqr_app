'use client';

import Link from 'next/link';
import { Package2Icon, ArrowRightIcon } from 'lucide-react';

interface LowStockDashboardCardProps {
  count: number;
}

export function LowStockDashboardCard({ count }: LowStockDashboardCardProps) {
  if (count === 0) return null;

  const isCritical = count >= 5;
  const cardClasses = isCritical
    ? 'border-status-overdue-border bg-status-overdue-bg'
    : 'border-status-due-border bg-status-due-bg';
  const accentText = isCritical ? 'text-status-overdue-text' : 'text-status-due-text';

  return (
    <Link
      href="/dashboard/lager?filter=low"
      className={`group bg-card rounded-xl border ${cardClasses} p-5 hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-card">
          <Package2Icon className={`h-4.5 w-4.5 ${accentText}`} />
        </div>
        <ArrowRightIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className={`text-2xl font-bold ${accentText}`}>{count}</p>
      <p className="text-xs text-muted-foreground mt-0.5">Teile unter Mindestmenge</p>
    </Link>
  );
}
