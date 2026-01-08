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
    date: new Date().toISOString().split('T')[0], // Today's date
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
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

    // Validate file types and sizes
    const validPhotos = newPhotos.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ist keine Bilddatei`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Upload photos to Supabase Storage first
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

      // 2. Create maintenance record with photo URLs
      const response = await fetch('/api/maintenances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          result.details.forEach((error: any) => {
            const field = error.path[0];
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Wartung erledigt
              </h2>
              <p className="text-sm text-gray-600 mt-1">{heaterModel}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Date */}
            <div>
              <Label htmlFor="date" className="mb-2 block">
                Wartungsdatum <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="mb-2 block">
                Notizen (optional)
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="z.B. Filter gewechselt, Druck geprüft..."
                className="resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Beschreiben Sie die durchgeführten Arbeiten
              </p>
            </div>

            {/* Photos */}
            <div>
              <Label className="mb-2 block">
                Fotos (optional, max. 5)
              </Label>

              {/* Photo preview */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Photo input */}
              {photos.length < 5 && (
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <div className="flex flex-col items-center">
                    <CameraIcon className="h-6 w-6 text-gray-400" />
                    <span className="mt-1 text-sm text-gray-600">
                      Fotos hinzufügen
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              )}

              <p className="mt-1 text-xs text-gray-500">
                JPEG, PNG oder WebP • Max. 5MB pro Foto
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={loading || uploadingPhotos}>
                {uploadingPhotos ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Fotos werden hochgeladen...
                  </>
                ) : loading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Wird gespeichert...
                  </>
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
