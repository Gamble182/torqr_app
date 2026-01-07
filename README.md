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

**Test Credentials:** See [TEST-CREDENTIALS.md](./TEST-CREDENTIALS.md) for login details.

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

See [TEST-CREDENTIALS.md](./TEST-CREDENTIALS.md) for more details.

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

- [PROJECT-SUMMARY.md](./docs/PROJECT-SUMMARY.md) - Executive overview and roadmap
- [DEVELOPER-SETUP-GUIDE.md](./docs/DEVELOPER-SETUP-GUIDE.md) - Step-by-step setup
- [TEST-CREDENTIALS.md](./TEST-CREDENTIALS.md) - Test user credentials
- [SPRINT-02-CUSTOMER-MANAGEMENT.md](./docs/SPRINT-02-CUSTOMER-MANAGEMENT.md) - Current sprint guide

---

## Current Development Status

**Sprint 1:** ✅ Complete - Authentication & Security
**Sprint 2:** 🚧 In Progress - Customer Management (API complete, UI in progress)

See [PROJECT-SUMMARY.md](./docs/PROJECT-SUMMARY.md) for full roadmap.

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
