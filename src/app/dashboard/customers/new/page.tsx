'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeftIcon } from 'lucide-react';

interface FormData {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string;
  heatingType: string;
  additionalEnergy: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

// Heating type options with German labels
const HEATING_TYPES = [
  { value: 'GAS', label: 'Gasheizung' },
  { value: 'OIL', label: 'Ölheizung' },
  { value: 'DISTRICT_HEATING', label: 'Fernwärme' },
  { value: 'HEAT_PUMP_AIR', label: 'Wärmepumpe (Luft)' },
  { value: 'HEAT_PUMP_GROUND', label: 'Wärmepumpe (Erde)' },
  { value: 'HEAT_PUMP_WATER', label: 'Wärmepumpe (Wasser)' },
  { value: 'PELLET_BIOMASS', label: 'Pelletheizung / Biomasse' },
  { value: 'NIGHT_STORAGE', label: 'Nachtspeicherheizung (Strom)' },
  { value: 'ELECTRIC_DIRECT', label: 'Elektro-Direktheizung (Infrarot, Heizlüfter etc.)' },
  { value: 'HYBRID', label: 'Hybridheizung (z. B. Gas + Wärmepumpe)' },
  { value: 'CHP', label: 'Blockheizkraftwerk (BHKW)' },
];

// Additional energy source options with German labels
const ADDITIONAL_ENERGY_SOURCES = [
  { value: 'PHOTOVOLTAIC', label: 'Photovoltaik' },
  { value: 'SOLAR_THERMAL', label: 'Solarthermie' },
  { value: 'SMALL_WIND', label: 'Windkraft (Kleinwindanlage)' },
  { value: 'BATTERY_STORAGE', label: 'Stromspeicher/Batterie' },
  { value: 'HEAT_STORAGE', label: 'Wärmespeicher (Pufferspeicher)' },
];

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    street: '',
    zipCode: '',
    city: '',
    phone: '',
    email: '',
    heatingType: '',
    additionalEnergy: '',
    notes: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user types
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

    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Straße ist erforderlich';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'PLZ ist erforderlich';
    } else if (formData.zipCode.length < 4) {
      newErrors.zipCode = 'PLZ muss mindestens 4 Zeichen lang sein';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Stadt ist erforderlich';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon ist erforderlich';
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Ungültige E-Mail-Adresse';
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
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to customers list
        router.push('/dashboard/customers');
      } else {
        // Handle validation errors from API
        if (result.details) {
          const apiErrors: FormErrors = {};
          result.details.forEach((error: any) => {
            const field = error.path[0];
            apiErrors[field] = error.message;
          });
          setErrors(apiErrors);
        } else {
          alert(`Fehler: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Fehler beim Erstellen des Kunden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Zurück zur Kundenliste
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Neuer Kunde</h1>
        <p className="mt-2 text-sm text-gray-600">
          Fügen Sie einen neuen Kunden zu Ihrer Datenbank hinzu
        </p>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="mb-2 block">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-red-500' : ''}
                placeholder="Max Mustermann"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Street */}
            <div>
              <Label htmlFor="street" className="mb-2 block">
                Straße und Hausnummer <span className="text-red-500">*</span>
              </Label>
              <Input
                id="street"
                name="street"
                type="text"
                value={formData.street}
                onChange={handleChange}
                className={errors.street ? 'border-red-500' : ''}
                placeholder="Musterstraße 123"
              />
              {errors.street && (
                <p className="mt-1 text-sm text-red-600">{errors.street}</p>
              )}
            </div>

            {/* ZIP and City */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="zipCode" className="mb-2 block">
                  PLZ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className={errors.zipCode ? 'border-red-500' : ''}
                  placeholder="12345"
                />
                {errors.zipCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city" className="mb-2 block">
                  Stadt <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  className={errors.city ? 'border-red-500' : ''}
                  placeholder="Berlin"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="mb-2 block">
                Telefon <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'border-red-500' : ''}
                placeholder="030 12345678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="mb-2 block">E-Mail (optional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'border-red-500' : ''}
                placeholder="max@beispiel.de"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Für automatische Wartungserinnerungen per E-Mail
              </p>
            </div>

            {/* Heating Type */}
            <div>
              <Label htmlFor="heatingType" className="mb-2 block">Art der Heizung (optional)</Label>
              <Select
                value={formData.heatingType}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, heatingType: value }));
                  if (errors.heatingType) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.heatingType;
                      return newErrors;
                    });
                  }
                }}
              >
                <SelectTrigger className={errors.heatingType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Bitte wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {HEATING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.heatingType && (
                <p className="mt-1 text-sm text-red-600">{errors.heatingType}</p>
              )}
            </div>

            {/* Additional Energy Source */}
            <div>
              <Label htmlFor="additionalEnergy" className="mb-2 block">Zusätzliche Energiequelle (optional)</Label>
              <Select
                value={formData.additionalEnergy}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, additionalEnergy: value }));
                  if (errors.additionalEnergy) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.additionalEnergy;
                      return newErrors;
                    });
                  }
                }}
              >
                <SelectTrigger className={errors.additionalEnergy ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Bitte wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {ADDITIONAL_ENERGY_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.additionalEnergy && (
                <p className="mt-1 text-sm text-red-600">{errors.additionalEnergy}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                z.B. Photovoltaik, Solarthermie oder Stromspeicher
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="mb-2 block">Notizen (optional)</Label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Besondere Hinweise zum Kunden..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-end gap-4">
            <Link href="/dashboard/customers">
              <Button type="button" variant="outline" disabled={loading}>
                Abbrechen
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Wird erstellt...
                </>
              ) : (
                'Kunde erstellen'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
