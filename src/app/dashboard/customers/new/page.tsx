'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useCreateCustomer } from '@/hooks/useCustomers';
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react';

interface FormData {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string;
  suppressEmail: boolean;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: '', street: '', zipCode: '', city: '', phone: '', email: '',
    suppressEmail: false,
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    createCustomer.mutate(
      {
        name: formData.name,
        street: formData.street,
        zipCode: formData.zipCode,
        city: formData.city,
        phone: formData.phone,
        email: formData.email || undefined,
        suppressEmail: formData.suppressEmail,
        notes: formData.notes || undefined,
      },
      {
        onSuccess: () => {
          router.push('/dashboard/customers');
        },
      }
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Zurück zur Kundenliste
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Neuer Kunde</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fügen Sie einen neuen Kunden zu Ihrer Datenbank hinzu
        </p>
      </div>

      <Card className="max-w-5xl">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          {/* Section 1: Kontaktdaten */}
          <div className="mb-8">
            <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">
              Kontaktdaten
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Label htmlFor="name" className="mb-1.5 block text-sm">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name" name="name" type="text" value={formData.name}
                  onChange={handleChange} className={`text-base${errors.name ? ' border-destructive' : ''}`}
                  placeholder="Max Mustermann"
                />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="phone" className="mb-1.5 block text-sm">
                  Telefon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone" name="phone" type="tel" value={formData.phone}
                  onChange={handleChange} className={`text-base${errors.phone ? ' border-destructive' : ''}`}
                  placeholder="030 12345678"
                />
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="email" className="mb-1.5 block text-sm">E-Mail <span className="text-destructive">*</span></Label>
                <Input
                  id="email" name="email" type="email" value={formData.email}
                  onChange={handleChange} className={`text-base${errors.email ? ' border-destructive' : ''}`}
                  placeholder="max@beispiel.de"
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                <p className="mt-1 text-xs text-muted-foreground">Für automatische Wartungserinnerungen (erforderlich)</p>
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
              </div>
            </div>
          </div>

          {/* Section 2: Adresse */}
          <div className="mb-8">
            <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">
              Adresse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-3">
                <Label htmlFor="street" className="mb-1.5 block text-sm">
                  Straße und Hausnummer <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="street" name="street" type="text" value={formData.street}
                  onChange={handleChange} className={`text-base${errors.street ? ' border-destructive' : ''}`}
                  placeholder="Musterstraße 123"
                />
                {errors.street && <p className="mt-1 text-xs text-destructive">{errors.street}</p>}
              </div>
              <div>
                <Label htmlFor="zipCode" className="mb-1.5 block text-sm">
                  PLZ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="zipCode" name="zipCode" type="text" value={formData.zipCode}
                  onChange={handleChange} className={`text-base${errors.zipCode ? ' border-destructive' : ''}`}
                  placeholder="12345"
                />
                {errors.zipCode && <p className="mt-1 text-xs text-destructive">{errors.zipCode}</p>}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="city" className="mb-1.5 block text-sm">
                  Ort <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city" name="city" type="text" value={formData.city}
                  onChange={handleChange} className={`text-base${errors.city ? ' border-destructive' : ''}`}
                  placeholder="Berlin"
                />
                {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Notizen */}
          <div className="mb-8">
            <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">
              Zusätzliche Informationen
            </h2>
            <div>
              <Label htmlFor="notes" className="mb-1.5 block text-sm">Notizen (optional)</Label>
              <textarea
                id="notes" name="notes" rows={4} value={formData.notes} onChange={handleChange}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Besondere Hinweise zum Kunden..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-border">
            <Link href="/dashboard/customers" className="w-full sm:w-auto">
              <Button type="button" variant="outline" disabled={createCustomer.isPending} className="w-full sm:w-auto h-11 sm:h-9">Abbrechen</Button>
            </Link>
            <Button type="submit" disabled={createCustomer.isPending} className="w-full sm:w-auto h-11 sm:h-9">
              {createCustomer.isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {createCustomer.isPending ? 'Wird erstellt...' : 'Kunde erstellen'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
