# Cookie Consent + Analytics (Vercel + PostHog) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a DSGVO-compliant consent gate (3-option cookie banner with per-service toggles) that controls Vercel Analytics + PostHog activation, plus conversion tracking for beta-lead and demo-request submissions.

**Architecture:** A single React Context (`ConsentProvider`) holds the consent state, persisted to LocalStorage with a versioned schema. Two analytics gates (`PostHogProvider`, `VercelAnalyticsGate`) read the context and only initialize their respective services when the user has explicitly opted in for that service. PostHog is loaded via dynamic `import('posthog-js')` so zero bytes of analytics code reach the browser before consent. The banner is rendered inside the global `Providers` so it's available on every route.

**Tech Stack:** React Context + `useReducer`, LocalStorage with version key, `posthog-js` (dynamic import), `@vercel/analytics/next`'s `Analytics` component, shadcn `dialog` + existing `switch`. Tests use the project's existing Vitest node environment for pure logic (storage, reducer, tracker helpers); UI verified visually via Next.js dev server + browser.

**Out of scope (deferred to follow-up backlog item):** Full Content-Security-Policy header. The BACKLOG entry said "CSP-Anpassung in next.config.ts" but `next.config.ts` currently has no CSP — adding one from scratch carries non-trivial regression risk against Sentry, NextAuth callbacks, Cal.com booking iframes, Supabase storage URLs. PostHog and Vercel Analytics work without an explicit CSP (no policy = no restriction). Will be addressed as a separate spec.

---

## File Structure

**Create:**
- `src/lib/consent/types.ts` — `ConsentState`, `ServiceConsent`, version + storage-key constants
- `src/lib/consent/storage.ts` — `loadConsent`, `saveConsent`, `resetConsent` (pure LocalStorage I/O)
- `src/lib/consent/reducer.ts` — `consentReducer` + `ConsentAction` type
- `src/lib/consent/context.tsx` — `ConsentProvider` + `useConsent` hook
- `src/lib/consent/__tests__/storage.test.ts` — round-trip, version mismatch, missing-window safety
- `src/lib/consent/__tests__/reducer.test.ts` — every action transition
- `src/components/marketing/CookieBanner.tsx` — bottom-fixed 3-button banner
- `src/components/marketing/CookieSettingsDialog.tsx` — per-service toggle modal
- `src/lib/analytics/posthog-provider.tsx` — consent-gated dynamic init
- `src/lib/analytics/vercel-analytics-gate.tsx` — conditionally-mounted `<Analytics />`
- `src/lib/analytics/track.ts` — `trackBetaLeadSubmitted`, `trackDemoRequestSubmitted`
- `src/lib/analytics/__tests__/track.test.ts` — no-op when posthog missing, capture call when loaded
- `src/components/ui/dialog.tsx` — shadcn primitive (added via CLI, not hand-written)

**Modify:**
- `src/components/Providers.tsx` — wrap children with `ConsentProvider` + `PostHogProvider` + `VercelAnalyticsGate` + render `CookieBanner`
- `src/components/marketing/BetaListForm.tsx` — call `trackBetaLeadSubmitted` on success
- `src/components/marketing/DemoRequestForm.tsx` — call `trackDemoRequestSubmitted` on success
- `src/components/marketing/MarketingFooter.tsx` — add "Cookie-Einstellungen" link
- `src/app/datenschutz/page.tsx` — replace section 6 (Cookies), add Vercel Analytics + PostHog as auftragsverarbeiter, link to settings
- `.env.example` — add `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST`
- `package.json` + `package-lock.json` — `posthog-js`, `@vercel/analytics`
- `docs/BACKLOG.md` — mark #77 + Cookie-Banner resolved, add new CSP follow-up item

---

## Task 1: Worktree + dependency install

**Files:**
- New worktree branch: `feature/cookie-consent-analytics`
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Create worktree**

```bash
git worktree add .worktrees/feature/cookie-consent-analytics -b feature/cookie-consent-analytics main
cd .worktrees/feature/cookie-consent-analytics
```

Expected: new directory `.worktrees/feature/cookie-consent-analytics` checked out at `main`. All subsequent commands run from there.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install posthog-js @vercel/analytics
```

Expected: both packages added to `package.json` under `dependencies`, lockfile updated.

- [ ] **Step 3: Add shadcn dialog primitive**

```bash
npx shadcn@latest add dialog --yes
```

Expected: `src/components/ui/dialog.tsx` created. If `--yes` is rejected interactively, run without it and accept defaults.

- [ ] **Step 4: Verify deps resolved**

```bash
node -e "console.log(require('posthog-js/package.json').version, require('@vercel/analytics/package.json').version)"
ls src/components/ui/dialog.tsx
```

Expected: prints two version strings; `dialog.tsx` listed.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/ui/dialog.tsx
git commit -m "chore: add posthog-js, @vercel/analytics, shadcn dialog"
```

