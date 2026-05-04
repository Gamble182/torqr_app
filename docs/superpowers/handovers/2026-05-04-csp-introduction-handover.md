# Handover — Sprint-Item #94: Content-Security-Policy (CSP) Header einführen

> **Wofür ist diese Datei?**
> Kickoff-Brief für eine neue Claude-Code-Session. Inhalt ist als ein Stück lesbar — du kannst alles ab "**HIER COPY-PASTE START**" als ersten Prompt in eine frische Session pasten und Claude weiß sofort, worum es geht und wie es lostmachen soll.

---

## HIER COPY-PASTE START

# Aufgabe: Content-Security-Policy Header in `next.config.ts` einführen (Backlog #94)

Wir starten Sprint-Item **#94** aus `docs/BACKLOG.md`. Das ist der Follow-up zu **#77** (Cookie-Consent + Vercel Analytics + PostHog), den wir in Sprint 30 Tag 2 (2026-05-04) bewusst aus dem Scope rausgezogen haben, weil CSP-Einführung Regressionsrisiko über mehrere unabhängige Subsysteme hat.

**Bitte gleich:**
1. Lies `CLAUDE.md` (Repo-Konventionen — bekommst du beim Session-Start ohnehin via SessionStart-Hook)
2. Lies `docs/BACKLOG.md` Zeile zu `#94` (CSP) für die Zusammenfassung
3. Lies `docs/superpowers/handovers/2026-05-04-csp-introduction-handover.md` (diese Datei) **vollständig** — sie ersetzt eine Brainstorming-Phase
4. Starte mit **`superpowers:writing-plans`** und produziere einen TDD-Plan unter `docs/superpowers/plans/YYYY-MM-DD-csp-introduction.md`
5. Nach Plan-Approval durch mich: **`superpowers:subagent-driven-development`** in einer Worktree `feature/csp-introduction`
6. Letzter Schritt: `superpowers:finishing-a-development-branch` → `--no-ff` Merge nach main (analog zu Sprint 30 Tag 2)

**Kein Auto-Push zu origin** — ich pushe selbst nach erfolgreichem Merge.

---

## Kontext: Warum jetzt + warum separat von #77

In Sprint 30 Tag 2 (2026-05-04) haben wir das DSGVO-Consent-Gate für PostHog + Vercel Analytics gebaut (siehe `docs/superpowers/plans/2026-05-04-cookie-consent-and-analytics.md`). Dort stand im Backlog ursprünglich "CSP-Anpassung in `next.config.ts`" — bei der Plan-Phase fand sich allerdings:

- Es gibt **aktuell überhaupt keinen CSP-Header** in `next.config.ts`. Nur die üblichen Security-Header (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy).
- "Anpassung" wäre also eigentlich "Einführung" — ein deutlich größeres Risiko.
- Eine zu strikte CSP bricht potentiell Sentry, NextAuth-Callbacks, Cal.com Booking-Iframes (im Dashboard), Supabase Storage Signed-URLs, Resend-Tracking-Pixel, PostHog, Vercel Analytics — also fast alles, was nicht *first-party* Vercel ist.
- Daher: aus dem Sprint-30-Scope rausgezogen, als eigenes Backlog-Item #94 angelegt, jetzt als eigenständiger Sprint angegangen.

Unser Ziel: CSP einführen **ohne dass irgendeine bestehende User-Journey kaputtgeht**. Test-Coverage gegen Auth, Dashboard, Booking und Marketing-Pfade ist Pflicht.

---

## Was schon existiert

### Security-Header heute (`next.config.ts`)

```ts
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ];
}
```

Das wird mit `withSentryConfig(...)` gewrappt am Ende der Datei.

### Externe Endpoints, die CSP whitelisten muss

Aufgesammelt aus dem Codebase-Scan zu Sprint-Item #94. Bitte beim Plan re-verifizieren — Drift möglich.

