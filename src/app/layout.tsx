import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL('https://torqr.de'),
  title: {
    default: 'Torqr · Die Wartungsakte für Heizungsbauer',
    template: '%s · Torqr',
  },
  description: 'Torqr digitalisiert deine Wartungsplanung — automatische Kunden-Erinnerungen, mobile Vor-Ort-Dokumentation, alle Daten zentral. 30 Tage gratis testen.',
  keywords: [
    'Wartungssoftware Heizungsbauer',
    'Heizungswartung Software',
    'Wartungsplaner',
    'Handwerker App',
    'SHK Software',
    'Heizungswartung digital',
  ],
  authors: [{ name: 'Torqr' }],
  openGraph: {
    title: 'Torqr · Die Wartungsakte für Heizungsbauer',
    description: 'Aus Excel raus. In die Hosentasche rein. 30 Tage gratis testen.',
    url: 'https://torqr.de',
    siteName: 'Torqr',
    locale: 'de_DE',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Torqr Landing-Page-Vorschau' }],
  },
  twitter: { card: 'summary_large_image', title: 'Torqr · Die Wartungsakte für Heizungsbauer', description: 'Aus Excel raus. In die Hosentasche rein.', images: ['/og-image.png'] },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://torqr.de' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
