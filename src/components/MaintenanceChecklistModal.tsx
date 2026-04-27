// src/components/MaintenanceChecklistModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  XIcon,
  CameraIcon,
  TrashIcon,
  Loader2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from 'lucide-react';
import type { ChecklistSnapshot } from '@/types/checklist';
import { CHECKLIST_DEFAULTS } from '@/lib/checklist-defaults';
import { useChecklistItems } from '@/hooks/useChecklistItems';
import { useCreateMaintenance } from '@/hooks/useMaintenances';
import type { PartsUsageEntry } from '@/hooks/useMaintenances';
import { useCreateFollowUpJob } from '@/hooks/useFollowUpJobs';
import { useInventoryItems } from '@/hooks/useInventory';
import { PartsUsageStep } from '@/components/maintenance/PartsUsageStep';

interface MaintenanceChecklistModalProps {
  systemId: string;
  systemLabel: string;
  systemType: string; // 'HEATING' | 'AC' | 'WATER_TREATMENT' | 'ENERGY_STORAGE'
  onClose: () => void;
  onSuccess: () => void;
}

type ChecklistEntry = {
  label: string;
  checked: boolean;
  isCustom: boolean;
};

export function MaintenanceChecklistModal({
  systemId,
  systemLabel,
  systemType,
  onClose,
  onSuccess,
}: MaintenanceChecklistModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [entries, setEntries] = useState<ChecklistEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [partsUsed, setPartsUsed] = useState<PartsUsageEntry[]>([]);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [followUps, setFollowUps] = useState<Array<{ label: string; description: string }>>([]);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [newFollowUpLabel, setNewFollowUpLabel] = useState('');
  const [newFollowUpDesc, setNewFollowUpDesc] = useState('');

  const { data: customItems } = useChecklistItems(systemId);
  const { data: inventoryItems = [] } = useInventoryItems();
  const createMaintenance = useCreateMaintenance();
  const createFollowUp = useCreateFollowUpJob(systemId, { silent: true });

  // Build the full checklist when custom items are loaded
  useEffect(() => {
    const defaults = (CHECKLIST_DEFAULTS[systemType] ?? []).map((label) => ({
      label,
      checked: false,
      isCustom: false,
    }));
    const custom = (customItems ?? []).map((item) => ({
      label: item.label,
      checked: false,
      isCustom: true,
    }));
    setEntries([...defaults, ...custom]);
  }, [customItems, systemType]);

  const checkedCount = entries.filter((e) => e.checked).length;
  const uncheckedItems = entries.filter((e) => !e.checked);

  const toggleEntry = (index: number) => {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, checked: !entry.checked } : entry
      )
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ist keine Bilddatei`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} ist zu groß (max. 5MB)`);
        return false;
      }
      return true;
    });
    if (photos.length + newPhotos.length > 5) {
      toast.error('Maximal 5 Fotos erlaubt');
      return;
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addFollowUp = () => {
    const label = newFollowUpLabel.trim();
    if (!label) return;
    setFollowUps((prev) => [...prev, { label, description: newFollowUpDesc.trim() }]);
    setNewFollowUpLabel('');
    setNewFollowUpDesc('');
  };

  const removeFollowUp = (index: number) => {
    setFollowUps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let uploadedUrls: string[] = [];

      if (photos.length > 0) {
        setUploadingPhotos(true);
        const tempId = `temp-${Date.now()}`;
        try {
          uploadedUrls = await Promise.all(
            photos.map(async (photo) => {
              const fd = new FormData();
              fd.append('file', photo);
              fd.append('maintenanceId', tempId);
              const res = await fetch('/api/upload/photo', { method: 'POST', body: fd });
              const data = await res.json();
              if (!data.success) throw new Error(data.error ?? 'Upload fehlgeschlagen');
              return data.url as string;
            })
          );
          toast.success(`${uploadedUrls.length} Foto(s) hochgeladen`);
        } catch (uploadError) {
          toast.error(
            uploadError instanceof Error ? uploadError.message : 'Fehler beim Hochladen der Fotos'
          );
          setLoading(false);
          setUploadingPhotos(false);
          return;
        }
        setUploadingPhotos(false);
      }

      const checklistData: ChecklistSnapshot = {
        items: entries,
        confirmedAt: new Date().toISOString(),
      };

      const { maintenance, negativeStockWarnings } = await createMaintenance.mutateAsync({
        systemId,
        date: new Date(date).toISOString(),
        notes: notes.trim() || null,
        photos: uploadedUrls,
        checklistData,
        partsUsed,
      });

      if (followUps.length > 0) {
        try {
          await Promise.all(
            followUps.map((fu) =>
              createFollowUp.mutateAsync({
                label: fu.label,
                description: fu.description || null,
                maintenanceId: maintenance.id,
              })
            )
          );
        } catch {
          toast.error('Wartung gespeichert, aber Fehler beim Erstellen der Nachfolgeaufträge');
        }
      }

      // Surface negative-stock warnings as non-blocking toasts.
      if (negativeStockWarnings.length > 0) {
        const itemMap = new Map(inventoryItems.map((i) => [i.id, i]));
        for (const w of negativeStockWarnings) {
          const item = itemMap.get(w.inventoryItemId);
          toast.warning(
            `Lager für „${item?.description ?? w.inventoryItemId}“ unterschritten — Bestand ${w.newStock}${item ? ` ${item.unit}` : ''}`,
          );
        }
      }

      toast.success('Wartung erfolgreich eingetragen!');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern der Wartung');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div className="bg-card w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-xl">

        {/* Header: step indicator + close */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-1.5">
            {([1, 2, 3, 4] as const).map((s) => (
              <div
                key={s}
                className={`rounded-full transition-all duration-200 ${
                  s === step
                    ? 'w-6 h-2 bg-primary'
                    : s < step
                    ? 'w-2 h-2 bg-primary/50'
                    : 'w-2 h-2 bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Schritt {step} von 4</p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Checkliste ── */}
          {step === 1 && (
            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">{systemLabel}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <ClipboardListIcon className="h-3.5 w-3.5" />
                  Wartungscheckliste &middot;{' '}
                  <span
                    className={
                      checkedCount === entries.length && entries.length > 0
                        ? 'text-success font-medium'
                        : ''
                    }
                  >
                    {checkedCount} / {entries.length} Punkte erledigt
                  </span>
                </p>
              </div>

              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Keine Checklisten-Einträge für diesen Systemtyp.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {entries.map((entry, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onClick={() => toggleEntry(index)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all min-h-[52px] ${
                          entry.checked
                            ? 'border-success/30 bg-success/5'
                            : 'border-border bg-card hover:bg-muted/50 active:bg-muted'
                        }`}
                      >
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            entry.checked
                              ? 'bg-success border-success'
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {entry.checked && (
                            <CheckCircle2Icon className="h-3.5 w-3.5 text-success-foreground" />
                          )}
                        </div>
                        <span
                          className={`flex-1 text-sm ${
                            entry.checked
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {entry.label}
                        </span>
                        {entry.isCustom && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border shrink-0">
                            Individuell
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Step 2: Notizen & Fotos ── */}
          {step === 2 && (
            <div className="p-4 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Notizen & Fotos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Optional — Besonderheiten und Dokumentation
                </p>
              </div>

              <div>
                <Label htmlFor="notes" className="mb-1.5 block text-sm">
                  Notizen (optional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="z.B. Druck war erhöht, nächstes Mal Filter wechseln…"
                  className="resize-none text-base min-h-[120px]"
                  maxLength={2000}
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                  {notes.length} / 2000
                </p>
              </div>

              <div>
                <Label className="mb-1.5 block text-sm">Fotos (optional, max. 5)</Label>

                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-28 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-destructive/80 text-white rounded-md p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length < 5 && (
                  <label className="flex items-center justify-center w-full h-16 sm:h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                    <div className="flex flex-col items-center">
                      <CameraIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="mt-1 text-xs text-muted-foreground">
                        Fotos hinzufügen
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}

                <p className="mt-1 text-xs text-muted-foreground">
                  JPEG, PNG oder WebP &middot; Max. 5MB pro Foto
                </p>
              </div>

              {/* Follow-up jobs section */}
              <div className="border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowFollowUps(!showFollowUps)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full"
                >
                  {showFollowUps ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                  Nachfolgeauftrag hinzufügen?
                  {followUps.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-status-due-bg text-warning-foreground border border-warning/20">
                      {followUps.length}
                    </span>
                  )}
                </button>

                {showFollowUps && (
                  <div className="mt-3 space-y-3">
                    {followUps.length > 0 && (
                      <ul className="space-y-2">
                        {followUps.map((fu, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {fu.label}
                              </p>
                              {fu.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {fu.description}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFollowUp(i)}
                              className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="space-y-2">
                      <Input
                        value={newFollowUpLabel}
                        onChange={(e) => setNewFollowUpLabel(e.target.value)}
                        placeholder="z.B. Wasserfilter erneuern"
                        maxLength={200}
                        className="text-base"
                      />
                      <Textarea
                        value={newFollowUpDesc}
                        onChange={(e) => setNewFollowUpDesc(e.target.value)}
                        placeholder="Beschreibung (optional)"
                        rows={2}
                        maxLength={1000}
                        className="resize-none text-base"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFollowUp}
                        disabled={!newFollowUpLabel.trim()}
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Hinzufügen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Teileverbrauch ── */}
          {step === 3 && (
            <PartsUsageStep
              customerSystemId={systemId}
              value={partsUsed}
              onChange={setPartsUsed}
              inventoryItems={inventoryItems}
            />
          )}

          {/* ── Step 4: Abschließen ── */}
          {step === 4 && (
            <div className="p-4 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Wartung abschließen</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{systemLabel}</p>
              </div>

              <div>
                <Label htmlFor="date" className="mb-1.5 block text-sm">
                  Wartungsdatum <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={today}
                  className="h-11 text-base"
                />
              </div>

              <Card className="p-4 bg-muted/30 border-border">
                <p className="text-sm font-medium text-foreground mb-3">Zusammenfassung</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Erledigte Punkte</span>
                    <span
                      className={`font-medium ${
                        checkedCount === entries.length && entries.length > 0
                          ? 'text-success'
                          : 'text-foreground'
                      }`}
                    >
                      {checkedCount} / {entries.length}
                    </span>
                  </div>
                  {notes.trim() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Notiz</span>
                      <span className="text-foreground">Vorhanden</span>
                    </div>
                  )}
                  {photos.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fotos</span>
                      <span className="text-foreground">{photos.length}</span>
                    </div>
                  )}
                </div>

                {uncheckedItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-warning-foreground font-medium mb-1.5">
                      Nicht erledigte Punkte ({uncheckedItems.length}):
                    </p>
                    <ul className="space-y-0.5">
                      {uncheckedItems.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-center gap-1.5"
                        >
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Footer: navigation */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border shrink-0">
          {step === 1 ? (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-11"
            >
              Abbrechen
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              disabled={loading}
              className="h-11"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Zurück
            </Button>
          )}

          {step < 4 ? (
            <Button
              onClick={() => setStep((prev) => (prev + 1) as 2 | 3 | 4)}
              className="h-11"
            >
              Weiter
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || uploadingPhotos || !date}
              className="h-11 bg-success hover:bg-success/90 text-success-foreground"
            >
              {uploadingPhotos ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Fotos werden hochgeladen…
                </>
              ) : loading ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Wird gespeichert…
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="h-4 w-4" />
                  Wartung abschließen
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
