'use client';

import { useState, useMemo } from 'react';
import { SearchIcon, PlusIcon, Loader2Icon } from 'lucide-react';
import { useCatalog, useCreateCatalogEntry } from '@/hooks/useCatalog';
import type { CatalogEntry, SystemType } from '@/hooks/useCatalog';

interface CatalogPickerProps {
  systemType: SystemType;
  value: string; // catalogId
  onChange: (catalogId: string, entry: CatalogEntry) => void;
}

export function CatalogPicker({ systemType, value, onChange }: CatalogPickerProps) {
  const { data: entries = [], isLoading } = useCatalog(systemType);
  const createEntry = useCreateCatalogEntry();
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newName, setNewName] = useState('');

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.manufacturer.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogEntry[]>();
    for (const entry of filtered) {
      const existing = map.get(entry.manufacturer) ?? [];
      map.set(entry.manufacturer, [...existing, entry]);
    }
    return map;
  }, [filtered]);

  const selected = entries.find((e) => e.id === value);

  const handleAdd = async () => {
    if (!newManufacturer.trim() || !newName.trim()) return;
    const entry = await createEntry.mutateAsync({
      systemType,
      manufacturer: newManufacturer.trim(),
      name: newName.trim(),
      acSubtype: null,
      storageSubtype: null,
    });
    if (entry) {
      onChange(entry.id, entry);
      setShowAddForm(false);
      setNewManufacturer('');
      setNewName('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {selected && (
        <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg text-sm">
          <span className="font-medium text-foreground">
            {selected.manufacturer} — {selected.name}
          </span>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange('', entries[0])}
          >
            Ändern
          </button>
        </div>
      )}

      {!selected && (
        <>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Hersteller oder Modell suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {grouped.size === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Keine Einträge gefunden
              </p>
            )}
            {Array.from(grouped.entries()).map(([manufacturer, models]) => (
              <div key={manufacturer}>
                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/40 uppercase tracking-wide">
                  {manufacturer}
                </p>
                {models.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onChange(entry.id, entry)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                  >
                    {entry.name}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Neues Gerät zum Katalog hinzufügen
            </button>
          ) : (
            <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/20">
              <input
                type="text"
                placeholder="Hersteller"
                value={newManufacturer}
                onChange={(e) => setNewManufacturer(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              />
              <input
                type="text"
                placeholder="Modellbezeichnung"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={createEntry.isPending}
                  className="flex-1 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {createEntry.isPending ? 'Speichern...' : 'Hinzufügen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
