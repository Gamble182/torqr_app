// src/components/marketing/Hero.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';
import { HeroVisual } from './HeroVisual';

export function Hero() {
  return (
    <section id="hero" className="pt-32 pb-32 sm:pb-40 px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand bg-brand-50 text-xs uppercase tracking-[1.5px] text-primary font-medium">
            ▰ Die Wartungsakte für Heizungsbauer
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Aus Excel raus.
            <br />
            In die <span className="text-primary">Hosentasche</span> rein.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Torqr digitalisiert deine Wartungsplanung — automatische Kunden-Erinnerungen,
            mobile Vor-Ort-Dokumentation, alle Daten zentral statt verstreut auf Excel und Outlook.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="#cta-hero">
              <Button size="lg" className="text-base px-8 h-12">
                30 Tage testen <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#cta-demo">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                Demo buchen
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Keine Kreditkarte · jederzeit kündbar · DSGVO-konform
          </p>
        </div>

        <div className="lg:pl-8">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
