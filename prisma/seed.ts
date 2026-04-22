import { PrismaClient, SystemType, StorageSubtype } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import heatingSystemsData from '../src/config/heating-systems.json';
import additionalCatalogData from '../src/config/additional-catalog.json';

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

interface AdditionalCatalogData {
  ac: ManufacturerEntry[];
  waterTreatment: ManufacturerEntry[];
  energyStorage: {
    boiler: ManufacturerEntry[];
    bufferTank: ManufacturerEntry[];
  };
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const heating = heatingSystemsData as HeatingSystemsData;
    const additional = additionalCatalogData as AdditionalCatalogData;
    const counts = { heating: 0, ac: 0, water: 0, storage: 0 };

    // HEATING
    for (const category of heating.heating_categories) {
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
          counts.heating++;
        }
      }
    }

    // AC
    for (const mfr of additional.ac) {
      for (const model of mfr.models) {
        await prisma.systemCatalog.upsert({
          where: {
            systemType_manufacturer_name: {
              systemType: SystemType.AC,
              manufacturer: mfr.manufacturer,
              name: model,
            },
          },
          update: {},
          create: {
            systemType: SystemType.AC,
            manufacturer: mfr.manufacturer,
            name: model,
            createdByUserId: null,
          },
        });
        counts.ac++;
      }
    }

    // WATER_TREATMENT
    for (const mfr of additional.waterTreatment) {
      for (const model of mfr.models) {
        await prisma.systemCatalog.upsert({
          where: {
            systemType_manufacturer_name: {
              systemType: SystemType.WATER_TREATMENT,
              manufacturer: mfr.manufacturer,
              name: model,
            },
          },
          update: {},
          create: {
            systemType: SystemType.WATER_TREATMENT,
            manufacturer: mfr.manufacturer,
            name: model,
            createdByUserId: null,
          },
        });
        counts.water++;
      }
    }

    // ENERGY_STORAGE — Boilers
    for (const mfr of additional.energyStorage.boiler) {
      for (const model of mfr.models) {
        await prisma.systemCatalog.upsert({
          where: {
            systemType_manufacturer_name: {
              systemType: SystemType.ENERGY_STORAGE,
              manufacturer: mfr.manufacturer,
              name: model,
            },
          },
          update: { storageSubtype: StorageSubtype.BOILER },
          create: {
            systemType: SystemType.ENERGY_STORAGE,
            manufacturer: mfr.manufacturer,
            name: model,
            storageSubtype: StorageSubtype.BOILER,
            createdByUserId: null,
          },
        });
        counts.storage++;
      }
    }

    // ENERGY_STORAGE — Buffer tanks
    for (const mfr of additional.energyStorage.bufferTank) {
      for (const model of mfr.models) {
        await prisma.systemCatalog.upsert({
          where: {
            systemType_manufacturer_name: {
              systemType: SystemType.ENERGY_STORAGE,
              manufacturer: mfr.manufacturer,
              name: model,
            },
          },
          update: { storageSubtype: StorageSubtype.BUFFER_TANK },
          create: {
            systemType: SystemType.ENERGY_STORAGE,
            manufacturer: mfr.manufacturer,
            name: model,
            storageSubtype: StorageSubtype.BUFFER_TANK,
            createdByUserId: null,
          },
        });
        counts.storage++;
      }
    }

    console.log(
      `Seeded catalog — HEATING: ${counts.heating}, AC: ${counts.ac}, WATER_TREATMENT: ${counts.water}, ENERGY_STORAGE: ${counts.storage} (total ${counts.heating + counts.ac + counts.water + counts.storage})`
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
