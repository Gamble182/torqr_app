import { PricingProvider, PricingToggle } from './PricingToggle';
import { PricingCard } from './PricingCard';

const tiers = [
  {
    tier: 'Solo' as const,
    audience: 'Für den Ein-Mann-Betrieb',
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      'Bis 50 Kunden',
      'Mobile Wartungs-Checklist',
      'Foto-Dokumentation pro Anlage',
      'Multi-System (Heizung · Klima · Wasser · Energiespeicher)',
      '904 Geräte vorgepflegt',
      'Automatische Kunden-Erinnerungen',
      'Online-Termin-Buchung',
      'Daten-Export (DSGVO Art. 20)',
    ],
    ctaLabel: '30 Tage testen →',
    ctaHref: '#cta-beta-solo',
  },
  {
    tier: 'Professional' as const,
    audience: 'Für Teams ab 2 Personen',
    monthlyPrice: 49,
    annualPrice: 490,
    highlight: true,
    features: [
      'Alles aus Solo, plus:',
      'Bis 150 Kunden',
      'Multi-User mit OWNER/TECHNICIAN-Rollen',
      'Anlagen-Zuweisung an Mitarbeiter',
      'Techniker-Workload-Page',
      '1× Onboarding-Session (1 h)',
    ],
    ctaLabel: '30 Tage testen →',
    ctaHref: '#cta-beta-pro',
  },
  {
    tier: 'Enterprise' as const,
    audience: 'Für Mehr-Standort-Betriebe & Partner',
    monthlyPrice: 99,
    annualPrice: 990,
    features: [
      'Alles aus Professional, plus:',
      'Unlimited Kunden',
      'Public API',
      'Custom-Branding (Logo + Farben in E-Mails)',
      'Priority-Support (24-h SLA)',
      '2× Onboarding-Session (2 h)',
    ],
    ctaLabel: 'Demo buchen →',
    ctaHref: '#cta-demo',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Klare Preise. 30 Tage gratis testen.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Beginne mit dem Tier, der zu deiner Größe passt — wechsle jederzeit.
          </p>
        </div>

        <PricingProvider>
          <div className="flex justify-center mb-12">
            <PricingToggle />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((t) => <PricingCard key={t.tier} {...t} />)}
          </div>
        </PricingProvider>

        <p className="mt-10 text-xs text-center text-muted-foreground">
          Alle Preise zzgl. USt. · 30 Tage gratis · keine Kreditkarte · jederzeit kündbar.
        </p>
      </div>
    </section>
  );
}
