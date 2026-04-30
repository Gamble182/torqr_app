'use client';
import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BetaListForm } from './BetaListForm';
import { DemoRequestForm } from './DemoRequestForm';

export function FinalCta() {
  const [tab, setTab] = useState<'beta' | 'demo'>('beta');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const setFromHash = () => {
      const h = window.location.hash;
      setTab(h === '#cta-demo' ? 'demo' : 'beta');
    };
    setFromHash();
    window.addEventListener('hashchange', setFromHash);
    return () => window.removeEventListener('hashchange', setFromHash);
  }, []);

  return (
    <section id="cta" className="py-20 sm:py-28 px-6 border-t border-border bg-brand-50">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Bereit, deine Wartungssaison neu zu denken?</h2>
          <p className="mt-4 text-base text-muted-foreground">
            30 Tage gratis · keine Kreditkarte · jederzeit kündbar.
          </p>
        </div>

        <div className="bg-background rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'beta' | 'demo')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="beta">30 Tage testen</TabsTrigger>
              <TabsTrigger value="demo">Demo buchen</TabsTrigger>
            </TabsList>
            <TabsContent value="beta">
              <BetaListForm />
            </TabsContent>
            <TabsContent value="demo">
              <DemoRequestForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
