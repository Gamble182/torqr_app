# Technical Architecture - Torqr

**Phase:** Technical Design
**Date:** December 11, 2024
**Agent:** Technical Architecture Agent
**Version:** 1.0

---

## Executive Summary

This document defines the complete technical architecture for Torqr MVP, optimized for mobile-first, offline-capable operation on a bootstrap budget (€0/month hosting MVP phase).

**Key Architecture Decisions:**
- **Monolithic Next.js 14 App** (frontend + API in one deployment)
- **PostgreSQL on Supabase** (free tier, EU data center)
- **PWA with Service Worker** (offline-first capability)
- **Optimistic UI + Background Sync** (smooth offline experience)
- **Serverless deployment on Vercel** (free tier, auto-scaling)

**Performance Targets:**
- <3s initial load (3G mobile)
- <500ms API response (p95)
- 99.5% uptime
- Works 100% offline for core features

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture (C4 Model - Context Diagram)

```
┌────────────────────────────────────────────────────────────────┐
│                     SYSTEM CONTEXT                              │
│                                                                 │
│  ┌──────────┐                                                  │
│  │          │  Uses PWA                                        │
│  │   Max    │  (Phone)                                         │
│  │  (User)  │───────────┐                                      │
│  │          │           │                                      │
│  └──────────┘           │                                      │
│                         ▼                                      │
│           ┌─────────────────────────────┐                     │
│           │         Torqr Platform       │                     │
│           │   (Next.js PWA Application)  │                     │
│           │                              │                     │
│           │  • Customer Management        │                     │
│           │  • Maintenance Tracking       │                     │
│           │  • Email Automation           │                     │
│           └──────────┬──────────────────┘                     │
│                      │                                          │
│         ┌────────────┼──────────────┬──────────────────┐     │
│         │            │              │                  │     │
│         ▼            ▼              ▼                  ▼     │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐      ┌──────────┐ │
│  │Supabase  │ │  Resend   │ │  Vercel  │      │ Customer │ │
│  │          │ │           │ │          │      │          │ │
│  │Database  │ │Email      │ │Cron Jobs │      │(Email)   │ │
│  │+ Storage │ │Delivery   │ │          │      │          │ │
│  └──────────┘ └───────────┘ └──────────┘      └──────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 Container Diagram (Components)

```
┌────────────────────────────────────────────────────────────────┐
│                    TORQR PLATFORM                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              FRONTEND (Next.js Client)                   │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │ │
│  │  │React       │  │Service     │  │Offline Cache   │    │ │
│  │  │Components  │  │Worker      │  │(IndexedDB)     │    │ │
│  │  └────────────┘  └────────────┘  └────────────────┘    │ │
│  └────────────────────┬────────────────────────────────────┘ │
│                       │ HTTPS / REST                          │
│  ┌────────────────────▼────────────────────────────────────┐ │
│  │              BACKEND (Next.js API Routes)                │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │ │
│  │  │Auth        │  │Business    │  │Email           │    │ │
│  │  │Middleware  │  │Logic       │  │Service         │    │ │
│  │  └────────────┘  └────────────┘  └────────────────┘    │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │ │
│  │  │Data        │  │File        │  │Cron Jobs       │    │ │
│  │  │Access(Pris │  │Upload      │  │(Reminders)     │    │ │
│  │  └────────────┘  └────────────┘  └────────────────┘    │ │
│  └─────────────┬──────────┬──────────┬────────────────────┘ │
│                │          │          │                       │
│         ┌──────▼─┐   ┌───▼────┐  ┌──▼────┐                 │
│         │Supabase│   │Supabase│  │Resend │                 │
│         │Database│   │Storage │  │Email  │                 │
│         └────────┘   └────────┘  └───────┘                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend Stack

**Core Framework:**
- **Next.js 14.0+** (App Router)
  - Rationale: SSR + API routes in one, excellent DX, Vercel optimized
  - Features used: App Router, Server Components, API Routes, Image Optimization

**Language:**
- **TypeScript 5.3+**
  - Rationale: Type safety reduces bugs, excellent IDE support
  - Configuration: Strict mode enabled

**UI & Styling:**
- **React 18.2+**
  - Features: Server Components, Suspense, useTransition
- **Tailwind CSS 3.4+**
  - Rationale: Utility-first, mobile-first by default, excellent DX
  - Plugins: @tailwindcss/forms, @tailwindcss/typography
- **shadcn/ui**
  - Rationale: Copy-paste components (no npm package bloat), accessible, customizable
  - Components: Button, Form, Dialog, Card, Input, Select, etc.

**State Management:**
- **React Context**
  - For global state (user auth, theme)
- **Zustand** (if needed for complex state)
  - Rationale: Lightweight, simple API, good TypeScript support
  - Usage: Offline queue management, sync state

**Forms & Validation:**
- **React Hook Form 7.x**
  - Rationale: Performance (uncontrolled), minimal re-renders
- **Zod 3.x**
  - Rationale: TypeScript-first validation, type inference
  - Usage: Form validation, API request/response validation

**PWA & Offline:**
- **next-pwa 5.x**
  - Service Worker generation
  - Workbox integration
- **Workbox 7.x** (via next-pwa)
  - Caching strategies
  - Background sync
- **IndexedDB** (via idb library)
  - Offline data storage
  - Sync queue

**Icons & Assets:**
- **Lucide React**
  - Rationale: Beautiful, consistent, tree-shakeable
  - ~150KB for full set, <10KB with tree-shaking

### 2.2 Backend Stack

**API Layer:**
- **Next.js API Routes**
  - Located in `app/api/*`
  - Edge Runtime for fast cold starts
  - Middleware for auth, logging, error handling

**Database:**
- **PostgreSQL 15+** (via Supabase)
  - Rationale: Robust, ACID compliant, excellent for relational data
  - Extensions: uuid-ossp (UUID generation)

**ORM:**
- **Prisma 5.x**
  - Rationale: Type-safe queries, auto-generated types, excellent DX
  - Features: Migrations, introspection, client generation
  - Configuration: Connection pooling enabled

**Authentication:**
- **NextAuth.js 4.x** (future: Auth.js 5.x)
  - Providers: Credentials (email + password)
  - Session: JWT-based
  - Features: Password reset, secure cookies

**File Storage:**
- **Supabase Storage**
  - S3-compatible API
  - CDN-backed
  - Automatic image optimization

**Email:**
- **Resend API**
  - RESTful API
  - 3,000 emails/month free
  - Email tracking (opens, clicks)

**Email Templates:**
- **React Email**
  - Write emails as React components
  - Export to HTML
  - Preview in development

**Job Scheduling:**
- **Vercel Cron**
  - Configuration in `vercel.json`
  - Serverless functions as cron handlers
  - Triggers: Daily 6AM, Monday 7AM

### 2.3 Development & Deployment

**Package Manager:**
- **npm** (or pnpm for faster installs)

**Code Quality:**
- **ESLint** (Next.js config)
- **Prettier** (code formatting)
- **TypeScript** (strict mode)

**Testing:**
- **Vitest** (unit tests, faster than Jest)
- **React Testing Library** (component tests)
- **Playwright** (E2E tests)

**Hosting:**
- **Vercel** (Frontend + API)
  - Free tier: 100GB bandwidth/month
  - Automatic HTTPS
  - Global CDN
  - Edge functions
  - Serverless functions

**Database Hosting:**
- **Supabase** (Free tier)
  - 500MB database
  - 1GB file storage
  - 2GB egress/month
  - Automatic backups (7 days retention on free tier, upgrade to 30 days)

**Monitoring & Logging:**
- **Sentry** (Error tracking)
  - Free tier: 5K errors/month
- **Vercel Analytics** (Performance monitoring)
  - Included in deployment

**CI/CD:**
- **Vercel** (automatic)
  - Push to `main` → automatic deployment
  - PR previews
  - Environment variables management

---

## 3. Database Design

### 3.1 Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // for migrations
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  phone         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  customers     Customer[]
  maintenances  Maintenance[]
  sessions      Session[]

  @@map("users")
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  token        String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("sessions")
}