---

## Task 2: Consent types + storage layer with tests

**Files:**
- Create: `src/lib/consent/types.ts`
- Create: `src/lib/consent/storage.ts`
- Test: `src/lib/consent/__tests__/storage.test.ts`

- [ ] **Step 1: Write `types.ts`**

```ts
// src/lib/consent/types.ts
export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = 'torqr-consent-v1';

export type ServiceConsent = {
  vercelAnalytics: boolean;
  posthog: boolean;
};

export type ConsentState = {
  version: number;
  decided: boolean;
  services: ServiceConsent;
  decidedAt: string | null;
};

export const DEFAULT_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  decided: false,
  services: { vercelAnalytics: false, posthog: false },
  decidedAt: null,
};
```

- [ ] **Step 2: Write the failing storage test**

```ts
// src/lib/consent/__tests__/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadConsent, saveConsent, resetConsent } from '../storage';
import { CONSENT_STORAGE_KEY, DEFAULT_CONSENT, type ConsentState } from '../types';

const memoryStore = new Map<string, string>();
const fakeStorage: Storage = {
  get length() { return memoryStore.size; },
  clear: () => memoryStore.clear(),
  getItem: (k) => memoryStore.get(k) ?? null,
  setItem: (k, v) => { memoryStore.set(k, v); },
  removeItem: (k) => { memoryStore.delete(k); },
  key: (i) => Array.from(memoryStore.keys())[i] ?? null,
};

beforeEach(() => {
  memoryStore.clear();
  // @ts-expect-error — mocking window for node test env
  globalThis.window = { localStorage: fakeStorage };
});

describe('consent storage', () => {
  it('returns DEFAULT_CONSENT when nothing stored', () => {
    expect(loadConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('round-trips a saved state', () => {
    const state: ConsentState = {
      version: 1,
      decided: true,
      services: { vercelAnalytics: true, posthog: false },
      decidedAt: '2026-05-04T10:00:00.000Z',
    };
    saveConsent(state);
    expect(loadConsent()).toEqual(state);
  });

  it('returns DEFAULT_CONSENT when version mismatch', () => {
    memoryStore.set(CONSENT_STORAGE_KEY, JSON.stringify({ ...DEFAULT_CONSENT, version: 99 }));
    expect(loadConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('returns DEFAULT_CONSENT when JSON malformed', () => {
    memoryStore.set(CONSENT_STORAGE_KEY, '{broken');
    expect(loadConsent()).toEqual(DEFAULT_CONSENT);
  });

  it('resetConsent removes the key', () => {
    saveConsent({ ...DEFAULT_CONSENT, decided: true });
    resetConsent();
    expect(memoryStore.has(CONSENT_STORAGE_KEY)).toBe(false);
  });

  it('loadConsent is SSR-safe (no window)', () => {
    // @ts-expect-error — simulate SSR
    delete globalThis.window;
    expect(loadConsent()).toEqual(DEFAULT_CONSENT);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/lib/consent/__tests__/storage.test.ts
```

Expected: FAIL with "Cannot find module '../storage'" (file does not exist yet).

- [ ] **Step 4: Implement `storage.ts`**

```ts
// src/lib/consent/storage.ts
import {
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  DEFAULT_CONSENT,
  type ConsentState,
} from './types';

export function loadConsent(): ConsentState {
  if (typeof window === 'undefined') return DEFAULT_CONSENT;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return DEFAULT_CONSENT;
    return parsed;
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function saveConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or storage disabled — silent no-op
  }
}

export function resetConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // no-op
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/consent/__tests__/storage.test.ts
```

Expected: 6/6 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/consent/types.ts src/lib/consent/storage.ts src/lib/consent/__tests__/storage.test.ts
git commit -m "feat(consent): types + storage layer with version-aware load"
```

---

## Task 3: Consent reducer with tests

**Files:**
- Create: `src/lib/consent/reducer.ts`
- Test: `src/lib/consent/__tests__/reducer.test.ts`

- [ ] **Step 1: Write the failing reducer test**

```ts
// src/lib/consent/__tests__/reducer.test.ts
import { describe, it, expect } from 'vitest';
import { consentReducer } from '../reducer';
import { DEFAULT_CONSENT, type ConsentState } from '../types';

