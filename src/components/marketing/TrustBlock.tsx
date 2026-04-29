// src/components/marketing/TrustBlock.tsx
import { GlobeIcon, LockIcon, MailCheckIcon, CheckCircle2Icon } from 'lucide-react';
import { TechStackStrip } from './TechStackStrip';

const cards = [
  { icon: GlobeIcon, title: 'Hosting in Frankfurt', body: 'Supabase eu-central-1 · Vercel EU-Region · keine Daten in Drittländern' },
  { icon: LockIcon, title: 'Verschlüsselt End-to-End', body: 'TLS überall · bcrypt für Passwörter · Row-Level-Security auf der Datenbank' },
  { icon: MailCheckIcon, title: 'Doppelt Opt-In für jede Kunden-Mail', body: 'UWG-konform · jederzeit abbestellbar · stateless HMAC-Unsubscribe' },
  { icon: CheckCircle2Icon, title: '324 automatisierte Tests', body: 'TypeScript strict · CI/CD · Sentry-Monitoring im laufenden Betrieb' },
];

export function TrustBlock() {
  return (
    <section id="trust" className="py-20 sm:py-28 px-6 border-t border-border bg-brand-50/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">DSGVO-konform aus Deutschland.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Datenresidenz, Verschlüsselung und Compliance — von Anfang an mitgedacht.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-background p-6">
              <c.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        <TechStackStrip />
      </div>
    </section>
  );
}