// ============================================================================
// CUSTOMERS & HEATERS
// ============================================================================

model Customer {
  id         String   @id @default(uuid())
  name       String
  street     String
  zipCode    String
  city       String
  phone      String
  email      String?
  emailOptIn EmailOptInStatus @default(NONE)
  optInToken String?  @unique // for double opt-in confirmation
  optInTokenExpires DateTime? // token expiry (48 hours)
  optInConfirmedAt DateTime? // when customer confirmed
  optInIpAddress String? // for GDPR proof
  unsubscribedAt DateTime? // if customer unsubscribed
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  heaters    Heater[]
  emailLogs  EmailLog[]

  @@index([userId])
  @@index([email])
  @@index([emailOptIn])
  @@map("customers")
}

enum EmailOptInStatus {
  NONE       // no email provided or not opted in
  PENDING    // confirmation email sent, awaiting click
  CONFIRMED  // customer clicked confirmation link
  UNSUBSCRIBED // customer unsubscribed
}

model Heater {
  id                  String   @id @default(uuid())
  model               String
  serialNumber        String?
  installationDate    DateTime?
  maintenanceInterval Int      // in months (1, 3, 6, 12, 24)
  lastMaintenance     DateTime?
  nextMaintenance     DateTime? // auto-calculated
  requiredParts       String?  // JSON array stored as text
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  // Relations
  customerId  String
  customer    Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  maintenances Maintenance[]

  @@index([customerId])
  @@index([nextMaintenance]) // for querying upcoming maintenances
  @@map("heaters")
}

