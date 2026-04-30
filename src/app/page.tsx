// src/app/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { Hero } from '@/components/marketing/Hero';
import { PainBlock } from '@/components/marketing/PainBlock';
import { ThreeStepSolution } from '@/components/marketing/ThreeStepSolution';
import { FeatureSection } from '@/components/marketing/FeatureSection';
import { RoiBlock } from '@/components/marketing/RoiBlock';
import { PilotStatus } from '@/components/marketing/PilotStatus';
import { TrustBlock } from '@/components/marketing/TrustBlock';
import { Pricing } from '@/components/marketing/Pricing';
import { Faq } from '@/components/marketing/Faq';
import { FinalCta } from '@/components/marketing/FinalCta';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background">
        <Hero />
        <PainBlock />
        <ThreeStepSolution />
        <FeatureSection />
        <RoiBlock />
        <PilotStatus />
        <TrustBlock />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <MarketingFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Torqr',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'EUR',
              lowPrice: '29',
              highPrice: '99',
            },
            description: 'Wartungsmanagement-Plattform für Heizungsbau-Betriebe.',
          }),
        }}
      />
    </>
  );
}
