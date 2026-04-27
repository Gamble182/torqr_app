'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  ArrowLeftIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useMaintenanceSet,
  useDeleteMaintenanceSet,
} from '@/hooks/useMaintenanceSets';
import type { MaintenanceSetItem } from '@/hooks/useMaintenanceSets';
import { SYSTEM_TYPE_LABELS } from '@/lib/constants';
import { MaintenanceSetItemsTable } from './MaintenanceSetItemsTable';
import { MaintenanceSetItemForm } from './MaintenanceSetItemForm';

interface MaintenanceSetDetailProps {
  id: string;
}

export function MaintenanceSetDetail({ id }: MaintenanceSetDetailProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: set, isLoading, error } = useMaintenanceSet(id);
  const deleteSet = useDeleteMaintenanceSet();

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MaintenanceSetItem | undefined>(undefined);
  const [showDeleteSetDialog, setShowDeleteSetDialog] = useState(false);

  // Redirect non-owners (wait for session to load first)
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (status === 'authenticated' && session?.user?.role !== 'OWNER') {
    router.replace('/dashboard');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/wartungssets')}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="text-center py-20 text-destructive">
          Fehler beim Laden des Wartungssets
        </div>
      </div>
    );
  }

  const openCreateForm = () => {
    setEditingItem(undefined);
    setShowItemForm(true);
  };

  const openEditForm = (item: MaintenanceSetItem) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const closeForm = () => {
    setShowItemForm(false);
    setEditingItem(undefined);
  };

  const handleDeleteSet = async () => {
    try {
      await deleteSet.mutateAsync(set.id);
      toast.success('Wartungsset gelöscht');
      router.push('/dashboard/wartungssets');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Fehler beim Löschen: ${message}`);
      setShowDeleteSetDialog(false);
    }
  };

  const items = set.items;
  const isEmpty = items.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/wartungssets')}
          className="-ml-2"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Zurück zur Übersicht
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{set.catalog.manufacturer}</p>
          <h1 className="text-2xl font-bold tracking-tight">{set.catalog.name}</h1>
          <div>
            <Badge variant="secondary">
              {SYSTEM_TYPE_LABELS[set.catalog.systemType] ?? set.catalog.systemType}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowDeleteSetDialog(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2Icon className="h-4 w-4 mr-2" />
          Löschen
        </Button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Teile ({items.length})
          </h2>
          <Button size="sm" onClick={openCreateForm}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Teil hinzufügen
          </Button>
        </div>

        {isEmpty ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            Noch keine Teile in diesem Set
          </div>
        ) : (
          <MaintenanceSetItemsTable setId={set.id} items={items} onEdit={openEditForm} />
        )}
      </div>

      {/* Item form modal */}
      <MaintenanceSetItemForm
        open={showItemForm}
        onClose={closeForm}
        setId={set.id}
        item={editingItem}
      />

      {/* Delete-set confirmation */}
      <AlertDialog
        open={showDeleteSetDialog}
        onOpenChange={(open) => {
          if (!open && !deleteSet.isPending) setShowDeleteSetDialog(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wartungsset löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Set „{set.catalog.manufacturer} {set.catalog.name}" und alle zugehörigen Teile
              werden unwiderruflich entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSet.isPending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSet();
              }}
              disabled={deleteSet.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSet.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                  Löscht…
                </>
              ) : (
                'Löschen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