// ============================================================================
// MAINTENANCE TRACKING
// ============================================================================

model Maintenance {
  id        String   @id @default(uuid())
  date      DateTime @default(now())
  notes     String?
  photos    String[] @default([]) // array of file URLs
  syncedAt  DateTime? // when synced from offline (null = created online)
  createdAt DateTime @default(now())

  // Relations
  heaterId String
  heater   Heater @relation(fields: [heaterId], references: [id], onDelete: Cascade)
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([heaterId])
  @@index([userId])
  @@index([date])
  @@map("maintenances")
}

// ============================================================================
// EMAIL AUTOMATION
// ============================================================================

model EmailLog {
  id           String   @id @default(uuid())
  customerId   String
  type         EmailType
  sentAt       DateTime @default(now())
  opened       Boolean  @default(false)
  openedAt     DateTime?
  clicked      Boolean  @default(false)
  clickedAt    DateTime?
  resendId     String?  // Resend email ID for tracking
  error        String?  // if send failed

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([customerId])
  @@index([type])
  @@index([sentAt])
  @@map("email_logs")
}

enum EmailType {
  OPT_IN_CONFIRMATION  // double opt-in confirmation
  REMINDER_4_WEEKS     // 4 weeks before maintenance
  REMINDER_1_WEEK      // 1 week before maintenance
  WEEKLY_SUMMARY       // weekly summary to Max (sent to user, not customer)
}

// ============================================================================
// CRON JOB TRACKING
// ============================================================================

model CronRun {
  id          String   @id @default(uuid())
  jobType     String   // "daily_reminders", "weekly_summary"
  startedAt   DateTime @default(now())
  completedAt DateTime?
  status      CronStatus @default(RUNNING)
  emailsSent  Int      @default(0)
  errors      String?  // JSON array of errors

  @@index([jobType])
  @@index([startedAt])
  @@map("cron_runs")
}

enum CronStatus {
  RUNNING
  SUCCESS
  FAILED
}
```

### 3.2 Database Indexes

**Critical indexes for performance:**

1. **Customer email lookup** (for email sending):
   ```sql
   CREATE INDEX idx_customers_email ON customers(email);
   CREATE INDEX idx_customers_email_opt_in ON customers(email_opt_in);
   ```

2. **Upcoming maintenances** (for cron jobs):
   ```sql
   CREATE INDEX idx_heaters_next_maintenance ON heaters(next_maintenance);
   ```

3. **User isolation** (ensure Max only sees his data):
   ```sql
   CREATE INDEX idx_customers_user_id ON customers(user_id);
   CREATE INDEX idx_heaters_customer_id ON heaters(customer_id);
   ```

4. **Email tracking**:
   ```sql
   CREATE INDEX idx_email_logs_customer_id_type ON email_logs(customer_id, type);
   ```

### 3.3 Database Size Estimation

**MVP (Max only, 80 customers):**
- Users: 1 row × ~200 bytes = 200 bytes
- Customers: 80 rows × ~500 bytes = 40 KB
- Heaters: 80 rows × ~300 bytes = 24 KB
- Maintenances: 80 customers × 12 maintenances/year = 960 rows × ~500 bytes = 480 KB/year
- EmailLogs: 80 customers × 2 reminders × 12 months = 1,920 rows × ~200 bytes = 384 KB/year
- Photos: 80 customers × 12 maintenances × 2 photos × 500 KB = ~960 MB/year

**Total Year 1: ~1-2 GB** (well within Supabase free tier initially, upgrade to Pro before storage limit)

---

## 4. API Design

### 4.1 API Structure

**Base URL:** `https://torqr.vercel.app/api`

