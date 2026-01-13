# Torqr - Heating Maintenance Management App

A mobile-first Progressive Web App (PWA) for heating technicians to manage customer maintenance schedules, track heater data, and automate reminder emails.

---

## Quick Start

### Prerequisites
- Node.js 20+ installed
- PostgreSQL database (we use Supabase)
- Git

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd torqr_app
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials:
- **Database**: Get connection strings from Supabase → Settings → Database
- **Authentication**: Generate secrets with `openssl rand -base64 32`
- **Email**: Get API key from Resend
- **Storage**: Get Supabase project URL and keys

See [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) for detailed environment variable documentation.

### 3. Database Setup

Generate Prisma client and run migrations:

```bash
npx prisma generate
npm run migrate:deploy
```

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test User

For testing, use these credentials:

| Field    | Value          |
|----------|----------------|
| Email    | test@torqr.app |
| Password | Test123!       |

| Field    | Value          |
|----------|----------------|
| Email    | peter@beispiel.de |
| Password | Peter123!       |

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **State Management**: TanStack Query (React Query) v5 for data fetching and caching
- **Backend**: Next.js API Routes, Prisma ORM 7
- **Database**: PostgreSQL (Supabase with connection pooling)
- **Authentication**: Custom JWT-based auth with bcrypt
- **Email**: Resend API
- **Storage**: Supabase Storage (for maintenance photos)
- **Deployment**: Vercel
- **Error Tracking**: Sentry (optional)

---

## Project Structure

```
torqr_app/
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── (auth)/            # Public routes: login, register
│   │   ├── dashboard/         # Protected routes: main app
│   │   └── api/               # API endpoints
│   ├── components/            # Reusable React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── heater-form/      # Split heater form components
│   │   └── ...               # Feature-specific components
│   ├── hooks/                 # React Query custom hooks
│   │   ├── useCustomers.ts   # Customer CRUD operations
│   │   ├── useHeaters.ts     # Heater CRUD operations
│   │   ├── useDashboard.ts   # Dashboard statistics
│   │   └── useMaintenances.ts # Maintenance CRUD operations
│   ├── lib/                   # Utilities and helpers
│   │   ├── prisma.ts         # Database client
│   │   ├── auth.ts           # Authentication logic
│   │   ├── react-query.tsx   # React Query configuration
│   │   └── ...
│   └── middleware.ts          # Auth & routing middleware
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── config/
│   └── prisma.config.ts       # Prisma 7 configuration
├── docs/                      # Documentation
│   ├── README.md             # Docs index
│   ├── archive/              # Old planning docs
│   ├── deployment/           # Deployment guides
│   ├── development/          # Development guides
│   └── testing/              # Test documentation
└── public/                    # Static assets
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run migrate:deploy` | Run database migrations |
| `npx prisma studio` | Open database GUI |
| `npx prisma generate` | Generate Prisma Client |

---

## Key Features

### Customer Management
- Add and manage customers with contact information
- Track heating system types and energy sources
- Email opt-in management with GDPR compliance

### Heater & Maintenance Tracking
- Multiple heaters per customer
- Configurable maintenance intervals (1, 3, 6, 12, 24 months)
- Automatic next maintenance date calculation
- Photo upload for maintenance documentation
- Maintenance history

### Email Automation
- Automatic reminder emails (4 weeks and 1 week before maintenance)
- Weekly summary emails
- Email tracking (opened, clicked)
- Double opt-in for email subscriptions

### Dashboard
- Statistics overview (customers, heaters, upcoming maintenance)
- Upcoming maintenance calendar
- Quick actions

---

## Development Workflow

### Branches
- `main` - Production branch (auto-deploys to Vercel)
- `development` - Development branch (for ongoing work)

### Workflow
1. Make changes in `development` branch
2. Test locally
3. Commit and push to `development`
4. When ready for production, merge to `main`:
   ```bash
   git checkout main
   git merge development
   git push origin main
   ```

### Running Migrations

Migrations should be run **locally** with the direct database connection:

```bash
npm run migrate:deploy
```

This uses the `DIRECT_URL` from your `.env` file (port 5432), not the pooled connection.

---

## Deployment

### Vercel Deployment

The app is configured for automatic deployment on Vercel.

**Important**: See [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) for complete deployment instructions.

**Key Points**:
- Use the **pooled connection** (port 6543) for `DATABASE_URL` in Vercel
- Migrations are **NOT** run during build (run them locally or via CI/CD)
- Set all environment variables in Vercel Dashboard → Settings → Environment Variables

### Database Connections

- **Runtime queries** (`DATABASE_URL`): Use pooled connection (port 6543)
  ```
  postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  ```

- **Migrations** (`DIRECT_URL`): Use direct connection (port 5432)
  ```
  postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
  ```

---

## Security

- All passwords hashed with bcrypt (10 rounds)
- JWT-based session management
- Secure HTTP-only session cookies
- Input validation with Zod
- CSRF protection
- Rate limiting on authentication endpoints
- SQL injection protection via Prisma

---

## Documentation

- [Environment Setup Guide](VERCEL_ENV_SETUP.md) - Complete environment variable documentation
- [Docs Index](docs/README.md) - Additional documentation
- [Deployment Guides](docs/deployment/) - Deployment instructions
- [Testing Documentation](docs/testing/) - Test cases and credentials
- [Archived Planning Docs](docs/archive/) - Original planning documents

---

## Troubleshooting

### Build Fails with Prisma Error

Make sure Prisma config can find the schema:
```bash
npx prisma generate --config=config/prisma.config.ts
```

### Database Connection Issues

1. Check that `DATABASE_URL` uses the **pooled connection** (port 6543)
2. Verify credentials in Supabase dashboard
3. Test connection locally:
   ```bash
   npx prisma db pull
   ```

### Auth Issues in Production

1. Verify `AUTH_SECRET` is set in Vercel
2. Verify `AUTH_URL` matches your production URL
3. Clear browser cookies and try again

---

## License

Proprietary - All rights reserved

---

## Support

For issues or questions:
1. Check the documentation in `docs/`
2. Review environment variables in [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md)
3. Check Vercel deployment logs
