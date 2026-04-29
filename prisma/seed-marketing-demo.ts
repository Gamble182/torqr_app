import { PrismaClient, SystemType, UserRole, EmailOptInStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';

/**
 * Marketing-Demo-Seed
 *
 * Erzeugt einen anonymisierten Demo-Datenbestand fuer Screenshots der
 * oeffentlichen Landingpage:
 *   - 1 Demo-Company "Beispiel-Heizung GmbH"
 *   - 1 OWNER (demo@torqr.de) + 1 TECHNICIAN (tech@torqr.de)
 *   - 5 anonyme Beispiel-Kunden
 *   - 8 CustomerSystems (Mix aus 4 SystemTypes: HEATING, AC, WATER_TREATMENT, ENERGY_STORAGE)
 *   - 12 historische Wartungen mit Checklist-Snapshot
 *
 * Idempotent: kann mehrfach ausgefuehrt werden, ohne Duplikate zu erzeugen.
 *
 * Achtung: Wird NICHT automatisch ausgefuehrt — manueller Aufruf via
 *   `npm run seed:marketing-demo`
 * vor dem Screenshot-Capture (Phase 7 / Task 32).
 */

interface CustomerSeed {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  email: string;
  phone: string;
}

interface SystemSeed {
  customerIdx: number;
  type: SystemType;
  assignedTo?: string;
}

const DEMO_COMPANY_NAME = 'Beispiel-Heizung GmbH';
const DEMO_OWNER_EMAIL = 'demo@torqr.de';
const DEMO_TECH_EMAIL = 'tech@torqr.de';
const DEMO_PASSWORD = 'demo-password-not-for-production';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Seeding marketing demo data ...');

    // ------------------------------------------------------------------
    // 1) Demo-Company (Company.name has no @unique constraint -> findFirst)
    // ------------------------------------------------------------------
    let company = await prisma.company.findFirst({ where: { name: DEMO_COMPANY_NAME } });
    if (!company) {
      company = await prisma.company.create({ data: { name: DEMO_COMPANY_NAME } });
    }

    // ------------------------------------------------------------------
    // 2) Demo-Users (User.email is @unique -> upsert is safe)
    // ------------------------------------------------------------------
    const passwordHash = await hash(DEMO_PASSWORD, 12);

    const owner = await prisma.user.upsert({
      where: { email: DEMO_OWNER_EMAIL },
      update: {},
      create: {
        email: DEMO_OWNER_EMAIL,
        name: 'Demo Owner',
        passwordHash,
        role: UserRole.OWNER,
        companyId: company.id,
        mustChangePassword: false,
      },
    });

    const tech = await prisma.user.upsert({
      where: { email: DEMO_TECH_EMAIL },
      update: {},
      create: {
        email: DEMO_TECH_EMAIL,
        name: 'Demo Techniker',
        passwordHash,
        role: UserRole.TECHNICIAN,
        companyId: company.id,
        mustChangePassword: false,
      },
    });

    console.log(`Demo-Company + 2 Users (OWNER, TECHNICIAN) bereit`);

    // ------------------------------------------------------------------
    // 3) 5 anonyme Beispiel-Kunden (kein compound unique -> findFirst)
    // ------------------------------------------------------------------
    const customerSeeds: CustomerSeed[] = [
      {
        name: 'Familie Mueller',
        street: 'Musterstr. 1',
        zipCode: '10115',
        city: 'Berlin',
        email: 'mueller@example.com',
        phone: '030 1234567',
      },
      {
        name: 'Schmidt & Soehne GbR',
        street: 'Hauptstr. 42',
        zipCode: '20095',
        city: 'Hamburg',
        email: 'kontakt@schmidt-soehne.example',
        phone: '040 7654321',
      },
      {
        name: 'Familie Becker',
        street: 'Bahnhofstr. 8',
        zipCode: '50667',
        city: 'Koeln',
        email: 'becker@example.com',
        phone: '0221 998877',
      },
      {
        name: 'Hotel Sonnenhof',
        street: 'Wiesenweg 17',
        zipCode: '80331',
        city: 'Muenchen',
        email: 'rezeption@sonnenhof.example',
        phone: '089 555123',
      },
      {
        name: 'Familie Wagner',
        street: 'Eichenring 3',
        zipCode: '60311',
        city: 'Frankfurt',
        email: 'wagner@example.com',
        phone: '069 332211',
      },
    ];

    for (const c of customerSeeds) {
      const existing = await prisma.customer.findFirst({
        where: { companyId: company.id, email: c.email },
      });
      if (!existing) {
        await prisma.customer.create({
          data: {
            ...c,
            companyId: company.id,
            userId: owner.id,
            emailOptIn: EmailOptInStatus.CONFIRMED,
          },
        });
      }
    }

    console.log('5 Kunden bereit');

    // ------------------------------------------------------------------
    // 4) 8 Anlagen — Mix aus 4 SystemTypes
    //    Idempotenz: bei bereits vorhandenen Systems (>= 8) Schritt skippen
    // ------------------------------------------------------------------
    const allCustomers = await prisma.customer.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'asc' },
    });

    if (allCustomers.length < 5) {
      throw new Error(`Erwartet 5 Kunden, gefunden ${allCustomers.length}`);
    }

    const existingSystems = await prisma.customerSystem.findMany({
      where: { companyId: company.id },
    });

    if (existingSystems.length >= 8) {
      console.log(`8+ Anlagen bereits vorhanden (${existingSystems.length}) — skip`);
    } else {
      // Catalog-Eintraege pro SystemType vorbereiten
      const heatingCat = await prisma.systemCatalog.findFirst({
        where: { systemType: SystemType.HEATING },
      });
      const acCat = await prisma.systemCatalog.findFirst({
        where: { systemType: SystemType.AC },
      });
      const waterCat = await prisma.systemCatalog.findFirst({
        where: { systemType: SystemType.WATER_TREATMENT },
      });
      const storageCat = await prisma.systemCatalog.findFirst({
        where: { systemType: SystemType.ENERGY_STORAGE },
      });

      if (!heatingCat || !acCat || !waterCat || !storageCat) {
        throw new Error(
          'SystemCatalog ist unvollstaendig — bitte erst `npx tsx prisma/seed.ts` ausfuehren.'
        );
      }

      const catalogByType: Record<SystemType, { id: string }> = {
        [SystemType.HEATING]: heatingCat,
        [SystemType.AC]: acCat,
        [SystemType.WATER_TREATMENT]: waterCat,
        [SystemType.ENERGY_STORAGE]: storageCat,
      };

      const systemMix: SystemSeed[] = [
        { customerIdx: 0, type: SystemType.HEATING },
        { customerIdx: 0, type: SystemType.AC, assignedTo: tech.id },
        { customerIdx: 1, type: SystemType.HEATING, assignedTo: tech.id },
        { customerIdx: 2, type: SystemType.HEATING },
        { customerIdx: 2, type: SystemType.WATER_TREATMENT },
        { customerIdx: 3, type: SystemType.HEATING, assignedTo: tech.id },
        { customerIdx: 4, type: SystemType.ENERGY_STORAGE },
        { customerIdx: 4, type: SystemType.HEATING },
      ];

      for (const m of systemMix) {
        const cust = allCustomers[m.customerIdx];
        const cat = catalogByType[m.type];
        const installYear = 2020 + Math.floor(Math.random() * 4);
        const nextDays = 7 + Math.floor(Math.random() * 28);
        await prisma.customerSystem.create({
          data: {
            customerId: cust.id,
            companyId: company.id,
            userId: owner.id,
            catalogId: cat.id,
            installationDate: new Date(installYear, 5, 15),
            maintenanceInterval: 12,
            nextMaintenance: new Date(Date.now() + nextDays * 86_400_000),
            assignedToUserId: m.assignedTo ?? null,
          },
        });
      }

      console.log('8 Anlagen angelegt');
    }

    // ------------------------------------------------------------------
    // 5) 12 historische Wartungen mit Checklist-Snapshot
    // ------------------------------------------------------------------
    const allSystems = await prisma.customerSystem.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'asc' },
    });

    if (allSystems.length === 0) {
      throw new Error('Keine CustomerSystems vorhanden — Wartungen koennen nicht angelegt werden.');
    }

    const existingMaintenances = await prisma.maintenance.count({
      where: { companyId: company.id },
    });

    if (existingMaintenances >= 12) {
      console.log(`12+ Wartungen bereits vorhanden (${existingMaintenances}) — skip`);
    } else {
      const monthsAgo = (n: number) => new Date(Date.now() - n * 30 * 86_400_000);
      const toCreate = 12 - existingMaintenances;
      for (let i = 0; i < toCreate; i++) {
        const sys = allSystems[i % allSystems.length];
        await prisma.maintenance.create({
          data: {
            systemId: sys.id,
            companyId: company.id,
            userId: owner.id,
            date: monthsAgo(i + 1),
            notes: `Demo-Wartung ${i + 1}: Routine-Check, alles in Ordnung.`,
            checklistData: {
              items: [
                { label: 'Drucktest', done: true },
                { label: 'Sichtpruefung', done: true },
              ],
            },
            photos: [],
          },
        });
      }

      console.log(`${toCreate} Wartungen angelegt`);
    }

    console.log('Marketing-Demo-Seed fertig.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