**Authentication:** JWT in HTTP-only cookie

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**Error Format:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { "field": "email" }
  }
}
```

### 4.2 API Endpoints

#### Authentication Endpoints

**POST /api/auth/register**
- Create new user account
- Request: `{ email, password, name }`
- Response: `{ user: { id, email, name }, token }`

**POST /api/auth/login**
- Login with credentials
- Request: `{ email, password }`
- Response: `{ user: { id, email, name }, token }`
- Sets HTTP-only cookie with JWT

**POST /api/auth/logout**
- Invalidate session
- Response: `{ success: true }`

**POST /api/auth/reset-password**
- Request password reset
- Request: `{ email }`
- Sends email with reset link

**POST /api/auth/reset-password/confirm**
- Confirm password reset
- Request: `{ token, newPassword }`

#### Customer Endpoints

**GET /api/customers**
- List all customers for authenticated user
- Query params: `search`, `limit`, `offset`, `sortBy`, `filterOverdue`
- Response: `{ customers: [...], total, hasMore }`

**GET /api/customers/:id**
- Get single customer with heaters
- Response: `{ customer: { ..., heaters: [...] } }`

**POST /api/customers**
- Create new customer
- Request: `{ name, street, zipCode, city, phone, email?, notes? }`
- Response: `{ customer: { id, ... } }`

**PATCH /api/customers/:id**
- Update customer
- Request: Partial customer object
- Response: `{ customer: { ... } }`

**DELETE /api/customers/:id**
- Delete customer (and all associated data)
- Response: `{ success: true }`

#### Heater Endpoints

**POST /api/heaters**
- Create heater for customer
- Request: `{ customerId, model, serialNumber?, installationDate?, maintenanceInterval, lastMaintenance?, requiredParts? }`
- Response: `{ heater: { id, ..., nextMaintenance } }`

**PATCH /api/heaters/:id**
- Update heater
- Request: Partial heater object
- Response: `{ heater: { ... } }`

**DELETE /api/heaters/:id**
- Delete heater
- Response: `{ success: true }`

#### Maintenance Endpoints

**POST /api/maintenances**
- Mark maintenance as completed
- Request: `{ heaterId, date, notes?, photos? }`
- Response: `{ maintenance: { ... }, heater: { nextMaintenance } }`
- Side effect: Updates heater's `lastMaintenance` and `nextMaintenance`

**GET /api/maintenances**
- List maintenances (for a heater or all)
- Query params: `heaterId`, `limit`, `offset`
- Response: `{ maintenances: [...] }`

**GET /api/maintenances/:id**
- Get single maintenance with photos
- Response: `{ maintenance: { ..., photos: [...] } }`

#### Photo Upload Endpoints

**POST /api/upload**
- Upload photo (for maintenance)
- Request: `multipart/form-data` with file
- Response: `{ url: "https://..." }`
- Stores in Supabase Storage

**DELETE /api/upload**
- Delete photo
- Request: `{ url }`
- Response: `{ success: true }`

#### Email Endpoints

**POST /api/email/opt-in**
- Resend opt-in confirmation email
- Request: `{ customerId }`
- Response: `{ success: true }`

**GET /api/email/confirm/:token**
- Confirm email opt-in (customer clicks link)
- Updates customer `emailOptIn` to CONFIRMED
- Response: Redirect to confirmation page

**GET /api/email/unsubscribe/:token**
- Unsubscribe from emails (customer clicks link)
- Updates customer `emailOptIn` to UNSUBSCRIBED
- Response: Redirect to unsubscribe confirmation page

#### Dashboard/Stats Endpoints

**GET /api/dashboard**
- Get dashboard statistics
- Response:
  ```json
  {
    "totalCustomers": 80,
    "maintenancesOverdue": 2,
    "maintenancesThisWeek": 5,
    "maintenancesNextWeek": 3,
    "recentMaintenances": [...]
  }
  ```

#### Cron Job Endpoints (Protected by Vercel Cron secret)

**POST /api/cron/daily-reminders**
- Triggered daily at 6:00 AM
- Sends 4-week and 1-week reminders
- Response: `{ emailsSent: 12, errors: [] }`

**POST /api/cron/weekly-summary**
- Triggered Monday at 7:00 AM
- Sends weekly summary to Max
- Response: `{ emailsSent: 1 }`

### 4.3 API Security

**Authentication Middleware:**
```typescript
// middleware/auth.ts
export async function requireAuth(req: Request) {
  const token = req.cookies.get('auth_token');
  if (!token) {
    throw new UnauthorizedError();
  }
  const session = await verifyJWT(token);
  if (!session) {
    throw new UnauthorizedError();
  }
  return session.userId;
}
```

**Rate Limiting:**
- Login: 5 attempts/minute per IP
- API calls: 100 requests/minute per user
- File uploads: 10 uploads/minute per user

**Input Validation:**
- All inputs validated with Zod schemas
- Email format validation
- SQL injection prevention (Prisma handles this)
- XSS prevention (React escapes by default)

---

## 5. Offline Architecture

### 5.1 Service Worker Strategy

**Caching Strategies:**

1. **App Shell (Cache First)**
   - HTML, CSS, JS bundles
   - Cached indefinitely, updated on new deployment
   - Workbox `CacheFirst` strategy

2. **API Responses (Network First, Cache Fallback)**
   - `/api/customers` → cache for offline
   - `/api/dashboard` → cache for offline
   - Workbox `NetworkFirst` with 5s timeout

3. **Images/Photos (Cache First, Network Fallback)**
   - Customer photos cached after first load
   - Workbox `CacheFirst` strategy

4. **API Mutations (Background Sync)**
   - POST/PATCH/DELETE → queued if offline
   - Workbox Background Sync API
   - Sync when connection restored

**Service Worker Code Structure:**
```javascript
// service-worker.js (generated by next-pwa)

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Precache app shell
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses (customers, dashboard)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/customers') ||
                url.pathname.startsWith('/api/dashboard'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          // Only cache successful responses
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Background sync for mutations
const bgSyncPlugin = new BackgroundSyncPlugin('maintenance-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
});

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && request.method !== 'GET',
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);
```

### 5.2 Offline Data Storage (IndexedDB)

**Structure:**
```typescript
// lib/offline-db.ts
import { openDB, DBSchema } from 'idb';

