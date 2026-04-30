'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';

type Cycle = 'monthly' | 'annual';
const CycleContext = createContext<{ cycle: Cycle; setCycle: (c: Cycle) => void }>({
  cycle: 'annual',
  setCycle: () => {},
});

export function PricingProvider({ children }: { children: ReactNode }) {
  const [cycle, setCycle] = useState<Cycle>('annual');
  return <CycleContext.Provider value={{ cycle, setCycle }}>{children}</CycleContext.Provider>;
}

export function usePricingCycle() {
  return useContext(CycleContext);
}

export function PricingToggle() {
  const { cycle, setCycle } = usePricingCycle();
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-background">
      <button
        type="button"
        onClick={() => setCycle('monthly')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          cycle === 'monthly' ? 'bg-foreground text-background' : 'text-muted-foreground'
        }`}
      >
        Monatlich
      </button>
      <button
        type="button"
        onClick={() => setCycle('annual')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          cycle === 'annual' ? 'bg-foreground text-background' : 'text-muted-foreground'
        }`}
      >
        Jährlich · 2 Monate gratis
      </button>
    </div>
  );
}
