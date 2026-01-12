# Sprint 3: Heater & Maintenance Management

**Duration:** 5-6 Days
**Goal:** Build complete heater CRUD functionality and maintenance tracking system
**Dependencies:** Sprint 2 (Customer Management) must be complete

---

## 📋 Sprint Overview

By the end of Sprint 3, you will have:
- ✅ Complete heater management (Create, Read, Update, Delete)
- ✅ Heater integration in customer detail page
- ✅ Maintenance tracking ("Wartung erledigt" flow)
- ✅ Automatic next maintenance date calculation
- ✅ Maintenance history display
- ✅ Photo upload and storage (Supabase Storage)
- ✅ Dashboard showing upcoming maintenances
- ✅ All features in German with responsive design

---

## 🎯 Sprint 3 Goals Summary

### Day 1: Heater API Backend
- [ ] Create Heater CRUD API endpoints
- [ ] Implement validation with Zod
- [ ] Auto-calculate nextMaintenance based on interval
- [ ] Test all heater endpoints
- [ ] German error messages


### Day 2: Heater Management UI
- [ ] Create heater form component
- [ ] Integrate heaters into customer detail page
- [ ] Display heater list with next maintenance dates
- [ ] Add/Edit/Delete heater functionality
- [ ] Responsive design with German labels

### Day 3: Maintenance Tracking - Backend
- [ ] Create Maintenance API endpoints
- [ ] Implement photo upload to Supabase Storage
- [ ] Update heater dates when maintenance completed
- [ ] Maintenance history endpoint
- [ ] Validation and error handling

### Day 4: Maintenance Tracking - Frontend
- [ ] "Wartung erledigt" button and form
- [ ] Camera integration for photo capture
- [ ] Photo upload with progress indicator
- [ ] Maintenance history display
- [ ] Full-size photo viewer

### Day 5: Dashboard & Polish
- [ ] Update dashboard with upcoming maintenances
- [ ] Overdue maintenance warnings
- [ ] Loading states and error handling
- [ ] Mobile testing and refinements
- [ ] End-to-end testing

### Day 6: Testing & Documentation (Optional Buffer)
- [ ] Integration testing
- [ ] Performance optimization
- [ ] Update development progress
- [ ] Prepare for Sprint 4 (Email Automation)

---

## 📅 Day 1: Heater API Backend

### 1.1 Create Heater API Endpoints

**File:** `src/app/api/heaters/route.ts`

Create endpoints for listing and creating heaters:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a heater
const createHeaterSchema = z.object({
  customerId: z.string().uuid('Ungültige Kunden-ID'),
  model: z.string().min(1, 'Modell ist erforderlich').max(100, 'Modell zu lang'),
  serialNumber: z.string().max(100, 'Seriennummer zu lang').optional().nullable(),
  installationDate: z.string().datetime('Ungültiges Installationsdatum').optional().nullable(),
  maintenanceInterval: z.enum(['1', '3', '6', '12', '24'], {
    errorMap: () => ({ message: 'Wartungsintervall muss 1, 3, 6, 12 oder 24 Monate sein' })
  }),
  lastMaintenance: z.string().datetime('Ungültiges Wartungsdatum').optional().nullable(),
});

