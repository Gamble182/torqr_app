# Torqr - Developer Setup Guide

**Version:** 1.0
**Date:** December 11, 2024
**Estimated Setup Time:** 2-3 hours

---

## 🎯 Overview

This guide walks you through setting up your development environment to build Torqr from scratch. By the end, you'll have a running Next.js application with database, authentication, and all services configured.

---

## 📁 Recommended Project Structure

### Option A: New Repository (RECOMMENDED)

Create a **separate git repository** for the Torqr application:

```
torqr-app/                    # NEW GIT REPO
├── docs/                             # Copy planning documents here
│   ├── business-model-canvas.md
│   ├── mvp-scope-definition.md
│   ├── technical-architecture.md
│   ├── gdpr-compliance-framework.md
│   └── project-summary.md
├── app/                              # Next.js App Router
│   ├── api/                          # API routes
│   ├── (auth)/                       # Auth pages
│   ├── (dashboard)/                  # Protected routes
│   └── layout.tsx
├── components/                       # React components
├── lib/                              # Utility functions
├── prisma/                           # Database schema
│   └── schema.prisma
├── public/                           # Static assets
├── emails/                           # React Email templates
├── .env.local                        # Environment variables (DO NOT COMMIT)
├── .env.example                      # Template for .env
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

**Why separate repo?**
- ✅ Clean separation: Jarvis = planning, torqr-app = actual product
- ✅ Easier deployment (Vercel connects to one repo)
- ✅ Cleaner git history for the product
- ✅ Can share with Max or team without Jarvis system
- ✅ Standard development workflow

### Option B: Subfolder (NOT RECOMMENDED)

You could create a subfolder in jarvis, but this mixes planning with development and makes deployment harder.

---

## ✅ Prerequisites

### Required Software

1. **Node.js** (v18.17+ or v20+)
   ```bash
   node --version  # Should be 18.17+ or 20+
   npm --version   # Should be 9+
   ```
   Download: https://nodejs.org/

2. **Git**
   ```bash
   git --version
   ```
   Download: https://git-scm.com/

3. **VS Code** (recommended)
   - Extensions:
     - ES7+ React/Redux/React-Native snippets
     - Prettier - Code formatter
     - ESLint
     - Tailwind CSS IntelliSense
     - Prisma
     - GitLens

4. **Database Tool** (optional but helpful)
   - DBeaver (free, universal)
   - TablePlus (paid, beautiful)
   - Supabase Studio (web-based, built-in)

---

## 🔧 Account Setup (Do This First!)

### 1. Vercel Account (Hosting & Deployment)

**Sign up:** https://vercel.com/signup

**Steps:**
1. Sign up with GitHub account (recommended for auto-deployment)
2. Verify email
3. No payment needed for free tier

**What you'll get:**
- 100GB bandwidth/month
- Unlimited projects
- Automatic HTTPS
- Preview deployments for PRs

---

### 2. Supabase Account (Database & Storage)

**Sign up:** https://supabase.com/dashboard/sign-up

**Steps:**
1. Sign up with GitHub
2. Create new project:
   - Name: `torqr-mvp`
   - Database Password: Generate strong password (save in password manager!)
   - Region: **Europe (Frankfurt) or Europe (Ireland)** (for GDPR!)
   - Plan: Free (sufficient for MVP)
3. Wait 2-3 minutes for project setup
4. Note these from Settings → Database:
   - Connection string (URI)
   - Direct connection string (for migrations)

**What you'll get:**
- 500MB PostgreSQL database
- 1GB file storage
- Automatic backups (7-day retention)
- Built-in database viewer

---

### 3. Resend Account (Email Delivery)

**Sign up:** https://resend.com/signup

**Steps:**
1. Sign up with email
2. Verify email
3. Go to API Keys
4. Create API Key: "re_Xj5CfBts_5QuTgZJtjx5SyCqwG1aPcHb5"
   - Name: "Torqr MVP"
   - Permission: Full Access
   - Copy API key immediately (only shown once!)

**Domain Setup (Do Later Before Go-Live):**
1. Add domain: `torqr.de` (or your chosen domain)
2. Add DNS records (SPF, DKIM, DMARC) - Resend provides exact values
3. Verify domain

**What you'll get:**
- 3,000 emails/month free
- Email tracking (opens, clicks)
- Excellent deliverability

---

### 4. Sentry Account (Error Tracking)

**Sign up:** https://sentry.io/signup/

**Steps:**
1. Sign up with GitHub
2. Create new project:
   - Platform: Next.js
   - Name: torqr-mvp
3. Copy DSN (Data Source Name) https://81da3e96805fc318440d57e97ef01b5c@o4510517828976640.ingest.de.sentry.io/4510517832056912

**What you'll get:**
- 5,000 errors/month free
- Error tracking and alerts
- Performance monitoring

---

### 5. GitHub Repository

**Create new repository:**

```bash
# On GitHub.com:
# 1. Click "New Repository"
# 2. Name: torqr-app
# 3. Description: "SaaS maintenance management platform for Handwerk professionals"
# 4. Private (recommended until launch)
# 5. Initialize with README: YES
# 6. Add .gitignore: Node
# 7. License: MIT (or your choice)
```

---

## 🚀 Step-by-Step Setup

### Step 1: Clone and Setup New Repository

```bash
# Navigate to your projects directory
cd C:\Users\y.dorth\Documents\Development_Private

