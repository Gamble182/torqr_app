import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MARKER_NOTE = 'Aus Altdaten übernommen (ehem. requiredParts)';

async function main() {
  const systems = await prisma.customerSystem.findMany({
    where: { requiredParts: { not: null } },
    select: { id: true, requiredParts: true },
  });

  console.log(`Found ${systems.length} customer systems with legacy requiredParts.`);

  let created = 0;
  let skipped = 0;

  for (const s of systems) {
    const text = (s.requiredParts ?? '').trim();
    if (!text) { skipped++; continue; }

    // Idempotency: skip if marker override already exists for this system
    const existing = await prisma.customerSystemPartOverride.findFirst({
      where: { customerSystemId: s.id, note: MARKER_NOTE },
    });
    if (existing) { skipped++; continue; }

    await prisma.customerSystemPartOverride.create({
      data: {
        customerSystemId: s.id,
        action: 'ADD',
        category: 'SPARE_PART',
        description: text,
        quantity: 1,
        unit: 'Stck',
        required: true,
        sortOrder: 999,
        note: MARKER_NOTE,
      },
    });
    created++;
  }

  console.log(`Migrated: ${created} created, ${skipped} skipped.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
