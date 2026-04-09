/**
 * Login activity log viewer
 *
 * Usage:
 *   npm run logs                          → last 7 days, all users
 *   npm run logs -- --days=30             → last 30 days
 *   npm run logs -- --email=x@example.com → filter by email
 *   npm run logs -- --email=x@example.com --days=30
 */

import { prisma } from '../src/lib/prisma';

// ── parse args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag: string) =>
  args.find((a) => a.startsWith(`--${flag}=`))?.split('=')[1];

const days  = parseInt(get('days') ?? '7', 10);
const email = get('email') ?? null;

// ── query ────────────────────────────────────────────────────────────────────
async function main() {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.loginLog.findMany({
    where: {
      createdAt: { gte: since },
      ...(email ? { email } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  // ── header ──────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` Login Logs — last ${days} day(s)${email ? `  |  email: ${email}` : ''}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (logs.length === 0) {
    console.log('  No entries found.\n');
    return;
  }

  // ── summary ──────────────────────────────────────────────────────────────
  const total    = logs.length;
  const success  = logs.filter((l) => l.success).length;
  const failed   = total - success;
  const uniqueIPs = new Set(logs.map((l) => l.ipAddress).filter(Boolean)).size;

  console.log(`  Total attempts : ${total}`);
  console.log(`  Successful     : ${success} ✅`);
  console.log(`  Failed         : ${failed} ❌`);
  console.log(`  Unique IPs     : ${uniqueIPs}`);
  console.log();

  // ── table ─────────────────────────────────────────────────────────────────
  const col = {
    time   : 20,
    result : 7,
    email  : 36,
    reason : 20,
    ip     : 16,
  };

  const pad = (s: string, n: number) => s.slice(0, n).padEnd(n);

  console.log(
    '  ' +
      pad('Time', col.time) +
      pad('Result', col.result) +
      pad('Email', col.email) +
      pad('Reason', col.reason) +
      pad('IP', col.ip)
  );
  console.log('  ' + '─'.repeat(col.time + col.result + col.email + col.reason + col.ip));

  for (const log of logs) {
    const time   = log.createdAt.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
    const result = log.success ? '✅' : '❌';
    const reason = log.reason ?? '';
    const ip     = log.ipAddress ?? '—';

    console.log(
      '  ' +
        pad(time, col.time) +
        pad(result, col.result) +
        pad(log.email, col.email) +
        pad(reason, col.reason) +
        pad(ip, col.ip)
    );
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
