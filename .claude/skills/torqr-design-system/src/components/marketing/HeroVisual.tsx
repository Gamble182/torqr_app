// src/components/marketing/HeroVisual.tsx
import Image from 'next/image';

/**
 * V1: Static composition. Real assets dropped to public/marketing/hero/ in Phase 7.
 * Until then, placeholder backgrounds prevent broken-image rendering.
 */
export function HeroVisual() {
  return (
    <div className="relative w-full max-w-xl mx-auto" aria-label="Vorschau Torqr-App auf Smartphone und Desktop">
      {/* Desktop browser frame */}
      <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex gap-1.5 p-2 bg-gray-800">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="relative aspect-[16/10] bg-white">
          <Image
            src="/marketing/hero/dashboard-desktop.png"
            alt="Torqr Dashboard mit Wartungs-Übersicht"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Phone frame, overlapping bottom-right */}
      <div className="absolute -bottom-12 -right-4 sm:right-2 w-32 sm:w-40 lg:w-48">
        <div className="bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
          <div className="relative aspect-[9/19.5] bg-white rounded-[1.5rem] overflow-hidden">
            <Image
              src="/marketing/hero/wartungs-checklist.gif"
              alt="Mobile Wartungs-Checklist im 3-Step-Wizard"
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
}