| Service | Wofür | Domains | CSP-Direktive |
|---|---|---|---|
| **Vercel Hosting** | Self / Edge | (self) | `default-src 'self'` |
| **Vercel Analytics** | Page-View Tracking (consent-gated) | `va.vercel-scripts.com`, `vitals.vercel-insights.com` | `script-src` + `connect-src` |
| **PostHog EU** | Product Analytics (consent-gated, dynamic import) | `eu.i.posthog.com`, `eu-assets.i.posthog.com` | `script-src` + `connect-src` + `img-src` |
| **Sentry** | Error Monitoring (server + client) | `*.sentry.io`, `*.ingest.sentry.io` (env-spezifisch) | `connect-src` + `worker-src` |
| **Supabase** | DB + Storage (Signed URLs für Wartungs-Fotos) | aktueller Project-Host: `hwagqyywixhhorhjtydt.supabase.co`, evtl. `*.supabase.co` für künftige Projekte | `connect-src` + `img-src` |
| **Cal.com v2 API** | Server-side Booking Reschedule/Cancel (von API-Routes) | `api.cal.com` — server-only, keine Client-CSP-Implikation | (kein Client-CSP-Eintrag nötig — server-to-server) |
| **Cal.com Embed/Iframe** | *Wenn jemals embedded:* `cal.com`, `app.cal.com` | aktuell **nicht embedded** — User klickt externen Link → Cal.com öffnet im neuen Tab | `frame-src` falls je embedded |
| **Resend** | E-Mail-Versand (server only) | `api.resend.com` — server-side | (kein Client-CSP-Eintrag nötig) |
| **Upstash Redis** | Rate-Limiting (server only) | `*.upstash.io` REST API — server-side | (kein Client-CSP-Eintrag nötig) |
| **NextAuth** | OAuth-Callbacks falls je Provider hinzugefügt | aktuell nur Email/Passwort — keine externen Provider | (heute kein Eintrag, künftig je nach Provider) |
| **Google Fonts / etc.** | Aktuell **nicht genutzt** — System-Font-Stack only (siehe `docs/design-system/`) | — | — |

### Was vermutlich nicht in die CSP muss

- `data:` URIs für Inline-Images (kommt teilweise von `next/image` für blurDataURL Placeholders) — aber das ist je nach Konfig
- `'unsafe-inline'` für CSS — Tailwind v4 generiert kompiliertes CSS, kein Inline-CSS-Bedarf erwartet
- `'unsafe-inline'` für Scripts — **muss vermieden werden**, sonst ist die ganze CSP wertlos

---

## Empfohlene Strategie (kein bindender Plan — der Plan-Skill formalisiert)

### Phase A — Report-Only Mode

Direkt eine `Content-Security-Policy-Report-Only`-Header einführen statt eine harte `Content-Security-Policy`. Das **bricht nichts** und sammelt im Browser-DevTools-Console-Log Verstöße. Vorteil: wir können die echte App nutzen (auch in Production), Verstöße sehen und iterativ einbauen, was wir vergessen haben.

Endpoint für Reports: aktuell **kein** eigener Report-Endpoint vorhanden — könnte:
- An Sentry gepiped werden (Sentry hat einen CSP-Report-Endpoint)
- An Vercel Logs (eigene `/api/csp-report` Route)
- Nur Browser-Console (am einfachsten — kein Endpoint, manuell testen)

Empfehlung: **Browser-Console-only für Phase A** — niedrige Komplexität, ausreichend für unsere Skala.

### Phase B — Strict CSP

Sobald Phase A einige Tage stabil läuft (in Production!), umschalten von Report-Only auf hart enforcing.

### Nonce-Strategie für Next.js 16

Next.js 16 (App Router) inlines manche Scripts (z. B. für Hydration). Strict CSP ohne `'unsafe-inline'` braucht entweder `'strict-dynamic'` mit Nonce oder Hash-basiert.

**Empfohlen:** Nonce-basiert via Routing-Middleware (Vercel-empfohlen, dokumentiert). Skizze:

```ts
// middleware.ts (oder zu existierendem src/middleware.ts hinzufügen)
import { NextResponse } from 'next/server';

export function middleware(request) {
  const nonce = crypto.randomUUID();
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com https://eu-assets.i.posthog.com`,
    // ... etc.
  ].join('; ');

  const response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  });
  response.headers.set('x-nonce', nonce);
  response.headers.set('Content-Security-Policy', csp);
  return response;
}
```

Layout liest dann `headers().get('x-nonce')` und gibt es an `<Script nonce={nonce}>`. Vercel-Doku: https://nextjs.org/docs/app/api-reference/file-conventions/middleware#csp

**Wichtig:** Vorhandene Middleware in `src/middleware.ts` (NextAuth-related) muss erweitert, nicht ersetzt werden.

---

## Test-Coverage (mandatorisch vor Phase B)

Diese User-Journeys müssen in Browser-Smoke (Playwright) und in Vitest (was geht) durchgespielt werden, OHNE CSP-Verstöße in der Browser-Console:

### Marketing-Site (anonyme User)
- [ ] `/` rendert komplett (alle Sektionen, alle Bilder, Hero-Mockup)
- [ ] Cookie-Banner erscheint, alle drei Buttons funktionieren
- [ ] Cookie-Settings-Dialog öffnet, Switches funktionieren
- [ ] Beta-Lead-Formular: submit erfolgreich + Success-State sichtbar
- [ ] Demo-Request-Formular: submit + Success
- [ ] Nach "Alle akzeptieren": PostHog-Chunk lädt, Vercel-Analytics-Beacon gesetzt
- [ ] `/datenschutz`, `/impressum` rendern komplett
- [ ] OG-Image (`/opengraph-image`) liefert PNG zurück

### Auth-Flow
- [ ] `/login` rendert, Form funktioniert, NextAuth-Callback erfolgreich
- [ ] `/register` rendert + funktioniert
- [ ] `/dashboard/change-password` (mustChangePassword-Flow) funktioniert

### Dashboard (authenticated User)
- [ ] `/dashboard` Stats laden, Charts rendern (chart-1 bis chart-5 SVG)
- [ ] `/dashboard/customers` Liste lädt, Detail-Page lädt
- [ ] `/dashboard/systems/[id]` System-Detail mit Wartungsplan + Foto-Card lädt
- [ ] **Foto-Upload zu Supabase Storage** (Wartungsschritt) — kritischer Pfad, Signed URLs
- [ ] **Foto-Anzeige aus Supabase Storage** — `<img src="https://[project].supabase.co/storage/...">` muss durch CSP `img-src`
- [ ] `/dashboard/termine` Kalender-View, Cal.com-Reschedule/Cancel-Modals
- [ ] `/dashboard/employees/[id]` Workload-Page
- [ ] `/dashboard/account` Profile + Password + Danger-Zone

### Server-side / Cron
- [ ] Daily-Reminders-Cron (`/api/cron/daily-reminders`) → Resend-API-Call (server-side, CSP-irrelevant)
- [ ] Weekly-Summary-Cron analog
- [ ] Cal.com-Webhook (`/api/webhooks/cal`) verarbeitet Test-Payload

### Sentry
- [ ] Manuell ein `throw new Error('csp-test')` in einer Page triggern → Sentry erhält Bericht ohne CSP-Block

---

## Risiken + Migrations-Reihenfolge

1. **Sentry blockt** wenn `connect-src` zu restriktiv → Sentry verliert Reports → Production-Fehler werden unsichtbar. Test: Manuelle Throw + Sentry-Dashboard checken.
2. **Supabase Storage URLs** sind dynamisch (Project-Subdomain) → wenn das Projekt mal migriert wird, CSP muss mit. Lösung: `*.supabase.co` als Whitelist akzeptieren.
3. **PostHog `eu-assets.i.posthog.com`** lädt Auxiliary-Scripts (`web-vitals.js`, `dead-clicks-autocapture.js`, `surveys.js`, `array.js`). Alle vom selben Host — `script-src` mit dem Host reicht.
4. **Cal.com Booking** läuft heute über externen Link (User klickt → Cal.com öffnet im neuen Tab). KEIN Iframe-Embed im Dashboard heute. Wenn das jemals embedded wird, `frame-src` muss erweitert werden.
5. **Inline-Styles** durch React/Tailwind sollten nicht passieren (Tailwind v4 = compiled). Falls doch: nur Hashes für die spezifischen Inline-Styles, nie `'unsafe-inline'` global.
6. **Production vs. Preview Deployments**: PostHog ist nur in Production konfiguriert (User-Decision Sprint 30). CSP muss in Preview-Deployments nicht zwingend PostHog-Hosts whitelisten — kann aber für Konsistenz drin sein (verursacht keine Probleme, da nichts versucht zu laden).

---

## Empfohlene Phasen-Aufteilung des Plans

| Phase | Was | Risiko |
|---|---|---|
| **Plan-Phase 0** | Codebase-Re-Verifikation: alle externen Hosts erneut greppen, sicherstellen dass nichts seit 2026-05-04 dazugekommen ist | Niedrig |
| **Plan-Phase 1** | CSP als Report-Only via Middleware einführen + Nonce-Pattern wiring + Tests dass Pages noch laden | Niedrig (Report-Only enforcet nichts) |
| **Plan-Phase 2** | Browser-Smoke aller User-Journeys (siehe Liste oben), Reports im DevTools-Log checken, fehlende Whitelist-Einträge nachziehen | Mittel — manuelle Arbeit |
| **Plan-Phase 3** | 1-3 Tage in Production observieren (Report-Only) — sammeln, was echte User triggern, ggf. nachziehen | Niedrig (kein User-Impact) |
| **Plan-Phase 4** | Umschalten Report-Only → Strict (Header-Name-Wechsel: 1 Code-Zeile) | **Hoch** — alle Verstöße werden jetzt enforced. Nur deployen wenn Phase 2+3 sauber waren. |
| **Plan-Phase 5** | Backlog-Item #94 als resolved markieren, ggf. Datenschutzerklärung um "wir setzen CSP-Header" erweitern (optional) | Niedrig |

---

## Referenzen

- **Spec der `feature/cookie-consent-analytics`** (frischer Sprint, in dem PostHog + Vercel Analytics konfiguriert wurden): `docs/superpowers/plans/2026-05-04-cookie-consent-and-analytics.md`
- **Backlog-Eintrag #94 mit allen Whitelist-Anforderungen:** `docs/BACKLOG.md` (suche nach `| 94 |`)
- **Aktuelle `next.config.ts`:** `next.config.ts` (45 Zeilen, withSentryConfig wrapper)
- **Existierende Middleware:** `src/middleware.ts` (NextAuth + Rate-Limiting)
- **PostHog Config:** `src/lib/analytics/posthog-provider.tsx`
- **Vercel Analytics:** `src/lib/analytics/vercel-analytics-gate.tsx`
- **Sentry-Config:** `src/instrumentation-client.ts` + Server-side via `withSentryConfig` in `next.config.ts`
- **Supabase Storage Bucket-Config:** `scripts/create-storage-buckets.ts`
- **Cal.com Client:** `src/lib/cal-com/client.ts`
- **Next.js 16 CSP Docs:** https://nextjs.org/docs/app/api-reference/file-conventions/middleware (offizielle Nonce-Pattern-Beispiele)
- **Vercel Plugin Skill:** `vercel:routing-middleware` ist installiert und kann konsultiert werden

---

## Definition of Done

- [ ] CSP-Header (Strict, nicht Report-Only) liefert alle Marketing- + Dashboard- + Auth-Pages aus, ohne dass Browser-Console CSP-Verstöße zeigt
- [ ] Sentry empfängt Test-Errors weiterhin
- [ ] PostHog (nach Consent) lädt + sendet Conversion-Events korrekt
- [ ] Vercel Analytics Beacon erreicht `vitals.vercel-insights.com` korrekt
- [ ] Foto-Upload + Foto-Anzeige in Wartungs-Dokumentation funktionieren
- [ ] Cal.com Booking-Reschedule/Cancel Modals funktionieren (Server-side API-Call, sollte keine CSP-Implikation haben)
- [ ] Alle 371 Vitest-Tests grün
- [ ] Backlog-Item #94 in `docs/BACKLOG.md` von Open auf Resolved
- [ ] Merge nach main via `--no-ff` mit aussagekräftiger Commit-Message
- [ ] Datenschutzerklärung optional aktualisiert (CSP-Erwähnung als Schutzmaßnahme)

---

## HIER COPY-PASTE ENDE

---

## Notiz für Yannik (Original-Author)

- Diese Datei lebt unter `docs/superpowers/handovers/` (neuer Folder). Falls du künftig mehr Handovers schreibst, könntest du dort eine README mit "Handover-Konvention" anlegen — aktuell ist das das einzige Beispiel.
- Du kannst den Block zwischen `HIER COPY-PASTE START` und `HIER COPY-PASTE ENDE` 1:1 als ersten User-Prompt einer neuen Claude-Code-Session reinkopieren. Claude bekommt durch den SessionStart-Hook automatisch CLAUDE.md, Memory-Index, Skill-Liste etc. mitgeladen — der Prompt zentriert dann auf die konkrete Aufgabe.
- Falls du erst einen Tag warten willst (z. B. bis das Anwalts-Review für #69 zurück ist), beeinflusst das #94 nicht — die beiden Sprints sind unabhängig.
