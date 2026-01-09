# Torqr

A mobile-first PWA for heating technicians (Heizungsbauer) to manage customer maintenance schedules and automate reminder emails.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and configure your database and service credentials:

```bash
cp .env.example .env
```

See `docs/DEVELOPER-SETUP-GUIDE.md` for detailed setup instructions.

### 3. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Create Test User

Create a test user for development:

```bash
npx tsx scripts/create-test-user.ts
```

**Test Credentials:** See [TEST-CREDENTIALS.md](./docs/testing/TEST-CREDENTIALS.md) for login details.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the test credentials.

---

## Test User Credentials

For local development and testing, use these credentials:

| Field    | Value          |
|----------|----------------|
| Email    | test@torqr.app |
| Password | Test123!       |

See [TEST-CREDENTIALS.md](./docs/testing/TEST-CREDENTIALS.md) for more details.

---

## Project Structure

```
torqr-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Login, Register pages
│   │   ├── dashboard/         # Protected dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities and helpers
│   └── middleware.ts          # Auth & rate limiting
├── prisma/                    # Database schema
├── scripts/                   # Utility scripts
├── docs/                      # Planning documentation
└── TEST-CREDENTIALS.md        # Test user credentials
```

---

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open database GUI
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes to database

---

## Tech Stack

- **Frontend:** Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Auth:** NextAuth.js
- **Email:** Resend
- **Deployment:** Vercel

---

## Documentation

📚 **Main Documentation:** [docs/README.md](./docs/README.md)

**Quick Links:**
- [Deployment Guide](./docs/deployment/DEPLOYMENT.md) - How to deploy to production
- [Testing Checklist](./docs/testing/TESTING_CHECKLIST.md) - 170+ test cases
- [Test Credentials](./docs/testing/TEST-CREDENTIALS.md) - Development login info
- [Time Tracking](./docs/development/TIMESHEET.md) - MVP cost calculation

**Development Docs:**
- [PROJECT-SUMMARY.md](./docs/PROJECT-SUMMARY.md) - Executive overview
- [DEVELOPER-SETUP-GUIDE.md](./docs/DEVELOPER-SETUP-GUIDE.md) - Setup guide
- [Sprint Documentation](./docs/) - Sprint planning & guides

---

## Current Development Status

**Sprint 1:** ✅ Complete - Authentication & Security
**Sprint 2:** ✅ Complete - Customer Management
**Sprint 3:** ✅ Complete - Heater & Maintenance Tracking
**Sprint 5:** ✅ Complete - Dashboard Statistics
**Sprint 6:** ✅ Complete - Testing & Polish

**Status:** Ready for deployment 🚀

---

## Security Notes

- All passwords are hashed with bcrypt (10 rounds)
- JWT sessions via NextAuth.js
- Rate limiting on auth endpoints
- Input validation with Zod
- CSRF protection enabled

---

## License

Proprietary - All rights reserved
