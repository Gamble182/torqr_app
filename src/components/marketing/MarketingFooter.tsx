import Link from 'next/link';
import { TorqrWordmark } from '@/components/brand/TorqrIcon';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border py-12 px-6 bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <TorqrWordmark size="sm" theme="light" showTagline={false} />
            <p className="mt-3 text-xs text-muted-foreground">Die Wartungsakte für Heizungsbauer.</p>
            <p className="mt-2 text-xs text-muted-foreground">🇩🇪 Made in Germany</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Produkt</p>
            <ul className="space-y-2 text-sm">
              <li><a href="/#features" className="text-foreground hover:text-primary">Features</a></li>
              <li><a href="/#pricing" className="text-foreground hover:text-primary">Preise</a></li>
              <li><a href="/#faq" className="text-foreground hover:text-primary">FAQ</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Rechtliches</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/datenschutz" className="text-foreground hover:text-primary">Datenschutz</Link></li>
              <li><Link href="/impressum" className="text-foreground hover:text-primary">Impressum</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Kontakt</p>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:hello@torqr.de" className="text-foreground hover:text-primary">hello@torqr.de</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Torqr · Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}