interface OfflineDB extends DBSchema {
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-updated': Date };
  };
  heaters: {
    key: string;
    value: Heater;
  };
  'pending-maintenances': {
    key: string;
    value: {
      id: string;
      heaterId: string;
      date: Date;
      notes?: string;
      photos?: string[];
      createdAt: Date;
    };
  };
}

export async function initDB() {
  return openDB<OfflineDB>('torqr-offline', 1, {
    upgrade(db) {
      db.createObjectStore('customers', { keyPath: 'id' });
      db.createObjectStore('heaters', { keyPath: 'id' });
      db.createObjectStore('pending-maintenances', { keyPath: 'id' });
    },
  });
}
```

**Sync Logic:**
```typescript
// lib/offline-sync.ts
export async function syncPendingMaintenances() {
  const db = await initDB();
  const pending = await db.getAll('pending-maintenances');

  for (const maintenance of pending) {
    try {
      await fetch('/api/maintenances', {
        method: 'POST',
        body: JSON.stringify(maintenance),
      });
      // Success: remove from pending queue
      await db.delete('pending-maintenances', maintenance.id);
    } catch (error) {
      // Keep in queue, will retry later
      console.error('Sync failed for maintenance:', maintenance.id);
    }
  }
}
```

### 5.3 Conflict Resolution

**Strategy: Last-Write-Wins**

For MVP simplicity, use Last-Write-Wins conflict resolution:
- Client sends offline changes with timestamp
- Server accepts latest timestamp
- No complex CRDTs needed for single-user MVP

**Future Enhancement (Multi-User):**
- Use version numbers or vector clocks
- Detect conflicts and prompt user resolution
- Log conflicts for manual review

---

## 6. Email Architecture

### 6.1 Email Sending Service

**Resend Integration:**
```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  template,
  data,
}: {
  to: string;
  subject: string;
  template: React.ComponentType<any>;
  data: any;
}) {
  const { data: result, error } = await resend.emails.send({
    from: 'Max Wagner <max@torqr.de>',
    to,
    subject,
    react: React.createElement(template, data),
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return result;
}
```

### 6.2 Email Templates (React Email)

**4-Week Reminder Template:**
```tsx
// emails/maintenance-reminder-4-weeks.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface Reminder4WeeksProps {
  customerName: string;
  heaterModel: string;
  dueDate: string;
  technicianName: string;
  technicianPhone: string;
  unsubscribeUrl: string;
}

export default function Reminder4Weeks({
  customerName,
  heaterModel,
  dueDate,
  technicianName,
  technicianPhone,
  unsubscribeUrl,
}: Reminder4WeeksProps) {
  return (
    <Html>
      <Head />
      <Preview>Wartungserinnerung für Ihre Heizung</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Wartungserinnerung</Heading>

          <Text style={text}>
            Sehr geehrte/r {customerName},
          </Text>

          <Text style={text}>
            Ihre Heizung ({heaterModel}) ist in ca. 4 Wochen
            (voraussichtlich am {dueDate}) wieder zur Wartung fällig.
          </Text>

          <Text style={text}>
            Wir werden uns zeitnah bei Ihnen melden, um einen Termin zu vereinbaren.
          </Text>

          <Section style={footer}>
            <Text style={text}>
              Mit freundlichen Grüßen<br />
              {technicianName}<br />
              Tel: {technicianPhone}
            </Text>

            <Text style={unsubscribe}>
              <a href={unsubscribeUrl}>Keine Erinnerungen mehr erhalten</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const footer = {
  marginTop: '40px',
  paddingTop: '20px',
  borderTop: '1px solid #eaeaea',
};

const unsubscribe = {
  color: '#8898aa',
  fontSize: '12px',
  marginTop: '20px',
};
```

### 6.3 Cron Job Implementation

**Vercel Cron Configuration (`vercel.json`):**
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/weekly-summary",
      "schedule": "0 7 * * 1"
    }
  ]
}
```

**Daily Reminders Handler:**
```typescript
// app/api/cron/daily-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import Reminder4Weeks from '@/emails/maintenance-reminder-4-weeks';
import Reminder1Week from '@/emails/maintenance-reminder-1-week';

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  const in4Weeks = new Date(today);
  in4Weeks.setDate(today.getDate() + 28);

  const in1Week = new Date(today);
  in1Week.setDate(today.getDate() + 7);

  let emailsSent = 0;
  const errors = [];

  // Find heaters due in 4 weeks
  const heaters4Weeks = await prisma.heater.findMany({
    where: {
      nextMaintenance: {
        gte: new Date(in4Weeks.setHours(0, 0, 0, 0)),
        lte: new Date(in4Weeks.setHours(23, 59, 59, 999)),
      },
      customer: {
        email: { not: null },
        emailOptIn: 'CONFIRMED',
      },
    },
    include: {
      customer: true,
      user: true,
    },
  });

  // Send 4-week reminders
  for (const heater of heaters4Weeks) {
    // Check if email already sent for this cycle
    const existingLog = await prisma.emailLog.findFirst({
      where: {
        customerId: heater.customerId,
        type: 'REMINDER_4_WEEKS',
        sentAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // within last 30 days
      },
    });

    if (existingLog) continue; // Already sent

    try {
      await sendEmail({
        to: heater.customer.email!,
        subject: 'Wartungserinnerung für Ihre Heizung',
        template: Reminder4Weeks,
        data: {
          customerName: heater.customer.name,
          heaterModel: heater.model,
          dueDate: heater.nextMaintenance!.toLocaleDateString('de-DE'),
          technicianName: heater.user.name,
          technicianPhone: heater.user.phone || '',
          unsubscribeUrl: `${process.env.NEXT_PUBLIC_URL}/api/email/unsubscribe/${heater.customer.id}`,
        },
      });

      // Log email
      await prisma.emailLog.create({
        data: {
          customerId: heater.customerId,
          type: 'REMINDER_4_WEEKS',
        },
      });

      emailsSent++;
    } catch (error) {
      errors.push({ customerId: heater.customerId, error: error.message });
    }
  }

  // Similar logic for 1-week reminders...

  return NextResponse.json({
    success: true,
    emailsSent,
    errors,
  });
}
```

---

## 7. Security Architecture

### 7.1 Authentication Flow

**JWT-based Session:**
1. User logs in with email + password
2. Server verifies credentials (bcrypt compare)
3. Server generates JWT with user ID
4. JWT stored in HTTP-only cookie
5. Subsequent requests include cookie
6. Middleware verifies JWT on each request

**JWT Payload:**
```json
{
  "userId": "uuid",
  "email": "max@example.com",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**JWT Signing:**
```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken';

export function signJWT(payload: { userId: string; email: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
}

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };
  } catch {
    return null;
  }
}
```

### 7.2 Password Hashing

**bcrypt Implementation:**
```typescript
// lib/password.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 7.3 Data Access Control

**Row-Level Security (Middleware):**
```typescript
// middleware/require-ownership.ts
export async function requireOwnership(userId: string, customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { userId: true },
  });

  if (!customer || customer.userId !== userId) {
    throw new ForbiddenError('Access denied');
  }
}
```

**All API routes filter by userId:**
```typescript
// Example: GET /api/customers
const customers = await prisma.customer.findMany({
  where: { userId: req.userId }, // Automatically filtered
});
```

### 7.4 Security Headers

**Next.js Security Headers:**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

---

## 8. Performance Optimization

### 8.1 Frontend Optimizations

**Code Splitting:**
- Next.js automatic code splitting
- Dynamic imports for heavy components
- Route-based splitting (App Router)

**Image Optimization:**
- `next/image` component (automatic WebP, lazy loading)
- Compress photos before upload (client-side)
- Supabase CDN for fast delivery

**Lazy Loading:**
```tsx
import dynamic from 'next/dynamic';

const PhotoGallery = dynamic(() => import('./PhotoGallery'), {
  loading: () => <Skeleton />,
  ssr: false, // Only load on client
});
```

**React Performance:**
- Use `React.memo()` for expensive components
- `useCallback` and `useMemo` to prevent re-renders
- Virtualized lists for long customer lists (react-window)

### 8.2 Backend Optimizations

**Database Query Optimization:**
- Use `select` to fetch only needed fields
- Use `include` judiciously (avoid N+1 queries)
- Proper indexing (see Section 3.2)

**API Response Caching:**
```typescript
// Cache dashboard stats for 5 minutes
export const revalidate = 300; // Next.js App Router cache
```

**Connection Pooling:**
- Prisma connection pooling enabled
- Supabase connection pooler for serverless

### 8.3 Deployment Optimizations

**Vercel Edge Functions:**
- Use Edge Runtime for API routes when possible
- Faster cold starts, global distribution

**Static Generation:**
- Marketing pages statically generated
- App pages server-rendered (need auth)

---

## 9. Monitoring & Observability

### 9.1 Error Tracking

**Sentry Integration:**
```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**Error Boundaries:**
```tsx
// components/ErrorBoundary.tsx
'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Etwas ist schiefgelaufen</h2>
      <button onClick={reset}>Erneut versuchen</button>
    </div>
  );
}
```

### 9.2 Performance Monitoring

**Vercel Analytics:**
- Automatic Core Web Vitals tracking
- Real User Monitoring (RUM)

**Custom Metrics:**
```typescript
// Track maintenance completion time
performance.mark('maintenance-start');
// ... complete maintenance
performance.mark('maintenance-end');
performance.measure('maintenance-flow', 'maintenance-start', 'maintenance-end');
```

### 9.3 Logging

**Structured Logging:**
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date() }));
  },
  error: (message: string, error: Error, meta?: object) => {
    console.error(JSON.stringify({ level: 'error', message, error: error.stack, ...meta, timestamp: new Date() }));
  },
};
```

