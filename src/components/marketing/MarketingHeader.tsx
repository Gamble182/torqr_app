import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { TorqrWordmark } from '@/components/brand/TorqrIcon';
import { ArrowRightIcon } from 'lucide-react';
import { MobileNavSheet } from './MobileNavSheet';

export async function MarketingHeader() {
  const session = await auth();
  const isAuthed = Boolean(session?.user);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl flex items-center justify-between h-16 px-6">
        <Link href="/"><TorqrWordmark size="sm" theme="light" showTagline={false} /></Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Preise</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {isAuthed ? (
            <Link href="/dashboard"><Button size="sm">Zum Dashboard <ArrowRightIcon className="h-3.5 w-3.5" /></Button></Link>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm">Anmelden</Button></Link>
              <Link href="#cta"><Button size="sm">30 Tage testen <ArrowRightIcon className="h-3.5 w-3.5" /></Button></Link>
            </>
          )}
        </div>

        <MobileNavSheet isAuthed={isAuthed} />
      </div>
    </header>
  );
}
