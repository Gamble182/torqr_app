import { PrismaClient, SystemType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import heatingSystemsData from '../src/config/heating-systems.json';

interface ManufacturerEntry {
  manufacturer: string;
  models: string[];
}

interface CategoryEntry {
  category: string;
  manufacturers: ManufacturerEntry[];
}

interface HeatingSystemsData {
  heating_categories: CategoryEntry[];
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const data = heatingSystemsData as HeatingSystemsData;
    let count = 0;

    for (const category of data.heating_categories) {
      for (const mfr of category.manufacturers) {
        for (const model of mfr.models) {
          await prisma.systemCatalog.upsert({
            where: {
              systemType_manufacturer_name: {
                systemType: SystemType.HEATING,
                manufacturer: mfr.manufacturer,
                name: model,
              },
            },
            update: {},
            create: {
              systemType: SystemType.HEATING,
              manufacturer: mfr.manufacturer,
              name: model,
              createdByUserId: null,
            },
          });
          count++;
        }
      }
    }

    console.log(`Seeded ${count} heating system catalog entries.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
