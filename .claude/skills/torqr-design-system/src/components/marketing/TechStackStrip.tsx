// src/components/marketing/TechStackStrip.tsx
export function TechStackStrip() {
  return (
    <div className="mt-12 pt-8 border-t border-border">
      <p className="text-xs text-center text-muted-foreground mb-4">Hosting & Infrastruktur</p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 grayscale opacity-60">
        <span className="text-sm font-medium text-foreground/80">▲ Vercel</span>
        <span className="text-sm font-medium text-foreground/80">⚡ Supabase</span>
        <span className="text-sm font-medium text-foreground/80">✉ Resend</span>
      </div>
    </div>
  );
}
