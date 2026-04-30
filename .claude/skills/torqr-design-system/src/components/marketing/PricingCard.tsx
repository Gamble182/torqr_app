'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { usePricingCycle } from './PricingToggle';

export interface PricingCardProps {
  tier: 'Solo' | 'Professional' | 'Enterprise';
  audience: string;
  monthlyPrice: number;
  annualPrice: number; // total per year
  highlight?: boolean;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

export function PricingCard({ tier, audience, monthlyPrice, annualPrice, highlight, features, ctaLabel, ctaHref }: PricingCardProps) {
  const { cycle } = usePricingCycle();
  const displayPrice = cycle === 'annual' ? Math.round(annualPrice / 12) : monthlyPrice;
  const annualHint = cycle === 'annual' ? `(${annualPrice} €/Jahr)` : null;

  return (
    <div className={`relative rounded-2xl p-8 flex flex-col ${
      highlight
        ? 'border-2 border-primary bg-background shadow-xl'
        : 'border border-border bg-background'
    }`}>
      {highlight ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-amber-950 text-xs font-medium tracking-wide">
          BELIEBTESTE WAHL
        </div>
      ) : null}

      <h3 className="text-xl font-bold text-foreground">{tier}</h3>
      <p className="text-sm text-muted-foreground mt-1">{audience}</p>

      <div className="mt-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">€{displayPrice}</span>
          <span className="text-sm text-muted-foreground">/ Monat</span>
        </div>
        {annualHint ? <p className="text-xs text-muted-foreground mt-1">{annualHint}</p> : null}
      </div>

      <ul className="mt-6 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground">{f}</span>
          </li>
        ))}
      </ul>

      <Link href={ctaHref} className="mt-8 block">
        <Button className="w-full" variant={highlight ? 'default' : 'outline'} size="lg">
          {ctaLabel}
        </Button>
      </Link>
    </div>
  );
}
