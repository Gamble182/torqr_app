'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { XIcon } from 'lucide-react';

interface Heater {
  id: string;
  model: string;
  serialNumber: string | null;
  installationDate: string | null;
  maintenanceInterval: number;
  lastMaintenance: string | null;
}

interface HeaterFormModalProps {
  customerId: string;
  heater?: Heater | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  model: string;
  serialNumber: string;
  installationDate: string;
  maintenanceInterval: string;
  lastMaintenance: string;
}

interface FormErrors {
  [key: string]: string;
}

const MAINTENANCE_INTERVALS = [
  { value: '1', label: '1 Monat' },
  { value: '3', label: '3 Monate' },
  { value: '6', label: '6 Monate' },
  { value: '12', label: '12 Monate' },
  { value: '24', label: '24 Monate' },
];

export function HeaterFormModal({
  customerId,
  heater,
  onClose,
  onSuccess,
}: HeaterFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    model: '',
    serialNumber: '',
    installationDate: '',
    maintenanceInterval: '12',
    lastMaintenance: '',
  });

  // Pre-fill form if editing
  useEffect(() => {
    if (heater) {
      setFormData({
        model: heater.model || '',
        serialNumber: heater.serialNumber || '',
        installationDate: heater.installationDate
          ? heater.installationDate.split('T')[0]
          : '',
        maintenanceInterval: heater.maintenanceInterval.toString(),
        lastMaintenance: heater.lastMaintenance
          ? heater.lastMaintenance.split('T')[0]
          : '',
      });
    }
  }, [heater]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.model.trim()) {
      newErrors.model = 'Modell ist erforderlich';
    }

    if (!formData.maintenanceInterval) {
      newErrors.maintenanceInterval = 'Wartungsintervall ist erforderlich';
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
      const url = heater
        ? `/api/heaters/${heater.id}`
        : '/api/heaters';

      const method = heater ? 'PATCH' : 'POST';

      const payload: any = {
        model: formData.model,
        serialNumber: formData.serialNumber || null,
        maintenanceInterval: formData.maintenanceInterval,
        installationDate: formData.installationDate
          ? new Date(formData.installationDate).toISOString()
          : null,
        lastMaintenance: formData.lastMaintenance
          ? new Date(formData.lastMaintenance).toISOString()
          : null,
      };

      if (!heater) {
        payload.customerId = customerId;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(heater ? 'Heizung aktualisiert!' : 'Heizung hinzugefügt!');
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
      console.error('Error saving heater:', err);
      toast.error('Fehler beim Speichern der Heizung');
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
            <h2 className="text-xl font-semibold text-gray-900">
              {heater ? 'Heizung bearbeiten' : 'Neue Heizung hinzufügen'}
            </h2>
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
            {/* Model */}
            <div>
              <Label htmlFor="model" className="mb-2 block">
                Modell <span className="text-red-500">*</span>
              </Label>
              <Input
                id="model"
                name="model"
                type="text"
                value={formData.model}
                onChange={handleChange}
                className={errors.model ? 'border-red-500' : ''}
                placeholder="z.B. Viessmann Vitodens 200-W"
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model}</p>
              )}
            </div>

            {/* Serial Number */}
            <div>
              <Label htmlFor="serialNumber" className="mb-2 block">
                Seriennummer (optional)
              </Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                type="text"
                value={formData.serialNumber}
                onChange={handleChange}
                placeholder="z.B. 7654321098"
              />
            </div>

            {/* Maintenance Interval */}
            <div>
              <Label htmlFor="maintenanceInterval" className="mb-2 block">
                Wartungsintervall <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.maintenanceInterval}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, maintenanceInterval: value }));
                  if (errors.maintenanceInterval) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.maintenanceInterval;
                      return newErrors;
                    });
                  }
                }}
              >
                <SelectTrigger className={errors.maintenanceInterval ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Bitte wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.maintenanceInterval && (
                <p className="mt-1 text-sm text-red-600">{errors.maintenanceInterval}</p>
              )}
            </div>

            {/* Installation Date */}
            <div>
              <Label htmlFor="installationDate" className="mb-2 block">
                Installationsdatum (optional)
              </Label>
              <Input
                id="installationDate"
                name="installationDate"
                type="date"
                value={formData.installationDate}
                onChange={handleChange}
              />
            </div>

            {/* Last Maintenance */}
            <div>
              <Label htmlFor="lastMaintenance" className="mb-2 block">
                Letzte Wartung (optional)
              </Label>
              <Input
                id="lastMaintenance"
                name="lastMaintenance"
                type="date"
                value={formData.lastMaintenance}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Wenn leer, wird heute als Datum verwendet
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
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Wird gespeichert...
                  </>
                ) : (
                  heater ? 'Änderungen speichern' : 'Heizung hinzufügen'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
