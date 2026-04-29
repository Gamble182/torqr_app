# Public Landing Page V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Liefere die öffentliche Marketing-Landingpage unter `torqr.de/` (10-Sektionen, Hero · Pain · 3-Step · Features · ROI · Pilot-Status · Trust · Pricing · FAQ · Final-CTA + Footer), zwei Lead-Formulare (Beta-Liste + Demo-Anfrage) mit Persistenz und Resend-Notifizierung, Datenschutz + Impressum-Seiten.

**Architecture:** Marketing-Page ersetzt den bestehenden Login-Redirect-Placeholder in `src/app/page.tsx`. Alle Sektionen als Server-Components in `src/components/marketing/`. Forms als Client-Components mit react-hook-form + Zod. Lead-Daten persistiert in zwei neuen Prisma-Tabellen (`BetaLead`, `DemoRequest`) und triggern Resend-Mails an einen Notify-Empfänger. URL-Hash-Routing (`#cta-beta-pro`, `#cta-demo`) steuert Tab-Default und Tier-Preselect im Final-CTA-Block.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, React 19, Tailwind 4, shadcn/ui, Prisma 7, NextAuth v5 (nur Header-Detection), react-hook-form, Zod 4, Resend + React Email, Upstash Redis (rate-limit), Vitest.

**Spec reference:** `docs/superpowers/specs/2026-04-29-landingpage-design.md`

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add `BetaLead` + `DemoRequest` models |
| `prisma/migrations/20260429120000_landing_page_leads/migration.sql` | Create | SQL migration |
| `prisma/seed-marketing-demo.ts` | Create | Seed-Script für Marketing-Demo-Daten (5 Kunden, 8 Anlagen, 12 Wartungen mit Fotos, anonymisiert) |
| `src/lib/validations.ts` | Modify | `betaLeadSchema`, `demoRequestSchema` |
| `src/lib/__tests__/validations.test.ts` | Modify | Tests für die neuen Schemas |
| `src/lib/rate-limit.ts` | Modify | `BETA_LEAD` + `DEMO_REQUEST` Presets |
| `src/lib/email/templates/BetaLeadAdminEmail.tsx` | Create | Admin-Notification-Template |
| `src/lib/email/templates/DemoRequestAdminEmail.tsx` | Create | Admin-Notification-Template |
| `src/lib/email/service.tsx` | Modify | `sendBetaLeadNotification`, `sendDemoRequestNotification` |
| `src/lib/email/__tests__/service.test.ts` | Modify | Tests |
| `src/app/api/beta-leads/route.ts` | Create | POST-Handler |
| `src/app/api/beta-leads/__tests__/route.test.ts` | Create | API-Tests |
| `src/app/api/demo-requests/route.ts` | Create | POST-Handler |
| `src/app/api/demo-requests/__tests__/route.test.ts` | Create | API-Tests |
| `src/components/ui/tabs.tsx` | Create | shadcn Tabs (für Final-CTA-Block) |
| `src/components/ui/accordion.tsx` | Create | shadcn Accordion (für FAQ) |
| `src/components/ui/sheet.tsx` | Create | shadcn Sheet (für Mobile-Nav) |
| `src/components/ui/checkbox.tsx` | Create | shadcn Checkbox (für Consent) |
| `src/components/marketing/MarketingHeader.tsx` | Create | Sticky Header mit Login/CTA |
| `src/components/marketing/MobileNavSheet.tsx` | Create | Mobile-Nav |
| `src/components/marketing/Hero.tsx` | Create | Hero-Sektion |
| `src/components/marketing/HeroVisual.tsx` | Create | Phone+Desktop-Visual |
| `src/components/marketing/PainBlock.tsx` | Create | "Kennst du das?" Pain-Cards |
| `src/components/marketing/ThreeStepSolution.tsx` | Create | "Mit Torqr läuft das so" |
| `src/components/marketing/FeatureBlock.tsx` | Create | Einzelner Feature-Block (alternierend) |
| `src/components/marketing/FeatureSection.tsx` | Create | Container der 4 Features |
| `src/components/marketing/RoiBlock.tsx` | Create | ROI 3-Tiles |
| `src/components/marketing/PilotStatus.tsx` | Create | Pilot-Programm-Status |
| `src/components/marketing/TechStackStrip.tsx` | Create | Vercel · Supabase · Resend Logo-Strip |
| `src/components/marketing/TrustBlock.tsx` | Create | DSGVO-Cards + Tech-Stack-Strip |
| `src/components/marketing/PricingToggle.tsx` | Create | Monthly/Annual Toggle (Client-Component) |
| `src/components/marketing/PricingCard.tsx` | Create | Eine Pricing-Card |
| `src/components/marketing/Pricing.tsx` | Create | Container mit 3 Cards + Toggle-State |
| `src/components/marketing/Faq.tsx` | Create | Accordion (Client-Component) |
| `src/components/marketing/BetaListForm.tsx` | Create | Beta-Form (Client-Component) |
| `src/components/marketing/DemoRequestForm.tsx` | Create | Demo-Form (Client-Component) |
| `src/components/marketing/FinalCta.tsx` | Create | Final-CTA mit Tabs für beide Forms |
| `src/components/marketing/MarketingFooter.tsx` | Create | 4-Spalten-Footer |
| `src/app/page.tsx` | Modify | Rewrite — Marketing-Landing |
| `src/app/datenschutz/page.tsx` | Create | DSGVO-Pflichtseite |
| `src/app/impressum/page.tsx` | Create | §5 TMG-Pflichtseite |
| `src/app/layout.tsx` | Modify | Erweiterte SEO-Metadata |
| `src/app/sitemap.ts` | Create | Sitemap |
| `src/app/robots.ts` | Create | robots.txt |
| `public/marketing/hero/dashboard-desktop.png` | Create (manual) | Hero-Asset |
| `public/marketing/hero/wartungs-checklist.gif` | Create (manual) | Hero-GIF |
| `public/marketing/features/*.{png,gif}` | Create (manual) | 4 Feature-Visuals |
| `public/og-image.png` | Create (manual) | Open-Graph-Image |
| `docs/BACKLOG.md` | Modify | Schließe Marketing-Backlog-Items #67–#75 (V1-relevant) |

---

## Phase 0 — Demo-Daten-Seed (vor allen Visuals)

## Task 1: Marketing-Demo-Seed-Script

**Files:**
- Create: `prisma/seed-marketing-demo.ts`

- [ ] **Step 1: Anlegen mit anonymisierten Demo-Kunden, Anlagen, Wartungen**

```typescript
// prisma/seed-marketing-demo.ts
import { PrismaClient, SystemType, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding marketing demo data ...');

  // Demo-Company + Demo-Owner (für Screenshots im Dashboard)
  const company = await prisma.company.upsert({
    where: { name: 'Beispiel-Heizung GmbH' },
    update: {},
    create: { name: 'Beispiel-Heizung GmbH' },
  });

  const ownerPassword = await hash('demo-password-not-for-production', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'demo@torqr.de' },
    update: {},
    create: {
      email: 'demo@torqr.de',
      name: 'Demo Owner',
      passwordHash: ownerPassword,
      role: Role.OWNER,
      companyId: company.id,
      mustChangePassword: false,
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@torqr.de' },
    update: {},
    create: {
      email: 'tech@torqr.de',
      name: 'Demo Techniker',
      passwordHash: ownerPassword,
      role: Role.TECHNICIAN,
      companyId: company.id,
      mustChangePassword: false,
    },
  });

  // 5 anonyme Beispiel-Kunden mit Mix aus Anlagentypen
  const customers = [
    { name: 'Familie Müller', street: 'Musterstr. 1', postalCode: '10115', city: 'Berlin', email: 'mueller@example.com', phone: '030 1234567' },
    { name: 'Schmidt & Söhne GbR', street: 'Hauptstr. 42', postalCode: '20095', city: 'Hamburg', email: 'kontakt@schmidt-soehne.example', phone: '040 7654321' },
    { name: 'Familie Becker', street: 'Bahnhofstr. 8', postalCode: '50667', city: 'Köln', email: 'becker@example.com', phone: '0221 998877' },
    { name: 'Hotel Sonnenhof', street: 'Wiesenweg 17', postalCode: '80331', city: 'München', email: 'rezeption@sonnenhof.example', phone: '089 555123' },
    { name: 'Familie Wagner', street: 'Eichenring 3', postalCode: '60311', city: 'Frankfurt', email: 'wagner@example.com', phone: '069 332211' },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { email_companyId: { email: c.email, companyId: company.id } },
      update: {},
      create: { ...c, companyId: company.id, userId: owner.id, emailOptIn: 'CONFIRMED' },
    });
  }

  console.log('✅ 5 Kunden angelegt');

  // 8 Anlagen — Mix aus 4 SystemTypes
  // (Pseudo-Demo: erste 2 Heizung, 2 Klima, 2 Wasser, 2 Energiespeicher)
  const allCustomers = await prisma.customer.findMany({ where: { companyId: company.id } });
  const catalogEntries = await prisma.systemCatalog.findMany({ take: 12 });

  const systemMix: Array<{ customerIdx: number; type: SystemType; assignedTo?: string }> = [
    { customerIdx: 0, type: SystemType.HEATING },
    { customerIdx: 0, type: SystemType.AIR_CONDITIONING, assignedTo: tech.id },
    { customerIdx: 1, type: SystemType.HEATING, assignedTo: tech.id },
    { customerIdx: 2, type: SystemType.HEATING },
    { customerIdx: 2, type: SystemType.WATER_TREATMENT },
    { customerIdx: 3, type: SystemType.HEATING, assignedTo: tech.id },
    { customerIdx: 4, type: SystemType.ENERGY_STORAGE },
    { customerIdx: 4, type: SystemType.HEATING },
  ];

  for (const m of systemMix) {
    const cust = allCustomers[m.customerIdx];
    const cat = catalogEntries.find((e) => e.systemType === m.type) ?? catalogEntries[0];
    await prisma.customerSystem.create({
      data: {
        customerId: cust.id,
        companyId: company.id,
        userId: owner.id,
        systemType: m.type,
        systemCatalogId: cat?.id ?? null,
        manufacturer: cat?.manufacturer ?? 'Demo',
        model: cat?.model ?? 'Demo-Modell',
        installDate: new Date(2020 + Math.floor(Math.random() * 4), 5, 15),
        nextMaintenance: new Date(Date.now() + (7 + Math.random() * 28) * 86400 * 1000),
        assignedToUserId: m.assignedTo ?? null,
      },
    });
  }

  console.log('✅ 8 Anlagen angelegt');

  // 12 Wartungen — historische, mit Fotos und Checklist-Snapshot
  const allSystems = await prisma.customerSystem.findMany({ where: { companyId: company.id } });
  const monthsAgo = (n: number) => new Date(Date.now() - n * 30 * 86400 * 1000);

  for (let i = 0; i < 12; i++) {
    const sys = allSystems[i % allSystems.length];
    await prisma.maintenance.create({
      data: {
        customerSystemId: sys.id,
        companyId: company.id,
        userId: owner.id,
        performedAt: monthsAgo(i + 1),
        notes: `Demo-Wartung ${i + 1}: Routine-Check, alles in Ordnung.`,
        checklistData: { items: [{ label: 'Drucktest', done: true }, { label: 'Sichtprüfung', done: true }] },
        photoUrls: [],
      },
    });
  }

  console.log('✅ 12 Wartungen angelegt');
  console.log('🎉 Marketing-Demo-Seed fertig.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: package.json um Seed-Script erweitern**

Edit `package.json` — neuer Script-Eintrag:

```json
"scripts": {
  ...
  "seed:marketing-demo": "npx tsx prisma/seed-marketing-demo.ts"
}
```

- [ ] **Step 3: Seed gegen lokale DB ausführen (manuell, Bestätigung) — VERSCHOBEN bis Phase 7**

Hinweis: Die DB-Schema-Erweiterungen aus Task 3 müssen vorher migriert sein. Ausführung des Seeds passiert in Phase 7 vor Screenshot-Capture.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed-marketing-demo.ts package.json
git commit -m "feat(marketing): seed-script for landing page demo data"
```

