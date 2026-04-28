import type { PartCategory } from '@prisma/client';

export function formatPartCategory(cat: PartCategory): string {
  switch (cat) {
    case 'SPARE_PART':
      return 'Ersatzteil';
    case 'CONSUMABLE':
      return 'Verbrauchsmaterial';
    case 'TOOL':
      return 'Werkzeug';
  }
}
