const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database...');

    // Run migration
    await client.query(`
      -- AlterTable heaters
      ALTER TABLE "heaters"
      ADD COLUMN IF NOT EXISTS "heaterType" TEXT,
      ADD COLUMN IF NOT EXISTS "manufacturer" TEXT,
      ADD COLUMN IF NOT EXISTS "hasStorage" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "storageManufacturer" TEXT,
      ADD COLUMN IF NOT EXISTS "storageModel" TEXT,
      ADD COLUMN IF NOT EXISTS "storageCapacity" INTEGER,
      ADD COLUMN IF NOT EXISTS "hasBattery" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "batteryManufacturer" TEXT,
      ADD COLUMN IF NOT EXISTS "batteryModel" TEXT,
      ADD COLUMN IF NOT EXISTS "batteryCapacity" DOUBLE PRECISION;
    `);

    console.log('✅ Added new heater fields');

    // Make customerId nullable
    await client.query(`
      ALTER TABLE "heaters"
      ALTER COLUMN "customerId" DROP NOT NULL;
    `);

    console.log('✅ Made customerId nullable');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