/**
 * POST /api/heaters
 * Create a new heater for a customer
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = createHeaterSchema.parse(body);

    // 3. Verify customer belongs to user
    const customer = await prisma.customer.findUnique({
      where: {
        id: validatedData.customerId,
        userId: userId,
      },
    });

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Kunde nicht gefunden',
      }, { status: 404 });
    }

    // 4. Calculate next maintenance date
    const lastMaintenance = validatedData.lastMaintenance
      ? new Date(validatedData.lastMaintenance)
      : new Date();

    const interval = parseInt(validatedData.maintenanceInterval);
    const nextMaintenance = new Date(lastMaintenance);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + interval);

    // 5. Create heater
    const heater = await prisma.heater.create({
      data: {
        customerId: validatedData.customerId,
        model: validatedData.model,
        serialNumber: validatedData.serialNumber || null,
        installationDate: validatedData.installationDate ? new Date(validatedData.installationDate) : null,
        maintenanceInterval: interval,
        lastMaintenance: lastMaintenance,
        nextMaintenance: nextMaintenance,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 6. Return created heater
    return NextResponse.json({
      success: true,
      data: heater,
    }, { status: 201 });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validierungsfehler',
        details: error.issues,
      }, { status: 400 });
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error creating heater:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen der Heizung',
    }, { status: 500 });
  }
}

/**
 * GET /api/heaters?customerId=xxx
 * Get all heaters for a customer
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get customer ID from query params
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({
        success: false,
        error: 'Kunden-ID fehlt',
      }, { status: 400 });
    }

    // 3. Verify customer belongs to user
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
        userId: userId,
      },
    });

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Kunde nicht gefunden',
      }, { status: 404 });
    }

    // 4. Fetch heaters
    const heaters = await prisma.heater.findMany({
      where: {
        customerId: customerId,
      },
      include: {
        maintenances: {
          orderBy: {
            date: 'desc',
          },
          take: 5, // Last 5 maintenances
        },
      },
      orderBy: {
        nextMaintenance: 'asc', // Soonest first
      },
    });

    // 5. Return heaters
    return NextResponse.json({
      success: true,
      data: heaters,
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error fetching heaters:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Heizungen',
    }, { status: 500 });
  }
}
```

---

### 1.2 Create Heater Detail/Update/Delete Endpoints

**File:** `src/app/api/heaters/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating a heater
const updateHeaterSchema = z.object({
  model: z.string().min(1, 'Modell ist erforderlich').max(100, 'Modell zu lang').optional(),
  serialNumber: z.string().max(100, 'Seriennummer zu lang').optional().nullable(),
  installationDate: z.string().datetime('Ungültiges Installationsdatum').optional().nullable(),
  maintenanceInterval: z.enum(['1', '3', '6', '12', '24'], {
    errorMap: () => ({ message: 'Wartungsintervall muss 1, 3, 6, 12 oder 24 Monate sein' })
  }).optional(),
  lastMaintenance: z.string().datetime('Ungültiges Wartungsdatum').optional().nullable(),
});

/**
 * GET /api/heaters/:id
 * Get a single heater by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get heater ID from params
    const { id } = await params;

    // 3. Fetch heater with customer verification
    const heater = await prisma.heater.findFirst({
      where: {
        id: id,
        customer: {
          userId: userId, // Ensure user owns the customer
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            street: true,
            city: true,
          },
        },
        maintenances: {
          orderBy: {
            date: 'desc',
          },
          include: {
            photos: true,
          },
        },
      },
    });

    // 4. Check if heater exists
    if (!heater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 5. Return heater
    return NextResponse.json({
      success: true,
      data: heater,
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error fetching heater:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Heizung',
    }, { status: 500 });
  }
}

/**
 * PATCH /api/heaters/:id
 * Update a heater
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get heater ID from params
    const { id } = await params;

    // 3. Check if heater exists and belongs to user
    const existingHeater = await prisma.heater.findFirst({
      where: {
        id: id,
        customer: {
          userId: userId,
        },
      },
    });

    if (!existingHeater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = updateHeaterSchema.parse(body);

    // 5. Recalculate next maintenance if interval or lastMaintenance changed
    let nextMaintenance = existingHeater.nextMaintenance;

    if (validatedData.maintenanceInterval || validatedData.lastMaintenance) {
      const interval = validatedData.maintenanceInterval
        ? parseInt(validatedData.maintenanceInterval)
        : existingHeater.maintenanceInterval;

      const lastMaintenance = validatedData.lastMaintenance
        ? new Date(validatedData.lastMaintenance)
        : existingHeater.lastMaintenance || new Date();

      nextMaintenance = new Date(lastMaintenance);
      nextMaintenance.setMonth(nextMaintenance.getMonth() + interval);
    }

    // 6. Update heater
    const updatedHeater = await prisma.heater.update({
      where: {
        id: id,
      },
      data: {
        ...(validatedData.model && { model: validatedData.model }),
        ...(validatedData.serialNumber !== undefined && { serialNumber: validatedData.serialNumber }),
        ...(validatedData.installationDate !== undefined && {
          installationDate: validatedData.installationDate ? new Date(validatedData.installationDate) : null
        }),
        ...(validatedData.maintenanceInterval && {
          maintenanceInterval: parseInt(validatedData.maintenanceInterval)
        }),
        ...(validatedData.lastMaintenance !== undefined && {
          lastMaintenance: validatedData.lastMaintenance ? new Date(validatedData.lastMaintenance) : null
        }),
        nextMaintenance: nextMaintenance,
      },
    });

    // 7. Return updated heater
    return NextResponse.json({
      success: true,
      data: updatedHeater,
    });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validierungsfehler',
        details: error.issues,
      }, { status: 400 });
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error updating heater:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Aktualisieren der Heizung',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/heaters/:id
 * Delete a heater (and all related maintenances via cascade)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get heater ID from params
    const { id } = await params;

    // 3. Check if heater exists and belongs to user
    const existingHeater = await prisma.heater.findFirst({
      where: {
        id: id,
        customer: {
          userId: userId,
        },
      },
    });

    if (!existingHeater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Delete heater (cascade will delete maintenances and photos)
    await prisma.heater.delete({
      where: {
        id: id,
      },
    });

    // 5. Return success
    return NextResponse.json({
      success: true,
      message: 'Heizung erfolgreich gelöscht',
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error deleting heater:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Löschen der Heizung',
    }, { status: 500 });
  }
}
```

---

### 1.3 Testing Checklist for Day 1

Use tools like Thunder Client or Postman to test:

- [ ] **POST /api/heaters** - Create heater
  - ✅ Creates heater with valid data
  - ✅ Returns 400 for invalid maintenanceInterval
  - ✅ Returns 404 for non-existent customer
  - ✅ Auto-calculates nextMaintenance correctly
  - ✅ Returns 401 without authentication

- [ ] **GET /api/heaters?customerId=xxx** - List heaters
  - ✅ Returns all heaters for customer
  - ✅ Ordered by nextMaintenance (soonest first)
  - ✅ Returns 404 for non-existent customer
  - ✅ Returns 401 without authentication

- [ ] **GET /api/heaters/:id** - Get heater
  - ✅ Returns heater with customer and maintenance history
  - ✅ Returns 404 for non-existent heater
  - ✅ Returns 401 without authentication

- [ ] **PATCH /api/heaters/:id** - Update heater
  - ✅ Updates heater fields
  - ✅ Recalculates nextMaintenance when interval changes
  - ✅ Returns 404 for non-existent heater
  - ✅ Returns 401 without authentication

- [ ] **DELETE /api/heaters/:id** - Delete heater
  - ✅ Deletes heater successfully
  - ✅ Returns 404 for non-existent heater
  - ✅ Returns 401 without authentication

---

## 📅 Day 2: Heater Management UI

### 2.1 Update Customer Detail Page with Heaters Section

**File:** `src/app/dashboard/customers/[id]/page.tsx`

Update the placeholder heaters section with real functionality:

```typescript
// Replace the placeholder heaters section with:

{/* Heaters Section */}
<Card className="p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
      <HomeIcon className="h-5 w-5 text-gray-400" />
      Heizungen ({heaters.length})
    </h2>
    <Button
      onClick={() => setShowHeaterForm(true)}
      className="flex items-center gap-2"
      size="sm"
    >
      <PlusIcon className="h-4 w-4" />
      Heizung hinzufügen
    </Button>
  </div>

  {heaters.length === 0 ? (
    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
      <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Noch keine Heizungen</h3>
      <p className="mt-1 text-sm text-gray-500">
        Fügen Sie die erste Heizung für diesen Kunden hinzu
      </p>
      <Button
        onClick={() => setShowHeaterForm(true)}
        className="mt-4"
        size="sm"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Erste Heizung hinzufügen
      </Button>
    </div>
  ) : (
    <div className="space-y-4">
      {heaters.map((heater) => (
        <div
          key={heater.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{heater.model}</h3>
              {heater.serialNumber && (
                <p className="text-sm text-gray-600">SN: {heater.serialNumber}</p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {heater.installationDate && (
                  <div>
                    <p className="text-gray-500">Installiert</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(heater.installationDate)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Wartungsintervall</p>
                  <p className="font-medium text-gray-900">
                    {heater.maintenanceInterval} Monat{heater.maintenanceInterval > 1 ? 'e' : ''}
                  </p>
                </div>
                {heater.lastMaintenance && (
                  <div>
                    <p className="text-gray-500">Letzte Wartung</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(heater.lastMaintenance)}
                    </p>
                  </div>
                )}
                {heater.nextMaintenance && (
                  <div>
                    <p className="text-gray-500">Nächste Wartung</p>
                    <p className={`font-medium ${
                      isMaintenanceSoon(heater.nextMaintenance)
                        ? 'text-amber-600'
                        : 'text-gray-900'
                    }`}>
                      {formatDate(heater.nextMaintenance)}
                    </p>
                  </div>
                )}
              </div>

              {heater.maintenances?.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500">
                    {heater.maintenances.length} Wartung{heater.maintenances.length > 1 ? 'en' : ''} durchgeführt
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditHeater(heater)}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteHeater(heater.id, heater.model)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isMaintenanceSoon(heater.nextMaintenance) && (
            <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-200">
              <p className="text-sm text-amber-800">
                ⚠️ Wartung fällig in den nächsten 30 Tagen
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</Card>

{/* Heater Form Modal */}
{showHeaterForm && (
  <HeaterFormModal
    customerId={customer.id}
    heater={editingHeater}
    onClose={() => {
      setShowHeaterForm(false);
      setEditingHeater(null);
    }}
    onSuccess={() => {
      setShowHeaterForm(false);
      setEditingHeater(null);
      fetchCustomer(); // Refresh customer data
    }}
  />
)}
```

---

### 2.2 Create Heater Form Component

**File:** `src/components/HeaterFormModal.tsx`

```typescript
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
```

---

## 📅 Day 3: Maintenance Tracking API

### 3.1 Setup Supabase Storage for Photos

First, configure Supabase Storage bucket for maintenance photos:

**Manual Setup Steps:**
1. Go to Supabase Dashboard → Storage
2. Create new bucket: `maintenance-photos`
3. Set bucket to **public** or **private** based on preference
4. Configure allowed file types: `image/jpeg, image/png, image/webp`
5. Set max file size: 5MB per photo

**Environment Variables:**

Add to `.env`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Install Supabase Client:**

```bash
npm install @supabase/supabase-js
```

**Create Supabase Client:**

**File:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a maintenance photo to Supabase Storage
 * Returns the public URL of the uploaded file
 */
export async function uploadMaintenancePhoto(
  file: File,
  maintenanceId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${maintenanceId}-${Date.now()}.${fileExt}`;
  const filePath = `maintenances/${fileName}`;

  const { data, error } = await supabase.storage
    .from('maintenance-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: publicData } = supabase.storage
    .from('maintenance-photos')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}

/**
 * Delete a maintenance photo from Supabase Storage
 */
export async function deleteMaintenancePhoto(url: string): Promise<void> {
  // Extract file path from URL
  const urlParts = url.split('/maintenance-photos/');
  if (urlParts.length < 2) {
    throw new Error('Invalid photo URL');
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('maintenance-photos')
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
```

---

### 3.2 Create Maintenance API Endpoints

**File:** `src/app/api/maintenances/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a maintenance record
const createMaintenanceSchema = z.object({
  heaterId: z.string().uuid('Ungültige Heizungs-ID'),
  date: z.string().datetime('Ungültiges Datum'),
  notes: z.string().max(1000, 'Notizen zu lang').optional().nullable(),
  photos: z.array(z.string().url('Ungültige Foto-URL')).optional(),
});

/**
 * POST /api/maintenances
 * Create a new maintenance record and update heater dates
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = createMaintenanceSchema.parse(body);

    // 3. Verify heater belongs to user
    const heater = await prisma.heater.findFirst({
      where: {
        id: validatedData.heaterId,
        customer: {
          userId: userId,
        },
      },
    });

    if (!heater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Calculate next maintenance date
    const maintenanceDate = new Date(validatedData.date);
    const nextMaintenance = new Date(maintenanceDate);
    nextMaintenance.setMonth(nextMaintenance.getMonth() + heater.maintenanceInterval);

    // 5. Create maintenance record with photos in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create maintenance record
      const maintenance = await tx.maintenance.create({
        data: {
          heaterId: validatedData.heaterId,
          date: maintenanceDate,
          notes: validatedData.notes || null,
        },
      });

      // Create photo records if provided
      if (validatedData.photos && validatedData.photos.length > 0) {
        await tx.maintenancePhoto.createMany({
          data: validatedData.photos.map((url) => ({
            maintenanceId: maintenance.id,
            photoUrl: url,
          })),
        });
      }

      // Update heater dates
      await tx.heater.update({
        where: {
          id: validatedData.heaterId,
        },
        data: {
          lastMaintenance: maintenanceDate,
          nextMaintenance: nextMaintenance,
        },
      });

      // Fetch complete maintenance with photos
      const completeMaintenance = await tx.maintenance.findUnique({
        where: {
          id: maintenance.id,
        },
        include: {
          photos: true,
          heater: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return completeMaintenance;
    });

    // 6. Return created maintenance
    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 201 });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validierungsfehler',
        details: error.issues,
      }, { status: 400 });
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error creating maintenance:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Erstellen der Wartung',
    }, { status: 500 });
  }
}

/**
 * GET /api/maintenances?heaterId=xxx
 * Get all maintenance records for a heater
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get heater ID from query params
    const searchParams = request.nextUrl.searchParams;
    const heaterId = searchParams.get('heaterId');

    if (!heaterId) {
      return NextResponse.json({
        success: false,
        error: 'Heizungs-ID fehlt',
      }, { status: 400 });
    }

    // 3. Verify heater belongs to user
    const heater = await prisma.heater.findFirst({
      where: {
        id: heaterId,
        customer: {
          userId: userId,
        },
      },
    });

    if (!heater) {
      return NextResponse.json({
        success: false,
        error: 'Heizung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Fetch maintenances
    const maintenances = await prisma.maintenance.findMany({
      where: {
        heaterId: heaterId,
      },
      include: {
        photos: true,
      },
      orderBy: {
        date: 'desc', // Most recent first
      },
    });

    // 5. Return maintenances
    return NextResponse.json({
      success: true,
      data: maintenances,
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error fetching maintenances:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Wartungen',
    }, { status: 500 });
  }
}
```

---

### 3.3 Create Single Maintenance Endpoint

**File:** `src/app/api/maintenances/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { deleteMaintenancePhoto } from '@/lib/supabase';

/**
 * GET /api/maintenances/:id
 * Get a single maintenance record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get maintenance ID from params
    const { id } = await params;

    // 3. Fetch maintenance with ownership verification
    const maintenance = await prisma.maintenance.findFirst({
      where: {
        id: id,
        heater: {
          customer: {
            userId: userId,
          },
        },
      },
      include: {
        photos: true,
        heater: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                street: true,
                city: true,
              },
            },
          },
        },
      },
    });

    // 4. Check if maintenance exists
    if (!maintenance) {
      return NextResponse.json({
        success: false,
        error: 'Wartung nicht gefunden',
      }, { status: 404 });
    }

    // 5. Return maintenance
    return NextResponse.json({
      success: true,
      data: maintenance,
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error fetching maintenance:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Wartung',
    }, { status: 500 });
  }
}

/**
 * DELETE /api/maintenances/:id
 * Delete a maintenance record and its photos
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get maintenance ID from params
    const { id } = await params;

    // 3. Fetch maintenance with photos and ownership verification
    const maintenance = await prisma.maintenance.findFirst({
      where: {
        id: id,
        heater: {
          customer: {
            userId: userId,
          },
        },
      },
      include: {
        photos: true,
      },
    });

    if (!maintenance) {
      return NextResponse.json({
        success: false,
        error: 'Wartung nicht gefunden',
      }, { status: 404 });
    }

    // 4. Delete photos from Supabase Storage
    for (const photo of maintenance.photos) {
      try {
        await deleteMaintenancePhoto(photo.photoUrl);
      } catch (err) {
        console.error('Error deleting photo from storage:', err);
        // Continue deletion even if photo deletion fails
      }
    }

    // 5. Delete maintenance (cascade will delete photo records)
    await prisma.maintenance.delete({
      where: {
        id: id,
      },
    });

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: 'Wartung erfolgreich gelöscht',
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error deleting maintenance:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Löschen der Wartung',
    }, { status: 500 });
  }
}
```

---

### 3.4 Testing Checklist for Day 3

- [ ] **Supabase Storage Setup**
  - ✅ Bucket created and configured
  - ✅ Upload test image manually
  - ✅ Verify public URL works

- [ ] **POST /api/maintenances** - Create maintenance
  - ✅ Creates maintenance with valid data
  - ✅ Updates heater lastMaintenance and nextMaintenance
  - ✅ Saves multiple photo URLs correctly
  - ✅ Returns 404 for non-existent heater
  - ✅ Returns 401 without authentication

- [ ] **GET /api/maintenances?heaterId=xxx** - List maintenances
  - ✅ Returns all maintenances for heater
  - ✅ Ordered by date (most recent first)
  - ✅ Includes photo records
  - ✅ Returns 404 for non-existent heater
  - ✅ Returns 401 without authentication

- [ ] **GET /api/maintenances/:id** - Get maintenance
  - ✅ Returns maintenance with photos
  - ✅ Includes heater and customer info
  - ✅ Returns 404 for non-existent maintenance
  - ✅ Returns 401 without authentication

- [ ] **DELETE /api/maintenances/:id** - Delete maintenance
  - ✅ Deletes maintenance and photo records
  - ✅ Deletes photos from Supabase Storage
  - ✅ Returns 404 for non-existent maintenance
  - ✅ Returns 401 without authentication

---

## 📅 Day 4: Maintenance Tracking Frontend

### 4.1 Create Maintenance Form Component

**File:** `src/components/MaintenanceFormModal.tsx`

```typescript
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
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

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
```

---

### 4.2 Create Maintenance History Component

**File:** `src/components/MaintenanceHistory.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FileTextIcon, ImageIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenancePhoto {
  id: string;
  photoUrl: string;
}

interface Maintenance {
  id: string;
  date: string;
  notes: string | null;
  photos: MaintenancePhoto[];
}

interface MaintenanceHistoryProps {
  maintenances: Maintenance[];
  onDelete: (id: string) => void;
}

export function MaintenanceHistory({
  maintenances,
  onDelete,
}: MaintenanceHistoryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDelete = async (maintenance: Maintenance) => {
    if (
      !confirm(
        `Möchten Sie die Wartung vom ${formatDate(maintenance.date)} wirklich löschen?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenances/${maintenance.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Wartung gelöscht');
        onDelete(maintenance.id);
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting maintenance:', err);
      toast.error('Fehler beim Löschen der Wartung');
    }
  };

  if (maintenances.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Noch keine Wartungen
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Wartungen werden hier angezeigt
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {maintenances.map((maintenance) => (
          <Card key={maintenance.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">
                    {formatDate(maintenance.date)}
                  </span>
                </div>

                {maintenance.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-700 mb-3">
                    <FileTextIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p className="flex-1 whitespace-pre-wrap">
                      {maintenance.notes}
                    </p>
                  </div>
                )}

                {maintenance.photos.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                    <div className="flex gap-2 overflow-x-auto">
                      {maintenance.photos.map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.photoUrl}
                          alt="Wartungsfoto"
                          className="h-16 w-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setSelectedPhoto(photo.photoUrl)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(maintenance)}
                className="ml-4 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Full-size photo viewer */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Wartungsfoto"
            className="max-w-full max-h-full object-contain"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 bg-white"
          >
            Schließen
          </Button>
        </div>
      )}
    </>
  );
}
```

---

### 4.3 Update Customer Detail Page with Maintenance UI

Update [src/app/dashboard/customers/[id]/page.tsx](src/app/dashboard/customers/[id]/page.tsx) to include:

1. **"Wartung erledigt" button** in heater cards
2. **Maintenance history display** below each heater
3. **State management** for showing/hiding maintenance form

```typescript
// Add to imports:
import { MaintenanceFormModal } from '@/components/MaintenanceFormModal';
import { MaintenanceHistory } from '@/components/MaintenanceHistory';

// Add state:
const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
const [selectedHeater, setSelectedHeater] = useState<Heater | null>(null);

// Add button in heater card (after edit/delete buttons):
<Button
  size="sm"
  onClick={() => {
    setSelectedHeater(heater);
    setShowMaintenanceForm(true);
  }}
  className="bg-green-600 hover:bg-green-700 text-white"
>
  Wartung erledigt
</Button>

// Add maintenance history below heater details:
{heater.maintenances && heater.maintenances.length > 0 && (
  <div className="mt-4">
    <h4 className="text-sm font-medium text-gray-700 mb-2">
      Wartungshistorie
    </h4>
    <MaintenanceHistory
      maintenances={heater.maintenances}
      onDelete={() => fetchCustomer()} // Refresh data
    />
  </div>
)}

// Add modal at end of component:
{showMaintenanceForm && selectedHeater && (
  <MaintenanceFormModal
    heaterId={selectedHeater.id}
    heaterModel={selectedHeater.model}
    onClose={() => {
      setShowMaintenanceForm(false);
      setSelectedHeater(null);
    }}
    onSuccess={() => {
      setShowMaintenanceForm(false);
      setSelectedHeater(null);
      fetchCustomer(); // Refresh data
    }}
  />
)}
```

---

## 📅 Day 5: Dashboard Updates & Polish

### 5.1 Create Dashboard Statistics API

**File:** `src/app/api/dashboard/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for the logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await requireAuth();

    // 2. Get current date for maintenance calculations
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // 3. Fetch statistics in parallel
    const [
      totalCustomers,
      totalHeaters,
      overdueMaintenances,
      upcomingMaintenances,
    ] = await Promise.all([
      // Total customers
      prisma.customer.count({
        where: {
          userId: userId,
        },
      }),

      // Total heaters
      prisma.heater.count({
        where: {
          customer: {
            userId: userId,
          },
        },
      }),

      // Overdue maintenances
      prisma.heater.findMany({
        where: {
          customer: {
            userId: userId,
          },
          nextMaintenance: {
            lt: now, // Less than now = overdue
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          nextMaintenance: 'asc', // Most overdue first
        },
      }),

      // Upcoming maintenances (next 30 days)
      prisma.heater.findMany({
        where: {
          customer: {
            userId: userId,
          },
          nextMaintenance: {
            gte: now, // Greater than or equal to now
            lte: thirtyDaysFromNow, // Within 30 days
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          nextMaintenance: 'asc', // Soonest first
        },
      }),
    ]);

    // 4. Return statistics
    return NextResponse.json({
      success: true,
      data: {
        totalCustomers,
        totalHeaters,
        overdueCount: overdueMaintenances.length,
        upcomingCount: upcomingMaintenances.length,
        overdueMaintenances,
        upcomingMaintenances,
      },
    });

  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Statistiken',
    }, { status: 500 });
  }
}
```

---

### 5.2 Update Dashboard Page with Statistics

**File:** `src/app/dashboard/page.tsx`

Update the placeholder dashboard with real data:

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  UsersIcon,
  HomeIcon,
  AlertTriangleIcon,
  CalendarIcon,
  PlusIcon,
} from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  totalHeaters: number;
  overdueCount: number;
  upcomingCount: number;
  overdueMaintenances: Heater[];
  upcomingMaintenances: Heater[];
}

interface Heater {
  id: string;
  model: string;
  nextMaintenance: string | null;
  customer: {
    id: string;
    name: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const result = await response.json();

        if (result.success) {
          setStats(result.data);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string): number => {
    const target = new Date(dateString);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
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
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Übersicht über Ihre Kunden und Heizungen
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Customers */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kunden</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalCustomers || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Total Heaters */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Heizungen</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats?.totalHeaters || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <HomeIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Overdue Maintenances */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Überfällig</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {stats?.overdueCount || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        {/* Upcoming Maintenances */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Nächste 30 Tage
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {stats?.upcomingCount || 0}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <CalendarIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Overdue Maintenances */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-600" />
              Überfällige Wartungen
            </h2>
          </div>

          {stats?.overdueMaintenances && stats.overdueMaintenances.length > 0 ? (
            <div className="space-y-3">
              {stats.overdueMaintenances.slice(0, 5).map((heater) => (
                <Link
                  key={heater.id}
                  href={`/dashboard/customers/${heater.customer.id}`}
                  className="block p-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {heater.customer.name}
                      </p>
                      <p className="text-sm text-gray-600">{heater.model}</p>
                    </div>
                    {heater.nextMaintenance && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          {formatDate(heater.nextMaintenance)}
                        </p>
                        <p className="text-xs text-red-600">
                          {Math.abs(getDaysUntil(heater.nextMaintenance))} Tage überfällig
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangleIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Keine überfälligen Wartungen
              </p>
            </div>
          )}
        </Card>

        {/* Upcoming Maintenances */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-amber-600" />
              Anstehende Wartungen
            </h2>
          </div>

          {stats?.upcomingMaintenances && stats.upcomingMaintenances.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingMaintenances.slice(0, 5).map((heater) => (
                <Link
                  key={heater.id}
                  href={`/dashboard/customers/${heater.customer.id}`}
                  className="block p-3 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {heater.customer.name}
                      </p>
                      <p className="text-sm text-gray-600">{heater.model}</p>
                    </div>
                    {heater.nextMaintenance && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-amber-600">
                          {formatDate(heater.nextMaintenance)}
                        </p>
                        <p className="text-xs text-amber-600">
                          In {getDaysUntil(heater.nextMaintenance)} Tagen
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Keine anstehenden Wartungen
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Schnellzugriff
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/customers/new">
            <Button className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Neuer Kunde
            </Button>
          </Link>
          <Link href="/dashboard/customers">
            <Button variant="outline" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Alle Kunden
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
```

---

## 📅 Day 6: Testing, Polish & Documentation

### 6.1 End-to-End Testing Checklist

**Complete User Flow:**
- [ ] Login with test user
- [ ] Navigate to customers list
- [ ] Create new customer with all heating details
- [ ] View customer detail page
- [ ] Add heater to customer
- [ ] Edit heater information
- [ ] Mark maintenance as completed with photos
- [ ] View maintenance history
- [ ] Delete maintenance
- [ ] Delete heater
- [ ] Check dashboard statistics update
- [ ] Verify overdue/upcoming lists
- [ ] Logout and verify data persistence

**Mobile Testing:**
- [ ] Test on mobile viewport (375px width)
- [ ] All forms usable on mobile
- [ ] Photo upload works on mobile
- [ ] Cards stack properly
- [ ] Buttons accessible
- [ ] Modals fit screen

**Error Handling:**
- [ ] Network errors show toast
- [ ] Validation errors display inline
- [ ] 404 errors redirect properly
- [ ] Unauthorized access redirects to login

---

### 6.2 Performance Optimization

**Areas to optimize:**
1. **Image Optimization**
   - Compress maintenance photos before upload
   - Use Next.js Image component where possible
   - Lazy load images in maintenance history

2. **API Optimization**
   - Add pagination to maintenance history if > 20 records
   - Cache dashboard statistics (5 minutes)
   - Optimize Prisma queries with proper indexes

3. **Loading States**
   - Add skeleton loaders instead of spinners
   - Implement optimistic updates for better UX
   - Pre-load customer data when hovering links

---

### 6.3 Update Development Progress Document

Update [docs/DEVELOPMENT-PROGRESS.md](docs/DEVELOPMENT-PROGRESS.md):

- Change Sprint 3 status to "Complete"
- Update overall progress to 60%
- List all files created/modified
- Document any issues encountered
- Add session summary

---

### 6.4 Polish Checklist

- [ ] All text in German
- [ ] Consistent spacing and padding
- [ ] All buttons have proper hover states
- [ ] Toast notifications for all actions
- [ ] Confirm dialogs for destructive actions
- [ ] Proper loading states everywhere
- [ ] No console errors or warnings
- [ ] TypeScript compilation clean
- [ ] Responsive design tested
- [ ] Accessibility: keyboard navigation works

---

## 🎯 Sprint 3 Success Criteria

By the end of Sprint 3, these must be working:

- [ ] Max can add heaters to customers
- [ ] Max can edit and delete heaters
- [ ] Next maintenance date auto-calculates
- [ ] Max can mark maintenance as completed
- [ ] Max can upload photos during maintenance
- [ ] Maintenance history displays correctly
- [ ] Dashboard shows upcoming maintenances
- [ ] All features work on mobile
- [ ] All text in German
- [ ] Toast notifications for all actions
- [ ] Zero TypeScript errors

---

## 📝 German Vocabulary Reference

- **Heizung** - Heater/Heating system
- **Wartung** - Maintenance
- **Wartung erledigt** - Maintenance completed
- **Nächste Wartung** - Next maintenance
- **Letzte Wartung** - Last maintenance
- **Wartungsintervall** - Maintenance interval
- **Installationsdatum** - Installation date
- **Seriennummer** - Serial number
- **Modell** - Model
- **Überfällig** - Overdue
- **Fällig** - Due

---

## 🚀 Ready for Sprint 3!

**Current Status:** Sprint 2 Complete ✅
**Next Step:** Implement Heater API (Day 1)
**Goal:** Complete heater and maintenance management system

---

*Document Version: 1.0*
*Last Updated: January 8, 2026*
*Status: Ready for Development*
