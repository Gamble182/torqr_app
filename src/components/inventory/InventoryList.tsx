'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInventoryItems } from '@/hooks/useInventory';
import { InventoryStatusBadge } from './InventoryStatusBadge';

type InventoryFilter = 'all' | 'low';

export function InventoryList() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === 'OWNER';

  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: items, isLoading, error } = useInventoryItems(
    filter === 'low' ? 'low' : undefined
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        Fehler beim Laden des Lagers
      </div>
    );
  }

  const isEmpty = !items || items.length === 0;

  return (
    <div className="space-y-4">
      {/* Toolbar: filter toggle + create CTA */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-md border bg-card p-0.5">
          <Button
            type="button"
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Alle
          </Button>
          <Button
            type="button"
            variant={filter === 'low' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('low')}
          >
            Nur niedrig
          </Button>
        </div>

        {isOwner && (
          <Button onClick={() => setShowCreateForm(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Neues Lagerteil
          </Button>
        )}
      </div>

      {/* Table */}
      {isEmpty ? (
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
          {filter === 'low'
            ? 'Keine Artikel mit niedrigem Bestand'
            : 'Noch keine Lagerteile angelegt'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Artikelnummer</th>
                <th className="px-3 py-2.5 text-left font-medium">Bezeichnung</th>
                <th className="px-3 py-2.5 text-left font-medium">Bestand</th>
                <th className="px-3 py-2.5 text-left font-medium">Mindestmenge</th>
                <th className="px-3 py-2.5 text-left font-medium">Einheit</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedItemId(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedItemId(item.id);
                    }
                  }}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                    {item.articleNumber ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{item.description}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{item.currentStock}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                    {item.minStock}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                    {item.unit}
                  </td>
                  <td className="px-3 py-2.5">
                    <InventoryStatusBadge
                      currentStock={item.currentStock}
                      minStock={item.minStock}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TODO Task 26: <InventoryDrawer itemId={selectedItemId} onClose={() => setSelectedItemId(null)} /> */}
      {/* TODO Task 26: <InventoryItemForm open={showCreateForm} onClose={() => setShowCreateForm(false)} /> */}
      {/* Suppress unused-state lint until Task 26 wires the drawer / form. */}
      {selectedItemId !== null && null}
      {showCreateForm && null}
    </div>
  );
}
