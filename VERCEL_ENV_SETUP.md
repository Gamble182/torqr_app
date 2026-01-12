# Vercel Environment Variables Setup

Follow these steps to configure your environment variables in Vercel:

## 1. Go to Your Vercel Project
- Navigate to your project dashboard on Vercel
- Click on **Settings** → **Environment Variables**

## 2. Add/Update These Environment Variables

### Database Configuration (REQUIRED)

**DATABASE_URL** (Pooled connection for runtime queries)
```
postgresql://postgres.vvsmxzebaoslofigxakt:yCJGTJ9NAxVuBwwz@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```
- Environments: Production, Preview, Development

**DIRECT_URL** (Direct connection for migrations - if needed)
```
postgresql://postgres:yCJGTJ9NAxVuBwwz@db.vvsmxzebaoslofigxakt.supabase.co:5432/postgres
```
- Environments: Production, Preview, Development

### Authentication (REQUIRED)

**AUTH_SECRET**
```
OTkyMjBkM2EtNjIyYi00MTI1LWFkMjEtNmQwMTNiYTgzNzUw
```
- Environments: Production, Preview, Development

**AUTH_URL**
- Production: `https://your-production-domain.com`
- Preview: `https://your-preview-domain.vercel.app`
- Development: `http://localhost:3000`

**JWT_SECRET**
```
OTkyMjBkM2EtNjIyYi00MTI1LWFkMjEtNmQwMTNiYTgzNzUw
```
- Environments: Production, Preview, Development

### Email Service (REQUIRED)

**RESEND_API_KEY**
```
re_V4UXzyBc_KrAFzes9pnXpp4aD4NrLvfVr
```
- Environments: Production, Preview, Development

### Supabase Storage (REQUIRED)

**NEXT_PUBLIC_SUPABASE_URL**
```
https://vvsmxzebaoslofigxakt.supabase.co
```
- Environments: Production, Preview, Development

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2c214emViYW9zbG9maWd4YWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NjA5MzksImV4cCI6MjA4MTAzNjkzOX0.TxlAMIG2itia_a2F37gbD1e_M9lC-U0L-KwVQ6ZCqEs
```
- Environments: Production, Preview, Development

**SUPABASE_SERVICE_ROLE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2c214emViYW9zbG9maWd4YWt0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQ2MDkzOSwiZXhwIjoyMDgxMDM2OTM5fQ.PGm1ALw2Ux57F8zNjCQ1SHpHc_7ToX0IimKO67vkB3E
```
- Environments: Production, Preview, Development

### Cron Jobs (REQUIRED)

**CRON_SECRET**
```
OTkyMjBkM2EtNjIyYi00MTI1LWFkMjEtNmQwMTNiYTgzNzUw
```
- Environments: Production, Preview, Development

### App Configuration (REQUIRED)

**NEXT_PUBLIC_APP_URL**
- Production: `https://your-production-domain.com` (e.g., `https://heizungsmeister.de`)
- Preview: Leave empty or use your preview URL
- Development: `http://localhost:3000`

**NODE_ENV**
- Production: `production`
- Preview: `production`
- Development: `development`

### Error Tracking (OPTIONAL)

**NEXT_PUBLIC_SENTRY_DSN**
```
https://81da3e96805fc318440d57e97ef01b5c@o4510517828976640.ingest.de.sentry.io/4510517832056912
```
- Environments: Production, Preview (optional for Development)

### Other Variables

**SKIP_ENV_VALIDATION** (Already set in vercel.json)
```
true
```
- Environments: Production, Preview, Development

## 3. Important Notes

1. **DATABASE_URL uses the pooled connection** (port 6543) - This is essential for Vercel's serverless environment
2. **DIRECT_URL uses the direct connection** (port 5432) - Only needed if you run migrations from Vercel (not recommended)
3. Make sure to **update AUTH_URL and NEXT_PUBLIC_APP_URL** with your actual production domain
4. After adding all variables, **redeploy your application**

## 4. Running Migrations

Migrations should be run **locally** or via a dedicated CI/CD step, NOT during Vercel builds:

```bash
npm run migrate:deploy
```

This uses the `DIRECT_URL` from your local `.env` file.
