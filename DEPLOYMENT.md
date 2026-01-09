# Torqr MVP - Deployment Guide

**Version:** 1.0
**Date:** 09.01.2026
**Goal:** Deploy to staging/production for mobile access

---

## Quick Start - Recommended: Vercel (Easiest)

Vercel is the creator of Next.js and offers the smoothest deployment experience with automatic HTTPS and global CDN.

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase project configured
- Database accessible from external connections

### Step 1: Push Code to GitHub

```bash
# If not already initialized
git init
git add .
git commit -m "Ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/torqr-app.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign in with GitHub
   - Click "Add New Project"

2. **Import Repository**
   - Select your `torqr-app` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Environment Variables**
   Click "Environment Variables" and add:

   ```env
   # Database
   DATABASE_URL=your_production_database_url
   DIRECT_URL=your_direct_database_url

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Auth (Generate new secrets for production!)
   NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
   NEXTAUTH_URL=https://your-app.vercel.app

   # Sentry (Optional)
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   SENTRY_AUTH_TOKEN=your_sentry_token
   ```

   **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Get your URL: `https://your-app.vercel.app`

### Step 3: Update NEXTAUTH_URL

After first deployment:
1. Copy your Vercel URL
2. Go to Vercel Dashboard → Settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual URL
4. Redeploy (Deployments → ⋯ → Redeploy)

### Step 4: Test on Mobile

1. Open your Vercel URL on mobile browser
2. Register a new account
3. Test all features using [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)

---

## Alternative: Railway (Database + App Hosting)

Railway offers simple deployment with built-in PostgreSQL database.

### Step 1: Setup Railway

1. **Sign up**: https://railway.app
2. **Create New Project**
3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway provides `DATABASE_URL` automatically

### Step 2: Add Your App

1. **Click "New" → "GitHub Repo"**
2. **Connect your repository**
3. **Add environment variables** (same as Vercel list above)
4. **Railway auto-detects Next.js** and builds

### Step 3: Get Public URL

1. Go to your service
2. Settings → Generate Domain
3. Copy your URL: `https://your-app.railway.app`

---

## Alternative: Render

Render offers free tier with static sites and PostgreSQL.

### Step 1: Create Web Service

1. **Sign up**: https://render.com
2. **New** → **Web Service**
3. **Connect GitHub repository**

### Step 2: Configure

- **Name**: torqr-app
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free (or Starter for always-on)

### Step 3: Environment Variables

Add all variables from the list above.

### Step 4: Create PostgreSQL Database

1. **New** → **PostgreSQL**
2. Copy **Internal Database URL**
3. Add as `DATABASE_URL` to your web service

---

## Database Migration (Important!)

After deploying, you need to push your Prisma schema to the production database.

### Option A: Using Prisma CLI (Local)

```bash
# Set production DATABASE_URL temporarily
DATABASE_URL="your_production_db_url" npx prisma db push

# Or migrate (recommended for production)
DATABASE_URL="your_production_db_url" npx prisma migrate deploy
```

### Option B: Using Platform CLI

**Vercel:**
```bash
vercel env pull .env.production
npx prisma db push
```

**Railway:**
```bash
railway run npx prisma db push
```

---

## Supabase Storage Configuration

Your Supabase bucket needs to be accessible from production.

### 1. Create Storage Bucket

1. Go to Supabase Dashboard
2. Storage → Create Bucket
3. Name: `maintenance-photos`
4. Public: Yes (for photo viewing)

### 2. Set Up RLS Policies

```sql
-- Allow authenticated users to INSERT
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'maintenance-photos');

-- Allow public SELECT (important for viewing photos!)
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'maintenance-photos');

-- Allow authenticated users to DELETE
CREATE POLICY "Authenticated users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'maintenance-photos');
```

**IMPORTANT**: Make sure SELECT policy targets `public`, not `authenticated`!

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain (e.g., `app.torqr.de`)
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable
5. Redeploy

### Railway
1. Settings → Generate Domain → Custom Domain
2. Add your domain
3. Update DNS CNAME record
4. Update environment variables

---

## Performance & Scaling Considerations

### Database Connection Pooling

For production, use connection pooling to avoid hitting database connection limits.

**Prisma with PgBouncer (Recommended):**