# Clone the new repository
git clone https://github.com/YOUR-USERNAME/torqr-app.git
cd torqr-app

# Verify you're in the right place
git remote -v  # Should show your GitHub repo
```

---

### Step 2: Copy Planning Documents

```bash
# Create docs folder
mkdir docs

# Copy all planning documents from jarvis outputs folder
# From PowerShell or Git Bash:
cp ../jarvis/projects/active/torqr/outputs/*.md docs/

# Also copy the original requirements for reference
cp ../jarvis/projects/active/torqr/context/*.md docs/

# Verify copied
ls docs/
# Should show:
# - PROJECT-SUMMARY.md
# - agent-01-business-model-canvas.md
# - agent-01-mvp-scope-definition.md
# - agent-02-technical-architecture.md
# - agent-04-gdpr-compliance-framework.md
# - projectidea.md
# - requirements.md
```

---

### Step 3: Initialize Next.js Project

```bash
# Create Next.js 14 with TypeScript, Tailwind, App Router
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# When prompted:
# ✔ Would you like to use TypeScript? Yes
# ✔ Would you like to use ESLint? Yes
# ✔ Would you like to use Tailwind CSS? Yes
# ✔ Would you like to use `src/` directory? No (we'll use app/ directly)
# ✔ Would you like to use App Router? Yes
# ✔ Would you like to customize the default import alias? No (@/* is fine)

# This creates:
# - app/ folder (App Router)
# - public/ folder
# - package.json
# - tsconfig.json
# - tailwind.config.ts
# - next.config.js
```

---

### Step 4: Install Additional Dependencies

```bash
# Database & ORM
npm install @prisma/client
npm install -D prisma

# Authentication
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs

# Email
npm install resend
npm install @react-email/components

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# UI Components (shadcn/ui - install as needed)
npm install class-variance-authority clsx tailwind-merge lucide-react

# PWA
npm install next-pwa

# Date handling
npm install date-fns

# Error tracking
npm install @sentry/nextjs

# Utilities
npm install uuid
npm install -D @types/uuid
```

---

### Step 5: Environment Variables Setup

Create `.env.local` file (DO NOT COMMIT THIS!):

```bash
# Create .env.local
touch .env.local

# Edit .env.local (paste this content):
```

```env
# .env.local (LOCAL DEVELOPMENT - DO NOT COMMIT)

# ============================================================================
# DATABASE (Supabase)
# ============================================================================
# Get from Supabase → Settings → Database → Connection string
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# For migrations (direct connection, not pooled)
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# ============================================================================
# AUTHENTICATION
# ============================================================================
# Generate with: openssl rand -base64 32
JWT_SECRET="your-generated-secret-here"

# NextAuth.js (v5)
AUTH_SECRET="your-generated-secret-here"
AUTH_URL="http://localhost:3000"

# ============================================================================
# EMAIL (Resend)
# ============================================================================
RESEND_API_KEY="re_your_api_key_here"

# ============================================================================
# FILE STORAGE (Supabase)
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# ============================================================================
# CRON JOBS
# ============================================================================
# Generate with: openssl rand -base64 32
CRON_SECRET="your-random-secret-for-cron-auth"

# ============================================================================
# ERROR TRACKING (Sentry)
# ============================================================================
NEXT_PUBLIC_SENTRY_DSN="https://your_sentry_dsn_here"

# ============================================================================
# APP CONFIGURATION
# ============================================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Also create `.env.example`** (safe to commit as template):

```bash
# Copy .env.local to .env.example and remove actual values
cp .env.local .env.example

# Edit .env.example to replace real values with placeholders:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@..."
# etc.
```

**Generate secrets:**
```bash
# On Windows (PowerShell):
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).Guid))

# On Mac/Linux:
openssl rand -base64 32
```

---

### Step 6: Setup Prisma Database Schema

```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env (you can delete this, we're using .env.local)
```

**Replace `prisma/schema.prisma` with the schema from technical architecture document:**

Open `docs/agent-02-technical-architecture.md` → Section 3.1 → Copy entire schema

```bash
# Open in VS Code
code prisma/schema.prisma

# Paste the complete schema from technical architecture doc
# (Lines 145-330 in that document)
```

**Run first migration:**

```bash
# Create and apply migration
npx prisma migrate dev --name init

# This will:
# 1. Create tables in Supabase
# 2. Generate Prisma Client
# 3. Create prisma/migrations folder

# Open Prisma Studio to view database
npx prisma studio
# Opens at http://localhost:5555
```

---

### Step 7: Configure Next.js

**Edit `next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'YOUR_PROJECT_REF.supabase.co', // Supabase Storage
    ],
  },
  // Security headers
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
        ],
      },
    ];
  },
};

// PWA Configuration
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA(nextConfig);
```

---

### Step 8: Setup Tailwind with shadcn/ui

**Initialize shadcn/ui:**

```bash
# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Answer prompts:
# ✔ Would you like to use TypeScript? yes
# ✔ Which style would you like to use? Default
# ✔ Which color would you like to use as base color? Slate
# ✔ Where is your global CSS file? app/globals.css
# ✔ Would you like to use CSS variables for colors? yes
# ✔ Where is your tailwind.config.js located? tailwind.config.ts
# ✔ Configure the import alias for components: @/components
# ✔ Configure the import alias for utils: @/lib/utils
```

**Install initial components:**

```bash
# Install commonly used components
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add label

# Install as needed during development
```

---

### Step 9: Setup Sentry

```bash
# Initialize Sentry
npx @sentry/wizard@latest -i nextjs

# Follow prompts:
# ✔ Select your platform: Next.js
# ✔ Do you already have a Sentry account? Yes
# ✔ Login via browser (will open Sentry)
# ✔ Select project: wartungswerk-mvp
# ✔ Configure source maps? Yes

# This creates:
# - sentry.client.config.ts
# - sentry.server.config.ts
# - sentry.edge.config.ts
```

---

### Step 10: Create Initial File Structure

```bash
# Create folder structure
mkdir -p app/api/auth
mkdir -p app/api/customers
mkdir -p app/api/heaters
mkdir -p app/api/maintenances
mkdir -p app/api/upload
mkdir -p app/api/cron
mkdir -p app/auth/login
mkdir -p app/auth/register
mkdir -p app/dashboard/dashboard
mkdir -p app/dashboard/customers
mkdir -p components/ui
mkdir -p lib
mkdir -p emails

# Create placeholder files
touch lib/prisma.ts
touch lib/auth.ts
touch lib/email.ts
touch lib/password.ts
touch lib/utils.ts
```

---

### Step 11: Create Core Utility Files

**`lib/prisma.ts`** (Database client):

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**`lib/password.ts`** (Password hashing):

```typescript
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

---

### Step 12: Test Development Server

```bash
# Start development server
npm run dev

# Open browser: http://localhost:3000
# You should see Next.js welcome page

# Test hot reload:
# Edit app/page.tsx, save, see changes instantly
```

---

### Step 13: Setup Git Properly

```bash
# Make sure .env.local is in .gitignore
echo "" >> .gitignore
echo "# Environment variables" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore

# Commit initial setup
git add .
git commit -m "Initial Next.js setup with Prisma, Tailwind, and all dependencies"
git push origin main
```

---

### Step 14: Connect to Vercel (Optional for MVP, Recommended for Continuous Deployment)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Follow prompts:
# ✔ Set up and deploy? Yes
# ✔ Which scope? Your personal account
# ✔ Link to existing project? No
# ✔ What's your project's name? torqr-app
# ✔ In which directory is your code located? ./

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Add environment variables in Vercel dashboard:**
1. Go to https://vercel.com/YOUR_USERNAME/torqr-app
2. Settings → Environment Variables
3. Add all variables from `.env.local`
4. Separate for Production, Preview, Development

---

## 📚 Using the Planning Documents

### During Development, Refer To:

**For Features:**
→ `docs/agent-01-mvp-scope-definition.md` Section 2.1 (MUST-HAVE features)
→ Each feature has user stories and acceptance criteria

**For API Implementation:**
→ `docs/agent-02-technical-architecture.md` Section 4.2 (API Endpoints)
→ Copy-paste endpoint specifications

**For Database Queries:**
→ `docs/agent-02-technical-architecture.md` Section 3 (Database Design)
→ Already implemented in `prisma/schema.prisma`

**For Offline Functionality:**
→ `docs/agent-02-technical-architecture.md` Section 5 (Offline Architecture)
→ Service Worker implementation code provided

**For Email Templates:**
→ `docs/agent-02-technical-architecture.md` Section 6.2 (Email Templates)
→ Copy React Email template code

**For GDPR Compliance:**
→ `docs/agent-04-gdpr-compliance-framework.md` Section 7 (Compliance Checklist)
→ Check off items as you implement

---

## 🎯 Sprint 1 Goals (Week 1)

Follow this checklist for your first week:

**Day 1-2: Setup (This Guide)**
- [x] All accounts created
- [x] Repository cloned
- [x] Dependencies installed
- [x] Database schema applied
- [x] Dev server running

**Day 3-4: Authentication**
- [x] Implement registration endpoint
- [x] Implement login endpoint
- [x] Implement JWT token generation
- [x] Create login/register pages
- [x] Test auth flow

**Day 5: Security Basics**
- [x] Add input validation (Zod)
- [x] Add rate limiting
- [x] Add CSRF protection
- [x] Security audit checklist

**Weekend: Documentation & Planning**
- [x] Read MVP scope document in full
- [x] Plan Sprint 2 (Customer Management) - See `SPRINT-02-CUSTOMER-MANAGEMENT.md`
- [ ] Set up project management (GitHub Issues or Trello)

---

## 🔍 Troubleshooting

### Database Connection Issues

**Error: "Can't reach database server"**

```bash
# Test connection
npx prisma db pull

# If fails, check:
# 1. Supabase project is running (dashboard shows "Active")
# 2. DATABASE_URL is correct (copy from Supabase dashboard)
# 3. Password has no special characters that need URL encoding
# 4. Using correct region (EU for GDPR)
```

### Prisma Migration Issues

**Error: "Migration failed"**

```bash
# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Or apply migrations manually
npx prisma migrate deploy
```

### Next.js Build Issues

**Error: "Module not found"**

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
rm package-lock.json
npm install

# Rebuild
npm run build
```

### Port Already in Use

**Error: "Port 3000 already in use"**

```bash
# Kill process on port 3000 (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use different port
npm run dev -- -p 3001
```

---

## 📖 Recommended Reading Order

**Before Starting Development:**
1. `docs/PROJECT-SUMMARY.md` (overview)
2. `docs/agent-01-mvp-scope-definition.md` Section 2.1 (MUST-HAVE features)
3. `docs/agent-02-technical-architecture.md` Section 2 (Tech Stack)

**During Sprint 1 (Auth & Setup):**
4. `docs/agent-02-technical-architecture.md` Section 3 (Database)
5. `docs/agent-02-technical-architecture.md` Section 7 (Security)

**During Sprint 2-3 (Features):**
6. `docs/agent-01-mvp-scope-definition.md` Section 5 (User Stories)
7. `docs/agent-02-technical-architecture.md` Section 4 (API Design)

**During Sprint 4 (Email):**
8. `docs/agent-02-technical-architecture.md` Section 6 (Email Architecture)
9. `docs/agent-04-gdpr-compliance-framework.md` Section 3 (Consent Management)

**During Sprint 5 (PWA/Offline):**
10. `docs/agent-02-technical-architecture.md` Section 5 (Offline Architecture)

**Before Go-Live:**
11. `docs/agent-04-gdpr-compliance-framework.md` Section 7 (Compliance Checklist)

---

## 🚀 Quick Start Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint

# Database
npx prisma migrate dev         # Create and apply migration
npx prisma migrate deploy      # Apply migrations (production)
npx prisma studio              # Open database GUI
npx prisma generate            # Generate Prisma Client
npx prisma db push             # Push schema without migration (dev only)

# Deployment
vercel                         # Deploy to preview
vercel --prod                  # Deploy to production
vercel env pull                # Pull environment variables

# Testing
npm run test                   # Run tests (after setup)
npm run test:e2e               # Run E2E tests (after setup)
```

---

## ✅ Success Checklist

By the end of setup, you should have:

- [x] **Accounts:** Vercel, Supabase, Resend, Sentry, GitHub
- [x] **Repository:** New git repo with Next.js initialized
- [x] **Dependencies:** All packages installed
- [x] **Database:** Schema applied, Prisma Studio working
- [x] **Environment:** All variables in `.env.local`
- [x] **Dev Server:** Running on http://localhost:3000
- [x] **Documentation:** All planning docs in `docs/` folder
- [x] **Git:** `.env.local` in `.gitignore`, initial commit pushed

**Next:** Start Sprint 1 → Implement authentication!

---

## 💡 Tips for Success

1. **Use Claude Code** in your new repository - I can help implement each feature
2. **Commit frequently** - Small, atomic commits
3. **Follow the sprint plan** - Don't skip ahead
4. **Test on real devices** - Max will use an actual smartphone
5. **Check GDPR compliance** - Refer to checklist before email features
6. **Deploy early** - Set up Vercel continuous deployment in Week 1

---

## 📞 Need Help?

**During development with Claude Code:**
- "Implement user registration endpoint from the technical architecture doc"
- "Create the Customer model CRUD operations following the API spec"
- "Set up the Service Worker for offline functionality"
- "Generate the 4-week reminder email template"

**Resources:**
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Tailwind Docs: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
- Resend Docs: https://resend.com/docs

---

**Ready to build! 🚀**

Start with `npm run dev` and begin Sprint 1 (Authentication) from the MVP Scope document.