---

## 10. Deployment & CI/CD

### 10.1 Environment Variables

**Required Environment Variables:**

```bash
# .env.local (development)
# .env.production (production - set in Vercel dashboard)

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # for migrations

# Authentication
JWT_SECRET="your-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000" # production: https://torqr.de

# Email
RESEND_API_KEY="re_..."

# File Storage
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..." # for server-side operations

# Cron Jobs
CRON_SECRET="random-secret-for-cron-auth"

# Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://..."
SENTRY_AUTH_TOKEN="..." # for source maps

# App
NEXT_PUBLIC_URL="https://torqr.de"
```

### 10.2 Deployment Process

**Vercel Deployment:**
1. Push to `main` branch on GitHub
2. Vercel detects push
3. Runs `npm run build`
4. Runs Prisma migration (if schema changed)
5. Deploys to production
6. Automatic HTTPS + CDN

**Database Migrations:**
```bash
# Local development
npx prisma migrate dev --name add_email_opt_in

# Production (Vercel runs automatically)
npx prisma migrate deploy
```

### 10.3 Rollback Strategy

**Instant Rollback:**
- Vercel keeps previous deployments
- One-click rollback in Vercel dashboard
- DNS remains unchanged

**Database Rollback:**
- Careful with destructive migrations
- Test migrations on staging first
- Keep SQL rollback scripts for critical migrations

