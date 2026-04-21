// src/components/SystemChecklistManager.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  TrashIcon,
  Loader2Icon,
  ListChecksIcon,
} from 'lucide-react';
import {
  useChecklistItems,
  useAddChecklistItem,
  useDeleteChecklistItem,
} from '@/hooks/useChecklistItems';

interface SystemChecklistManagerProps {
  systemId: string;
}

export function SystemChecklistManager({ systemId }: SystemChecklistManagerProps) {
  const [expanded, setExpanded] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [addError, setAddError] = useState('');

  const { data: items = [], isLoading, error } = useChecklistItems(systemId);
  const addItem = useAddChecklistItem(systemId);
  const deleteItem = useDeleteChecklistItem(systemId);

  const handleAdd = async () => {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      setAddError('Bezeichnung ist erforderlich');
      return;
    }
    if (trimmed.length > 200) {
      setAddError('Bezeichnung zu lang (max. 200 Zeichen)');
      return;
    }
    setAddError('');
    try {
      await addItem.mutateAsync(trimmed);
      setNewLabel('');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync(itemId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  return (
    <div className="border-t border-border mt-3 pt-3">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left py-1"
      >
        <ListChecksIcon className="h-3.5 w-3.5 shrink-0" />
        <span>Checkliste verwalten</span>
        {items.length > 0 && (
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
            {items.length} eigene
          </span>
        )}
        {expanded ? (
          <ChevronUpIcon className="h-3.5 w-3.5 ml-auto shrink-0" />
        ) : (
          <ChevronDownIcon className="h-3.5 w-3.5 ml-auto shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
              Wird geladen…
            </div>
          )}

          {error && !isLoading && (
            <p className="text-xs text-destructive">
              Fehler beim Laden der Einträge
            </p>
          )}

          {!isLoading && !error && items.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Noch keine eigenen Einträge. Fügen Sie individuelle Prüfpunkte für
              dieses System hinzu.
            </p>
          )}

          {items.length > 0 && (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
                >
                  <span className="flex-1 text-xs text-foreground">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteItem.isPending}
                    title="Eintrag löschen"
                    className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 shrink-0 p-0.5"
                  >
                    {deleteItem.isPending ? (
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => {
                  setNewLabel(e.target.value);
                  setAddError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="z.B. Eigener Prüfpunkt"
                className={`h-9 text-base flex-1 ${addError ? 'border-destructive' : ''}`}
                maxLength={200}
                disabled={addItem.isPending}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAdd}
                disabled={addItem.isPending || !newLabel.trim()}
                className="h-9 shrink-0"
              >
                {addItem.isPending ? (
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlusIcon className="h-3.5 w-3.5" />
                )}
                Hinzufügen
              </Button>
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
