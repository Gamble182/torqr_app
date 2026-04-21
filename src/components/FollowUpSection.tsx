'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  PlusIcon,
  TrashIcon,
  Loader2Icon,
  CheckCircle2Icon,
  CircleIcon,
  WrenchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useFollowUpJobs,
  useCreateFollowUpJob,
  useUpdateFollowUpJob,
  useDeleteFollowUpJob,
} from '@/hooks/useFollowUpJobs';

interface FollowUpSectionProps {
  systemId: string;
}

export function FollowUpSection({ systemId }: FollowUpSectionProps) {
  const { data: followUps = [], isLoading } = useFollowUpJobs(systemId);
  const createFollowUp = useCreateFollowUpJob(systemId);
  const updateFollowUp = useUpdateFollowUpJob(systemId);
  const deleteFollowUp = useDeleteFollowUpJob(systemId);

  const [newLabel, setNewLabel] = useState('');

  const openCount = followUps.filter((f) => !f.completed).length;

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    await createFollowUp.mutateAsync({ label });
    setNewLabel('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    updateFollowUp.mutate({ id, completed: !currentlyCompleted });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Nachfolgeauftrag wirklich löschen?')) return;
    deleteFollowUp.mutate(id);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <WrenchIcon className="h-4 w-4 text-muted-foreground" />
          Nachfolgeaufträge
          {openCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-status-due-bg text-warning-foreground border border-warning/20">
              {openCount} offen
            </span>
          )}
        </h2>
      </div>

      {/* Inline add form */}
      <div className="flex gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Neuen Nachfolgeauftrag hinzufügen…"
          maxLength={200}
          className="flex-1"
          disabled={createFollowUp.isPending}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newLabel.trim() || createFollowUp.isPending}
        >
          {createFollowUp.isPending ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
          Hinzufügen
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : followUps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Keine Nachfolgeaufträge vorhanden.
        </p>
      ) : (
        <ul className="space-y-2">
          {followUps.map((item) => (
            <li
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                item.completed
                  ? 'border-border bg-muted/30'
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggle(item.id, item.completed)}
                className="mt-0.5 shrink-0"
                disabled={updateFollowUp.isPending}
              >
                {item.completed ? (
                  <CheckCircle2Icon className="h-5 w-5 text-success" />
                ) : (
                  <CircleIcon className="h-5 w-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    item.completed
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {format(new Date(item.createdAt), 'dd. MMM yyyy', { locale: de })}
                  {item.completed && item.completedAt && (
                    <> · Erledigt am {format(new Date(item.completedAt), 'dd. MMM yyyy', { locale: de })}</>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-status-overdue-bg transition-colors"
                disabled={deleteFollowUp.isPending}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
