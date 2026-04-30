'use client';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MenuIcon, ArrowRightIcon } from 'lucide-react';

export function MobileNavSheet({ isAuthed }: { isAuthed: boolean }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menü öffnen">
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetTitle>Navigation</SheetTitle>
        <nav className="mt-8 flex flex-col gap-4 text-base">
          <a href="#features">Features</a>
          <a href="#pricing">Preise</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="mt-8 flex flex-col gap-2">
          {isAuthed ? (
            <Link href="/dashboard"><Button className="w-full">Zum Dashboard <ArrowRightIcon className="h-4 w-4" /></Button></Link>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" className="w-full">Anmelden</Button></Link>
              <Link href="#cta"><Button className="w-full">30 Tage testen <ArrowRightIcon className="h-4 w-4" /></Button></Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