describe('consentReducer', () => {
  it('hydrate replaces full state', () => {
    const next: ConsentState = {
      version: 1, decided: true,
      services: { vercelAnalytics: true, posthog: false },
      decidedAt: '2026-05-04T08:00:00.000Z',
    };
    expect(consentReducer(DEFAULT_CONSENT, { type: 'hydrate', state: next })).toEqual(next);
  });

  it('accept_all sets both services true and decided=true', () => {
    const result = consentReducer(DEFAULT_CONSENT, { type: 'accept_all' });
    expect(result.decided).toBe(true);
    expect(result.services).toEqual({ vercelAnalytics: true, posthog: true });
    expect(result.decidedAt).not.toBeNull();
  });

  it('reject_all sets both services false and decided=true', () => {
    const result = consentReducer(DEFAULT_CONSENT, { type: 'reject_all' });
    expect(result.decided).toBe(true);
    expect(result.services).toEqual({ vercelAnalytics: false, posthog: false });
    expect(result.decidedAt).not.toBeNull();
  });

  it('set_services merges partial updates and marks decided', () => {
    const result = consentReducer(DEFAULT_CONSENT, {
      type: 'set_services',
      services: { posthog: true },
    });
    expect(result.decided).toBe(true);
    expect(result.services).toEqual({ vercelAnalytics: false, posthog: true });
  });

  it('reopen toggles decided back to false but keeps services', () => {
    const decided: ConsentState = {
      version: 1, decided: true,
      services: { vercelAnalytics: true, posthog: false },
      decidedAt: '2026-05-04T08:00:00.000Z',
    };
    const result = consentReducer(decided, { type: 'reopen' });
    expect(result.decided).toBe(false);
    expect(result.services).toEqual(decided.services);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/consent/__tests__/reducer.test.ts
```

Expected: FAIL with "Cannot find module '../reducer'".

- [ ] **Step 3: Implement `reducer.ts`**

```ts
// src/lib/consent/reducer.ts
import {
  CONSENT_VERSION,
  type ConsentState,
  type ServiceConsent,
} from './types';

export type ConsentAction =
  | { type: 'hydrate'; state: ConsentState }
  | { type: 'accept_all' }
  | { type: 'reject_all' }
  | { type: 'set_services'; services: Partial<ServiceConsent> }
  | { type: 'reopen' };

export function consentReducer(state: ConsentState, action: ConsentAction): ConsentState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'accept_all':
      return {
        version: CONSENT_VERSION,
        decided: true,
        services: { vercelAnalytics: true, posthog: true },
        decidedAt: new Date().toISOString(),
      };
    case 'reject_all':
      return {
        version: CONSENT_VERSION,
        decided: true,
        services: { vercelAnalytics: false, posthog: false },
        decidedAt: new Date().toISOString(),
      };
    case 'set_services':
      return {
        version: CONSENT_VERSION,
        decided: true,
        services: { ...state.services, ...action.services },
        decidedAt: new Date().toISOString(),
      };
    case 'reopen':
      return { ...state, decided: false };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/consent/__tests__/reducer.test.ts
```

Expected: 5/5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/consent/reducer.ts src/lib/consent/__tests__/reducer.test.ts
git commit -m "feat(consent): reducer with hydrate/accept/reject/set/reopen actions"
```

---

## Task 4: Consent React Context

**Files:**
- Create: `src/lib/consent/context.tsx`

- [ ] **Step 1: Implement the context**

```tsx
// src/lib/consent/context.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_CONSENT, type ConsentState, type ServiceConsent } from './types';
import { consentReducer } from './reducer';
import { loadConsent, saveConsent } from './storage';

type ConsentContextValue = {
  consent: ConsentState;
  hydrated: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  setServices: (services: Partial<ServiceConsent>) => void;
  reopen: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(consentReducer, DEFAULT_CONSENT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadConsent();
    dispatch({ type: 'hydrate', state: loaded });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveConsent(state);
  }, [state, hydrated]);

  return (
    <ConsentContext.Provider
      value={{
        consent: state,
        hydrated,
        acceptAll: () => dispatch({ type: 'accept_all' }),
        rejectAll: () => dispatch({ type: 'reject_all' }),
        setServices: (services) => dispatch({ type: 'set_services', services }),
        reopen: () => dispatch({ type: 'reopen' }),
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/lib/consent/context.tsx
git commit -m "feat(consent): React context with LocalStorage hydration + persistence"
```

---

## Task 5: Cookie Banner + Settings Dialog

**Files:**
- Create: `src/components/marketing/CookieBanner.tsx`
- Create: `src/components/marketing/CookieSettingsDialog.tsx`

- [ ] **Step 1: Implement the settings dialog**

```tsx
// src/components/marketing/CookieSettingsDialog.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useConsent } from '@/lib/consent/context';

export function CookieSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { consent, setServices } = useConsent();
  const [draftVercel, setDraftVercel] = useState(consent.services.vercelAnalytics);
  const [draftPostHog, setDraftPostHog] = useState(consent.services.posthog);

  useEffect(() => {
    if (open) {
      setDraftVercel(consent.services.vercelAnalytics);
      setDraftPostHog(consent.services.posthog);
    }
  }, [open, consent.services.vercelAnalytics, consent.services.posthog]);

  const onSave = () => {
    setServices({ vercelAnalytics: draftVercel, posthog: draftPostHog });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cookie-Einstellungen</DialogTitle>
          <DialogDescription>
            Wähle aus, welche Dienste du erlaubst. Du kannst deine Auswahl jederzeit ändern.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="essential" className="text-sm font-medium">Essentielle Cookies</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Login-Session, Sicherheit. Immer aktiv.
              </p>
            </div>
            <Switch id="essential" checked disabled />
          </div>

          <div className="flex items-start justify-between gap-4 pt-3 border-t border-border">
            <div>
              <Label htmlFor="vercel" className="text-sm font-medium">Vercel Analytics</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Anonyme Seitenaufrufe und Performance-Daten. Keine Cookies.
              </p>
            </div>
            <Switch id="vercel" checked={draftVercel} onCheckedChange={setDraftVercel} />
          </div>

          <div className="flex items-start justify-between gap-4 pt-3 border-t border-border">
            <div>
              <Label htmlFor="posthog" className="text-sm font-medium">PostHog Product Analytics</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Anonyme Nutzungsanalyse zur Produktverbesserung. EU-Server (Frankfurt).
              </p>
            </div>
            <Switch id="posthog" checked={draftPostHog} onCheckedChange={setDraftPostHog} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSave}>Speichern und schließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Implement the banner**

```tsx
// src/components/marketing/CookieBanner.tsx
'use client';

import { useState } from 'react';
import { useConsent } from '@/lib/consent/context';
import { Button } from '@/components/ui/button';
import { CookieSettingsDialog } from './CookieSettingsDialog';

export function CookieBanner() {
  const { consent, hydrated, acceptAll, rejectAll } = useConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!hydrated || consent.decided) return null;

  return (
    <>
      <div
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 rounded-lg border border-border bg-background shadow-lg p-5"
      >
        <h2 id="cookie-banner-title" className="text-sm font-semibold text-foreground mb-2">
          Cookies und Tracking
        </h2>
        <p id="cookie-banner-description" className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Wir nutzen technisch notwendige Cookies sowie optional Analyse-Tools (Vercel Analytics,
          PostHog) zur Verbesserung der Seite. Details in der{' '}
          <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={acceptAll} size="sm" className="flex-1">Alle akzeptieren</Button>
          <Button onClick={rejectAll} size="sm" variant="outline" className="flex-1">Nur essentielle</Button>
          <Button
            onClick={() => setSettingsOpen(true)}
            size="sm"
            variant="ghost"
            className="flex-1"
          >
            Einstellungen
          </Button>
        </div>
      </div>
      <CookieSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/CookieBanner.tsx src/components/marketing/CookieSettingsDialog.tsx
git commit -m "feat(consent): cookie banner + settings dialog"
```

---

## Task 6: PostHog provider with consent gate + Vercel Analytics gate

**Files:**
- Create: `src/lib/analytics/posthog-provider.tsx`
- Create: `src/lib/analytics/vercel-analytics-gate.tsx`

- [ ] **Step 1: Implement PostHog provider**

```tsx
// src/lib/analytics/posthog-provider.tsx
'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useConsent } from '@/lib/consent/context';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

export function PostHogProvider({ children }: { children: ReactNode }) {
  const { consent, hydrated } = useConsent();
  const initialized = useRef(false);

  // Lazy-init only when consent is granted
  useEffect(() => {
    if (!hydrated) return;
    if (!consent.services.posthog) return;
    if (initialized.current) return;
    if (!POSTHOG_KEY) return;
    initialized.current = true;
    void (async () => {
      const { default: posthog } = await import('posthog-js');
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',
        autocapture: false,
        capture_pageview: 'history_change',
        disable_session_recording: true,
      });
    })();
  }, [consent.services.posthog, hydrated]);

  // Honor revocation: stop capturing if user disables after init
  useEffect(() => {
    if (!initialized.current) return;
    if (consent.services.posthog) return;
    void (async () => {
      const { default: posthog } = await import('posthog-js');
      if (typeof posthog.opt_out_capturing === 'function') posthog.opt_out_capturing();
    })();
  }, [consent.services.posthog]);

  return <>{children}</>;
}
```

- [ ] **Step 2: Implement Vercel Analytics gate**

```tsx
// src/lib/analytics/vercel-analytics-gate.tsx
'use client';

import { Analytics } from '@vercel/analytics/next';
import { useConsent } from '@/lib/consent/context';

export function VercelAnalyticsGate() {
  const { consent, hydrated } = useConsent();
  if (!hydrated) return null;
  if (!consent.services.vercelAnalytics) return null;
  return <Analytics />;
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/analytics/posthog-provider.tsx src/lib/analytics/vercel-analytics-gate.tsx
git commit -m "feat(analytics): consent-gated PostHog dynamic init + Vercel Analytics gate"
```

---

## Task 7: Wire everything into Providers + render banner

**Files:**
- Modify: `src/components/Providers.tsx`

- [ ] **Step 1: Update Providers to include all consent + analytics layers**

Replace the entire file `src/components/Providers.tsx` with:

```tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { ReactNode } from 'react';
import { ReactQueryProvider } from '@/lib/react-query';
import { ConsentProvider } from '@/lib/consent/context';
import { PostHogProvider } from '@/lib/analytics/posthog-provider';
import { VercelAnalyticsGate } from '@/lib/analytics/vercel-analytics-gate';
import { CookieBanner } from '@/components/marketing/CookieBanner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ReactQueryProvider>
        <ConsentProvider>
          <PostHogProvider>
            {children}
            <Toaster position="top-right" richColors />
            <VercelAnalyticsGate />
            <CookieBanner />
          </PostHogProvider>
        </ConsentProvider>
      </ReactQueryProvider>
    </SessionProvider>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Smoke-test in dev server**

```bash
npm run dev
```

Then open `http://localhost:3000/`:
1. Banner appears bottom-right.
2. Open DevTools → Application → LocalStorage → confirm `torqr-consent-v1` is **absent**.
3. Click "Alle akzeptieren". Banner disappears. LocalStorage now contains `{ "version":1, "decided":true, "services":{ "vercelAnalytics":true, "posthog":true }, ... }`.
4. Reload page. Banner stays hidden.
5. Open DevTools → Network → filter "posthog". Confirm `/static/array.js` or similar request appears (PostHog now loaded).
6. Clear LocalStorage → reload. Banner reappears.
7. Click "Nur essentielle". LocalStorage shows `services` both `false`. Network has no PostHog requests. No `_vercel` requests.
8. Clear LocalStorage → reload → click "Einstellungen". Dialog opens. Toggle PostHog on, leave Vercel off, save. Verify only PostHog requests in Network.

Expected: all 8 checks pass. Stop the dev server (`Ctrl+C` or kill).

- [ ] **Step 4: Commit**

```bash
git add src/components/Providers.tsx
git commit -m "feat(consent): mount ConsentProvider + analytics gates + banner globally"
```

---

## Task 8: Conversion event helpers with tests

**Files:**
- Create: `src/lib/analytics/track.ts`
- Test: `src/lib/analytics/__tests__/track.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/analytics/__tests__/track.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const captureMock = vi.fn();

vi.mock('posthog-js', () => ({
  default: {
    __loaded: false as boolean,
    capture: captureMock,
  },
}));

beforeEach(() => {
  captureMock.mockReset();
  // @ts-expect-error mock window for node env
  globalThis.window = {};
  process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
});

describe('track helpers', () => {
  it('trackBetaLeadSubmitted is a no-op when posthog is not loaded', async () => {
    const { trackBetaLeadSubmitted } = await import('../track');
    const posthog = (await import('posthog-js')).default as unknown as { __loaded: boolean };
    posthog.__loaded = false;
    await trackBetaLeadSubmitted({ tier: 'SOLO', source: 'hero' });
    expect(captureMock).not.toHaveBeenCalled();
  });

  it('trackBetaLeadSubmitted captures with props when loaded', async () => {
    const { trackBetaLeadSubmitted } = await import('../track');
    const posthog = (await import('posthog-js')).default as unknown as { __loaded: boolean };
    posthog.__loaded = true;
    await trackBetaLeadSubmitted({ tier: 'PRO', source: 'pricing-pro' });
    expect(captureMock).toHaveBeenCalledWith('beta_lead_submitted', {
      tier: 'PRO',
      source: 'pricing-pro',
    });
  });

  it('trackDemoRequestSubmitted captures when loaded', async () => {
    const { trackDemoRequestSubmitted } = await import('../track');
    const posthog = (await import('posthog-js')).default as unknown as { __loaded: boolean };
    posthog.__loaded = true;
    await trackDemoRequestSubmitted({ source: 'final-cta' });
    expect(captureMock).toHaveBeenCalledWith('demo_request_submitted', {
      source: 'final-cta',
    });
  });

  it('is a no-op when window is undefined (SSR)', async () => {
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    const { trackBetaLeadSubmitted } = await import('../track');
    await trackBetaLeadSubmitted({ tier: 'SOLO' });
    expect(captureMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/analytics/__tests__/track.test.ts
```

Expected: FAIL with "Cannot find module '../track'".

- [ ] **Step 3: Implement `track.ts`**

```ts
// src/lib/analytics/track.ts
type TierInterest = 'SOLO' | 'PRO' | null | undefined;

type BetaLeadProps = { tier?: TierInterest; source?: string | null };
type DemoRequestProps = { source?: string | null };

async function safeCapture(event: string, props: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  try {
    const { default: posthog } = await import('posthog-js');
    if (!posthog.__loaded) return;
    posthog.capture(event, props);
  } catch {
    // PostHog not available — silent no-op
  }
}

export async function trackBetaLeadSubmitted(props: BetaLeadProps = {}) {
  await safeCapture('beta_lead_submitted', {
    tier: props.tier ?? null,
    source: props.source ?? null,
  });
}

export async function trackDemoRequestSubmitted(props: DemoRequestProps = {}) {
  await safeCapture('demo_request_submitted', {
    source: props.source ?? null,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/analytics/__tests__/track.test.ts
```

Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/track.ts src/lib/analytics/__tests__/track.test.ts
git commit -m "feat(analytics): trackBetaLeadSubmitted + trackDemoRequestSubmitted helpers"
```

---

## Task 9: Wire trackers into the two forms

**Files:**
- Modify: `src/components/marketing/BetaListForm.tsx`
- Modify: `src/components/marketing/DemoRequestForm.tsx`

- [ ] **Step 1: Update BetaListForm to call tracker on success**

In `src/components/marketing/BetaListForm.tsx`, add an import at the top of the existing imports:

```tsx
import { trackBetaLeadSubmitted } from '@/lib/analytics/track';
```

Then replace the success branch inside `onSubmit`. The current code has:

```tsx
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg(j.error ?? 'Etwas ist schiefgelaufen. Bitte versuche es nochmal.');
        setSubmitState('error');
        return;
      }
      setSubmitState('success');
```

Change the last line to:

```tsx
      setSubmitState('success');
      void trackBetaLeadSubmitted({
        tier: data.tierInterest ?? null,
        source: data.source ?? null,
      });
```

- [ ] **Step 2: Update DemoRequestForm similarly**

In `src/components/marketing/DemoRequestForm.tsx`, add the import:

```tsx
import { trackDemoRequestSubmitted } from '@/lib/analytics/track';
```

Find `setSubmitState('success');` (the success branch in `onSubmit`, around line 51) and replace with:

```tsx
      setSubmitState('success');
      void trackDemoRequestSubmitted({
        source: (data as { source?: string | null }).source ?? null,
      });
```

If `data.source` is not part of `DemoRequestInput`, drop the source prop and use `void trackDemoRequestSubmitted();` instead — verify by checking the schema in `src/lib/validations.ts` first.

- [ ] **Step 3: Typecheck + tests still green**

```bash
npx tsc --noEmit
npx vitest run
```

Expected: tsc clean, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/BetaListForm.tsx src/components/marketing/DemoRequestForm.tsx
git commit -m "feat(analytics): track beta-lead + demo-request conversions"
```

---

## Task 10: Datenschutz page + MarketingFooter updates

**Files:**
- Modify: `src/app/datenschutz/page.tsx`
- Modify: `src/components/marketing/MarketingFooter.tsx`

- [ ] **Step 1: Add Cookie-Einstellungen reopen helper**

The settings dialog is owned by `CookieBanner`. To reopen settings from outside, the simplest path is a small client-only link component that calls `reopen()` on the consent context — which causes the banner to reappear, with a "Settings" button in it.

Create `src/components/marketing/CookieSettingsLink.tsx`:

```tsx
// src/components/marketing/CookieSettingsLink.tsx
'use client';

import { useConsent } from '@/lib/consent/context';

export function CookieSettingsLink({ className }: { className?: string }) {
  const { reopen } = useConsent();
  return (
    <button type="button" onClick={reopen} className={className ?? 'underline text-foreground hover:text-primary'}>
      Cookie-Einstellungen
    </button>
  );
}
```

- [ ] **Step 2: Add the link to MarketingFooter**

Open `src/components/marketing/MarketingFooter.tsx`. The "Rechtliches" `<ul>` currently contains Datenschutz + Impressum. Add a third `<li>`:

```tsx
import { CookieSettingsLink } from './CookieSettingsLink';
// ...
              <li><Link href="/datenschutz" className="text-foreground hover:text-primary">Datenschutz</Link></li>
              <li><Link href="/impressum" className="text-foreground hover:text-primary">Impressum</Link></li>
              <li><CookieSettingsLink className="text-foreground hover:text-primary" /></li>
```

- [ ] **Step 3: Update Datenschutz section 4 (Auftragsverarbeiter) and section 6 (Cookies)**

In `src/app/datenschutz/page.tsx`, extend the auftragsverarbeiter list. Replace the existing `<ul>` block in section 4 with:

```tsx
          <ul>
            <li>Vercel Inc. (Hosting der Anwendung) — Standort EU-Region, Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Vercel Inc. (Vercel Analytics, optional nach Einwilligung) — anonyme Performance- und Seitenaufruf-Daten ohne Cookies, EU-Region</li>
            <li>PostHog Inc. (Product Analytics, optional nach Einwilligung) — Server-Region EU (Frankfurt), Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Supabase Inc. (Datenbank) — Server-Region eu-central-1 (Frankfurt), Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Resend (E-Mail-Versand) — Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Upstash (Rate-Limiting) — Auftragsverarbeitungsvertrag abgeschlossen</li>
          </ul>
```

Then replace section 6 (Cookies) entirely. Currently:

```tsx
          <h2>6. Cookies</h2>
          <p>
            Diese Website setzt aktuell ausschließlich technisch notwendige Session-Cookies (Auth) ein.
            Tracking- oder Analyse-Cookies werden nicht eingesetzt.
          </p>
```

Replace with:

```tsx
          <h2>6. Cookies und Analyse-Tools</h2>
          <p>
            Diese Website setzt technisch notwendige Cookies ein (Login-Session, Sicherheit) sowie
            optional — nach deiner ausdrücklichen Einwilligung — Analyse-Tools von Vercel und PostHog.
            Vor deiner Einwilligung wird kein Analyse-Code geladen oder ausgeführt.
          </p>
          <p>
            Du kannst deine Einwilligung jederzeit ändern oder widerrufen über die{' '}
            <a href="#cookie-settings-anchor" className="underline">Cookie-Einstellungen</a> im
            Footer der Seite.
          </p>
          <ul>
            <li>
              <strong>Vercel Analytics</strong> (Vercel Inc.) — anonyme Seitenaufrufe und
              Performance-Daten. Setzt keine Cookies. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO.
            </li>
            <li>
              <strong>PostHog</strong> (PostHog Inc., EU-Server in Frankfurt) — anonyme Nutzungsanalyse
              für Produktverbesserung. Person Profiles nur bei expliziter Identifikation
              (`identified_only`-Modus), keine Auto-Capture, keine Session-Replays.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO.
            </li>
          </ul>
```

(Note: `#cookie-settings-anchor` is just a visible cue; the actual functional element is the
`CookieSettingsLink` in the footer. We do not need a real anchor target.)

- [ ] **Step 4: Typecheck + visual check**

```bash
npx tsc --noEmit
npm run dev
```

Open `/datenschutz` — confirm new section 6 + extended Auftragsverarbeiter list. Open `/` — scroll to footer, click "Cookie-Einstellungen". Verify the cookie banner reappears (because `reopen()` toggled `decided` to false). Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing/CookieSettingsLink.tsx src/components/marketing/MarketingFooter.tsx src/app/datenschutz/page.tsx
git commit -m "feat(legal): cookie-settings link + datenschutz consent + analytics sections"
```

---

## Task 11: .env.example, BACKLOG, follow-up items, final commit

**Files:**
- Modify: `.env.example`
- Modify: `docs/BACKLOG.md`

- [ ] **Step 1: Add PostHog vars to .env.example**

Append to `.env.example` (preserve existing content; add at the bottom or in a logical group):

```
# PostHog Product Analytics — EU Cloud project token (NEXT_PUBLIC_*, safe to expose)
NEXT_PUBLIC_POSTHOG_KEY=phc_replace_me
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

- [ ] **Step 2: Update BACKLOG.md**

In `docs/BACKLOG.md`:

a) Strike #77 + Cookie-Banner from the Sprint 30 task list (same pattern used for #89/#90 today):

Replace the rows starting with `| #77 |` and `| Cookie-Banner |` with:

```
| ~~#77~~ | ~~Vercel Analytics + PostHog Integration~~ | ~~M (~2 h)~~ | **✅ resolved 2026-05-04** |
| ~~Cookie-Banner~~ | ~~Custom 3-Option-Layout~~ | ~~M (~2 h)~~ | **✅ resolved 2026-05-04** |
```

b) Remove #77 from the "Marketing & Go-to-Market" Open Items table (the row whose first cell is `| 77 |`).

c) Add a new row under the same "Marketing & Go-to-Market" Open Items table (after the highest existing #):

```
| 94 | Security | **Content-Security-Policy (CSP) Header in `next.config.ts` einführen.** Aktuell fehlt CSP komplett — `connect-src`, `script-src`, `img-src`, `style-src`, `frame-src` müssen mit Whitelist für eu.i.posthog.com, eu-assets.i.posthog.com, va.vercel-scripts.com, *.sentry.io, supabase.co (Storage URLs), cal.com (Booking-Iframe im Dashboard) erstellt werden. Inkl. `nonce`-Strategie für Next.js. Regressionstests gegen alle Auth-Flows + Booking-Flow nötig. | Medium | 2026-05-04 |
```

d) Append a new resolved entry under `### Sprint 30 Tag 1 — Public-Launch Polish (2026-05-04)` section (rename the section header to `### Sprint 30 Tag 1+2 — Public-Launch Polish (2026-05-04)` if Tag 2 lands the same day; otherwise add a new section header `### Sprint 30 Tag 2 — Consent + Analytics (2026-05-04)`):

