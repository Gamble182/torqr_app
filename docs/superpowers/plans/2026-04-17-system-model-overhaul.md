# System Model Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-customer `Heater` model with a global `SystemCatalog` + per-instance `CustomerSystem`, extending coverage from heating-only to four system types (Heizung, Klimaanlage, Wasseraufbereitung, Energiespeicher).

**Architecture:** A shared `SystemCatalog` table holds manufacturer/model definitions (no userId — platform-global, authenticated users may add entries). `CustomerSystem` is the per-installation record tied to both a catalog entry and a customer. The existing `Maintenance` model re-points from `heaterId` to `systemId`. All old `Heater` code is deleted, not migrated — the DB contains only test/mock data.

**Tech Stack:** Next.js 14 App Router, Prisma 7, PostgreSQL (Supabase), TanStack Query v5, Zod v4, Vitest, TypeScript strict, Tailwind + shadcn/ui, Resend email

---

## File Map

**Create:**
- `prisma/seed.ts`
- `src/app/api/catalog/route.ts`
- `src/app/api/customer-systems/route.ts`
- `src/app/api/customer-systems/[id]/route.ts`
- `src/hooks/useCatalog.ts`
- `src/hooks/useCustomerSystems.ts`
- `src/components/system-form/SystemTypeSelector.tsx`
- `src/components/system-form/CatalogPicker.tsx`
- `src/components/system-form/SystemAssignmentModal.tsx`
- `src/app/dashboard/systems/page.tsx`
- `src/app/dashboard/systems/[id]/page.tsx`
- `src/lib/__tests__/system-schemas.test.ts`

**Modify:**
- `prisma/schema.prisma`
- `package.json` (add prisma.seed)
- `src/lib/validations.ts`
- `src/app/api/maintenances/route.ts`
- `src/app/api/maintenances/[id]/route.ts`
- `src/lib/email/service.tsx`
- `src/app/api/cron/daily-reminders/route.ts`
- `src/app/api/dashboard/stats/route.ts`
- `src/app/api/customers/[id]/send-reminder/route.ts`
- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/components/MaintenanceFormModal.tsx`
- `src/components/DashboardNav.tsx`
- `src/app/dashboard/customers/[id]/page.tsx`
- `src/app/dashboard/customers/new/page.tsx`
- `src/app/dashboard/customers/[id]/edit/page.tsx`

**Delete:**
- `src/app/api/heaters/route.ts`
- `src/app/api/heaters/[id]/route.ts`
- `src/app/dashboard/heaters/` (entire folder)
- `src/components/HeaterFormModal.tsx`
- `src/components/heater-form/` (entire folder)
- `src/hooks/useHeaters.ts`

---

### Task 1: Prisma Schema Overhaul

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `package.json`

- [ ] **Step 1: Replace schema.prisma with the new model**

Replace the entire contents of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  passwordHash       String
  name               String
  phone              String?
  companyName        String?
  emailWeeklySummary Boolean   @default(true)
  emailVerified      DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  customers      Customer[]
  customerSystems CustomerSystem[]
  maintenances   Maintenance[]
  sessions       Session[]
  bookings       Booking[]

  @@map("users")
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("sessions")
}

// ============================================================================
// CUSTOMERS
// ============================================================================

model Customer {
  id                String           @id @default(uuid())
  name              String
  street            String
  zipCode           String
  city              String
  phone             String
  email             String?
  emailOptIn        EmailOptInStatus @default(NONE)
  optInToken        String?          @unique
  optInTokenExpires DateTime?
  optInConfirmedAt  DateTime?
  optInIpAddress    String?
  unsubscribedAt    DateTime?
  notes             String?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  userId          String
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  customerSystems CustomerSystem[]
  emailLogs       EmailLog[]
  bookings        Booking[]

  @@index([userId])
  @@index([email])
  @@index([emailOptIn])
  @@map("customers")
}

enum EmailOptInStatus {
  NONE
  PENDING
  CONFIRMED
  UNSUBSCRIBED
}

// ============================================================================
// SYSTEM CATALOG (global, shared across all users)
// ============================================================================

enum SystemType {
  HEATING
  AC
  WATER_TREATMENT
  ENERGY_STORAGE
}

enum AcSubtype {
  SINGLE_SPLIT
  MULTI_SPLIT_2
  MULTI_SPLIT_3
  MULTI_SPLIT_4
  MULTI_SPLIT_5
}

enum StorageSubtype {
  BOILER
  BUFFER_TANK
}

model SystemCatalog {
  id               String          @id @default(uuid())
  systemType       SystemType
  manufacturer     String
  name             String
  acSubtype        AcSubtype?
  storageSubtype   StorageSubtype?
  createdByUserId  String?
  createdAt        DateTime        @default(now())

  customerSystems CustomerSystem[]

  @@unique([systemType, manufacturer, name])
  @@index([systemType])
  @@index([manufacturer])
  @@map("system_catalog")
}

// ============================================================================
// CUSTOMER SYSTEMS (per-installation instances)
// ============================================================================

model CustomerSystem {
  id                    String    @id @default(uuid())
  serialNumber          String?
  installationDate      DateTime?
  maintenanceInterval   Int
  lastMaintenance       DateTime?
  nextMaintenance       DateTime?
  storageCapacityLiters Int?
  requiredParts         String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  catalogId  String
  catalog    SystemCatalog @relation(fields: [catalogId], references: [id])
  customerId String
  customer   Customer      @relation(fields: [customerId], references: [id], onDelete: Cascade)
  userId     String
  user       User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  maintenances Maintenance[]

  @@index([userId])
  @@index([customerId])
  @@index([catalogId])
  @@index([nextMaintenance])
  @@map("customer_systems")
}

// ============================================================================
// MAINTENANCE TRACKING
// ============================================================================

model Maintenance {
  id        String    @id @default(uuid())
  date      DateTime  @default(now())
  notes     String?
  photos    String[]  @default([])
  syncedAt  DateTime?
  createdAt DateTime  @default(now())

  systemId String
  system   CustomerSystem @relation(fields: [systemId], references: [id], onDelete: Cascade)
  userId   String
  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([systemId])
  @@index([userId])
  @@index([date])
  @@map("maintenances")
}

// ============================================================================
// EMAIL AUTOMATION
// ============================================================================

model EmailLog {
  id         String    @id @default(uuid())
  customerId String
  type       EmailType
  sentAt     DateTime  @default(now())
  opened     Boolean   @default(false)
  openedAt   DateTime?
  clicked    Boolean   @default(false)
  clickedAt  DateTime?
  resendId   String?
  error      String?

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([customerId])
  @@index([type])
  @@index([sentAt])
  @@map("email_logs")
}

enum EmailType {
  OPT_IN_CONFIRMATION
  REMINDER_4_WEEKS
  REMINDER_1_WEEK
  WEEKLY_SUMMARY
}

// ============================================================================
// CRON JOB TRACKING
// ============================================================================

model CronRun {
  id          String     @id @default(uuid())
  jobType     String
  startedAt   DateTime   @default(now())
  completedAt DateTime?
  status      CronStatus @default(RUNNING)
  emailsSent  Int        @default(0)
  errors      String?

  @@index([jobType])
  @@index([startedAt])
  @@map("cron_runs")
}

enum CronStatus {
  RUNNING
  SUCCESS
  FAILED
}

// ============================================================================
// LOGIN ACTIVITY LOG
// ============================================================================

model LoginLog {
  id        String   @id @default(uuid())
  email     String
  userId    String?
  success   Boolean
  reason    String?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([email])
  @@index([userId])
  @@index([createdAt])
  @@map("login_logs")
}

// ============================================================================
// CAL.COM BOOKINGS
// ============================================================================

model Booking {
  id            String        @id @default(uuid())
  calBookingUid String        @unique
  triggerEvent  String
  startTime     DateTime
  endTime       DateTime?
  title         String?
  attendeeName  String?
  attendeeEmail String?
  status        BookingStatus @default(CONFIRMED)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([customerId])
  @@index([startTime])
  @@map("bookings")
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  RESCHEDULED
}
```