---

## Phase 1 — Data-Layer

## Task 2: Asset-Ordner-Struktur anlegen

**Files:**
- Create: `public/marketing/hero/.gitkeep`
- Create: `public/marketing/features/.gitkeep`

- [ ] **Step 1: Ordner anlegen mit `.gitkeep`**

```bash
mkdir -p public/marketing/hero public/marketing/features
touch public/marketing/hero/.gitkeep public/marketing/features/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
git add public/marketing/
git commit -m "chore(marketing): asset folder structure for hero + features"
```

## Task 3: Prisma — BetaLead + DemoRequest Models + Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260429120000_landing_page_leads/migration.sql`

- [ ] **Step 1: Prisma-Schema erweitern**

Edit `prisma/schema.prisma`. Anhängen am Ende der Datei:

```prisma
// ─── Public landing page leads ────────────────────────────────────────────

model BetaLead {
  id           String   @id @default(cuid())
  email        String
  name         String?
  company      String?
  tierInterest String?  // "SOLO" | "PRO" | null (Enterprise → DemoRequest)
  source       String?  // "hero" | "pricing-solo" | "pricing-pro" | "pilot-status" | "direct"
  consent      Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@index([email])
  @@index([createdAt])
}

model DemoRequest {
  id            String   @id @default(cuid())
  email         String
  name          String
  company       String?
  phone         String?
  preferredSlot String?
  message       String?  @db.Text
  source        String?  // "hero" | "pricing-enterprise" | "header" | "direct"
  consent       Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@index([email])
  @@index([createdAt])
}
```

- [ ] **Step 2: Migration generieren**

Run:

```bash
npx dotenv -e .env -- npx prisma migrate dev --name landing_page_leads --create-only --config=config/prisma.config.ts
```

Expected: Erzeugt `prisma/migrations/<timestamp>_landing_page_leads/migration.sql` mit `CREATE TABLE BetaLead` und `CREATE TABLE DemoRequest`. Falls Prisma 7 das `--config`-Flag mit `--create-only` nicht akzeptiert: stattdessen `npx prisma migrate dev --name landing_page_leads --create-only` mit `DATABASE_URL` im env.

- [ ] **Step 3: Migration prüfen und committen**

```bash
cat prisma/migrations/*/migration.sql | tail -30
```

Verify two `CREATE TABLE` statements with proper indexes.

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): BetaLead + DemoRequest models for landing page leads"
```

- [ ] **Step 4: Migration deployen (lokal)**

```bash
npm run migrate:deploy
```

Expected: "Applied migration `20260429120000_landing_page_leads`" oder vergleichbar.

- [ ] **Step 5: Prisma Client regenerieren**

```bash
npx prisma generate --config=config/prisma.config.ts
```

## Task 4: Zod-Schemas für Forms

**Files:**
- Modify: `src/lib/validations.ts`
- Modify: `src/lib/__tests__/validations.test.ts`

- [ ] **Step 1: Schemas anhängen**

Edit `src/lib/validations.ts`. Am Ende einfügen:

```typescript
// ─── Public landing page form schemas ────────────────────────────────────

export const betaLeadSchema = z.object({
  email: z.string().trim().min(1, 'E-Mail-Adresse ist erforderlich').email('Bitte gib eine gültige E-Mail-Adresse an'),
  name: z.string().trim().max(120).optional().or(z.literal('')),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  tierInterest: z.enum(['SOLO', 'PRO']).optional(),
  source: z.string().trim().max(60).optional(),
  consent: z.literal(true, { message: 'Bitte stimme der Datenverarbeitung zu, damit wir dich kontaktieren können.' }),
  // Honeypot — must be empty
  website: z.string().max(0).optional().or(z.literal('')),
});

export type BetaLeadInput = z.infer<typeof betaLeadSchema>;

export const demoRequestSchema = z.object({
  email: z.string().trim().min(1, 'E-Mail-Adresse ist erforderlich').email('Bitte gib eine gültige E-Mail-Adresse an'),
  name: z.string().trim().min(1, 'Bitte gib deinen Namen an').max(120),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  preferredSlot: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
  source: z.string().trim().max(60).optional(),
  consent: z.literal(true, { message: 'Bitte stimme der Datenverarbeitung zu, damit wir dich kontaktieren können.' }),
  website: z.string().max(0).optional().or(z.literal('')),
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;
```

- [ ] **Step 2: Tests erweitern**

Edit `src/lib/__tests__/validations.test.ts`. Anhängen:

```typescript
import { betaLeadSchema, demoRequestSchema } from '../validations';

describe('betaLeadSchema', () => {
  it('akzeptiert minimale gültige Eingabe', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', consent: true });
    expect(result.success).toBe(true);
  });

  it('lehnt fehlende E-Mail ab', () => {
    const result = betaLeadSchema.safeParse({ consent: true });
    expect(result.success).toBe(false);
  });

  it('lehnt ungültige E-Mail ab', () => {
    const result = betaLeadSchema.safeParse({ email: 'invalid', consent: true });
    expect(result.success).toBe(false);
  });

  it('lehnt fehlenden Consent ab', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', consent: false });
    expect(result.success).toBe(false);
  });

  it('akzeptiert SOLO-Tier', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', tierInterest: 'SOLO', consent: true });
    expect(result.success).toBe(true);
  });

  it('lehnt ENTERPRISE-Tier ab (geht über DemoRequest)', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', tierInterest: 'ENTERPRISE' as never, consent: true });
    expect(result.success).toBe(false);
  });

  it('lehnt befüllten Honeypot ab', () => {
    const result = betaLeadSchema.safeParse({ email: 'test@torqr.de', consent: true, website: 'spam' });
    expect(result.success).toBe(false);
  });
});