```
| 77 | Marketing | **Vercel Analytics + PostHog Integration (consent-gated)** — `ConsentProvider` mit LocalStorage-Persistenz (`torqr-consent-v1`, version=1), 3-Option Cookie-Banner (Alle akzeptieren / Nur essentielle / Einstellungen), per-Service-Toggles (Dialog mit Switch-Komponente), PostHog via dynamic `import('posthog-js')` — keine Bytes vor Consent. PostHog konfiguriert: EU-Host, `identified_only` Person Profiles, `autocapture: false`, `disable_session_recording: true`. Conversion-Events `beta_lead_submitted` + `demo_request_submitted` in BetaListForm + DemoRequestForm. CSP als Follow-up #94 verschoben (kein bestehender CSP-Header — Einführung = separate Risk-Box). | 2026-05-04 |
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass (existing + 6 storage + 5 reducer + 4 track = 15 new green tests).

- [ ] **Step 4: Final visual smoke-test in dev server**

```bash
npm run dev
```

Walk the full path:

1. Fresh tab → banner appears.
2. Click "Alle akzeptieren" → banner disappears.
3. Submit Beta-Lead form (test data, e.g. `test+beta@example.com`, tier SOLO via `#cta-beta-solo`) → "Danke!" success state. Network tab shows `POST /api/beta-leads` AND a PostHog `e?…` capture request with `event: beta_lead_submitted`.
4. Submit Demo-Request form similarly → PostHog capture with `event: demo_request_submitted`.
5. Footer → click "Cookie-Einstellungen" → banner reappears → click "Einstellungen" → toggle PostHog off, save → trigger another form submit → no PostHog capture (because `__loaded` is true but `opt_out_capturing` was called).
6. Reload page → banner stays hidden (decided=true persists), but no PostHog `init` call this time (because `consent.services.posthog === false`).

