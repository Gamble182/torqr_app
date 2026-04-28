'use client';

import { InventoryList } from '@/components/inventory/InventoryList';

export default function LagerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lager</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lagerteile und Bestandsführung
        </p>
      </div>
      <InventoryList />
    </div>
  );
}
