// src/components/marketing/FeatureBlock.tsx
import Image from 'next/image';
import { CheckIcon } from 'lucide-react';

export interface FeatureBlockProps {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
  isGif?: boolean;
  reverse?: boolean;
}

export function FeatureBlock({
  eyebrow, title, description, bullets, imageSrc, imageAlt, isGif, reverse,
}: FeatureBlockProps) {
  return (
    <div className={`grid gap-12 lg:grid-cols-2 lg:items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <p className="text-xs uppercase tracking-[1.5px] text-primary font-medium mb-3">{eyebrow}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{title}</h3>
        <p className="text-base text-muted-foreground leading-relaxed mb-6">{description}</p>
        <ul className="space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-foreground">
              <CheckIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card shadow-sm">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          unoptimized={isGif}
        />
      </div>
    </div>
  );
}