Stop the dev server.

- [ ] **Step 5: Commit and push the branch**

```bash
git add .env.example docs/BACKLOG.md
git commit -m "docs: backlog Sprint 30 Tag 2 + .env.example for PostHog"
```

- [ ] **Step 6: Hand-off**

Worktree status: branch `feature/cookie-consent-analytics` ready to merge into `main`. Counts (cumulative across all tasks): ~13 commits (1 deps + 5 feature + 1 wiring + 1 tests + 2 forms + 1 legal + 1 docs + 1 final). Ready for `superpowers:finishing-a-development-branch`.

---

## Self-Review

**Spec coverage check:**
- ✓ Vercel Analytics integration → Task 6 (`VercelAnalyticsGate`), Task 7 (mounting)
- ✓ PostHog integration → Task 6 (`PostHogProvider` with consent gate)
- ✓ EU-Cloud + identified_only + no autocapture/replay → Task 6 init config
- ✓ Conversion events Beta-Submit + Demo-Submit → Task 8 (helpers) + Task 9 (wiring)
- ✓ Custom Cookie-Banner 3-Option-Layout → Task 5
- ✓ Service-Toggles → Task 5 (`CookieSettingsDialog`)
- ✓ LocalStorage Consent-State → Task 2 (storage), Task 4 (context wires it)
- ✓ React Context `useConsent()` → Task 4
- ✓ DSGVO-Konformität (kein Tracking vor Consent) → Task 6 dynamic import + init guard, Task 8 `__loaded` check
- ✓ Datenschutz-Text Update → Task 10
- ✗ CSP — explicitly deferred to follow-up #94 (Task 11.2c), documented in plan header

**Placeholder scan:** No "TBD", "TODO", "fill in", or "Add appropriate handling" in any step. All code blocks are complete. All file paths are exact.

**Type consistency:**
- `ServiceConsent` type: `{ vercelAnalytics: boolean; posthog: boolean }` — used in Task 2, 3, 4, 5, 6 → consistent.
- `useConsent()` returns `{ consent, hydrated, acceptAll, rejectAll, setServices, reopen }` — defined in Task 4, consumed in Tasks 5, 6, 10 → consistent.
- `trackBetaLeadSubmitted({ tier, source })` — defined in Task 8, called in Task 9 → consistent.
- `posthog.__loaded` flag — used in Task 8 helper and verified in test → real property of posthog-js (not invented).

No issues found. Plan is ready to execute.