---

## 11. Scalability Plan

### 11.1 MVP → Beta (10 users)

**No changes needed:**
- Vercel free tier handles 10 users easily
- Supabase free tier sufficient

### 11.2 Beta → SaaS (100 users)

**Required Upgrades:**
- **Vercel Pro:** $20/month (more bandwidth)
- **Supabase Pro:** $25/month (better performance, 30-day backups)
- **Resend Growth:** $20/month (50k emails)

**Architecture Changes:**
- None needed (designed for multi-tenancy)

### 11.3 SaaS → Scale (1000+ users)

**Infrastructure:**
- **Vercel Team/Enterprise:** Custom pricing
- **Supabase Team:** $599/month (dedicated resources)
- **Redis:** Add caching layer (Upstash: $10-50/month)

**Architecture Changes:**
- Add Redis for session storage (faster than DB)
- Add Redis for API response caching
- Consider CDN for photos (Cloudflare R2)
- Horizontal scaling (Vercel handles automatically)

**Database Optimization:**
- Read replicas (Supabase Pro+ feature)
- More aggressive indexing
- Archive old maintenances (>5 years) to cold storage

---

## 12. Technology Decision Rationale

### 12.1 Why Next.js?

**Pros:**
- ✅ Full-stack in one framework (no separate backend)
- ✅ Excellent DX (hot reload, TypeScript, file-based routing)
- ✅ Vercel optimization (co-created by same company)
- ✅ Built-in API routes (no Express needed)
- ✅ App Router for modern React (Server Components)
- ✅ Image optimization out-of-the-box
- ✅ Large community, excellent documentation

**Cons:**
- ❌ Vendor lock-in with Vercel (mitigated: can deploy elsewhere)
- ❌ App Router learning curve (worth it for long-term)

**Alternatives Considered:**
- **Remix:** Great, but smaller ecosystem
- **SvelteKit:** Lighter, but React has more libraries
- **Vanilla React + Express:** More setup, less integrated

### 12.2 Why Supabase?

**Pros:**
- ✅ PostgreSQL (robust, ACID, relational)
- ✅ Free tier generous (500MB DB, 1GB storage)
- ✅ Built-in auth (not used for MVP, but available)
- ✅ Built-in file storage (S3-compatible)
- ✅ EU data center available (GDPR)
- ✅ Automatic backups
- ✅ Good TypeScript SDK

**Cons:**
- ❌ Vendor lock-in (mitigated: PostgreSQL, can migrate)
- ❌ Free tier limits (upgrade path exists)