- [ ] **Step 2: Add prisma seed config to package.json**

In `package.json`, add a top-level `"prisma"` key (currently `null`):

```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
},
```

- [ ] **Step 3: Reset the database and generate client**

```bash
npx prisma migrate reset --force
npx prisma generate
```

Expected: "Database reset successful" + client generated with new models.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma package.json
git commit -m "feat(schema): replace Heater with SystemCatalog + CustomerSystem"
```

---

### Task 2: Catalog Seed Data

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create seed.ts**

```typescript
import { PrismaClient, SystemType } from '@prisma/client';
import heatingSystemsData from '../src/config/heating-systems.json';

const prisma = new PrismaClient();

interface ManufacturerEntry {
  manufacturer: string;
  models: string[];
}

interface CategoryEntry {
  category: string;
  manufacturers: ManufacturerEntry[];
}

interface HeatingSystemsData {
  heating_categories: CategoryEntry[];
}

async function main() {
  const data = heatingSystemsData as HeatingSystemsData;
  let count = 0;

  for (const category of data.heating_categories) {
    for (const mfr of category.manufacturers) {
      for (const model of mfr.models) {
        await prisma.systemCatalog.upsert({
          where: {
            systemType_manufacturer_name: {
              systemType: SystemType.HEATING,
              manufacturer: mfr.manufacturer,
              name: model,
            },
          },
          update: {},
          create: {
            systemType: SystemType.HEATING,
            manufacturer: mfr.manufacturer,
            name: model,
            createdByUserId: null,
          },
        });
        count++;
      }
    }
  }

  console.log(`Seeded ${count} heating system catalog entries.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed**

```bash
npx prisma db seed
```

Expected: "Seeded N heating system catalog entries."

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): seed SystemCatalog with heating systems from config"
```

---

### Task 3: Validation Schemas + Vitest Tests

**Files:**
- Modify: `src/lib/validations.ts`
- Create: `src/lib/__tests__/system-schemas.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/system-schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { catalogCreateSchema, customerSystemCreateSchema, maintenanceCreateSchema } from '../validations';

describe('catalogCreateSchema', () => {
  it('accepts a valid HEATING entry', () => {
    const result = catalogCreateSchema.safeParse({
      systemType: 'HEATING',
      manufacturer: 'Vaillant',
      name: 'ecoTEC plus',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid AC entry with acSubtype', () => {
    const result = catalogCreateSchema.safeParse({
      systemType: 'AC',
      manufacturer: 'Daikin',
      name: 'Perfera 2.5kW',
      acSubtype: 'SINGLE_SPLIT',
    });
    expect(result.success).toBe(true);
  });

  it('rejects AC entry without acSubtype', () => {
    const result = catalogCreateSchema.safeParse({
      systemType: 'AC',
      manufacturer: 'Daikin',
      name: 'Perfera 2.5kW',
    });
    expect(result.success).toBe(false);
  });

  it('accepts WATER_TREATMENT without acSubtype', () => {
    const result = catalogCreateSchema.safeParse({
      systemType: 'WATER_TREATMENT',
      manufacturer: 'BWT',
      name: 'Perla Silk M',
    });
    expect(result.success).toBe(true);
  });
});

describe('customerSystemCreateSchema', () => {
  it('accepts valid minimal input', () => {
    const result = customerSystemCreateSchema.safeParse({
      catalogId: '123e4567-e89b-12d3-a456-426614174000',
      customerId: '123e4567-e89b-12d3-a456-426614174001',
      maintenanceInterval: '12',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing catalogId', () => {
    const result = customerSystemCreateSchema.safeParse({
      customerId: '123e4567-e89b-12d3-a456-426614174001',
      maintenanceInterval: '12',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid maintenanceInterval', () => {
    const result = customerSystemCreateSchema.safeParse({
      catalogId: '123e4567-e89b-12d3-a456-426614174000',
      customerId: '123e4567-e89b-12d3-a456-426614174001',
      maintenanceInterval: '7',
    });
    expect(result.success).toBe(false);
  });
});

describe('maintenanceCreateSchema', () => {
  it('uses systemId not heaterId', () => {
    const result = maintenanceCreateSchema.safeParse({
      systemId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects heaterId (old field)', () => {
    const result = maintenanceCreateSchema.safeParse({
      heaterId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/lib/__tests__/system-schemas.test.ts
```

Expected: FAIL (schemas not yet updated)

- [ ] **Step 3: Update validations.ts**

Replace the CUSTOMER SCHEMAS section, HEATER SCHEMAS section, HEATING SYSTEMS SCHEMAS section, and MAINTENANCE SCHEMAS section. The full updated file from the top of the heater schemas down:

Remove the following exports entirely:
- `HeatingTypeEnum` (local const)
- `AdditionalEnergySourceEnum` (local const)
- `EnergyStorageSystemEnum` (local const)
- `heaterCreateSchema`
- `heaterUpdateSchema`
- `addCategorySchema`
- `addManufacturerSchema`
- `addModelSchema`

In `customerCreateSchema`, remove `heatingType`, `additionalEnergySources`, `energyStorageSystems` fields.

Add after the customer schemas section:

```typescript
// ============================================================================
// SYSTEM CATALOG SCHEMAS
// ============================================================================

const SystemTypeEnum = z.enum(['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE']);
const AcSubtypeEnum = z.enum(['SINGLE_SPLIT', 'MULTI_SPLIT_2', 'MULTI_SPLIT_3', 'MULTI_SPLIT_4', 'MULTI_SPLIT_5']);
const StorageSubtypeEnum = z.enum(['BOILER', 'BUFFER_TANK']);

export const catalogCreateSchema = z
  .object({
    systemType: SystemTypeEnum,
    manufacturer: z.string().min(1, 'Hersteller ist erforderlich').max(100),
    name: z.string().min(1, 'Name ist erforderlich').max(100),
    acSubtype: AcSubtypeEnum.optional(),
    storageSubtype: StorageSubtypeEnum.optional(),
  })
  .refine(
    (data) => data.systemType !== 'AC' || data.acSubtype !== undefined,
    { message: 'AC-Subtyp ist für Klimaanlagen erforderlich', path: ['acSubtype'] }
  );

// ============================================================================
// CUSTOMER SYSTEM SCHEMAS
// ============================================================================

export const customerSystemCreateSchema = z.object({
  catalogId: uuidSchema,
  customerId: uuidSchema,
  serialNumber: z.string().max(100).optional().nullable(),
  installationDate: z.string().datetime().optional().nullable(),
  maintenanceInterval: z.enum(['1', '3', '6', '12', '24'], {
    message: 'Wartungsintervall muss 1, 3, 6, 12 oder 24 Monate sein',
  }),
  lastMaintenance: z.string().datetime().optional().nullable(),
  storageCapacityLiters: z.number().int().positive().optional().nullable(),
  requiredParts: z.string().optional().nullable(),
});

export const customerSystemUpdateSchema = z.object({
  catalogId: uuidSchema.optional(),
  customerId: uuidSchema.optional(),
  serialNumber: z.string().max(100).optional().nullable(),
  installationDate: z.string().datetime().optional().nullable(),
  maintenanceInterval: z
    .enum(['1', '3', '6', '12', '24'], {
      message: 'Wartungsintervall muss 1, 3, 6, 12 oder 24 Monate sein',
    })
    .optional(),
  lastMaintenance: z.string().datetime().optional().nullable(),
  storageCapacityLiters: z.number().int().positive().optional().nullable(),
  requiredParts: z.string().optional().nullable(),
});
```

Replace `maintenanceCreateSchema` with:

```typescript
export const maintenanceCreateSchema = z.object({
  systemId: uuidSchema,
  date: dateStringSchema.optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  photos: z.array(z.string().url('Invalid photo URL')).max(10, 'Maximum 10 photos allowed').optional(),
});
```

Update `customerCreateSchema` — remove the three fields:

```typescript
export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  street: z.string().min(1, 'Straße ist erforderlich').max(100, 'Straße zu lang'),
  zipCode: z.string().min(4, 'PLZ muss mindestens 4 Zeichen haben').max(10, 'PLZ zu lang'),
  city: z.string().min(1, 'Stadt ist erforderlich').max(100, 'Stadt zu lang'),
  phone: z.string().min(1, 'Telefon ist erforderlich').max(20, 'Telefon zu lang'),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  suppressEmail: z.boolean().optional().default(false),
  notes: z.string().max(1000, 'Notizen zu lang').optional(),
});
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/lib/__tests__/system-schemas.test.ts
```

Expected: All 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations.ts src/lib/__tests__/system-schemas.test.ts
git commit -m "feat(validation): replace heater schemas with catalog + customerSystem schemas"
```

---

### Task 4: Catalog API Route

**Files:**
- Create: `src/app/api/catalog/route.ts`

- [ ] **Step 1: Create the catalog route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { catalogCreateSchema } from '@/lib/validations';
import { SystemType } from '@prisma/client';

/**
 * GET /api/catalog?systemType=HEATING
 * Returns all catalog entries, optionally filtered by systemType.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const systemType = request.nextUrl.searchParams.get('systemType') as SystemType | null;

    const entries = await prisma.systemCatalog.findMany({
      where: systemType ? { systemType } : undefined,
      orderBy: [{ manufacturer: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching catalog:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden des Katalogs' }, { status: 500 });
  }
}

/**
 * POST /api/catalog
 * Create a new catalog entry (contributed by authenticated user).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    const validated = catalogCreateSchema.parse(body);

    const entry = await prisma.systemCatalog.create({
      data: {
        systemType: validated.systemType as SystemType,
        manufacturer: validated.manufacturer,
        name: validated.name,
        acSubtype: validated.acSubtype ?? null,
        storageSubtype: validated.storageSubtype ?? null,
        createdByUserId: userId,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    // Unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ success: false, error: 'Dieser Eintrag existiert bereits im Katalog' }, { status: 409 });
    }
    console.error('Error creating catalog entry:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Erstellen des Katalogeintrags' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/catalog/route.ts
git commit -m "feat(api): add GET/POST /api/catalog"
```

---

### Task 5: Customer Systems API Routes

**Files:**
- Create: `src/app/api/customer-systems/route.ts`
- Create: `src/app/api/customer-systems/[id]/route.ts`

- [ ] **Step 1: Create customer-systems/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { customerSystemCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * GET /api/customer-systems?customerId=xxx&search=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search') || '';

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId, userId },
      });
      if (!customer) {
        return NextResponse.json({ success: false, error: 'Kunde nicht gefunden' }, { status: 404 });
      }
    }

    const where: Prisma.CustomerSystemWhereInput = {
      userId,
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { serialNumber: { contains: search, mode: 'insensitive' } },
          { catalog: { name: { contains: search, mode: 'insensitive' } } },
          { catalog: { manufacturer: { contains: search, mode: 'insensitive' } } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { city: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const systems = await prisma.customerSystem.findMany({
      where,
      include: {
        catalog: true,
        customer: {
          select: { id: true, name: true, street: true, city: true, phone: true },
        },
        _count: { select: { maintenances: true } },
        maintenances: customerId
          ? { orderBy: { date: 'desc' }, take: 5 }
          : false,
      },
      orderBy: [{ nextMaintenance: 'asc' }, { customer: { name: 'asc' } }],
    });

    return NextResponse.json({ success: true, data: systems });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching customer systems:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Systeme' }, { status: 500 });
  }
}

/**
 * POST /api/customer-systems
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validated = customerSystemCreateSchema.parse(body);

    // Verify customer belongs to user
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId, userId },
    });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Kunde nicht gefunden' }, { status: 404 });
    }

    // Verify catalog entry exists
    const catalog = await prisma.systemCatalog.findUnique({
      where: { id: validated.catalogId },
    });
    if (!catalog) {
      return NextResponse.json({ success: false, error: 'Katalogeintrag nicht gefunden' }, { status: 404 });
    }

    const interval = parseInt(validated.maintenanceInterval);
    const lastMaintenance = validated.lastMaintenance
      ? new Date(validated.lastMaintenance)
      : new Date();
    const nextMaintenance = new Date(lastMaintenance);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + interval);

    const system = await prisma.customerSystem.create({
      data: {
        catalogId: validated.catalogId,
        customerId: validated.customerId,
        userId,
        serialNumber: validated.serialNumber ?? null,
        installationDate: validated.installationDate ? new Date(validated.installationDate) : null,
        maintenanceInterval: interval,
        lastMaintenance,
        nextMaintenance,
        storageCapacityLiters: validated.storageCapacityLiters ?? null,
        requiredParts: validated.requiredParts ?? null,
      },
      include: {
        catalog: true,
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: system }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error creating customer system:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Erstellen des Systems' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create customer-systems/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { customerSystemUpdateSchema } from '@/lib/validations';

/**
 * GET /api/customer-systems/:id
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const system = await prisma.customerSystem.findFirst({
      where: { id, userId },
      include: {
        catalog: true,
        customer: { select: { id: true, name: true, street: true, city: true } },
        maintenances: { orderBy: { date: 'desc' } },
      },
    });

    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: system });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching system:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden des Systems' }, { status: 500 });
  }
}

/**
 * PATCH /api/customer-systems/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const existing = await prisma.customerSystem.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const body = await request.json();
    const validated = customerSystemUpdateSchema.parse(body);

    let nextMaintenance = existing.nextMaintenance;
    if (validated.maintenanceInterval || validated.lastMaintenance) {
      const interval = validated.maintenanceInterval
        ? parseInt(validated.maintenanceInterval)
        : existing.maintenanceInterval;
      const lastMaintenance = validated.lastMaintenance
        ? new Date(validated.lastMaintenance)
        : existing.lastMaintenance ?? new Date();
      nextMaintenance = new Date(lastMaintenance);
      nextMaintenance.setMonth(nextMaintenance.getMonth() + interval);
    }

    const updated = await prisma.customerSystem.update({
      where: { id },
      data: {
        ...(validated.catalogId !== undefined && { catalogId: validated.catalogId }),
        ...(validated.customerId !== undefined && { customerId: validated.customerId }),
        ...(validated.serialNumber !== undefined && { serialNumber: validated.serialNumber }),
        ...(validated.installationDate !== undefined && {
          installationDate: validated.installationDate ? new Date(validated.installationDate) : null,
        }),
        ...(validated.maintenanceInterval && { maintenanceInterval: parseInt(validated.maintenanceInterval) }),
        ...(validated.lastMaintenance !== undefined && {
          lastMaintenance: validated.lastMaintenance ? new Date(validated.lastMaintenance) : null,
        }),
        ...(validated.storageCapacityLiters !== undefined && { storageCapacityLiters: validated.storageCapacityLiters }),
        ...(validated.requiredParts !== undefined && { requiredParts: validated.requiredParts }),
        nextMaintenance,
      },
      include: { catalog: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error updating system:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Aktualisieren des Systems' }, { status: 500 });
  }
}

/**
 * DELETE /api/customer-systems/:id
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;

    const existing = await prisma.customerSystem.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    await prisma.customerSystem.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'System erfolgreich gelöscht' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error deleting system:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Löschen des Systems' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/customer-systems/
git commit -m "feat(api): add customer-systems CRUD routes"
```

---

### Task 6: Update Maintenance Routes + MaintenanceFormModal

**Files:**
- Modify: `src/app/api/maintenances/route.ts`
- Modify: `src/app/api/maintenances/[id]/route.ts`
- Modify: `src/components/MaintenanceFormModal.tsx`

- [ ] **Step 1: Update maintenances/route.ts**

Replace the full file:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { maintenanceCreateSchema } from '@/lib/validations';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * POST /api/maintenances
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const rateLimitResponse = rateLimitByUser(request, userId, RATE_LIMIT_PRESETS.API_USER);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validatedData = maintenanceCreateSchema.parse(body);

    const system = await prisma.customerSystem.findFirst({
      where: { id: validatedData.systemId, userId },
    });

    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const maintenanceDate = validatedData.date ? new Date(validatedData.date) : new Date();
    const nextMaintenance = new Date(maintenanceDate);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + system.maintenanceInterval);

    const result = await prisma.$transaction(async (tx) => {
      const maintenance = await tx.maintenance.create({
        data: {
          systemId: validatedData.systemId,
          userId,
          date: maintenanceDate,
          notes: validatedData.notes || null,
          photos: validatedData.photos || [],
        },
        include: {
          system: {
            include: {
              catalog: true,
              customer: { select: { id: true, name: true } },
            },
          },
        },
      });

      await tx.customerSystem.update({
        where: { id: validatedData.systemId },
        data: { lastMaintenance: maintenanceDate, nextMaintenance },
      });

      return maintenance;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validierungsfehler', details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error creating maintenance:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Erstellen der Wartung' }, { status: 500 });
  }
}

/**
 * GET /api/maintenances?systemId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const systemId = request.nextUrl.searchParams.get('systemId');
    if (!systemId) {
      return NextResponse.json({ success: false, error: 'System-ID fehlt' }, { status: 400 });
    }

    const system = await prisma.customerSystem.findFirst({
      where: { id: systemId, userId },
    });

    if (!system) {
      return NextResponse.json({ success: false, error: 'System nicht gefunden' }, { status: 404 });
    }

    const maintenances = await prisma.maintenance.findMany({
      where: { systemId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: maintenances });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nicht autorisiert' }, { status: 401 });
    }
    console.error('Error fetching maintenances:', error);
    return NextResponse.json({ success: false, error: 'Fehler beim Laden der Wartungen' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update maintenances/[id]/route.ts**

Replace every occurrence of `heater` with `system` in the ownership checks and includes. The three ownership checks change from:

```typescript
// OLD
where: {
  id,
  heater: {
    customer: { userId },
  },
},
```

to:

```typescript
// NEW
where: {
  id,
  system: { userId },
},
```

The `include` in GET changes from:
```typescript
include: {
  heater: {
    include: {
      customer: { select: { id: true, name: true, street: true, city: true } },
    },
  },
},
```
to:
```typescript
include: {
  system: {
    include: {
      catalog: true,
      customer: { select: { id: true, name: true, street: true, city: true } },
    },
  },
},
```

The PATCH `include` block changes similarly — `heater` → `system` with `catalog: true` added.

- [ ] **Step 3: Update MaintenanceFormModal.tsx**

In `src/components/MaintenanceFormModal.tsx`, make three changes:

1. Rename prop `heaterId: string` → `systemId: string`
2. Rename prop `heaterModel: string` → `systemLabel: string`
3. In the fetch body, replace `heaterId: heaterId` → `systemId: systemId`
4. In the modal title, replace references to `heaterModel` → `systemLabel`

The interface becomes:
```typescript
interface MaintenanceFormModalProps {
  systemId: string;
  systemLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/maintenances/ src/components/MaintenanceFormModal.tsx
git commit -m "feat(maintenance): re-point from heaterId to systemId"
```

---

### Task 7: Update Email Service

**Files:**
- Modify: `src/lib/email/service.tsx`

- [ ] **Step 1: Replace sendReminder in service.tsx**

Replace the `sendReminder` function (lines 16–90):

```typescript
export async function sendReminder(
  systemId: string,
  type: ReminderType
): Promise<void> {
  const system = await prisma.customerSystem.findUnique({
    where: { id: systemId },
    include: {
      catalog: true,
      customer: true,
      user: { select: { name: true, email: true, phone: true, companyName: true } },
    },
  });

  if (!system?.customer?.email) {
    throw new Error(`System ${systemId}: no customer or no email`);
  }

  const { catalog, customer, user } = system;
  const weeksUntil = type === 'REMINDER_4_WEEKS' ? 4 : 1;
  const maintenanceDate = system.nextMaintenance
    ? format(system.nextMaintenance, 'dd.MM.yyyy', { locale: de })
    : 'Unbekannt';

  const html = await render(
    React.createElement(ReminderEmail, {
      customerName: customer.name,
      maintenanceDate,
      heaterManufacturer: catalog.manufacturer,
      heaterModel: catalog.name,
      heaterSerialNumber: system.serialNumber,
      weeksUntil,
      calComUrl: CAL_COM_URL
        ? (() => {
            const url = new URL(CAL_COM_URL);
            url.searchParams.set('metadata[customerId]', customer.id);
            url.searchParams.set('metadata[userId]', system.userId);
            if (customer.name) url.searchParams.set('name', customer.name);
            if (customer.email) url.searchParams.set('email', customer.email as string);
            const address = [customer.street, `${customer.zipCode} ${customer.city}`]
              .filter(Boolean).join(', ');
            if (address) url.searchParams.set('location', address);
            return url.toString();
          })()
        : CAL_COM_URL,
      maxPhone: user?.phone ?? '',
      maxEmail: user?.email ?? '',
      maxName: user?.name ?? '',
      maxCompanyName: user?.companyName ?? null,
      unsubscribeUrl: buildUnsubscribeUrl(customer.id),
    })
  );

  const systemLabel = [catalog.manufacturer, catalog.name].filter(Boolean).join(' ');
  const weekWord = weeksUntil === 1 ? 'Woche' : 'Wochen';

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: customer.email as string,
    subject: `Wartungserinnerung – Ihre Anlage: Termin in ${weeksUntil} ${weekWord}`,
    html,
  });

  await prisma.emailLog.create({
    data: {
      customerId: customer.id,
      type,
      resendId: data?.id ?? null,
      error: error ? JSON.stringify(error) : null,
    },
  });

  if (error) {
    throw new Error(`Resend error for system ${systemId}: ${JSON.stringify(error)}`);
  }
}
```

- [ ] **Step 2: Replace sendWeeklySummary queries in service.tsx**

Replace the three parallel queries (lines 119–133) from using `prisma.heater` to using `prisma.customerSystem`:

```typescript
const [upcomingSystems, overdueSystems, completedMaintenances] = await Promise.all([
  prisma.customerSystem.findMany({
    where: { userId: user.id, nextMaintenance: { gte: now, lte: weekEnd } },
    include: { catalog: true, customer: { select: { name: true } } },
    orderBy: { nextMaintenance: 'asc' },
  }),
  prisma.customerSystem.findMany({
    where: { userId: user.id, nextMaintenance: { lt: now } },
    include: { catalog: true, customer: { select: { name: true } } },
    orderBy: { nextMaintenance: 'asc' },
  }),
  prisma.maintenance.findMany({
    where: { userId: user.id, date: { gte: weekAgo, lte: now } },
  }),
]);
```

Update the mapping below those queries:

```typescript
upcomingList: upcomingSystems.map((s) => ({
  customerName: s.customer?.name ?? 'Unbekannt',
  date: s.nextMaintenance ? format(s.nextMaintenance, 'dd.MM.yyyy') : '–',
  heaterInfo: [s.catalog.manufacturer, s.catalog.name].filter(Boolean).join(' '),
})),
overdueList: overdueSystems.map((s) => ({
  customerName: s.customer?.name ?? 'Unbekannt',
  daysOverdue: s.nextMaintenance ? differenceInDays(now, s.nextMaintenance) : 0,
  heaterInfo: [s.catalog.manufacturer, s.catalog.name].filter(Boolean).join(' '),
})),
```

Also update counts:
```typescript
upcomingCount: upcomingSystems.length,
overdueCount: overdueSystems.length,
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/service.tsx
git commit -m "feat(email): re-point service from Heater to CustomerSystem"
```

---

### Task 8: Update Cron + Stats + Send-Reminder + Admin Routes

**Files:**
- Modify: `src/app/api/cron/daily-reminders/route.ts`
- Modify: `src/app/api/dashboard/stats/route.ts`
- Modify: `src/app/api/customers/[id]/send-reminder/route.ts`
- Modify: `src/app/api/admin/stats/route.ts`
- Modify: `src/app/api/admin/users/[id]/route.ts`

- [ ] **Step 1: Update daily-reminders cron**

Replace `getEligibleHeaterIds` with `getEligibleSystemIds`:

```typescript
async function getEligibleSystemIds(type: ReminderType): Promise<string[]> {
  const now = new Date();
  const targetDays = type === 'REMINDER_4_WEEKS' ? 28 : 7;
  const windowStart = addDays(now, targetDays - 1);
  const windowEnd = addDays(now, targetDays + 1);
  const dedupeFrom = addDays(now, -30);

  const systems = await prisma.customerSystem.findMany({
    where: {
      nextMaintenance: { gte: windowStart, lte: windowEnd },
      customer: {
        emailOptIn: 'CONFIRMED',
        email: { not: null },
        emailLogs: {
          none: { type, sentAt: { gte: dedupeFrom } },
        },
      },
    },
    select: { id: true },
  });

  return systems.map((s) => s.id);
}
```

In the `GET` handler, replace:
```typescript
const heaterIds = await getEligibleHeaterIds(type);
for (const heaterId of heaterIds) {
  try {
    await sendReminder(heaterId, type);
```
with:
```typescript
const systemIds = await getEligibleSystemIds(type);
for (const systemId of systemIds) {
  try {
    await sendReminder(systemId, type);
```

And the error log:
```typescript
errors.push(`${systemId}: ${msg}`);
console.error(`[daily-reminders] Failed for system ${systemId}:`, err);
```

- [ ] **Step 2: Update dashboard/stats route**

Replace all `prisma.heater` references with `prisma.customerSystem`. The ownership filter changes from `customer: { userId }` to direct `userId`:

```typescript
const [
  totalCustomers,
  totalSystems,
  overdueMaintenances,
  upcomingMaintenances,
  upcomingSystemsList,
  recentMaintenances,
] = await Promise.all([
  prisma.customer.count({ where: { userId } }),

  prisma.customerSystem.count({ where: { userId } }),

  prisma.customerSystem.count({
    where: { userId, nextMaintenance: { lt: now } },
  }),

  prisma.customerSystem.count({
    where: { userId, nextMaintenance: { gte: now, lte: futureDate } },
  }),

  prisma.customerSystem.findMany({
    where: { userId, nextMaintenance: { gte: now, lte: futureDate } },
    include: {
      catalog: true,
      customer: { select: { id: true, name: true, city: true, phone: true } },
    },
    orderBy: { nextMaintenance: 'asc' },
    take: 10,
  }),

  prisma.maintenance.findMany({
    where: { user: { id: userId } },
    include: {
      system: {
        include: {
          catalog: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 5,
  }),
]);
```

Update the response:
```typescript
return NextResponse.json({
  success: true,
  data: {
    totalCustomers,
    totalSystems,
    overdueMaintenances,
    upcomingMaintenances,
    upcomingSystemsList,
    recentMaintenances,
  },
});
```

- [ ] **Step 3: Update send-reminder route**

In `src/app/api/customers/[id]/send-reminder/route.ts`, replace the body parsing and heater lookup:

```typescript
const body = await req.json().catch(() => ({})) as { systemId?: string };
const { systemId } = body;

// ...after customer check...

const system = systemId
  ? await prisma.customerSystem.findFirst({ where: { id: systemId, customerId, userId } })
  : await prisma.customerSystem.findFirst({ where: { customerId, userId }, orderBy: { createdAt: 'asc' } });

if (!system) {
  return NextResponse.json(
    { success: false, error: 'System nicht gefunden' },
    { status: 404 }
  );
}

await sendReminder(system.id, 'REMINDER_1_WEEK');
```

- [ ] **Step 4: Update admin/stats route**

Replace `prisma.heater.count()` with `prisma.customerSystem.count()` and the response key `totalHeaters` → `totalSystems`:

```typescript
const totalSystems = await prisma.customerSystem.count(); // in the Promise.all
// ...
data: {
  totalUsers,
  totalCustomers,
  totalSystems,   // was totalHeaters
  totalMaintenances,
  emailsLast7Days,
  lastCronRuns,
  recentEmailErrors,
  recentCronErrors,
},
```

- [ ] **Step 5: Update admin/users/[id] route**

In the `_count` select, replace `heaters` with `customerSystems`:
```typescript
_count: {
  select: { customers: true, customerSystems: true, maintenances: true, bookings: true },
},
```

In the `customers` select, replace `_count: { select: { heaters: true } }` with:
```typescript
_count: { select: { customerSystems: true } },
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/ src/app/api/dashboard/ src/app/api/customers/[id]/send-reminder/ src/app/api/admin/
git commit -m "feat(api): re-point all heater references to customerSystem"
```

---

### Task 9: New React Query Hooks

**Files:**
- Create: `src/hooks/useCatalog.ts`
- Create: `src/hooks/useCustomerSystems.ts`

- [ ] **Step 1: Create useCatalog.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type SystemType = 'HEATING' | 'AC' | 'WATER_TREATMENT' | 'ENERGY_STORAGE';
export type AcSubtype = 'SINGLE_SPLIT' | 'MULTI_SPLIT_2' | 'MULTI_SPLIT_3' | 'MULTI_SPLIT_4' | 'MULTI_SPLIT_5';
export type StorageSubtype = 'BOILER' | 'BUFFER_TANK';

export interface CatalogEntry {
  id: string;
  systemType: SystemType;
  manufacturer: string;
  name: string;
  acSubtype: AcSubtype | null;
  storageSubtype: StorageSubtype | null;
  createdByUserId: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useCatalog(systemType?: SystemType) {
  return useQuery<CatalogEntry[]>({
    queryKey: ['catalog', systemType],
    queryFn: async () => {
      const url = systemType ? `/api/catalog?systemType=${systemType}` : '/api/catalog';
      const res = await fetch(url);
      const result: ApiResponse<CatalogEntry[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Katalogs');
      }
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateCatalogEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CatalogEntry, 'id' | 'createdByUserId' | 'createdAt'>) => {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<CatalogEntry> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Erstellen des Eintrags');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      toast.success('Katalogeintrag erfolgreich erstellt!');
    },
    onError: (error: Error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });
}
```

- [ ] **Step 2: Create useCustomerSystems.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CatalogEntry } from './useCatalog';

export interface CustomerSystem {
  id: string;
  userId: string;
  customerId: string;
  catalogId: string;
  catalog: CatalogEntry;
  serialNumber: string | null;
  installationDate: string | null;
  maintenanceInterval: number;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  storageCapacityLiters: number | null;
  requiredParts: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    street: string;
    city: string;
    phone: string;
  } | null;
  _count?: { maintenances: number };
  maintenances?: Array<{ id: string; date: string; notes: string | null; photos: string[] }>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useCustomerSystems(params?: { customerId?: string; search?: string }) {
  return useQuery<CustomerSystem[]>({
    queryKey: ['customer-systems', params],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (params?.customerId) sp.set('customerId', params.customerId);
      if (params?.search) sp.set('search', params.search);
      const url = `/api/customer-systems${sp.toString() ? `?${sp}` : ''}`;
      const res = await fetch(url);
      const result: ApiResponse<CustomerSystem[]> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Systeme');
      }
      return result.data;
    },
    staleTime: 30_000,
  });
}

export function useCustomerSystem(systemId: string | null) {
  return useQuery<CustomerSystem>({
    queryKey: ['customer-system', systemId],
    queryFn: async () => {
      if (!systemId) throw new Error('Keine System-ID angegeben');
      const res = await fetch(`/api/customer-systems/${systemId}`);
      const result: ApiResponse<CustomerSystem> = await res.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden des Systems');
      }
      return result.data;
    },
    enabled: !!systemId,
    staleTime: 30_000,
  });
}

export function useCreateCustomerSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CustomerSystem>) => {
      const res = await fetch('/api/customer-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<CustomerSystem> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Erstellen des Systems');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      toast.success('System erfolgreich erstellt!');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}

export function useUpdateCustomerSystem(systemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CustomerSystem>) => {
      const res = await fetch(`/api/customer-systems/${systemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result: ApiResponse<CustomerSystem> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Aktualisieren');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      queryClient.invalidateQueries({ queryKey: ['customer-system', systemId] });
      toast.success('System erfolgreich aktualisiert!');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}

export function useDeleteCustomerSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (systemId: string) => {
      const res = await fetch(`/api/customer-systems/${systemId}`, { method: 'DELETE' });
      const result: ApiResponse<null> = await res.json();
      if (!result.success) throw new Error(result.error || 'Fehler beim Löschen');
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-systems'] });
      toast.success('System erfolgreich gelöscht!');
    },
    onError: (error: Error) => toast.error(`Fehler: ${error.message}`),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCatalog.ts src/hooks/useCustomerSystems.ts
git commit -m "feat(hooks): add useCatalog and useCustomerSystems hooks"
```

---

### Task 10: SystemTypeSelector Component

**Files:**
- Create: `src/components/system-form/SystemTypeSelector.tsx`

- [ ] **Step 1: Create SystemTypeSelector.tsx**

```tsx
import { FlameIcon, WindIcon, DropletIcon, BatteryIcon } from 'lucide-react';
import type { SystemType } from '@/hooks/useCatalog';

const SYSTEM_TYPES: Array<{
  value: SystemType;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  { value: 'HEATING', label: 'Heizung', description: 'Gas, Öl, Wärmepumpe etc.', icon: FlameIcon },
  { value: 'AC', label: 'Klimaanlage', description: 'Split-Geräte, VRF-Systeme', icon: WindIcon },
  { value: 'WATER_TREATMENT', label: 'Wasseraufbereitung', description: 'Filter, Enthärter etc.', icon: DropletIcon },
  { value: 'ENERGY_STORAGE', label: 'Energiespeicher', description: 'Pufferspeicher, Boiler', icon: BatteryIcon },
];

interface SystemTypeSelectorProps {
  value: SystemType | '';
  onChange: (type: SystemType) => void;
}

export function SystemTypeSelector({ value, onChange }: SystemTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SYSTEM_TYPES.map(({ value: type, label, description, icon: Icon }) => {
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
              selected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
              selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className={`text-sm font-medium ${selected ? 'text-foreground' : 'text-foreground'}`}>
                {label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/system-form/SystemTypeSelector.tsx
git commit -m "feat(ui): add SystemTypeSelector component"
```

---

### Task 11: CatalogPicker Component

**Files:**
- Create: `src/components/system-form/CatalogPicker.tsx`

- [ ] **Step 1: Create CatalogPicker.tsx**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { SearchIcon, PlusIcon, Loader2Icon } from 'lucide-react';
import { useCatalog, useCreateCatalogEntry } from '@/hooks/useCatalog';
import type { CatalogEntry, SystemType } from '@/hooks/useCatalog';

interface CatalogPickerProps {
  systemType: SystemType;
  value: string; // catalogId
  onChange: (catalogId: string, entry: CatalogEntry) => void;
}

export function CatalogPicker({ systemType, value, onChange }: CatalogPickerProps) {
  const { data: entries = [], isLoading } = useCatalog(systemType);
  const createEntry = useCreateCatalogEntry();
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newName, setNewName] = useState('');

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.manufacturer.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogEntry[]>();
    for (const entry of filtered) {
      const existing = map.get(entry.manufacturer) ?? [];
      map.set(entry.manufacturer, [...existing, entry]);
    }
    return map;
  }, [filtered]);

  const selected = entries.find((e) => e.id === value);

  const handleAdd = async () => {
    if (!newManufacturer.trim() || !newName.trim()) return;
    const entry = await createEntry.mutateAsync({
      systemType,
      manufacturer: newManufacturer.trim(),
      name: newName.trim(),
      acSubtype: null,
      storageSubtype: null,
    });
    if (entry) {
      onChange(entry.id, entry);
      setShowAddForm(false);
      setNewManufacturer('');
      setNewName('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {selected && (
        <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm">
          <span className="font-medium text-foreground">
            {selected.manufacturer} — {selected.name}
          </span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange('', entries[0])}
          >
            Ändern
          </button>
        </div>
      )}

      {!selected && (
        <>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Hersteller oder Modell suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {grouped.size === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Keine Einträge gefunden
              </p>
            )}
            {Array.from(grouped.entries()).map(([manufacturer, models]) => (
              <div key={manufacturer}>
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/40 uppercase tracking-wide">
                  {manufacturer}
                </p>
                {models.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onChange(entry.id, entry)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    {entry.name}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Neues Gerät zum Katalog hinzufügen
            </button>
          ) : (
            <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/20">
              <input
                type="text"
                placeholder="Hersteller"
                value={newManufacturer}
                onChange={(e) => setNewManufacturer(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              />
              <input
                type="text"
                placeholder="Modellbezeichnung"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={createEntry.isPending}
                  className="flex-1 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createEntry.isPending ? 'Speichern...' : 'Hinzufügen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/system-form/CatalogPicker.tsx
git commit -m "feat(ui): add CatalogPicker component"
```

---

### Task 12: SystemAssignmentModal Component

**Files:**
- Create: `src/components/system-form/SystemAssignmentModal.tsx`

- [ ] **Step 1: Create SystemAssignmentModal.tsx**

```tsx
'use client';

import { useState } from 'react';
import { XIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SystemTypeSelector } from './SystemTypeSelector';
import { CatalogPicker } from './CatalogPicker';
import { useCreateCustomerSystem, useUpdateCustomerSystem } from '@/hooks/useCustomerSystems';
import type { CustomerSystem } from '@/hooks/useCustomerSystems';
import type { CatalogEntry, SystemType } from '@/hooks/useCatalog';

const MAINTENANCE_INTERVALS = [
  { value: '1', label: '1 Monat' },
  { value: '3', label: '3 Monate' },
  { value: '6', label: '6 Monate' },
  { value: '12', label: '12 Monate' },
  { value: '24', label: '24 Monate' },
];

interface SystemAssignmentModalProps {
  customerId: string;
  system?: CustomerSystem | null; // null = create mode
  onClose: () => void;
  onSuccess: () => void;
}

export function SystemAssignmentModal({
  customerId,
  system,
  onClose,
  onSuccess,
}: SystemAssignmentModalProps) {
  const isEdit = !!system;
  const createSystem = useCreateCustomerSystem();
  const updateSystem = useUpdateCustomerSystem(system?.id ?? '');

  const [systemType, setSystemType] = useState<SystemType | ''>(
    (system?.catalog.systemType as SystemType) ?? ''
  );
  const [catalogId, setCatalogId] = useState(system?.catalogId ?? '');
  const [serialNumber, setSerialNumber] = useState(system?.serialNumber ?? '');
  const [installationDate, setInstallationDate] = useState(
    system?.installationDate ? system.installationDate.substring(0, 10) : ''
  );
  const [maintenanceInterval, setMaintenanceInterval] = useState(
    system ? String(system.maintenanceInterval) : '12'
  );
  const [lastMaintenance, setLastMaintenance] = useState(
    system?.lastMaintenance ? system.lastMaintenance.substring(0, 10) : ''
  );

  const handleCatalogChange = (id: string, _entry: CatalogEntry) => {
    setCatalogId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogId) return;

    const payload = {
      catalogId,
      customerId,
      serialNumber: serialNumber || null,
      installationDate: installationDate ? new Date(installationDate).toISOString() : null,
      maintenanceInterval,
      lastMaintenance: lastMaintenance ? new Date(lastMaintenance).toISOString() : null,
    };

    if (isEdit) {
      await updateSystem.mutateAsync(payload);
    } else {
      await createSystem.mutateAsync(payload);
    }
    onSuccess();
    onClose();
  };

  const isPending = createSystem.isPending || updateSystem.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? 'System bearbeiten' : 'System zuweisen'}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* System Type */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>Systemtyp</Label>
              <SystemTypeSelector value={systemType} onChange={setSystemType} />
            </div>
          )}

          {/* Catalog Picker */}
          {(systemType || isEdit) && (
            <div className="space-y-2">
              <Label>Gerät aus Katalog</Label>
              <CatalogPicker
                systemType={(systemType as SystemType) || system!.catalog.systemType as SystemType}
                value={catalogId}
                onChange={handleCatalogChange}
              />
            </div>
          )}

          {/* Instance fields */}
          {catalogId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Seriennummer (optional)</Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="z. B. VSN-2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="installationDate">Installationsdatum (optional)</Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceInterval">Wartungsintervall</Label>
                <select
                  id="maintenanceInterval"
                  value={maintenanceInterval}
                  onChange={(e) => setMaintenanceInterval(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {MAINTENANCE_INTERVALS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastMaintenance">Letzte Wartung (optional)</Label>
                <Input
                  id="lastMaintenance"
                  type="date"
                  value={lastMaintenance}
                  onChange={(e) => setLastMaintenance(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" disabled={!catalogId || isPending} className="flex-1">
              {isPending && <Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? 'Speichern' : 'System zuweisen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/system-form/
git commit -m "feat(ui): add SystemAssignmentModal component"
```

---

### Task 13: DashboardNav + Systems List Page

**Files:**
- Modify: `src/components/DashboardNav.tsx`
- Create: `src/app/dashboard/systems/page.tsx`

- [ ] **Step 1: Update DashboardNav**

In `src/components/DashboardNav.tsx`, update the navigation array (line 21–26):

```typescript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Kunden', href: '/dashboard/customers', icon: UsersIcon },
  { name: 'Systeme', href: '/dashboard/systems', icon: WrenchIcon },
  { name: 'Wartungen', href: '/dashboard/wartungen', icon: WrenchIcon },
];
```

Remove `FlameIcon` from the import (it's no longer used in navigation). The import becomes:

```typescript
import {
  LayoutDashboardIcon,
  UsersIcon,
  WrenchIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
} from 'lucide-react';
```

- [ ] **Step 2: Create /dashboard/systems/page.tsx**

```tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2Icon,
  WrenchIcon,
  SearchIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  ChevronRightIcon,
  FlameIcon,
  WindIcon,
  DropletIcon,
  BatteryIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useCustomerSystems } from '@/hooks/useCustomerSystems';
import type { SystemType } from '@/hooks/useCatalog';

const SYSTEM_TYPE_LABELS: Record<SystemType, string> = {
  HEATING: 'Heizung',
  AC: 'Klimaanlage',
  WATER_TREATMENT: 'Wasseraufbereitung',
  ENERGY_STORAGE: 'Energiespeicher',
};

const SYSTEM_TYPE_ICONS: Record<SystemType, React.ElementType> = {
  HEATING: FlameIcon,
  AC: WindIcon,
  WATER_TREATMENT: DropletIcon,
  ENERGY_STORAGE: BatteryIcon,
};

function getMaintenanceUrgency(dateString: string | null) {
  if (!dateString) return 'none';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'urgent';
  if (diffDays <= 30) return 'soon';
  return 'upcoming';
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const config: Record<string, { label: string; style: string }> = {
    overdue: { label: 'Überfällig', style: 'bg-destructive/10 text-destructive border-destructive/20' },
    urgent: { label: 'Diese Woche', style: 'bg-warning/10 text-warning-foreground border-warning/20' },
    soon: { label: 'Bald fällig', style: 'bg-secondary/10 text-secondary border-secondary/20' },
    upcoming: { label: 'Geplant', style: 'bg-muted text-muted-foreground border-border' },
    none: { label: 'Keine Wartung', style: 'bg-muted text-muted-foreground border-border' },
  };
  const { label, style } = config[urgency];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${style}`}>
      {label}
    </span>
  );
}

export default function SystemsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: systems = [], isLoading, error } = useCustomerSystems({ search: searchQuery });

  const overdueCount = useMemo(
    () => systems.filter((s) => s.nextMaintenance && getMaintenanceUrgency(s.nextMaintenance) === 'overdue').length,
    [systems]
  );
  const totalMaintenances = useMemo(
    () => systems.reduce((sum, s) => sum + (s._count?.maintenances ?? 0), 0),
    [systems]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive font-medium mb-1">Fehler beim Laden der Systeme</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Systeme</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle zu wartenden Systeme Ihrer Kunden
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
              <WrenchIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Systeme gesamt</p>
              <p className="text-xl font-bold text-foreground">{systems.length}</p>
            </div>
          </div>
        </div>

        <div className={`bg-card rounded-xl border p-5 ${overdueCount > 0 ? 'border-destructive/30' : 'border-border'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-destructive/10">
              <CalendarIcon className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Überfällige Wartungen</p>
              <p className={`text-xl font-bold ${overdueCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {overdueCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/10">
              <WrenchIcon className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durchgeführte Wartungen</p>
              <p className="text-xl font-bold text-foreground">{totalMaintenances}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Suche nach Gerät, Hersteller, Kunde oder Ort..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring h-11"
        />
      </div>

      {/* Systems List */}
      <div className="bg-card rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Alle Systeme ({systems.length})</h2>
        </div>
        <div className="p-4">
          {systems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {systems.map((system) => {
                const urgency = getMaintenanceUrgency(system.nextMaintenance);
                const TypeIcon = SYSTEM_TYPE_ICONS[system.catalog.systemType as SystemType];
                return (
                  <Link
                    key={system.id}
                    href={`/dashboard/systems/${system.id}`}
                    className="group block p-4 rounded-xl border border-border hover:shadow-md hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {system.catalog.manufacturer} {system.catalog.name}
                          </h3>
                          {system.serialNumber && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              SN: {system.serialNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {system.nextMaintenance && <UrgencyBadge urgency={urgency} />}
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {system.customer && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-3 w-3" />
                            <span>{system.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon className="h-3 w-3" />
                            <span>{system.customer.city}</span>
                          </div>
                        </>
                      )}
                      {system.nextMaintenance && (
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="h-3 w-3" />
                          <span>
                            Nächste Wartung: {format(new Date(system.nextMaintenance), 'dd. MMM yyyy', { locale: de })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <WrenchIcon className="h-3 w-3" />
                        <span>
                          {system._count?.maintenances ?? 0}{' '}
                          {(system._count?.maintenances ?? 0) === 1 ? 'Wartung' : 'Wartungen'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <WrenchIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Keine Systeme gefunden' : 'Noch keine Systeme vorhanden'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DashboardNav.tsx src/app/dashboard/systems/page.tsx
git commit -m "feat(ui): update nav + add systems list page"
```

---

### Task 14: System Detail Page

**Files:**
- Create: `src/app/dashboard/systems/[id]/page.tsx`

- [ ] **Step 1: Create systems/[id]/page.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Loader2Icon,
  ArrowLeftIcon,
  WrenchIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerSystem, useDeleteCustomerSystem } from '@/hooks/useCustomerSystems';
import { SystemAssignmentModal } from '@/components/system-form/SystemAssignmentModal';
import { MaintenanceFormModal } from '@/components/MaintenanceFormModal';
import { MaintenanceHistory } from '@/components/MaintenanceHistory';

const SYSTEM_TYPE_LABELS: Record<string, string> = {
  HEATING: 'Heizung',
  AC: 'Klimaanlage',
  WATER_TREATMENT: 'Wasseraufbereitung',
  ENERGY_STORAGE: 'Energiespeicher',
};

export default function SystemDetailPage() {
  const params = useParams();
  const systemId = params.id as string;

  const { data: system, isLoading, error, refetch } = useCustomerSystem(systemId);
  const deleteSystem = useDeleteCustomerSystem();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  const handleDelete = async () => {
    if (!confirm('System wirklich löschen? Alle Wartungseinträge werden ebenfalls gelöscht.')) return;
    await deleteSystem.mutateAsync(systemId);
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !system) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">System nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/systems">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {system.catalog.manufacturer} {system.catalog.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {SYSTEM_TYPE_LABELS[system.catalog.systemType] ?? system.catalog.systemType}
            {system.serialNumber && ` · SN: ${system.serialNumber}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
            Bearbeiten
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Löschen
          </Button>
        </div>
      </div>

      {/* Details cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer */}
        {system.customer && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Kunde</h2>
            <Link
              href={`/dashboard/customers/${system.customer.id}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <UserIcon className="h-4 w-4" />
              {system.customer.name}
              <ChevronRightIcon className="h-3 w-3" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="h-4 w-4" />
              {system.customer.street}, {system.customer.city}
            </div>
          </div>
        )}

        {/* Maintenance schedule */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Wartungsplan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Intervall</span>
              <span>{system.maintenanceInterval} Monate</span>
            </div>
            {system.lastMaintenance && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Letzte Wartung</span>
                <span>{format(new Date(system.lastMaintenance), 'dd. MMM yyyy', { locale: de })}</span>
              </div>
            )}
            {system.nextMaintenance && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nächste Wartung</span>
                <span className="font-medium">
                  {format(new Date(system.nextMaintenance), 'dd. MMM yyyy', { locale: de })}
                </span>
              </div>
            )}
            {system.installationDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Installiert am</span>
                <span>{format(new Date(system.installationDate), 'dd. MMM yyyy', { locale: de })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New maintenance button */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-foreground">Wartungshistorie</h2>
        <Button size="sm" onClick={() => setShowMaintenanceForm(true)}>
          <WrenchIcon className="h-4 w-4" />
          Wartung eintragen
        </Button>
      </div>

      {/* Maintenance history */}
      <MaintenanceHistory systemId={systemId} maintenances={system.maintenances ?? []} onRefresh={refetch} />

      {/* Modals */}
      {showEditModal && (
        <SystemAssignmentModal
          customerId={system.customerId}
          system={system}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      {showMaintenanceForm && (
        <MaintenanceFormModal
          systemId={systemId}
          systemLabel={`${system.catalog.manufacturer} ${system.catalog.name}`}
          onClose={() => setShowMaintenanceForm(false)}
          onSuccess={() => { refetch(); setShowMaintenanceForm(false); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/systems/[id]/page.tsx
git commit -m "feat(ui): add system detail page"
```

---

### Task 15: Update Customer Detail Page

**Files:**
- Modify: `src/app/dashboard/customers/[id]/page.tsx`

- [ ] **Step 1: Update imports**

Replace the heater-related imports at the top of the file:

Remove:
```typescript
import { useHeaters, useDeleteHeater } from '@/hooks/useHeaters';
import { HeaterFormModal } from '@/components/HeaterFormModal';
import {
  FlameIcon, BatteryChargingIcon, SunIcon, ZapIcon,
} from 'lucide-react';
```

Add:
```typescript
import { useCustomerSystems, useDeleteCustomerSystem } from '@/hooks/useCustomerSystems';
import { SystemAssignmentModal } from '@/components/system-form/SystemAssignmentModal';
import { WrenchIcon, FlameIcon, WindIcon, DropletIcon, BatteryIcon } from 'lucide-react';
```

Remove the helper functions `getHeatingTypeLabel`, `getHeatingTypeIcon`, `getAdditionalEnergyLabel`, `getEnergyStorageLabel` entirely.

- [ ] **Step 2: Update state and hooks**

Replace:
```typescript
const { data: heaters, refetch: refetchHeaters } = useHeaters({ customerId });
const deleteHeater = useDeleteHeater();
const [showHeaterForm, setShowHeaterForm] = useState(false);
const [editingHeater, setEditingHeater] = useState<Heater | null>(null);
```
With:
```typescript
const { data: systems = [], refetch: refetchSystems } = useCustomerSystems({ customerId });
const deleteSystem = useDeleteCustomerSystem();
const [showSystemForm, setShowSystemForm] = useState(false);
const [editingSystem, setEditingSystem] = useState<CustomerSystem | null>(null);
```

Also update the `Heater` interface reference — import `CustomerSystem` from `@/hooks/useCustomerSystems` instead.

- [ ] **Step 3: Update handleSendReminder**

```typescript
const handleSendReminder = async (systemId: string, systemLabel: string) => {
  if (!customer?.email) {
    toast.error('Dieser Kunde hat keine E-Mail-Adresse hinterlegt');
    return;
  }
  setSendingReminder((prev) => ({ ...prev, [systemId]: true }));
  try {
    const res = await fetch(`/api/customers/${customerId}/send-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemId }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Erinnerung für ${systemLabel} gesendet`);
    } else {
      toast.error(data.error || 'Fehler beim Senden');
    }
  } catch {
    toast.error('Fehler beim Senden der Erinnerung');
  } finally {
    setSendingReminder((prev) => ({ ...prev, [systemId]: false }));
  }
};
```

- [ ] **Step 4: Remove Energiesystem card**

Delete the entire "Energiesystem" card section (the card that showed `heatingType`, `additionalEnergySources`, `energyStorageSystems`).

- [ ] **Step 5: Update the systems section**

Replace the "Heizsysteme" section with a systems section that uses `systems` from `useCustomerSystems`. Update the stat card label from "Heizsysteme" to "Systeme" and use `systems.length`. Replace `heater.model` with `system.catalog.manufacturer + ' ' + system.catalog.name` in the list. Call `deleteSystem.mutateAsync(system.id)` instead of `deleteHeater.mutateAsync(heater.id)`. Call `handleSendReminder(system.id, system.catalog.manufacturer + ' ' + system.catalog.name)`.

Replace the `<HeaterFormModal>` usage with `<SystemAssignmentModal customerId={customerId} system={editingSystem} ...>`.

Replace `MaintenanceFormModal` props: `heaterId={selectedHeater.id} heaterModel={selectedHeater.model}` → `systemId={selectedSystem.id} systemLabel={...}`.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/customers/[id]/page.tsx
git commit -m "feat(ui): update customer detail page for CustomerSystem"
```

---

### Task 16: Update Customer Forms + Delete Old Heater Files

**Files:**
- Modify: `src/app/dashboard/customers/new/page.tsx`
- Modify: `src/app/dashboard/customers/[id]/edit/page.tsx`
- Delete: `src/app/api/heaters/`
- Delete: `src/app/dashboard/heaters/`
- Delete: `src/components/HeaterFormModal.tsx`
- Delete: `src/components/heater-form/`
- Delete: `src/hooks/useHeaters.ts`

- [ ] **Step 1: Update new customer form**

In `src/app/dashboard/customers/new/page.tsx`:

Remove from `FormData` interface: `heatingType`, `additionalEnergySources`, `energyStorageSystems`.

Remove from initial state: `heatingType: '', additionalEnergySources: [], energyStorageSystems: []`.

Remove constants: `HEATING_TYPES`, `ADDITIONAL_ENERGY_SOURCES`, `ENERGY_STORAGE_SYSTEMS`.

Remove imports: `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`, `MultiSelect`.

Remove the three form field sections (heatingType Select + two MultiSelects) from the JSX.

Remove from the submit payload: `heatingType`, `additionalEnergySources`, `energyStorageSystems`.

- [ ] **Step 2: Update edit customer form**

Apply the same removals to `src/app/dashboard/customers/[id]/edit/page.tsx` — same fields, same constants, same JSX sections, same imports.

- [ ] **Step 3: Delete old heater files**

```bash
rm -rf src/app/api/heaters
rm -rf src/app/dashboard/heaters
rm -f src/components/HeaterFormModal.tsx
rm -rf src/components/heater-form
rm -f src/hooks/useHeaters.ts
```

- [ ] **Step 4: Verify build**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If TypeScript reports broken imports (e.g. something still importing from `useHeaters`), fix them now.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(cleanup): remove heater files, update customer forms to drop energy fields"
```

---

## Done

After all 16 tasks, the codebase:
- Has no remaining references to `Heater`, `heatingType`, `additionalEnergySources`, `energyStorageSystems`, or `HeatingType` enum
- Uses `SystemCatalog` + `CustomerSystem` everywhere
- `Maintenance` re-points to `systemId`
- Four system types are supported in catalog, UI, and email
- All old heater routes, hooks, modals, and pages are deleted
