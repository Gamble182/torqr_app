'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeftIcon } from 'lucide-react';
import { z } from 'zod';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';

interface FormData {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string;
  suppressEmail: boolean;
  emailOptIn: 'NONE' | 'CONFIRMED' | 'UNSUBSCRIBED';
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const { data: customer, isLoading: fetchLoading, isError: fetchError, error: fetchErrorObj } = useCustomer(customerId);
  const updateMutation = useUpdateCustomer(customerId);

  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    street: '',
    zipCode: '',
    city: '',
    phone: '',
    email: '',
    suppressEmail: false,
    emailOptIn: 'NONE',
    notes: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        street: customer.street || '',
        zipCode: customer.zipCode || '',
        city: customer.city || '',
        phone: customer.phone || '',
        email: customer.email || '',
        suppressEmail: customer.emailOptIn === 'NONE' && !!customer.email,
        emailOptIn: customer.emailOptIn || 'NONE',
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  useEffect(() => {
    if (fetchError) {
      toast.error(fetchErrorObj instanceof Error ? fetchErrorObj.message : 'Fehler beim Laden des Kunden');
      router.push('/dashboard/customers');
    }
  }, [fetchError, fetchErrorObj, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name ist erforderlich';
    if (!formData.street.trim()) newErrors.street = 'Straße ist erforderlich';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'PLZ ist erforderlich';
    else if (formData.zipCode.length < 4) newErrors.zipCode = 'PLZ muss mindestens 4 Zeichen lang sein';
    if (!formData.city.trim()) newErrors.city = 'Ort ist erforderlich';
    if (!formData.phone.trim()) newErrors.phone = 'Telefon ist erforderlich';
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail-Adresse ist erforderlich';
    } else if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await updateMutation.mutateAsync(formData);
      router.push(`/dashboard/customers/${customerId}`);
      router.refresh();
    } catch (err) {
      // Zod validation errors arrive as Error with details wrapped in message; fall back to field-level errors if present
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message) as { details?: z.ZodIssue[] };
          if (parsed?.details) {
            const apiErrors: FormErrors = {};
            parsed.details.forEach((issue) => {
              const field = issue.path[0] as string;
              apiErrors[field] = issue.message;
            });
            setErrors(apiErrors);
            return;
          }
        } catch {
          // Not a structured error — toast already handled by hook
        }
      }
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  const loading = updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Zurück zur Kundenliste
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Kunde bearbeiten</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aktualisieren Sie die Kundendaten
        </p>
      </div>

      <Card className="max-w-5xl">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          {/* Section 1: Kontaktdaten */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b">
              Kontaktdaten
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="name" className="mb-2 block">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name" name="name" type="text" value={formData.name}
                  onChange={handleChange} className={`text-base${errors.name ? ' border-destructive' : ''}`}
                  placeholder="Max Mustermann"
                />
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="phone" className="mb-2 block">
                  Telefon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone" name="phone" type="tel" value={formData.phone}
                  onChange={handleChange} className={`text-base${errors.phone ? ' border-destructive' : ''}`}
                  placeholder="030 12345678"
                />
                {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="mb-2 block">E-Mail <span className="text-destructive">*</span></Label>
                <Input
                  id="email" name="email" type="email" value={formData.email}
                  onChange={handleChange} className={`text-base${errors.email ? ' border-destructive' : ''}`}
                  placeholder="max@beispiel.de"
                />
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Für automatische Wartungserinnerungen (erforderlich)
                </p>
                {formData.emailOptIn === 'CONFIRMED' && (
                  <p className="mt-1.5 text-xs text-green-600">✓ E-Mail-Erinnerungen aktiv</p>
                )}
                {formData.emailOptIn === 'UNSUBSCRIBED' && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    ⚠️ Kunde hat sich abgemeldet. Wird nur bei neuer E-Mail zurückgesetzt.
                  </p>
                )}
                {formData.emailOptIn !== 'UNSUBSCRIBED' && (
                  <label className="mt-2 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.suppressEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, suppressEmail: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-xs text-muted-foreground">
                      Keine E-Mail-Erinnerungen senden
                    </span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Adresse */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b">
              Adresse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3">
                <Label htmlFor="street" className="mb-2 block">
                  Straße und Hausnummer <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="street" name="street" type="text" value={formData.street}
                  onChange={handleChange} className={`text-base${errors.street ? ' border-destructive' : ''}`}
                  placeholder="Musterstraße 123"
                />
                {errors.street && <p className="mt-1 text-sm text-destructive">{errors.street}</p>}
              </div>

              <div>
                <Label htmlFor="zipCode" className="mb-2 block">
                  PLZ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="zipCode" name="zipCode" type="text" value={formData.zipCode}
                  onChange={handleChange} className={`text-base${errors.zipCode ? ' border-destructive' : ''}`}
                  placeholder="12345"
                />
                {errors.zipCode && <p className="mt-1 text-sm text-destructive">{errors.zipCode}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="city" className="mb-2 block">
                  Ort <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city" name="city" type="text" value={formData.city}
                  onChange={handleChange} className={`text-base${errors.city ? ' border-destructive' : ''}`}
                  placeholder="Berlin"
                />
                {errors.city && <p className="mt-1 text-sm text-destructive">{errors.city}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Notizen */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b">
              Zusätzliche Informationen
            </h2>
            <div>
              <Label htmlFor="notes" className="mb-2 block">Notizen (optional)</Label>
              <textarea
                id="notes" name="notes" rows={4} value={formData.notes} onChange={handleChange}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Besondere Hinweise zum Kunden..."
              />
              {errors.notes && <p className="mt-1 text-sm text-destructive">{errors.notes}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t">
            <Link href="/dashboard/customers" className="w-full sm:w-auto">
              <Button type="button" variant="outline" disabled={loading} className="w-full sm:w-auto h-11">
                Abbrechen
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto h-11">
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Wird gespeichert...
                </>
              ) : (
                'Änderungen speichern'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
