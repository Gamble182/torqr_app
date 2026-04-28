/**
 * Idempotent Supabase Storage bucket setup.
 *
 * Creates the buckets the app expects to exist when uploading photos.
 * Safe to re-run — existing buckets are skipped.
 *
 * Run locally with:
 *   npx tsx scripts/create-storage-buckets.ts
 *
 * Required env vars (loaded from .env via dotenv/config):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

interface BucketSpec {
  id: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
}

const BUCKETS: BucketSpec[] = [
  {
    id: 'maintenance-photos',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  }

  const supabase = createClient(url, serviceKey);
  const { data: existing, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }
  const existingIds = new Set((existing ?? []).map((b) => b.id));

  for (const spec of BUCKETS) {
    if (existingIds.has(spec.id)) {
      console.log(`✓ Bucket '${spec.id}' already exists — skipping`);
      continue;
    }
    const { error } = await supabase.storage.createBucket(spec.id, {
      public: spec.public,
      fileSizeLimit: spec.fileSizeLimit,
      allowedMimeTypes: spec.allowedMimeTypes,
    });
    if (error) {
      throw new Error(`Failed to create bucket '${spec.id}': ${error.message}`);
    }
    console.log(`+ Created bucket '${spec.id}' (public=${spec.public}, max=${spec.fileSizeLimit}B)`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
