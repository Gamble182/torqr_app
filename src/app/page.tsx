import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TorqrWordmark } from '@/components/brand/TorqrIcon';
import {
  UsersIcon,
  CalendarCheckIcon,
  ZapIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BarChart3Icon,
  BellRingIcon,
} from 'lucide-react';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl flex items-center justify-between h-16 px-6">
          <TorqrWordmark size="sm" theme="light" showTagline={false} />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Anmelden
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Kostenlos starten
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-brand-50 text-sm text-brand-600 mb-8">
            <ZapIcon className="h-3.5 w-3.5 text-brand-accent" />
            Gebaut für Handwerksbetriebe
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Heizungswartung
            <br />
            <span className="text-primary">einfach · automatisch</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Verwalten Sie Kunden, planen Sie Wartungen automatisch und
            digitalisieren Sie Ihre Arbeitsprozesse. Weniger Verwaltung,
            mehr Zeit für Ihr Kerngeschäft.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-8 h-12">
                Kostenlos starten
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 h-12"
              >
                Anmelden
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Alles, was Sie brauchen
            </h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Eine Plattform, die Ihren gesamten Arbeitsalltag vereinfacht
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={UsersIcon}
              title="Kundenverwaltung"
              description="Alle Kundendaten, Kontakte und Geräte zentral organisiert und jederzeit griffbereit."
            />
            <FeatureCard
              icon={CalendarCheckIcon}
              title="Wartungsplanung"
              description="Automatische Terminberechnung und Erinnerungen. Kein Wartungstermin wird mehr vergessen."
            />
            <FeatureCard
              icon={BellRingIcon}
              title="Erinnerungen"
              description="Proaktive Benachrichtigungen bei fälligen und überfälligen Wartungen auf einen Blick."
            />
            <FeatureCard
              icon={BarChart3Icon}
              title="Dashboard"
              description="Übersicht über alle Kennzahlen: offene Wartungen, Kundenbestand und Aktivitäten."
            />
            <FeatureCard
              icon={ZapIcon}
              title="Schnelle Erfassung"
              description="Neue Kunden und Heizsysteme in Sekunden anlegen. Wartungen mit einem Klick dokumentieren."
            />
            <FeatureCard
              icon={ShieldCheckIcon}
              title="Sicher & Zuverlässig"
              description="Ihre Daten sind geschützt. Sichere Anmeldung und verschlüsselte Übertragung."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-brand-50 border-t border-brand-200">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Bereit loszulegen?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Starten Sie jetzt kostenlos und erleben Sie, wie einfach Verwaltung sein kann.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg" className="text-base px-8 h-12">
                Jetzt registrieren
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <TorqrWordmark size="sm" theme="light" showTagline={false} />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} torqr. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 hover:shadow-md hover:border-brand-200 transition-all duration-200">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-primary mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
