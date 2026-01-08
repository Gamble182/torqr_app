'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { MultiSelect } from '@/components/ui/multi-select';
import { ArrowLeftIcon } from 'lucide-react';

interface FormData {
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string;
  heatingType: string;
  additionalEnergySources: string[];
  energyStorageSystems: string[];
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

// Additional energy source options with German labels (multiselect)
const ADDITIONAL_ENERGY_SOURCES = [
  { value: 'PHOTOVOLTAIC', label: 'Photovoltaik' },
  { value: 'SOLAR_THERMAL', label: 'Solarthermie' },
  { value: 'SMALL_WIND', label: 'Windkraft (Kleinwindanlage)' },
];

// Energy storage system options with German labels (multiselect)
const ENERGY_STORAGE_SYSTEMS = [
  { value: 'BATTERY_STORAGE', label: 'Stromspeicher/Batterie' },
  { value: 'HEAT_STORAGE', label: 'Wärmespeicher (Pufferspeicher)' },
];

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    street: '',
    zipCode: '',
    city: '',
    phone: '',
    email: '',
    heatingType: '',
    additionalEnergySources: [],
    energyStorageSystems: [],
    notes: '',
  });

  // Fetch customer data on mount
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setFetchLoading(true);

        const response = await fetch(`/api/customers/${customerId}`);
        const result = await response.json();

        if (result.success) {
          const customer = result.data;
          setFormData({
            name: customer.name || '',
            street: customer.street || '',
            zipCode: customer.zipCode || '',
            city: customer.city || '',
            phone: customer.phone || '',
            email: customer.email || '',
            heatingType: customer.heatingType || '',
            additionalEnergySources: customer.additionalEnergySources || [],
            energyStorageSystems: customer.energyStorageSystems || [],
            notes: customer.notes || '',
          });
        } else {
          alert(`Fehler: ${result.error}`);
          router.push('/dashboard/customers');
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        alert('Fehler beim Laden des Kunden');
        router.push('/dashboard/customers');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId, router]);

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

    if (!formData.heatingType) {
      newErrors.heatingType = 'Art der Heizung ist erforderlich';
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
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
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
      console.error('Error updating customer:', err);
      alert('Fehler beim Aktualisieren des Kunden');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Kunde bearbeiten</h1>
        <p className="mt-2 text-sm text-gray-600">
          Aktualisieren Sie die Kundendaten
        </p>
      </div>

      <Card className="max-w-5xl">
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          {/* Section 1: Kontaktdaten */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Kontaktdaten
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name - Full Width */}
              <div className="md:col-span-2">
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
                  Für automatische Wartungserinnerungen
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Adresse */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Adresse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Street - Full Width */}
              <div className="md:col-span-3">
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

              {/* ZIP Code */}
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

              {/* City */}
              <div className="md:col-span-2">
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
          </div>

          {/* Section 3: Heizsystem */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Heizsystem
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Heating Type */}
              <div className="md:col-span-2">
                <Label htmlFor="heatingType" className="mb-2 block">
                  Art der Heizung <span className="text-red-500">*</span>
                </Label>
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

              {/* Additional Energy Sources - Multiselect */}
              <div>
                <Label htmlFor="additionalEnergySources" className="mb-2 block">
                  Zusätzliche Energiequellen (optional)
                </Label>
                <MultiSelect
                  options={ADDITIONAL_ENERGY_SOURCES}
                  value={formData.additionalEnergySources}
                  onChange={(value) => setFormData((prev) => ({ ...prev, additionalEnergySources: value }))}
                  placeholder="Auswählen..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  z.B. Photovoltaik, Solarthermie
                </p>
              </div>

              {/* Energy Storage Systems - Multiselect */}
              <div>
                <Label htmlFor="energyStorageSystems" className="mb-2 block">
                  Energiespeichersysteme (optional)
                </Label>
                <MultiSelect
                  options={ENERGY_STORAGE_SYSTEMS}
                  value={formData.energyStorageSystems}
                  onChange={(value) => setFormData((prev) => ({ ...prev, energyStorageSystems: value }))}
                  placeholder="Auswählen..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Batterie- oder Wärmespeicher
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Notizen */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Zusätzliche Informationen
            </h2>
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
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Link href="/dashboard/customers">
              <Button type="button" variant="outline" disabled={loading}>
                Abbrechen
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
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