```env
# Direct connection for migrations
DIRECT_URL="postgresql://user:password@host:5432/db"

# Pooled connection for app
DATABASE_URL="postgresql://user:password@host:6543/db?pgbouncer=true"
```

### Caching

Consider adding:
- Redis for session storage
- CDN for static assets (Vercel includes this)
- Database query caching

---

## Monitoring & Debugging

### View Logs

**Vercel:**
- Dashboard → Project → Logs
- Real-time function logs

**Railway:**
- Service → Logs tab
- Real-time streaming

**Render:**
- Service → Logs tab

### Common Issues

**Issue: "Database connection failed"**
- Solution: Check `DATABASE_URL` is correct
- Ensure database accepts external connections
- Check firewall/network settings

**Issue: "NEXTAUTH_URL not set"**
- Solution: Add environment variable with full URL including https://

**Issue: "Supabase photos not loading"**
- Solution: Check RLS policies (SELECT should be public)
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys

**Issue: "Build timeout"**
- Solution: Increase build timeout in platform settings
- Check for infinite loops in build scripts

**Issue: "API route 404"**
- Solution: Check route files are in correct location
- Ensure build completed successfully

---

## Security Checklist for Production

Before going live:

- [ ] **Generate new NEXTAUTH_SECRET** (don't reuse development secret)
- [ ] **Use production database** (separate from development)
- [ ] **Enable HTTPS** (automatic on Vercel/Railway/Render)
- [ ] **Restrict database access** (only from app server IP)
- [ ] **Rotate Supabase keys** if shared publicly
- [ ] **Set up Sentry** for error tracking
- [ ] **Configure rate limiting** (already implemented in proxy.ts)
- [ ] **Review environment variables** (no hardcoded secrets)
- [ ] **Test authentication flow** end-to-end
- [ ] **Backup database** before migrations

---

## Cost Estimates (Monthly)

### Free Tier (Good for Demo/Testing)
- **Vercel Free**: Unlimited deployments, 100GB bandwidth
- **Supabase Free**: 500MB database, 1GB file storage
- **Railway Free**: $5 credit/month (limited usage)
- **Total**: $0/month (with limitations)

### Starter Tier (Production-Ready)
- **Vercel Pro**: $20/month (team features, analytics)
- **Supabase Pro**: $25/month (8GB database, 100GB storage)
- **Railway/Render**: $7-10/month (dedicated resources)
- **Total**: ~$50-55/month

### Recommended for MVP
Start with **free tier** for demo/testing, upgrade to **starter tier** when you get your first paying customer.

---

## Quick Deployment Checklist

Ready to deploy? Use this checklist:

1. [ ] Code pushed to GitHub
2. [ ] Created account on deployment platform (Vercel recommended)
3. [ ] Production database created and accessible
4. [ ] Supabase project configured with storage bucket
5. [ ] All environment variables prepared
6. [ ] Generated new `NEXTAUTH_SECRET` for production
7. [ ] Connected repository to deployment platform
8. [ ] Added all environment variables
9. [ ] Triggered first deployment
10. [ ] Ran database migrations (`prisma db push`)
11. [ ] Updated `NEXTAUTH_URL` with actual deployment URL
12. [ ] Redeployed after URL update
13. [ ] Tested registration and login
14. [ ] Tested all CRUD operations
15. [ ] Tested photo upload to Supabase
16. [ ] Verified mobile access
17. [ ] Shared URL with colleague for testing

---

## Support & Troubleshooting

### Platform Documentation
- **Vercel**: https://vercel.com/docs
- **Railway**: https://docs.railway.app
- **Render**: https://render.com/docs
- **Supabase**: https://supabase.com/docs

### Get Help
- Next.js Discord: https://nextjs.org/discord
- Vercel Support: support@vercel.com
- Check platform status pages for outages

---

## Next Steps After Deployment

1. **Test Everything**: Use [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)
2. **Show to Colleague**: Get feedback on mobile experience
3. **Monitor Performance**: Check loading times and errors
4. **Iterate**: Fix any issues discovered during testing
5. **Consider Custom Domain**: For professional appearance
6. **Set Up Backups**: Database backup schedule
7. **Plan Monitoring**: Sentry for errors, analytics for usage

---

**Last Updated:** 09.01.2026
**Author:** Y. Dorth

Good luck with your deployment! 🚀
