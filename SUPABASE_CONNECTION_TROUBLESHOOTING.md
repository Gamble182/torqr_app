# Supabase Connection Troubleshooting

## Current Issues Detected

1. **IPv6 Connectivity**: Database endpoint only resolves to IPv6, but your network lacks IPv6 support
2. **Corporate Firewall**: PostgreSQL ports (5432, 6543) appear blocked
3. **Possible Project Pause**: Supabase free tier projects pause after inactivity

## Steps to Resolve

### Step 1: Wake Up Your Supabase Project

1. Visit: https://supabase.com/dashboard/project/vvsmxzebaoslofigxakt
2. If the project shows as "Paused", click **Restore** or wait for it to wake up
3. Check the project status indicator (should be green)

### Step 2: Get Correct Connection String

1. In Supabase Dashboard → **Settings** → **Database**
2. Under **Connection Info**, find two connection strings:
   - **Connection string** (Direct, port 5432) - for migrations
   - **Connection pooling** (Pooler, port 6543) - for app connections

3. Copy both strings and update your `.env` file:

```env
# Use Connection Pooling for app
DATABASE_URL="postgresql://postgres.vvsmxzebaoslofigxakt:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Use Direct Connection for migrations
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.vvsmxzebaoslofigxakt.supabase.co:5432/postgres"
```

**Important**: Replace `[PASSWORD]` with your actual password: `yCJGTJ9NAxVuBwwz`

### Step 3: Network Connectivity Options

If corporate firewall blocks database ports, try these alternatives:

#### Option A: Use Supabase REST API
Instead of direct database connections, use Supabase client SDK which uses HTTPS (port 443):

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

#### Option B: Connect from Different Network
- Use mobile hotspot
- Work from home network
- Use VPN if available

#### Option C: Enable IPv6 on Your Network
Contact IT to enable global IPv6 connectivity (less likely to be approved)

### Step 4: Verify Connection

After updating `.env`, test the connection:

```bash
npx tsx scripts/create-test-user.ts
```

## Alternative: Manual User Creation via Supabase Dashboard

If you can't connect from your machine:

1. Go to Supabase Dashboard → **Table Editor**
2. Select the `users` table
3. Click **Insert row**
4. Fill in:
   - `id`: (auto-generated UUID)
   - `email`: test@torqr.app
   - `passwordHash`: [see below for hash]
   - `name`: Test User
   - `createdAt`: (auto-generated)
   - `updatedAt`: (auto-generated)

To generate password hash for "Test123!":
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Test123!', 12).then(hash => console.log(hash))"
```

## Testing Connectivity from Command Line

```bash
# Test DNS resolution
nslookup db.vvsmxzebaoslofigxakt.supabase.co

# Test pooler connectivity
curl -v telnet://aws-0-eu-central-1.pooler.supabase.com:6543

# Test with Prisma
npx prisma db execute --stdin <<< "SELECT 1"
```

## Contact Support

If none of these work:
- Supabase Support: https://supabase.com/support
- Check Supabase Status: https://status.supabase.com
- Your IT department for firewall rules