**Alternatives Considered:**
- **PlanetScale:** MySQL, great free tier, but MySQL less robust than Postgres
- **Neon:** Postgres, serverless, but newer/less proven
- **Railway:** All-in-one, but more expensive

### 12.3 Why Prisma?

**Pros:**
- ✅ Type-safe queries (auto-generated types from schema)
- ✅ Excellent DX (migrations, studio, introspection)
- ✅ Prevents SQL injection by default
- ✅ Great TypeScript support

**Cons:**
- ❌ Slightly slower than raw SQL (negligible for MVP scale)
- ❌ Generated client adds to bundle size (server-side only, OK)

**Alternatives Considered:**
- **Drizzle ORM:** Lighter, but less mature
- **TypeORM:** Older, less type-safe
- **Kysely:** More SQL-like, less abstraction (good for complex queries)

### 12.4 Why PWA (not Native App)?

**Pros:**
- ✅ Single codebase (web = iOS = Android)
- ✅ No app store approval needed
- ✅ Instant updates (no app store delays)
- ✅ Easier offline support (Service Workers)
- ✅ Lower development cost (one codebase)
- ✅ Direct distribution (URL, no installation friction)

**Cons:**
- ❌ iOS PWA limitations (no push notifications, less native feel)
- ❌ Less discoverable (no app store presence)
- ❌ Limited access to native APIs

**Decision:** PWA perfect for MVP, can build native later if needed.

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

**RISK-ARCH-001: Offline sync conflicts**
- **Mitigation:** Last-Write-Wins strategy (simple, good enough for single-user)
- **Monitoring:** Log all sync conflicts
- **Escalation:** If >1% of syncs have conflicts, investigate

**RISK-ARCH-002: Supabase free tier limits exceeded**
- **Mitigation:** Monitor usage in Supabase dashboard
- **Threshold:** Upgrade to Pro at 400MB DB or 900MB storage
- **Cost:** $25/month (acceptable at MVP validation stage)

**RISK-ARCH-003: Email deliverability issues**
- **Mitigation:** Use Resend (good reputation), configure SPF/DKIM/DMARC
- **Monitoring:** Track bounce rate in Resend dashboard
- **Threshold:** If bounce rate >5%, investigate

**RISK-ARCH-004: Vercel cold start latency**
- **Mitigation:** Use Edge Runtime where possible, keep functions warm
- **Monitoring:** Vercel Analytics shows cold start metrics
- **Acceptable:** <1s cold start (happens rarely)

### 13.2 Scalability Risks

**RISK-ARCH-005: Database performance degrades at scale**
- **Mitigation:** Proper indexing (Section 3.2), query optimization
- **Monitoring:** Supabase dashboard shows slow queries
- **Threshold:** If p95 query time >500ms, optimize or add read replica

**RISK-ARCH-006: Photo storage costs escalate**
- **Mitigation:** Aggressive compression (max 2MB per photo), limit 5 photos/maintenance
- **Monitoring:** Track storage growth monthly
- **Threshold:** If >80% of free tier (800MB), upgrade or implement cleanup

---

## 14. Next Steps

### 14.1 Immediate (Before Development)

1. ✅ **Set up Vercel project**
   - Connect GitHub repository
   - Configure environment variables
   - Set up preview deployments

2. ✅ **Set up Supabase project**
   - Create new project (EU region: Frankfurt)
   - Note connection strings
   - Configure Row Level Security (RLS) if using Supabase Auth

3. ✅ **Set up Resend account**
   - Verify sender domain (wartungswerk.de)
   - Configure SPF/DKIM/DMARC
   - Note API key

4. ✅ **Set up Sentry project**
   - Create new project for error tracking
   - Note DSN

### 14.2 Development Phase

1. **Week 1: Project Setup**
   - Initialize Next.js project
   - Configure Prisma
   - Set up database schema
   - Create initial migrations
   - Set up ESLint, Prettier, TypeScript strict mode

2. **Weeks 2-7: Feature Development**
   - Follow sprint plan (see MVP Scope document)

3. **Week 8: Testing & Deployment**
   - End-to-end testing
   - Performance optimization
   - Security audit
   - Production deployment

### 14.3 Post-Deployment

1. **Monitoring Setup**
   - Sentry alerts configured
   - Vercel Analytics reviewed
   - Supabase metrics dashboard

2. **Performance Baseline**
   - Lighthouse score documented
   - Core Web Vitals tracked
   - API response times baselined

---

**Document Status:** ✅ COMPLETE
**Next Agent:** UX Design Agent (Mobile-First Design)
**Dependencies:** MVP Scope (agent-01), GDPR Framework (agent-04)
**Approval:** Ready for UX design and development
**Implementation:** Full technical specification for developers