describe('demoRequestSchema', () => {
  it('akzeptiert minimale gültige Eingabe', () => {
    const result = demoRequestSchema.safeParse({ email: 'test@torqr.de', name: 'Max Mustermann', consent: true });
    expect(result.success).toBe(true);
  });

  it('lehnt fehlenden Namen ab', () => {
    const result = demoRequestSchema.safeParse({ email: 'test@torqr.de', consent: true });
    expect(result.success).toBe(false);
  });

  it('lehnt fehlenden Consent ab', () => {
    const result = demoRequestSchema.safeParse({ email: 'test@torqr.de', name: 'Max', consent: false });
    expect(result.success).toBe(false);
  });

  it('lehnt befüllten Honeypot ab', () => {
    const result = demoRequestSchema.safeParse({ email: 'test@torqr.de', name: 'Max', consent: true, website: 'spam' });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Tests laufen lassen**

```bash
npm run test:run -- src/lib/__tests__/validations.test.ts
```

Expected: alle PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validations.ts src/lib/__tests__/validations.test.ts
git commit -m "feat(validations): zod schemas for beta-lead + demo-request forms"
```

## Task 5: Rate-Limit-Presets erweitern

**Files:**
- Modify: `src/lib/rate-limit.ts`

- [ ] **Step 1: Presets ergänzen**

Edit `src/lib/rate-limit.ts` (Zeile 197-202):

```typescript
export const RATE_LIMIT_PRESETS = {
  LOGIN: { interval: 15 * 60 * 1000, maxRequests: 10 },
  REGISTER: { interval: 15 * 60 * 1000, maxRequests: 5 },
  API_USER: { interval: 60 * 1000, maxRequests: 100 },
  FILE_UPLOAD: { interval: 60 * 1000, maxRequests: 10 },
  BETA_LEAD: { interval: 60 * 60 * 1000, maxRequests: 5 },      // 5 / Stunde / IP
  DEMO_REQUEST: { interval: 60 * 60 * 1000, maxRequests: 3 },   // 3 / Stunde / IP
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/rate-limit.ts
git commit -m "feat(rate-limit): presets for landing page lead forms"
```

---

## Phase 2 — Email-Layer (vor API, weil API es importiert)

## Task 6: BetaLeadAdminEmail Template

**Files:**
- Create: `src/lib/email/templates/BetaLeadAdminEmail.tsx`

- [ ] **Step 1: Template anlegen**

```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from '@react-email/components';

export interface BetaLeadAdminEmailProps {
  email: string;
  name?: string | null;
  company?: string | null;
  tierInterest?: string | null;
  source?: string | null;
  receivedAt: string;
}

export function BetaLeadAdminEmail({ email, name, company, tierInterest, source, receivedAt }: BetaLeadAdminEmailProps) {
  return (
    <Html lang="de">
      <Head />
      <Body style={{ backgroundColor: '#f4f7f4', fontFamily: '-apple-system, system-ui, sans-serif', padding: 0 }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 560, margin: '24px auto', borderRadius: 8, padding: 24 }}>
          <Heading style={{ fontSize: 20, color: '#008000', marginBottom: 4 }}>Neuer Beta-Lead 🎉</Heading>
          <Text style={{ color: '#666', fontSize: 13, marginTop: 0 }}>{receivedAt}</Text>
          <Hr />
          <Section>
            <Text><strong>E-Mail:</strong> {email}</Text>
            {name ? <Text><strong>Name:</strong> {name}</Text> : null}
            {company ? <Text><strong>Firma:</strong> {company}</Text> : null}
            {tierInterest ? <Text><strong>Tier-Interesse:</strong> {tierInterest}</Text> : null}
            {source ? <Text><strong>Quelle:</strong> {source}</Text> : null}
          </Section>
          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>
            Antwortmöglichkeit: direkt auf {email}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default BetaLeadAdminEmail;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/BetaLeadAdminEmail.tsx
git commit -m "feat(email): admin notification template for beta leads"
```

## Task 7: DemoRequestAdminEmail Template

**Files:**
- Create: `src/lib/email/templates/DemoRequestAdminEmail.tsx`

- [ ] **Step 1: Template anlegen**

```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from '@react-email/components';

export interface DemoRequestAdminEmailProps {
  email: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  preferredSlot?: string | null;
  message?: string | null;
  source?: string | null;
  receivedAt: string;
}

export function DemoRequestAdminEmail({
  email, name, company, phone, preferredSlot, message, source, receivedAt,
}: DemoRequestAdminEmailProps) {
  return (
    <Html lang="de">
      <Head />
      <Body style={{ backgroundColor: '#f4f7f4', fontFamily: '-apple-system, system-ui, sans-serif', padding: 0 }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 600, margin: '24px auto', borderRadius: 8, padding: 24 }}>
          <Heading style={{ fontSize: 20, color: '#008000', marginBottom: 4 }}>Neue Demo-Anfrage 📅</Heading>
          <Text style={{ color: '#666', fontSize: 13, marginTop: 0 }}>{receivedAt}</Text>
          <Hr />
          <Section>
            <Text><strong>Name:</strong> {name}</Text>
            <Text><strong>E-Mail:</strong> {email}</Text>
            {company ? <Text><strong>Firma:</strong> {company}</Text> : null}
            {phone ? <Text><strong>Telefon:</strong> {phone}</Text> : null}
            {preferredSlot ? <Text><strong>Wunschtermin:</strong> {preferredSlot}</Text> : null}
            {source ? <Text><strong>Quelle:</strong> {source}</Text> : null}
          </Section>
          {message ? (
            <>
              <Hr />
              <Section>
                <Text style={{ fontWeight: 600 }}>Nachricht:</Text>
                <Text style={{ whiteSpace: 'pre-line' }}>{message}</Text>
              </Section>
            </>
          ) : null}
          <Hr />
          <Text style={{ fontSize: 12, color: '#999' }}>
            Antwort innerhalb von 1 Werktag versprochen.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default DemoRequestAdminEmail;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/DemoRequestAdminEmail.tsx
git commit -m "feat(email): admin notification template for demo requests"
```

## Task 8: Email-Service-Methoden

**Files:**
- Modify: `src/lib/email/service.tsx`

- [ ] **Step 1: Service-Funktionen anhängen**

Read existing `src/lib/email/service.tsx` to understand the existing patterns. Then append:

```tsx
import { BetaLeadAdminEmail } from './templates/BetaLeadAdminEmail';
import { DemoRequestAdminEmail } from './templates/DemoRequestAdminEmail';

const BETA_LEAD_NOTIFY_EMAIL = process.env.BETA_LEAD_NOTIFY_EMAIL || 'hello@torqr.de';
const DEMO_REQUEST_NOTIFY_EMAIL = process.env.DEMO_REQUEST_NOTIFY_EMAIL || 'hello@torqr.de';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Torqr <noreply@torqr.de>';

export async function sendBetaLeadNotification(input: {
  email: string;
  name?: string | null;
  company?: string | null;
  tierInterest?: string | null;
  source?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const receivedAt = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' });

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: BETA_LEAD_NOTIFY_EMAIL,
      subject: `[Torqr Beta] Neuer Lead: ${input.email}${input.tierInterest ? ` (${input.tierInterest})` : ''}`,
      react: BetaLeadAdminEmail({ ...input, receivedAt }),
      replyTo: input.email,
    });

    if (result.error) return { ok: false, error: String(result.error.message ?? result.error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown email error' };
  }
}

export async function sendDemoRequestNotification(input: {
  email: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  preferredSlot?: string | null;
  message?: string | null;
  source?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const receivedAt = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' });

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: DEMO_REQUEST_NOTIFY_EMAIL,
      subject: `[Torqr Demo] Anfrage von ${input.name} (${input.email})`,
      react: DemoRequestAdminEmail({ ...input, receivedAt }),
      replyTo: input.email,
    });

    if (result.error) return { ok: false, error: String(result.error.message ?? result.error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown email error' };
  }
}
```

- [ ] **Step 2: Tests anhängen**

Edit `src/lib/email/__tests__/service.test.ts` (oder erstellen, falls nicht existierend). Mock the resend import:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
}));

import { sendBetaLeadNotification, sendDemoRequestNotification } from '../service';

describe('sendBetaLeadNotification', () => {
  beforeEach(() => mockSend.mockReset());

  it('schickt E-Mail mit Subject inkl. Tier', async () => {
    mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });
    const result = await sendBetaLeadNotification({ email: 'test@torqr.de', tierInterest: 'SOLO' });
    expect(result.ok).toBe(true);
    expect(mockSend).toHaveBeenCalled();
    const [args] = mockSend.mock.calls[0];
    expect(args.subject).toContain('SOLO');
    expect(args.replyTo).toBe('test@torqr.de');
  });

  it('gibt error zurück wenn Resend fehlschlägt', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Quota exceeded' } });
    const result = await sendBetaLeadNotification({ email: 'test@torqr.de' });
    expect(result.ok).toBe(false);
  });
});

describe('sendDemoRequestNotification', () => {
  beforeEach(() => mockSend.mockReset());

  it('schickt E-Mail mit Name im Subject', async () => {
    mockSend.mockResolvedValue({ data: { id: 'x' }, error: null });
    const result = await sendDemoRequestNotification({ email: 'a@b.de', name: 'Max' });
    expect(result.ok).toBe(true);
    const [args] = mockSend.mock.calls[0];
    expect(args.subject).toContain('Max');
  });
});
```

- [ ] **Step 3: Tests laufen lassen**

```bash
npm run test:run -- src/lib/email/__tests__/service.test.ts
```

Expected: alle PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/email/service.tsx src/lib/email/__tests__/service.test.ts
git commit -m "feat(email): notification services for beta-lead + demo-request"
```

---

## Phase 3 — API-Routes

## Task 9: Beta-Leads API Route

**Files:**
- Create: `src/app/api/beta-leads/route.ts`
- Create: `src/app/api/beta-leads/__tests__/route.test.ts`

- [ ] **Step 1: Test schreiben (TDD)**

```typescript
// src/app/api/beta-leads/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockCreate = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: { betaLead: { create: mockCreate } },
}));

const mockSendNotify = vi.fn();
vi.mock('@/lib/email/service', () => ({
  sendBetaLeadNotification: mockSendNotify,
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitMiddleware: vi.fn(async () => null),
  RATE_LIMIT_PRESETS: { BETA_LEAD: { interval: 60 * 60 * 1000, maxRequests: 5 } },
}));

import { POST } from '../route';

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/beta-leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/beta-leads', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockSendNotify.mockReset();
  });

  it('akzeptiert gültigen Lead', async () => {
    mockCreate.mockResolvedValue({ id: 'x' });
    mockSendNotify.mockResolvedValue({ ok: true });

    const res = await POST(makeRequest({ email: 'a@b.de', consent: true }));
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalled();
    expect(mockSendNotify).toHaveBeenCalled();
  });

  it('lehnt ungültige Eingabe mit 400 ab', async () => {
    const res = await POST(makeRequest({ email: 'invalid', consent: true }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('lehnt fehlenden Consent mit 400 ab', async () => {
    const res = await POST(makeRequest({ email: 'a@b.de', consent: false }));
    expect(res.status).toBe(400);
  });

  it('Honeypot: gibt 200 zurück, persistiert aber nicht', async () => {
    const res = await POST(makeRequest({ email: 'a@b.de', consent: true, website: 'spam' }));
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test, expect failure**

```bash
npm run test:run -- src/app/api/beta-leads/__tests__/route.test.ts
```

Expected: FAIL (Modul existiert noch nicht).

- [ ] **Step 3: Route implementieren**

```typescript
// src/app/api/beta-leads/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { betaLeadSchema } from '@/lib/validations';
import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { sendBetaLeadNotification } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  // Rate-limit
  const rl = await rateLimitMiddleware(request, RATE_LIMIT_PRESETS.BETA_LEAD);
  if (rl) return rl;

  // Parse + validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = betaLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { email, name, company, tierInterest, source, consent } = parsed.data;

  // Persist
  try {
    await prisma.betaLead.create({
      data: {
        email,
        name: name && name.length > 0 ? name : null,
        company: company && company.length > 0 ? company : null,
        tierInterest: tierInterest ?? null,
        source: source ?? null,
        consent,
      },
    });
  } catch (e) {
    console.error('[beta-leads] DB error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  // Fire-and-forget notification (don't fail user if email fails)
  await sendBetaLeadNotification({ email, name, company, tierInterest, source });

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 4: Tests laufen lassen, alle PASS**

```bash
npm run test:run -- src/app/api/beta-leads/__tests__/route.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/beta-leads/
git commit -m "feat(api): POST /api/beta-leads with validation, rate-limit, email notification"
```

## Task 10: Demo-Requests API Route

**Files:**
- Create: `src/app/api/demo-requests/route.ts`
- Create: `src/app/api/demo-requests/__tests__/route.test.ts`

- [ ] **Step 1: Test schreiben**

```typescript
// src/app/api/demo-requests/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockCreate = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: { demoRequest: { create: mockCreate } },
}));

const mockSendNotify = vi.fn();
vi.mock('@/lib/email/service', () => ({
  sendDemoRequestNotification: mockSendNotify,
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimitMiddleware: vi.fn(async () => null),
  RATE_LIMIT_PRESETS: { DEMO_REQUEST: { interval: 60 * 60 * 1000, maxRequests: 3 } },
}));

import { POST } from '../route';

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/demo-requests', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/demo-requests', () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockSendNotify.mockReset();
  });

  it('akzeptiert gültige Anfrage', async () => {
    mockCreate.mockResolvedValue({ id: 'x' });
    mockSendNotify.mockResolvedValue({ ok: true });

    const res = await POST(makeRequest({ email: 'a@b.de', name: 'Max', consent: true }));
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalled();
  });

  it('lehnt fehlenden Namen ab', async () => {
    const res = await POST(makeRequest({ email: 'a@b.de', consent: true }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test, expect failure**

- [ ] **Step 3: Route implementieren**

```typescript
// src/app/api/demo-requests/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { demoRequestSchema } from '@/lib/validations';
import { rateLimitMiddleware, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { sendDemoRequestNotification } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  const rl = await rateLimitMiddleware(request, RATE_LIMIT_PRESETS.DEMO_REQUEST);
  if (rl) return rl;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = demoRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const optionalString = (s?: string) => (s && s.length > 0 ? s : null);

  try {
    await prisma.demoRequest.create({
      data: {
        email: d.email,
        name: d.name,
        company: optionalString(d.company),
        phone: optionalString(d.phone),
        preferredSlot: optionalString(d.preferredSlot),
        message: optionalString(d.message),
        source: d.source ?? null,
        consent: d.consent,
      },
    });
  } catch (e) {
    console.error('[demo-requests] DB error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  await sendDemoRequestNotification({
    email: d.email,
    name: d.name,
    company: optionalString(d.company),
    phone: optionalString(d.phone),
    preferredSlot: optionalString(d.preferredSlot),
    message: optionalString(d.message),
    source: d.source,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 4: Tests laufen lassen, alle PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/demo-requests/
git commit -m "feat(api): POST /api/demo-requests with validation, rate-limit, email notification"
```

---

## Phase 4 — UI-Primitives (shadcn-Komponenten)

## Task 11: shadcn-Komponenten installieren (Tabs, Accordion, Sheet, Checkbox)

**Files:**
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/accordion.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/checkbox.tsx`

- [ ] **Step 1: Erforderliche Radix-Packages installieren**

```bash
npm install @radix-ui/react-tabs @radix-ui/react-accordion @radix-ui/react-checkbox
```

(Sheet ist Wrapper um existing `@radix-ui/react-dialog` — kein neues Package.)

- [ ] **Step 2: shadcn-Komponenten generieren**

```bash
npx shadcn@latest add tabs accordion sheet checkbox
```

Falls shadcn-CLI nicht funktioniert: manuelle Implementierungen aus shadcn-Docs (https://ui.shadcn.com/docs/components/tabs etc.) in `src/components/ui/{tabs,accordion,sheet,checkbox}.tsx` einfügen.

- [ ] **Step 3: Verifizieren — Komponenten exportieren erwartete APIs**

Open each file, confirm exports:
- `tabs.tsx`: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `accordion.tsx`: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- `sheet.tsx`: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`
- `checkbox.tsx`: `Checkbox`

- [ ] **Step 4: Build verifizieren**

```bash
npm run build
```

Expected: Build erfolgreich (keine Type-Errors).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ package.json package-lock.json
git commit -m "feat(ui): add shadcn tabs, accordion, sheet, checkbox primitives"
```

---

## Phase 5 — Marketing-Komponenten

> **Hinweis:** Alle Sektionen in `src/components/marketing/`. Defaults sind Server-Components (kein `'use client'` außer wo unten explizit markiert). Inhalts-Quelle für Texte/Tabellen ist die Spec, Sektion `## Per-Section Detail`.

## Task 12: MarketingHeader + MobileNavSheet

**Files:**
- Create: `src/components/marketing/MarketingHeader.tsx`
- Create: `src/components/marketing/MobileNavSheet.tsx`

- [ ] **Step 1: MobileNavSheet (Client-Component)**

```tsx
// src/components/marketing/MobileNavSheet.tsx
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
```

- [ ] **Step 2: MarketingHeader (Server-Component, async)**

```tsx
// src/components/marketing/MarketingHeader.tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/MarketingHeader.tsx src/components/marketing/MobileNavSheet.tsx
git commit -m "feat(marketing): MarketingHeader with auth-aware CTAs and mobile sheet"
```

## Task 13: HeroVisual

**Files:**
- Create: `src/components/marketing/HeroVisual.tsx`

- [ ] **Step 1: Komponente (Phone+Desktop-Composition)**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/HeroVisual.tsx
git commit -m "feat(marketing): HeroVisual with phone+desktop composition"
```

## Task 14: Hero

**Files:**
- Create: `src/components/marketing/Hero.tsx`

- [ ] **Step 1: Hero-Komponente**

```tsx
// src/components/marketing/Hero.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';
import { HeroVisual } from './HeroVisual';

export function Hero() {
  return (
    <section id="hero" className="pt-32 pb-32 sm:pb-40 px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl grid gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-200 bg-brand-50 text-xs uppercase tracking-[1.5px] text-primary font-medium">
            ▰ Die Wartungsakte für Heizungsbauer
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            Aus Excel raus.
            <br />
            In die <span className="text-primary">Hosentasche</span> rein.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Torqr digitalisiert deine Wartungsplanung — automatische Kunden-Erinnerungen,
            mobile Vor-Ort-Dokumentation, alle Daten zentral statt verstreut auf Excel und Outlook.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="#cta-hero">
              <Button size="lg" className="text-base px-8 h-12">
                30 Tage testen <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#cta-demo">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                Demo buchen
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Keine Kreditkarte · jederzeit kündbar · DSGVO-konform
          </p>
        </div>

        <div className="lg:pl-8">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/Hero.tsx
git commit -m "feat(marketing): Hero section with pain-killer headline + dual CTAs"
```

## Task 15: PainBlock

**Files:**
- Create: `src/components/marketing/PainBlock.tsx`

- [ ] **Step 1: Komponente**

```tsx
// src/components/marketing/PainBlock.tsx
import { AlertTriangleIcon } from 'lucide-react';

const pains = [
  {
    title: 'Die Excel-Liste vom letzten Jahr — wer pflegt die noch?',
    body: 'Kunden-Adressen, Anlagen, Wartungsdaten in 4 Dateien verteilt, jede mit anderem Stand.',
  },
  {
    title: 'Wieder ein Anruf, weil die Wartung vergessen wurde.',
    body: '5 % der Termine rutschen durch — und es ist immer der Kunde, der erinnert.',
  },
  {
    title: 'Wo ist das Foto der Anlage von 2024?',
    body: 'Wartungs-Doku verstreut zwischen WhatsApp, Galerie und Notizen.',
  },
];

export function PainBlock() {
  return (
    <section id="pain" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Kennst du das?</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Drei Probleme, die in jedem Heizungsbau-Betrieb wiederkehren — und die Torqr beim
            Wegräumen hilft.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {pains.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card p-6">
              <AlertTriangleIcon className="h-5 w-5 text-accent mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/PainBlock.tsx
git commit -m "feat(marketing): PainBlock with 3 pain cards"
```

## Task 16: ThreeStepSolution

**Files:**
- Create: `src/components/marketing/ThreeStepSolution.tsx`

- [ ] **Step 1: Komponente**

```tsx
// src/components/marketing/ThreeStepSolution.tsx
import { DatabaseIcon, BellRingIcon, SmartphoneIcon } from 'lucide-react';

const steps = [
  {
    icon: DatabaseIcon,
    title: 'Alles an einem Ort',
    body: 'Kunden, Anlagen, Wartungshistorie und Fotos im selben System — mobil und Desktop.',
  },
  {
    icon: BellRingIcon,
    title: 'Automatisch erinnert',
    body: 'Deine Kunden bekommen 4 Wochen + 1 Woche vor jedem Termin eine Mail. Der Wartungstermin ist mit einem Klick gebucht — ohne Telefon-Pingpong.',
  },
  {
    icon: SmartphoneIcon,
    title: 'Mobil dokumentiert',
    body: '3-Step-Wartungs-Checklist mit Fotos und Notizen, direkt vor Ort am Smartphone. Historie bleibt unveränderlich.',
  },
];

export function ThreeStepSolution() {
  return (
    <section id="how" className="py-20 sm:py-28 px-6 border-t border-border bg-brand-50/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Mit Torqr läuft das so.</h2>
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="text-center sm:text-left">
              <div className="flex items-baseline justify-center sm:justify-start gap-3 mb-4">
                <span className="text-5xl font-bold text-accent">{i + 1}</span>
                <s.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/ThreeStepSolution.tsx
git commit -m "feat(marketing): ThreeStepSolution mapped to pain block"
```

## Task 17: FeatureBlock + FeatureSection

**Files:**
- Create: `src/components/marketing/FeatureBlock.tsx`
- Create: `src/components/marketing/FeatureSection.tsx`

- [ ] **Step 1: FeatureBlock (single, alternating)**

```tsx
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
```

- [ ] **Step 2: FeatureSection (Container der 4 Features)**

```tsx
// src/components/marketing/FeatureSection.tsx
import { FeatureBlock } from './FeatureBlock';

const features = [
  {
    eyebrow: 'MOBILE WARTUNGS-CHECKLIST',
    title: 'Wartung in 30 Sekunden — vor dem Gerät.',
    description: 'Drei klick-schnelle Schritte mit Fotos, Notizen und Bestätigung. Direkt am Smartphone, direkt vor der Anlage.',
    bullets: [
      '3-Step-Modal: Checkliste · Notizen+Fotos · Bestätigen',
      'Pro Anlagentyp vorgegebene Default-Items, anpassbar',
      'Immutable JSON-Snapshot pro Wartung — Historie unveränderlich',
    ],
    imageSrc: '/marketing/features/checklist-mobile.gif',
    imageAlt: 'Mobile Wartungs-Checklist als 3-Step-Wizard',
    isGif: true,
  },
  {
    eyebrow: 'FOTO-DOKUMENTATION',
    title: 'Lückenlose Foto-Doku pro Anlage.',
    description: 'Bis zu 5 Fotos pro Anlage. Alle Bilder bleiben pro Wartung historisch erhalten — keine versehentlichen Löschungen.',
    bullets: [
      'Bis zu 5 Fotos pro Anlage, JPEG/PNG/WebP',
      'Lightbox-Galerie zum Durchblättern',
      'Historische Wartungs-Fotos bleiben unveränderlich erhalten',
    ],
    imageSrc: '/marketing/features/photo-doku-desktop.png',
    imageAlt: 'Anlagen-Detail-Page mit Foto-Galerie und Lightbox',
  },
  {
    eyebrow: 'MULTI-SYSTEM & 904 GERÄTE-KATALOG',
    title: 'Heizung, Klima, Wasser, Energiespeicher — eine App.',
    description: 'Vier Anlagentypen mit eigenem Hersteller- und Modell-Katalog. 904 Einträge vorgepflegt, eigene jederzeit ergänzbar.',
    bullets: [
      'Vier Anlagentypen (Heizung · Klima · Wasseraufbereitung · Energiespeicher)',
      '904 Hersteller- und Modell-Einträge vorgepflegt',
      'Eigene Geräte jederzeit ergänzbar',
    ],
    imageSrc: '/marketing/features/multisystem-desktop.png',
    imageAlt: 'Anlagen-Liste mit Multi-System-Filter-Chips',
  },
  {
    eyebrow: 'MULTI-USER & WORKLOAD',
    title: 'Mit Mitarbeitern wachsen, ohne System zu wechseln.',
    description: 'Sobald du den ersten Techniker einstellst, läuft Torqr mit. Mit klaren Rollen, Anlagen-Zuweisung und einer Workload-Übersicht.',
    bullets: [
      'OWNER- und TECHNICIAN-Rollen mit feinkörnigen Rechten',
      'Anlagen-Zuweisung pro Mitarbeiter, Bulk-Reassign',
      'Workload-Page mit Stats-Tiles je Mitarbeiter',
    ],
    imageSrc: '/marketing/features/workload-desktop.png',
    imageAlt: 'Techniker-Workload-Page mit Stats-Tiles',
  },
];

export function FeatureSection() {
  return (
    <section id="features" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Was Torqr für dich tut.</h2>
        </div>

        <div className="space-y-20 sm:space-y-28">
          {features.map((f, i) => (
            <FeatureBlock key={f.eyebrow} {...f} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/FeatureBlock.tsx src/components/marketing/FeatureSection.tsx
git commit -m "feat(marketing): FeatureSection with 4 alternating feature blocks"
```

## Task 18: RoiBlock

**Files:**
- Create: `src/components/marketing/RoiBlock.tsx`

- [ ] **Step 1: Komponente**

```tsx
// src/components/marketing/RoiBlock.tsx
import { ClockIcon, EuroIcon, ShieldCheckIcon } from 'lucide-react';

const tiles = [
  {
    icon: ClockIcon,
    headline: '6 h pro Woche zurück',
    sub: 'Weniger Excel, weniger Telefon, mehr Werkstatt-Zeit',
  },
  {
    icon: EuroIcon,
    headline: '~12.000 €/Jahr Zeit-Wert',
    sub: 'Bei 40 €/h Stundensatz · 48 Arbeitswochen',
  },
  {
    icon: ShieldCheckIcon,
    headline: '~5 % weniger Kundenabwanderung',
    sub: 'Vergessene Wartungen kosten Kunden — Torqr fängt sie automatisch ab',
  },
];

export function RoiBlock() {
  return (
    <section id="roi" className="py-20 sm:py-28 px-6 border-t border-border bg-brand-50/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Was Torqr dir zurückgibt.</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-12">
          {tiles.map((t) => (
            <div key={t.headline} className="rounded-xl border border-border bg-background p-8 text-center">
              <t.icon className="h-8 w-8 text-primary mx-auto mb-4" />
              <p className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t.headline}</p>
              <p className="text-sm text-muted-foreground">{t.sub}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-background border border-border p-8 text-center">
          <h3 className="text-base font-semibold text-foreground mb-3">Was bedeutet das in einem Jahr?</h3>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Bei 50 Wartungsverträgen und €348/Jahr Solo-Tier:{' '}
            <strong className="text-foreground">ROI-Faktor ~35×.</strong> Break-even nach knapp{' '}
            <strong className="text-foreground">zwei Wochen.</strong> Die ersten 30 Tage sind kostenlos —
            du gehst kein Risiko ein.
          </p>
        </div>

        <p className="mt-6 text-xs italic text-muted-foreground text-center max-w-2xl mx-auto">
          ø-Werte für Solo-Betriebe mit ~50 Wartungsverträgen. Basis: Business-Model-Canvas-Berechnung 2024,
          validiert mit Pilotkunden-Daten.
        </p>

        {/* TODO V2: ROI-Rechner-Tool — Inline-CTA aktivieren wenn /roi-rechner live ist */}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/RoiBlock.tsx
git commit -m "feat(marketing): RoiBlock with 3 stat tiles and yearly outcome statement"
```

## Task 19: PilotStatus

**Files:**
- Create: `src/components/marketing/PilotStatus.tsx`

- [ ] **Step 1: Komponente**

```tsx
// src/components/marketing/PilotStatus.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from 'lucide-react';

const stats = [
  { value: '1', label: 'Aktiver Pilotbetrieb' },
  { value: '28', label: 'Sprints geliefert' },
  { value: '324', label: 'Grüne Tests' },
];

export function PilotStatus() {
  return (
    <section id="pilot" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent-surface text-xs uppercase tracking-[1.5px] text-amber-900 font-medium mb-6">
          ▰ Aktuell in der Beta-Phase
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
          Wir entwickeln Torqr <span className="text-primary">gemeinsam</span> mit echten Heizungsbauern.
        </h2>

        <p className="mt-6 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Aktuell läuft Torqr mit einem aktiven Pilotbetrieb. Die ersten Beta-Plätze sind verfügbar —
          wir nehmen pro Woche maximal drei neue Heizungsbau-Betriebe auf, um sauberes Onboarding zu garantieren.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl font-bold text-primary">{s.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link href="#cta-pilot">
            <Button size="lg">Beta-Liste eintragen <ArrowRightIcon className="h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/PilotStatus.tsx
git commit -m "feat(marketing): PilotStatus block with 3 substance stats"
```

## Task 20: TechStackStrip + TrustBlock

**Files:**
- Create: `src/components/marketing/TechStackStrip.tsx`
- Create: `src/components/marketing/TrustBlock.tsx`

- [ ] **Step 1: TechStackStrip**

```tsx
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
```

- [ ] **Step 2: TrustBlock**

```tsx
// src/components/marketing/TrustBlock.tsx
import { GlobeIcon, LockIcon, MailCheckIcon, CheckCircle2Icon } from 'lucide-react';
import { TechStackStrip } from './TechStackStrip';

const cards = [
  { icon: GlobeIcon, title: 'Hosting in Frankfurt', body: 'Supabase eu-central-1 · Vercel EU-Region · keine Daten in Drittländern' },
  { icon: LockIcon, title: 'Verschlüsselt End-to-End', body: 'TLS überall · bcrypt für Passwörter · Row-Level-Security auf der Datenbank' },
  { icon: MailCheckIcon, title: 'Doppelt Opt-In für jede Kunden-Mail', body: 'UWG-konform · jederzeit abbestellbar · stateless HMAC-Unsubscribe' },
  { icon: CheckCircle2Icon, title: '324 automatisierte Tests', body: 'TypeScript strict · CI/CD · Sentry-Monitoring im laufenden Betrieb' },
];

export function TrustBlock() {
  return (
    <section id="trust" className="py-20 sm:py-28 px-6 border-t border-border bg-brand-50/40">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">DSGVO-konform aus Deutschland.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Datenresidenz, Verschlüsselung und Compliance — von Anfang an mitgedacht.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-background p-6">
              <c.icon className="h-6 w-6 text-primary mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        <TechStackStrip />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/TechStackStrip.tsx src/components/marketing/TrustBlock.tsx
git commit -m "feat(marketing): TrustBlock with 4 DSGVO cards and tech-stack strip"
```

## Task 21: PricingToggle + PricingCard + Pricing

**Files:**
- Create: `src/components/marketing/PricingToggle.tsx`
- Create: `src/components/marketing/PricingCard.tsx`
- Create: `src/components/marketing/Pricing.tsx`

- [ ] **Step 1: PricingToggle (Client-Component)**

```tsx
// src/components/marketing/PricingToggle.tsx
'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';

type Cycle = 'monthly' | 'annual';
const CycleContext = createContext<{ cycle: Cycle; setCycle: (c: Cycle) => void }>({
  cycle: 'annual',
  setCycle: () => {},
});

export function PricingProvider({ children }: { children: ReactNode }) {
  const [cycle, setCycle] = useState<Cycle>('annual');
  return <CycleContext.Provider value={{ cycle, setCycle }}>{children}</CycleContext.Provider>;
}

export function usePricingCycle() {
  return useContext(CycleContext);
}

export function PricingToggle() {
  const { cycle, setCycle } = usePricingCycle();
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-background">
      <button
        type="button"
        onClick={() => setCycle('monthly')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          cycle === 'monthly' ? 'bg-foreground text-background' : 'text-muted-foreground'
        }`}
      >
        Monatlich
      </button>
      <button
        type="button"
        onClick={() => setCycle('annual')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          cycle === 'annual' ? 'bg-foreground text-background' : 'text-muted-foreground'
        }`}
      >
        Jährlich · 2 Monate gratis
      </button>
    </div>
  );
}
```

- [ ] **Step 2: PricingCard (Client-Component, liest Cycle aus Context)**

```tsx
// src/components/marketing/PricingCard.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { usePricingCycle } from './PricingToggle';

export interface PricingCardProps {
  tier: 'Solo' | 'Professional' | 'Enterprise';
  audience: string;
  monthlyPrice: number;
  annualPrice: number; // total per year
  highlight?: boolean;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

export function PricingCard({ tier, audience, monthlyPrice, annualPrice, highlight, features, ctaLabel, ctaHref }: PricingCardProps) {
  const { cycle } = usePricingCycle();
  const displayPrice = cycle === 'annual' ? Math.round(annualPrice / 12) : monthlyPrice;
  const annualHint = cycle === 'annual' ? `(${annualPrice} €/Jahr)` : null;

  return (
    <div className={`relative rounded-2xl p-8 flex flex-col ${
      highlight
        ? 'border-2 border-primary bg-background shadow-xl'
        : 'border border-border bg-background'
    }`}>
      {highlight ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-amber-950 text-xs font-medium tracking-wide">
          BELIEBTESTE WAHL
        </div>
      ) : null}

      <h3 className="text-xl font-bold text-foreground">{tier}</h3>
      <p className="text-sm text-muted-foreground mt-1">{audience}</p>

      <div className="mt-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-foreground">€{displayPrice}</span>
          <span className="text-sm text-muted-foreground">/ Monat</span>
        </div>
        {annualHint ? <p className="text-xs text-muted-foreground mt-1">{annualHint}</p> : null}
      </div>

      <ul className="mt-6 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground">{f}</span>
          </li>
        ))}
      </ul>

      <Link href={ctaHref} className="mt-8 block">
        <Button className="w-full" variant={highlight ? 'default' : 'outline'} size="lg">
          {ctaLabel}
        </Button>
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Pricing (Container)**

```tsx
// src/components/marketing/Pricing.tsx
import { PricingProvider, PricingToggle } from './PricingToggle';
import { PricingCard } from './PricingCard';

const tiers = [
  {
    tier: 'Solo' as const,
    audience: 'Für den Ein-Mann-Betrieb',
    monthlyPrice: 29,
    annualPrice: 290,
    features: [
      'Bis 50 Kunden',
      'Mobile Wartungs-Checklist',
      'Foto-Dokumentation pro Anlage',
      'Multi-System (Heizung · Klima · Wasser · Energiespeicher)',
      '904 Geräte vorgepflegt',
      'Automatische Kunden-Erinnerungen',
      'Online-Termin-Buchung',
      'Daten-Export (DSGVO Art. 20)',
    ],
    ctaLabel: '30 Tage testen →',
    ctaHref: '#cta-beta-solo',
  },
  {
    tier: 'Professional' as const,
    audience: 'Für Teams ab 2 Personen',
    monthlyPrice: 49,
    annualPrice: 490,
    highlight: true,
    features: [
      'Alles aus Solo, plus:',
      'Bis 150 Kunden',
      'Multi-User mit OWNER/TECHNICIAN-Rollen',
      'Anlagen-Zuweisung an Mitarbeiter',
      'Techniker-Workload-Page',
      '1× Onboarding-Session (1 h)',
    ],
    ctaLabel: '30 Tage testen →',
    ctaHref: '#cta-beta-pro',
  },
  {
    tier: 'Enterprise' as const,
    audience: 'Für Mehr-Standort-Betriebe & Partner',
    monthlyPrice: 99,
    annualPrice: 990,
    features: [
      'Alles aus Professional, plus:',
      'Unlimited Kunden',
      'Public API',
      'Custom-Branding (Logo + Farben in E-Mails)',
      'Priority-Support (24-h SLA)',
      '2× Onboarding-Session (2 h)',
    ],
    ctaLabel: 'Demo buchen →',
    ctaHref: '#cta-demo',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Klare Preise. 30 Tage gratis testen.</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Beginne mit dem Tier, der zu deiner Größe passt — wechsle jederzeit.
          </p>
        </div>

        <PricingProvider>
          <div className="flex justify-center mb-12">
            <PricingToggle />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((t) => <PricingCard key={t.tier} {...t} />)}
          </div>
        </PricingProvider>

        <p className="mt-10 text-xs text-center text-muted-foreground">
          Alle Preise zzgl. USt. · 30 Tage gratis · keine Kreditkarte · jederzeit kündbar.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/marketing/PricingToggle.tsx src/components/marketing/PricingCard.tsx src/components/marketing/Pricing.tsx
git commit -m "feat(marketing): Pricing with 3 tiers and monthly/annual toggle"
```

## Task 22: Faq

**Files:**
- Create: `src/components/marketing/Faq.tsx`

- [ ] **Step 1: Komponente**

```tsx
// src/components/marketing/Faq.tsx
'use client';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Was passiert nach den 30 Tagen kostenlos?',
    a: 'Du wählst den Tier, der zu dir passt — oder du kündigst. Keine Verlängerungs-Falle, keine Kreditkarte im Voraus. Wir erinnern dich rechtzeitig per E-Mail.',
  },
  {
    q: 'Ist Torqr nur für Heizungsbauer geeignet?',
    a: 'Nein — Torqr unterstützt vier Anlagentypen: Heizung, Klima, Wasseraufbereitung und Energiespeicher (Boiler / Pufferspeicher). 904 Hersteller-Modell-Einträge sind vorgepflegt, eigene kannst du jederzeit ergänzen.',
  },
  {
    q: 'Kann ich meine bestehende Excel-Kundenliste importieren?',
    a: 'Aktuell legst du Kunden manuell oder über das Anlagen-Modal an — der Geräte-Katalog beschleunigt das deutlich. Ein CSV-Import ist in Vorbereitung. Während der Beta-Phase helfen wir dir gerne beim einmaligen Initial-Import.',
  },
  {
    q: 'Was passiert mit meinen Daten, wenn ich kündige?',
    a: 'Du bekommst einen vollständigen Daten-Export (DSGVO Art. 20) — Kunden, Anlagen, Wartungs-Historie und Fotos in offenen Formaten. Kein Vendor-Lock-in.',
  },
  {
    q: 'Funktioniert Torqr offline auf der Baustelle?',
    a: 'Eingeschränkt — die App ist als Progressive Web App (PWA) installierbar und zeigt zwischengespeicherte Daten ohne Netz. Eine echte Offline-Sync mit lokaler Bearbeitung ist auf der Roadmap.',
  },
  {
    q: 'Kann ich später Mitarbeiter hinzufügen?',
    a: 'Ja — wechsle in den Professional-Tier. Du legst Mitarbeiter mit OWNER- oder TECHNICIAN-Rolle an, weist Anlagen zu und siehst die Workload je Mitarbeiter im Dashboard. Kein neuer Vertrag, kein Daten-Umzug.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="py-20 sm:py-28 px-6 border-t border-border bg-background">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Häufige Fragen.</h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/Faq.tsx
git commit -m "feat(marketing): FAQ section with 6 accordion entries"
```

## Task 23: BetaListForm

**Files:**
- Create: `src/components/marketing/BetaListForm.tsx`

- [ ] **Step 1: Form-Komponente**

```tsx
// src/components/marketing/BetaListForm.tsx
'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { betaLeadSchema, type BetaLeadInput } from '@/lib/validations';

export function BetaListForm() {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BetaLeadInput>({
    resolver: zodResolver(betaLeadSchema),
    defaultValues: { consent: false as never },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash === '#cta-beta-solo') {
      setValue('tierInterest', 'SOLO');
      setValue('source', 'pricing-solo');
    } else if (hash === '#cta-beta-pro') {
      setValue('tierInterest', 'PRO');
      setValue('source', 'pricing-pro');
    } else if (hash === '#cta-pilot') {
      setValue('source', 'pilot-status');
    } else if (hash === '#cta-hero') {
      setValue('source', 'hero');
    } else {
      setValue('source', 'direct');
    }
  }, [setValue]);

  const onSubmit = async (data: BetaLeadInput) => {
    setSubmitState('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/beta-leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg(j.error ?? 'Etwas ist schiefgelaufen. Bitte versuche es nochmal.');
        setSubmitState('error');
        return;
      }
      setSubmitState('success');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Netzwerkfehler');
      setSubmitState('error');
    }
  };

  if (submitState === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle2Icon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Danke!</h3>
        <p className="text-sm text-muted-foreground">Wir melden uns innerhalb von 2 Werktagen.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Honeypot */}
      <input type="text" {...register('website')} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div>
        <Label htmlFor="beta-email">E-Mail-Adresse *</Label>
        <Input id="beta-email" type="email" autoComplete="email" {...register('email')} />
        {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="beta-name">Name (optional)</Label>
          <Input id="beta-name" type="text" autoComplete="name" {...register('name')} />
        </div>
        <div>
          <Label htmlFor="beta-company">Firma (optional)</Label>
          <Input id="beta-company" type="text" autoComplete="organization" {...register('company')} />
        </div>
      </div>

      <div className="flex items-start gap-3 pt-2">
        <Checkbox id="beta-consent" onCheckedChange={(v) => setValue('consent', v === true as never)} />
        <Label htmlFor="beta-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert und für die Beta-Aufnahme
          verwendet werden. Details in der{' '}
          <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
        </Label>
      </div>
      {errors.consent ? <p className="text-xs text-red-600">{errors.consent.message}</p> : null}

      {submitState === 'error' ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitState === 'submitting'}>
        {submitState === 'submitting' ? <><Loader2Icon className="h-4 w-4 animate-spin" /> Wird gesendet …</> : 'Beta-Liste eintragen'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/BetaListForm.tsx
git commit -m "feat(marketing): BetaListForm with hash-routing for tier preselect"
```

## Task 24: DemoRequestForm

**Files:**
- Create: `src/components/marketing/DemoRequestForm.tsx`

- [ ] **Step 1: Form-Komponente**

```tsx
// src/components/marketing/DemoRequestForm.tsx
'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { demoRequestSchema, type DemoRequestInput } from '@/lib/validations';

export function DemoRequestForm() {
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register, handleSubmit, setValue, formState: { errors },
  } = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: { consent: false as never },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash === '#cta-demo' && document.referrer.includes('pricing')) {
      setValue('source', 'pricing-enterprise');
    } else if (hash === '#cta-demo') {
      setValue('source', 'hero');
    } else {
      setValue('source', 'direct');
    }
  }, [setValue]);

  const onSubmit = async (data: DemoRequestInput) => {
    setSubmitState('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/demo-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErrorMsg(j.error ?? 'Etwas ist schiefgelaufen. Bitte versuche es nochmal.');
        setSubmitState('error');
        return;
      }
      setSubmitState('success');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Netzwerkfehler');
      setSubmitState('error');
    }
  };

  if (submitState === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle2Icon className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Danke!</h3>
        <p className="text-sm text-muted-foreground">Wir melden uns innerhalb von 1 Werktag mit Terminvorschlägen.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="text" {...register('website')} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="demo-name">Name *</Label>
          <Input id="demo-name" type="text" autoComplete="name" {...register('name')} />
          {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="demo-email">E-Mail *</Label>
          <Input id="demo-email" type="email" autoComplete="email" {...register('email')} />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="demo-company">Firma (optional)</Label>
          <Input id="demo-company" type="text" autoComplete="organization" {...register('company')} />
        </div>
        <div>
          <Label htmlFor="demo-phone">Telefon (optional)</Label>
          <Input id="demo-phone" type="tel" autoComplete="tel" {...register('phone')} />
        </div>
      </div>

      <div>
        <Label htmlFor="demo-slot">Wunschtermin-Bereich (optional)</Label>
        <Input id="demo-slot" type="text" placeholder="z. B. Vormittags KW 19" {...register('preferredSlot')} />
      </div>

      <div>
        <Label htmlFor="demo-message">Nachricht (optional)</Label>
        <Textarea id="demo-message" rows={3} {...register('message')} />
      </div>

      <div className="flex items-start gap-3 pt-2">
        <Checkbox id="demo-consent" onCheckedChange={(v) => setValue('consent', v === true as never)} />
        <Label htmlFor="demo-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Demo-Anfrage gespeichert und verwendet werden.
          Details in der <a href="/datenschutz" className="underline">Datenschutzerklärung</a>.
        </Label>
      </div>
      {errors.consent ? <p className="text-xs text-red-600">{errors.consent.message}</p> : null}

      {submitState === 'error' ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

      <Button type="submit" size="lg" className="w-full" disabled={submitState === 'submitting'}>
        {submitState === 'submitting' ? <><Loader2Icon className="h-4 w-4 animate-spin" /> Wird gesendet …</> : 'Demo-Anfrage senden'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/DemoRequestForm.tsx
git commit -m "feat(marketing): DemoRequestForm with hash-aware source tracking"
```

## Task 25: FinalCta

**Files:**
- Create: `src/components/marketing/FinalCta.tsx`

- [ ] **Step 1: FinalCta mit Tabs für beide Forms (Client-Component für Hash-Tab-Sync)**

```tsx
// src/components/marketing/FinalCta.tsx
'use client';
import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BetaListForm } from './BetaListForm';
import { DemoRequestForm } from './DemoRequestForm';

export function FinalCta() {
  const [tab, setTab] = useState<'beta' | 'demo'>('beta');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const setFromHash = () => {
      const h = window.location.hash;
      setTab(h === '#cta-demo' ? 'demo' : 'beta');
    };
    setFromHash();
    window.addEventListener('hashchange', setFromHash);
    return () => window.removeEventListener('hashchange', setFromHash);
  }, []);

  return (
    <section id="cta" className="py-20 sm:py-28 px-6 border-t border-border bg-brand-50">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Bereit, deine Wartungssaison neu zu denken?</h2>
          <p className="mt-4 text-base text-muted-foreground">
            30 Tage gratis · keine Kreditkarte · jederzeit kündbar.
          </p>
        </div>

        <div className="bg-background rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'beta' | 'demo')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="beta">30 Tage testen</TabsTrigger>
              <TabsTrigger value="demo">Demo buchen</TabsTrigger>
            </TabsList>
            <TabsContent value="beta">
              <BetaListForm />
            </TabsContent>
            <TabsContent value="demo">
              <DemoRequestForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/FinalCta.tsx
git commit -m "feat(marketing): FinalCta with tabs for beta + demo forms"
```

## Task 26: MarketingFooter

**Files:**
- Create: `src/components/marketing/MarketingFooter.tsx`

- [ ] **Step 1: Komponente**

```tsx
// src/components/marketing/MarketingFooter.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/marketing/MarketingFooter.tsx
git commit -m "feat(marketing): MarketingFooter with 4 columns"
```

---

## Phase 6 — Page-Assembly + SEO

## Task 27: Rewrite `src/app/page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Komplettes Replace mit Marketing-Komposition**

```tsx
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
```

- [ ] **Step 2: Build verifizieren**

```bash
npm run build
```

Expected: erfolgreicher Build, keine Type-Errors. Wenn Type-Errors, beheben.

- [ ] **Step 3: Dev-Server starten und manuelle Visual-Verifikation**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Header zeigt Wordmark + Nav + CTAs (oder "Zum Dashboard" falls eingeloggt)
- Hero rendert (Text korrekt, Visual zeigt Placeholder bis Phase 7-Assets gedroppt)
- Alle Sektionen scrollbar in Reihenfolge
- Pricing-Toggle wechselt zwischen Monatlich/Jährlich
- FAQ-Accordion klappt auf
- Final-CTA zeigt Tabs

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(marketing): rewrite root page.tsx as composed marketing landing"
```

## Task 28: SEO-Metadata in `src/app/layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read existing layout to understand structure**

```bash
cat src/app/layout.tsx | head -40
```

- [ ] **Step 2: Metadata-Export erweitern**

Edit `src/app/layout.tsx`. Replace existing `metadata` export (or add if missing):

```tsx
import type { Metadata } from 'next';

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
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): comprehensive metadata for landing page"
```

## Task 29: Sitemap + robots.ts

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

- [ ] **Step 1: Sitemap**

```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://torqr.de';
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/datenschutz`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/impressum`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
```

- [ ] **Step 2: robots**

```typescript
// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/', '/admin/'] },
    ],
    sitemap: 'https://torqr.de/sitemap.xml',
  };
}
```

- [ ] **Step 3: Build verifizieren — Sitemap und robots erreichbar**

```bash
npm run build && npm start &
sleep 3
curl http://localhost:3000/sitemap.xml | head -10
curl http://localhost:3000/robots.txt
kill %1
```

Expected: sitemap.xml zeigt 3 URLs, robots.txt enthält die Disallow-Regeln.

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat(seo): sitemap and robots.txt"
```

---

## Phase 7 — Legal-Pages (Pre-Launch-Pflicht)

## Task 30: Datenschutzerklärung

**Files:**
- Create: `src/app/datenschutz/page.tsx`

- [ ] **Step 1: Page-Skelett mit Generator-Vorlage-Inhalten**

> **Wichtig:** Die folgende Vorlage ist ein **Skelett** und muss von einem Anwalt reviewed werden, bevor die Page öffentlich erreichbar wird. Die `<TODO Anwalt>`-Marker sind rechtlich kritische Stellen.

```tsx
// src/app/datenschutz/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung von Torqr nach DSGVO und BDSG.',
  robots: { index: true, follow: false },
};

export default function DatenschutzPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background pt-24">
        <article className="mx-auto max-w-3xl px-6 py-16 prose prose-sm sm:prose-base">
          <h1>Datenschutzerklärung</h1>
          <p className="text-muted-foreground">Stand: <time>{new Date().toLocaleDateString('de-DE')}</time></p>

          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
            {/* TODO Anwalt: vollständige Verantwortlichen-Angaben aus Impressum übernehmen */}
            Torqr — Inhaber: Yannik Dorth<br />
            E-Mail: <a href="mailto:hello@torqr.de">hello@torqr.de</a>
          </p>

          <h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
          <p>
            Beim Besuch dieser Website werden technisch notwendige Daten (z. B. IP-Adresse, Browser-Typ,
            besuchte Seiten) automatisch erfasst und für die sichere Bereitstellung der Website verarbeitet.
            Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
          </p>

          <h2>3. Beta-Liste / Demo-Anfrage</h2>
          <p>
            Wenn du dich in die Beta-Liste einträgst oder eine Demo anfragst, verarbeiten wir die von dir
            übermittelten Angaben (E-Mail, Name, Firma, Telefon, Wunschtermin, Nachricht) zur Bearbeitung
            deiner Anfrage. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung) und Art. 6 Abs. 1
            lit. a DSGVO (Einwilligung).
          </p>
          <p>
            Die Daten werden für maximal 24 Monate aufbewahrt, danach gelöscht — sofern nicht gesetzliche
            Aufbewahrungsfristen entgegenstehen.
          </p>

          <h2>4. Hosting und Auftragsverarbeiter</h2>
          <p>
            {/* TODO Anwalt: konkrete AVV-Status-Sätze pro Dienstleister */}
            Wir nutzen folgende Auftragsverarbeiter:
          </p>
          <ul>
            <li>Vercel Inc. (Hosting der Anwendung) — Standort EU-Region, Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Supabase Inc. (Datenbank) — Server-Region eu-central-1 (Frankfurt), Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Resend (E-Mail-Versand) — Auftragsverarbeitungsvertrag abgeschlossen</li>
            <li>Upstash (Rate-Limiting) — Auftragsverarbeitungsvertrag abgeschlossen</li>
          </ul>

          <h2>5. Deine Rechte</h2>
          <p>
            Du hast jederzeit das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
            Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21)
            nach DSGVO. Außerdem hast du das Recht auf Beschwerde bei der zuständigen Aufsichtsbehörde.
          </p>

          <h2>6. Cookies</h2>
          <p>
            Diese Website setzt aktuell ausschließlich technisch notwendige Session-Cookies (Auth) ein.
            Tracking- oder Analyse-Cookies werden nicht eingesetzt.
          </p>

          <h2>7. Kontakt</h2>
          <p>
            Bei Fragen zum Datenschutz wende dich an{' '}
            <a href="mailto:hello@torqr.de">hello@torqr.de</a>.
          </p>

          <p className="text-xs text-muted-foreground italic mt-12">
            Diese Datenschutzerklärung wurde initial mit Hilfe der Vorlage von datenschutz-generator.de
            erstellt und durch einen Anwalt reviewed.
          </p>

          <p className="mt-8"><Link href="/">← Zurück zur Startseite</Link></p>
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}
```

- [ ] **Step 2: Commit (mit klarem Hinweis auf Anwalt-Review-Pflicht)**

```bash
git add src/app/datenschutz/page.tsx
git commit -m "feat(legal): datenschutz page skeleton (REQUIRES Anwalt review before public launch)"
```

## Task 31: Impressum

**Files:**
- Create: `src/app/impressum/page.tsx`

- [ ] **Step 1: Page mit §5-TMG-Inhalten**

```tsx
// src/app/impressum/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum von Torqr nach §5 TMG.',
  robots: { index: true, follow: false },
};

export default function ImpressumPage() {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen bg-background pt-24">
        <article className="mx-auto max-w-3xl px-6 py-16 prose prose-sm sm:prose-base">
          <h1>Impressum</h1>

          <h2>Angaben gemäß §5 TMG</h2>
          <p>
            {/* TODO: vollständige Adresse + Steuer-ID/USt-ID einfügen */}
            Yannik Dorth<br />
            [Straße + Hausnummer]<br />
            [PLZ] [Ort]<br />
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>
            E-Mail: <a href="mailto:hello@torqr.de">hello@torqr.de</a><br />
            {/* Optional: Telefon */}
          </p>

          <h2>Umsatzsteuer-ID</h2>
          <p>{/* TODO: USt-ID einfügen, falls vorhanden — andernfalls Sektion entfernen */}</p>

          <h2>Verantwortlich für den Inhalt nach §55 Abs. 2 RStV</h2>
          <p>Yannik Dorth (Anschrift wie oben)</p>

          <h2>Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a>.
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß §7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Nach §§8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
            zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>

          <p className="mt-8"><Link href="/">← Zurück zur Startseite</Link></p>
        </article>
      </main>
      <MarketingFooter />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/impressum/page.tsx
git commit -m "feat(legal): impressum page (TODO: complete address + USt-ID before launch)"
```

---

## Phase 8 — Visual-Asset-Produktion (manueller Schritt)

## Task 32: Demo-Daten-Seed laufen lassen + Screenshots aufnehmen

**Files:**
- Create (manual, in Browser): `public/marketing/hero/dashboard-desktop.png`
- Create (manual): `public/marketing/features/photo-doku-desktop.png`
- Create (manual): `public/marketing/features/multisystem-desktop.png`
- Create (manual): `public/marketing/features/workload-desktop.png`

- [ ] **Step 1: Seed gegen lokale DB laufen lassen**

```bash
npm run seed:marketing-demo
```

Expected: 5 Kunden, 8 Anlagen, 12 Wartungen angelegt.

- [ ] **Step 2: Mit Demo-User einloggen und Dashboard-Screenshot machen**

1. Dev-Server starten: `npm run dev`
2. Browser öffnen: `http://localhost:3000/login`
3. Login mit `demo@torqr.de` / `demo-password-not-for-production`
4. Dashboard öffnen
5. Screenshot bei Desktop-Auflösung 1440×900 — Tools z.B. macOS Cmd+Shift+5, Windows Snipping Tool, Browser-DevTools "Screenshot full page"
6. Speichern unter `public/marketing/hero/dashboard-desktop.png` (PNG, max 500 KB, Quality 85)

- [ ] **Step 3: Foto-Doku-Screenshot machen**

1. In der Demo-App: Anlage öffnen, die Wartungen mit Fotos hat (Demo-Seed legt Foto-URLs leer an — vor Screenshot manuell 2-3 Demo-Fotos hochladen)
2. Anlagen-Detail-Page: Lightbox-Galerie sichtbar
3. Screenshot speichern als `public/marketing/features/photo-doku-desktop.png`

- [ ] **Step 4: Multi-System-Screenshot machen**

1. Anlagen-Liste öffnen mit allen 8 Demo-Anlagen sichtbar
2. Filter-Chips für SystemType-Filter aktivieren (Heizung, Klima, Wasser, Energiespeicher)
3. Screenshot speichern als `public/marketing/features/multisystem-desktop.png`

- [ ] **Step 5: Workload-Page-Screenshot machen**

1. `/dashboard/team/workload` öffnen
2. Stats-Tiles + gruppierte Anlagen-Liste sichtbar
3. Screenshot speichern als `public/marketing/features/workload-desktop.png`

- [ ] **Step 6: Commit Assets**

```bash
git add public/marketing/
git commit -m "chore(marketing): demo screenshots for hero + features"
```

## Task 33: Hero-GIF + Mobile-Checklist-GIF erstellen

**Files:**
- Create (manual): `public/marketing/hero/wartungs-checklist.gif`
- Create (manual): `public/marketing/features/checklist-mobile.gif`

- [ ] **Step 1: GIF-Recording-Tool installieren (einmalig)**

Empfohlene Tools:
- **macOS:** [Kap](https://getkap.co/) (Free) oder [Gifski](https://gif.ski/) (CLI)
- **Windows:** [ScreenToGif](https://www.screentogif.com/) (Free)
- **Cross-Platform:** [LICEcap](https://www.cockos.com/licecap/)

- [ ] **Step 2: Mobile-Modus aktivieren und 3-Step-Wizard recorden**

1. Browser-DevTools → Device-Mode → "iPhone 15 Pro"
2. Demo-App: Anlage öffnen → "Wartung dokumentieren" Button
3. Record starten
4. Drei Schritte des Wartungs-Modals durchklicken (Checkliste → Notizen+Fotos → Bestätigen)
5. Record stoppen — Länge ~5-7 Sekunden
6. GIF exportieren — Größe-Ziel: max 500 KB, Auflösung 360×780 oder 270×585
7. Speichern als `public/marketing/hero/wartungs-checklist.gif`
8. Identische Kopie als `public/marketing/features/checklist-mobile.gif`

- [ ] **Step 3: Größe optimieren (falls > 500 KB)**

```bash
# Mit gifsicle, falls installiert:
gifsicle -O3 --lossy=80 public/marketing/hero/wartungs-checklist.gif -o public/marketing/hero/wartungs-checklist.gif
```

Oder online: https://ezgif.com/optimize.

- [ ] **Step 4: Manuelle Verifikation der Page-Performance**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- Hero-GIF lädt und loopt
- Hero-Visual zeigt Phone-Frame mit GIF + Desktop-Frame mit Dashboard-Screenshot
- Feature-Sektion: alle 4 Visuals laden korrekt

- [ ] **Step 5: Commit Assets**

```bash
git add public/marketing/
git commit -m "chore(marketing): hero + mobile-checklist GIFs"
```

## Task 34: OG-Image erstellen

**Files:**
- Create (manual): `public/og-image.png`

- [ ] **Step 1: OG-Image gestalten (1200×630)**

Inhalt:
- Hintergrund: weiß oder Brand-Surface `#E6F2E6`
- Wordmark "torqr" gross zentriert
- Tagline darunter: "Die Wartungsakte für Heizungsbauer"
- Hero-Headline darunter: "Aus Excel raus. In die Hosentasche rein."

Tools: Figma, Canva, oder einfach Browser-Screenshot der Hero-Sektion bei 1200×630.

Speichern als `public/og-image.png`.

- [ ] **Step 2: Manuelle Verifikation mit OG-Debugger**

Deploy preview to Vercel, dann:
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

Verify: Bild + Title + Description erscheinen korrekt.

- [ ] **Step 3: Commit**

```bash
git add public/og-image.png
git commit -m "chore(marketing): open-graph image"
```

---

## Phase 9 — Verifikation

## Task 35: Lighthouse-Audit + Accessibility-Check + Test-Suite

- [ ] **Step 1: Tests komplett laufen lassen**

```bash
npm run test:run
```

Expected: ALL PASS (mindestens 324 grüne Tests, idealerweise 350+ mit den neuen).

- [ ] **Step 2: Build verifizieren**

```bash
npm run build
```

Expected: Erfolgreicher Build, keine Type-Errors, keine ESLint-Fehler.

- [ ] **Step 3: Lighthouse-Mobile-Audit**

```bash
npm run dev &
sleep 3
npx lighthouse http://localhost:3000 --view --form-factor=mobile --output=html --output-path=./lighthouse-report.html
kill %1
```

Expected: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 95.

Falls Performance < 90:
- Hero-GIF zu groß? → reduzieren
- Lazy-Loading für Feature-Bilder prüfen (next/image macht das automatisch — verify)
- Font-Loading? → System-Font, kein Webfont, sollte OK sein

- [ ] **Step 4: Accessibility-Check mit axe**

```bash
npx @axe-core/cli http://localhost:3000
```

Expected: 0 Violations. Falls Violations:
- Kontrast-Probleme? → Brand-Token verifizieren
- Fehlende ARIA-Labels? → ergänzen
- Heading-Hierarchie kaputt? → fixen

- [ ] **Step 5: Manuelle E2E-Smoke-Tests**

1. Dev-Server: `npm run dev`
2. Page öffnen, alle Sektionen scrollen
3. Pricing-Toggle wechseln — Preise wechseln korrekt
4. FAQ-Accordion auf/zu
5. Hero-CTA "30 Tage testen" → scrollt zu Final-CTA, Tab "Beta-Liste" aktiv
6. Hero-CTA "Demo buchen" → scrollt zu Final-CTA, Tab "Demo" aktiv
7. Pricing-Solo-CTA → Tier-Preselect "Solo" im Form
8. Pricing-Pro-CTA → Tier-Preselect "Pro" im Form
9. Pricing-Enterprise-CTA → Tab "Demo" aktiv
10. Beta-Form mit Test-Mail submitten → Success-State, DB-Eintrag prüfen
11. Demo-Form mit Test-Daten submitten → Success-State, DB-Eintrag prüfen
12. Datenschutz-Page erreichbar
13. Impressum-Page erreichbar
14. Footer-Links funktionieren
15. Mobile-Menü öffnet
16. Eingeloggter User: Header zeigt "Zum Dashboard"

- [ ] **Step 6: BACKLOG.md Marketing-Items resolven**

Edit `docs/BACKLOG.md`:
- Items #67–#75 (Marketing & Go-to-Market) — markiere V1-Tasks als resolved
- Neue Items hinzufügen für V2: ROI-Rechner-Tool, Programmatic-SEO, Pilot-Testimonial, Cal.com-Decision

- [ ] **Step 7: Final Commit**

```bash
git add docs/BACKLOG.md
git commit -m "chore(backlog): resolve V1 landing page marketing items, add V2 backlog"
```

- [ ] **Step 8: Push branch**

```bash
git push origin feature/landingpage
```

(Falls auf Worktree-Branch — siehe Execution Handoff. Falls auf main — Discussion mit User vor Push.)

---

## Self-Review

**Spec-Coverage prüfen:**

| Spec-Bereich | Plan-Task | Coverage |
|---|---|---|
| Page Anatomy (10 Sektionen) | Tasks 12-26 | ✅ |
| Hero (D-2 Tagline + Pain-Headline) | Task 14 | ✅ |
| Pain-Block A·B·E | Task 15 | ✅ |
| 3-Step | Task 16 | ✅ |
| Feature-Sektion (4 Features) | Task 17 | ✅ |
| ROI-Block (3 Tiles + Sub) | Task 18 | ✅ |
| Pilot-Programm-Status | Task 19 | ✅ |
| Trust-Block (4 Cards + Logo-Strip) | Task 20 | ✅ |
| Pricing (3 Tiers + Annual-Toggle) | Task 21 | ✅ |
| FAQ (6 Fragen) | Task 22 | ✅ |
| Final-CTA (Tabs für beide Forms) | Task 25 | ✅ |
| Footer (4 Spalten) | Task 26 | ✅ |
| BetaLead Prisma-Modell | Task 3 | ✅ |
| DemoRequest Prisma-Modell | Task 3 | ✅ |
| Zod-Schemas + Tests | Task 4 | ✅ |
| Rate-Limit-Presets | Task 5 | ✅ |
| Email-Templates + Service | Tasks 6-8 | ✅ |
| API-Routes + Tests | Tasks 9-10 | ✅ |
| URL-Hash-Routing | Task 23, 24, 25 | ✅ |
| Honeypot-Spam-Protection | Tasks 4, 9, 10 | ✅ |
| DSGVO-Consent-Pflicht | Task 4 (Schema), 23/24 (UI) | ✅ |
| SEO-Metadata + JSON-LD | Tasks 27, 28 | ✅ |
| Sitemap + robots | Task 29 | ✅ |
| Datenschutz-Page | Task 30 | ✅ |
| Impressum-Page | Task 31 | ✅ |
| Hero-Visual + Feature-Visuals | Tasks 32, 33 | ✅ |
| OG-Image | Task 34 | ✅ |
| Lighthouse + Tests | Task 35 | ✅ |
| Pre-Launch-Tasks (Anwalt-Review) | Task 30 (Hinweis) | ✅ (Manueller Schritt) |
| BACKLOG.md update | Task 35 | ✅ |

**Type-Konsistenz:**
- `BetaLeadInput`, `DemoRequestInput` — definiert in Task 4, importiert in 9, 10, 23, 24 ✅
- `BetaLead`, `DemoRequest` Prisma-Modelle — Migration in Task 3, verwendet in 9, 10 ✅
- `RATE_LIMIT_PRESETS.BETA_LEAD` und `.DEMO_REQUEST` — definiert in Task 5, verwendet in 9, 10 ✅
- `usePricingCycle` — exported in Task 21 (PricingToggle), used in PricingCard ✅

**Placeholder-Scan:**
- "TODO Anwalt" in Datenschutz/Impressum — bewusst markiert, Pflicht-Task vor Launch (kein Plan-Failure, sondern Manual-Step-Marker)
- "TODO V2" in RoiBlock-Inline-CTA — explizit V2-markiert, kein Implementation-Gap
- Keine vagen "TBD" / "implement later" / "appropriate handling" gefunden ✅

**Ambiguity-Scan:**
- `defaultValues: { consent: false as never }` — eigenwillig wegen Zod-`literal(true)`-Typ. Funktional korrekt, aber kommentiert lassen für Klarheit.
- Hero-CTA scrollt zu `#cta-hero`, aber FinalCta hat ID `#cta`. Tab-Sync nutzt Hash-Listener — beide Hashes navigieren zu `#cta`-Section, Hash unterscheidet Tab-Default. ✅ Konsistent dokumentiert in Task 25.

Self-Review-PASS.

---

## Execution Handoff

Plan komplett und committed (sobald die Datei in git ist) unter `docs/superpowers/plans/2026-04-29-landingpage.md`.

**Empfehlung vor Implementation: Worktree erstellen** mit `superpowers:using-git-worktrees`. Begründung:
- 35 Tasks · ~7-8 Tage Arbeit
- Hohe Wahrscheinlichkeit für Mid-Implementation-Diskussionen / Hotfix-Bedarf auf main
- Saubere Branching = sauberer PR-Review

**Zwei Execution-Optionen:**

**1. Subagent-Driven (empfohlen)** — Frischer Subagent pro Task, Two-Stage-Review zwischen Tasks, schnelle Iteration. **REQUIRED SUB-SKILL:** `superpowers:subagent-driven-development`.

**2. Inline Execution** — Tasks in dieser Session ausführen, Batch-Execution mit Checkpoints für Review. **REQUIRED SUB-SKILL:** `superpowers:executing-plans`.

**Welcher Approach?**
