'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { XIcon, CameraIcon, TrashIcon, Loader2Icon } from 'lucide-react';
import { uploadMaintenancePhoto } from '@/lib/supabase';
import { z } from 'zod';

interface MaintenanceFormModalProps {
  heaterId: string;
  heaterModel: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  date: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

export function MaintenanceFormModal({
  heaterId,
  heaterModel,
  onClose,
  onSuccess,
}: MaintenanceFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photos, setPhotos] = useState<File[]>([]);

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files);
    const validPhotos = newPhotos.filter((file) => {
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

    if (photos.length + validPhotos.length > 5) {
      toast.error('Maximal 5 Fotos erlaubt');
      return;
    }

    setPhotos((prev) => [...prev, ...validPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.date) {
      newErrors.date = 'Datum ist erforderlich';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      let uploadedUrls: string[] = [];

      if (photos.length > 0) {
        setUploadingPhotos(true);
        const tempMaintenanceId = `temp-${Date.now()}`;
        const uploadPromises = photos.map((photo) =>
          uploadMaintenancePhoto(photo, tempMaintenanceId)
        );

        try {
          uploadedUrls = await Promise.all(uploadPromises);
          toast.success(`${uploadedUrls.length} Foto(s) hochgeladen`);
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          toast.error('Fehler beim Hochladen der Fotos');
          setLoading(false);
          setUploadingPhotos(false);
          return;
        }

        setUploadingPhotos(false);
      }

      const response = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heaterId: heaterId,
          date: new Date(formData.date).toISOString(),
          notes: formData.notes || null,
          photos: uploadedUrls,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Wartung erfolgreich eingetragen!');
        onSuccess();
      } else {
        if (result.details) {
          const apiErrors: FormErrors = {};
          result.details.forEach((error: z.ZodIssue) => {
            const field = error.path[0] as string;
            apiErrors[field] = error.message;
          });
          setErrors(apiErrors);
          toast.error('Bitte überprüfen Sie Ihre Eingaben');
        } else {
          toast.error(`Fehler: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('Error saving maintenance:', err);
      toast.error('Fehler beim Speichern der Wartung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Wartung erledigt
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{heaterModel}</p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} disabled={loading}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="date" className="mb-1.5 block text-sm">
                Wartungsdatum <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date" name="date" type="date" value={formData.date}
                onChange={handleChange} max={new Date().toISOString().split('T')[0]}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && (
                <p className="mt-1 text-xs text-destructive">{errors.date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes" className="mb-1.5 block text-sm">Notizen (optional)</Label>
              <Textarea
                id="notes" name="notes" value={formData.notes} onChange={handleChange}
                rows={4} placeholder="z.B. Filter gewechselt, Druck geprüft..." className="resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Beschreiben Sie die durchgeführten Arbeiten
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
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button" variant="outline" size="sm"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 5 && (
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                  <div className="flex flex-col items-center">
                    <CameraIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">
                      Fotos hinzufügen
                    </span>
                  </div>
                  <input
                    type="file" accept="image/*" multiple
                    onChange={handlePhotoSelect} className="hidden" disabled={loading}
                  />
                </label>
              )}

              <p className="mt-1 text-xs text-muted-foreground">
                JPEG, PNG oder WebP &middot; Max. 5MB pro Foto
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || uploadingPhotos}>
                {uploadingPhotos ? (
                  <><Loader2Icon className="h-4 w-4 animate-spin" /> Fotos werden hochgeladen...</>
                ) : loading ? (
                  <><Loader2Icon className="h-4 w-4 animate-spin" /> Wird gespeichert...</>
                ) : (
                  'Wartung speichern'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
