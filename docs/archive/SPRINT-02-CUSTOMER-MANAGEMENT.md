# Sprint 2: Customer & Heater Management

**Duration:** 5 Days (Week 2)
**Goal:** Build complete customer and heater CRUD functionality with dashboard
**Dependencies:** Sprint 1 (Authentication & Security) must be complete

---

## 📋 Sprint Overview

By the end of Sprint 2, you will have:
- ✅ Complete customer management (Create, Read, Update, Delete)
- ✅ Heater management with customer association
- ✅ Dashboard with customer list and search
- ✅ Protected API routes with authentication
- ✅ User-specific data isolation (row-level security)
- ✅ Responsive UI with proper error handling

---

## 🎯 Sprint 2 Goals Summary

### Day 1: Authentication Middleware & Dashboard Setup
- [ ] Create authentication middleware helper
- [ ] Build dashboard layout and navigation
- [ ] Create protected route wrapper
- [ ] Implement logout functionality

### Day 2: Customer Management - Backend
- [ ] Create Customer API endpoints (CRUD)
- [ ] Apply validation, rate limiting, and CSRF protection
- [ ] Test customer endpoints

### Day 3: Customer Management - Frontend
- [ ] Build customer list page with search
- [ ] Create customer detail page
- [ ] Build customer form (create/edit)
- [ ] Implement delete confirmation dialog

### Day 4: Heater Management
- [ ] Create Heater API endpoints (CRUD)
- [ ] Build heater form component
- [ ] Integrate heater management into customer detail page
- [ ] Implement next maintenance calculation

### Day 5: Testing & Polish
- [ ] Integration testing (full customer + heater flow)
- [ ] Error handling improvements
- [ ] Loading states and UI polish
- [ ] Security audit for new endpoints

---

## 📅 Day 1: Authentication Middleware & Dashboard Setup

### 1.1 Create Authentication Helper

**File:** `src/lib/auth-helpers.ts`

Create a helper function to extract authenticated user from session:

```typescript
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';

/**
 * Get authenticated user from session
 * @throws Error if user is not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

/**
 * Middleware for API routes that require authentication
 * Returns user info or null if not authenticated
 */
export async function getAuthUser() {
  const session = await auth();
  return session?.user || null;
}

/**
 * Check if user owns a resource
 * @param userId - Current user's ID
 * @param resourceUserId - Resource owner's ID
 * @returns true if user owns resource
 */
export function checkOwnership(userId: string, resourceUserId: string): boolean {
  return userId === resourceUserId;
}
```

**Why:** Centralizes authentication logic and makes API routes cleaner.

---

### 1.2 Create Protected Route Wrapper Component

**File:** `src/components/ProtectedRoute.tsx`

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
```

**Why:** Protects client-side routes from unauthenticated access.

---

### 1.3 Build Dashboard Layout

**File:** `src/app/dashboard/layout.tsx`

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardNav } from '@/components/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
```

---

### 1.4 Create Dashboard Navigation

**File:** `src/components/DashboardNav.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Customers', href: '/dashboard/customers' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex shrink-0 items-center">
              <h1 className="text-xl font-bold text-gray-900">Torqr</h1>
            </div>
            <div className="ml-6 flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    isActive(item.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{session?.user?.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

### 1.5 Create Dashboard Home Page

**File:** `src/app/dashboard/page.tsx`

```typescript
import { requireAuth } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  try {
    await requireAuth();
  } catch {
    redirect('/login');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome to Torqr. Your customer management dashboard.
      </p>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Stats cards will go here in future sprints */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="rounded-md bg-blue-500 p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                    <dd className="text-3xl font-semibold text-gray-900">-</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**✅ Day 1 Checkpoint:**
- Authentication middleware working
- Dashboard layout with navigation
- Protected routes enforced
- User can logout

---

## 📅 Day 2: Customer Management - Backend

### 2.1 Create Customer API - List Customers

**File:** `src/app/api/customers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';

/**
 * GET /api/customers
 * List all customers for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Apply rate limiting
    const rateLimitResponse = rateLimitByUser(
      request,
      userId,
      RATE_LIMIT_PRESETS.API_USER
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'name';

    // Build where clause
    const where = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { street: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Fetch customers with heater count
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          heaters: {
            select: {
              id: true,
              model: true,
              nextMaintenance: true,
            },
          },
        },
        orderBy: { [sortBy]: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * Create new customer
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Apply rate limiting
    const rateLimitResponse = rateLimitByUser(
      request,
      userId,
      RATE_LIMIT_PRESETS.API_USER
    );
    if (rateLimitResponse) return rateLimitResponse;

    // TODO: Apply CSRF protection when client sends token
    // const csrfResponse = csrfProtection(request);
    // if (csrfResponse) return csrfResponse;

    // Parse and validate request body
    const body = await request.json();
    const { customerCreateSchema, safeValidateRequest } = await import('@/lib/validations');
    const validationResult = safeValidateRequest(customerCreateSchema, body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        ...validationResult.data,
        userId,
      },
      include: {
        heaters: true,
      },
    });

    return NextResponse.json(
      { customer },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating customer:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
```

---

### 2.2 Create Customer API - Single Customer Operations

**File:** `src/app/api/customers/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, checkOwnership } from '@/lib/auth-helpers';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { uuidSchema } from '@/lib/validations';

/**
 * GET /api/customers/:id
 * Get single customer with heaters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Validate ID format
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        heaters: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Check if customer exists
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (!checkOwnership(userId, customer.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customers/:id
 * Update customer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Apply rate limiting
    const rateLimitResponse = rateLimitByUser(
      request,
      userId,
      RATE_LIMIT_PRESETS.API_USER
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Validate ID format
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Check customer exists and verify ownership
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (!checkOwnership(userId, existingCustomer.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { customerUpdateSchema, safeValidateRequest } = await import('@/lib/validations');
    const validationResult = safeValidateRequest(customerUpdateSchema, body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: validationResult.data,
      include: {
        heaters: true,
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error updating customer:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/:id
 * Delete customer (and all associated data)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Apply rate limiting
    const rateLimitResponse = rateLimitByUser(
      request,
      userId,
      RATE_LIMIT_PRESETS.API_USER
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Validate ID format
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Check customer exists and verify ownership
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (!checkOwnership(userId, existingCustomer.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete customer (cascades to heaters and maintenances)
    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
```

---

### 2.3 Test Customer API Endpoints

Create test file or use tools like:
- **Postman/Insomnia**: Test all CRUD operations
- **curl commands**: Quick CLI testing
- **Next.js API testing**: Add to test suite

**Test cases:**
1. ✅ Create customer with valid data
2. ✅ Create customer with invalid data (should return 400)
3. ✅ List customers (should filter by userId)
4. ✅ Search customers by name
5. ✅ Get single customer
6. ✅ Update customer
7. ✅ Delete customer
8. ✅ Try accessing another user's customer (should return 403)
9. ✅ Test rate limiting (exceed 100 requests/min)

**✅ Day 2 Checkpoint:**
- All customer API endpoints working
- Validation applied to all inputs
- Rate limiting enforced
- User data isolation verified

---

## 📅 Day 3: Customer Management - Frontend

### 3.1 Create Customer List Page

**File:** `src/app/dashboard/customers/page.tsx`

```typescript
import { requireAuth } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { CustomerList } from '@/components/customers/CustomerList';

export default async function CustomersPage() {
  try {
    await requireAuth();
  } catch {
    redirect('/login');
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your customer database
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <a
            href="/dashboard/customers/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Customer
          </a>
        </div>
      </div>

      <div className="mt-8">
        <CustomerList />
      </div>
    </div>
  );
}
```

---

### 3.2 Create Customer List Component

**File:** `src/components/customers/CustomerList.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Heater {
  id: string;
  model: string;
  nextMaintenance: string | null;
}

interface Customer {
  id: string;
  name: string;
  street: string;
  city: string;
  phone: string;
  heaters: Heater[];
}

export function CustomerList() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/customers?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.customers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  if (loading && customers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchCustomers} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No customers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first customer.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push('/dashboard/customers/new')}>
              Add Customer
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <li key={customer.id}>
                <a
                  href={`/dashboard/customers/${customer.id}`}
                  className="block hover:bg-gray-50 transition"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {customer.street}, {customer.city}
                        </p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      </div>
                      <div className="ml-4 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-500">
                            {customer.heaters.length} heater(s)
                          </span>
                          {customer.heaters.some(h => h.nextMaintenance) && (
                            <span className="mt-1 text-xs text-orange-600">
                              Maintenance due
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

### 3.3 Create Customer Form Component

**File:** `src/components/customers/CustomerForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const customerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  street: z.string().min(3, 'Street must be at least 3 characters'),
  zipCode: z.string().min(3, 'Zip code must be at least 3 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer?: CustomerFormData & { id: string };
  mode: 'create' | 'edit';
}

export function CustomerForm({ customer, mode }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer,
  });

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    setError(null);

    try {
      const url =
        mode === 'create'
          ? '/api/customers'
          : `/api/customers/${customer?.id}`;

      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save customer');
      }

      const result = await response.json();
      router.push(`/dashboard/customers/${result.customer.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'New Customer' : 'Edit Customer'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name')} disabled={loading} />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="street">Street *</Label>
            <Input id="street" {...register('street')} disabled={loading} />
            {errors.street && (
              <p className="text-sm text-red-600 mt-1">{errors.street.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zipCode">Zip Code *</Label>
              <Input id="zipCode" {...register('zipCode')} disabled={loading} />
              {errors.zipCode && (
                <p className="text-sm text-red-600 mt-1">{errors.zipCode.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input id="city" {...register('city')} disabled={loading} />
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" type="tel" {...register('phone')} disabled={loading} />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" type="email" {...register('email')} disabled={loading} />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              disabled={loading}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.notes && (
              <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

### 3.4 Create New Customer Page

**File:** `src/app/dashboard/customers/new/page.tsx`

```typescript
import { requireAuth } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { CustomerForm } from '@/components/customers/CustomerForm';

export default async function NewCustomerPage() {
  try {
    await requireAuth();
  } catch {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl">
      <CustomerForm mode="create" />
    </div>
  );
}
```

---

### 3.5 Create Customer Detail Page

**File:** `src/app/dashboard/customers/[id]/page.tsx`

```typescript
import { requireAuth } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { CustomerDetail } from '@/components/customers/CustomerDetail';

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    await requireAuth();
  } catch {
    redirect('/login');
  }

  return <CustomerDetail customerId={params.id} />;
}
```

---

**File:** `src/components/customers/CustomerDetail.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Customer {
  id: string;
  name: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email?: string;
  notes?: string;
  heaters: Array<{
    id: string;
    model: string;
    maintenanceInterval: number;
    nextMaintenance?: string;
  }>;
}

export function CustomerDetail({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }

      const data = await response.json();
      setCustomer(data.customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all associated heaters and maintenance records.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      router.push('/dashboard/customers');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading customer...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Customer not found'}</p>
        <Button onClick={() => router.push('/dashboard/customers')} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {customer.street}, {customer.zipCode} {customer.city}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/customers/${customerId}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-500">Phone:</span>
            <p className="text-sm text-gray-900">{customer.phone}</p>
          </div>
          {customer.email && (
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-sm text-gray-900">{customer.email}</p>
            </div>
          )}
          {customer.notes && (
            <div>
              <span className="text-sm font-medium text-gray-500">Notes:</span>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Heaters Section - will be implemented on Day 4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Heaters</CardTitle>
            <Button size="sm">Add Heater</Button>
          </div>
        </CardHeader>
        <CardContent>
          {customer.heaters.length === 0 ? (
            <p className="text-sm text-gray-500">No heaters added yet.</p>
          ) : (
            <div className="space-y-2">
              {customer.heaters.map((heater) => (
                <div key={heater.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{heater.model}</p>
                    <p className="text-sm text-gray-500">
                      Maintenance every {heater.maintenanceInterval} months
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

**✅ Day 3 Checkpoint:**
- Customer list page with search working
- Create new customer working
- View customer details working
- Edit customer working
- Delete customer with confirmation working

---

## 📅 Day 4: Heater Management

### 4.1 Create Heater API Endpoints

**File:** `src/app/api/heaters/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, checkOwnership } from '@/lib/auth-helpers';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { heaterCreateSchema, safeValidateRequest } from '@/lib/validations';
import { addMonths } from 'date-fns';

/**
 * Calculate next maintenance date based on last maintenance and interval
 */
function calculateNextMaintenance(
  lastMaintenance: Date | null,
  installationDate: Date | null,
  maintenanceInterval: number
): Date {
  const baseDate = lastMaintenance || installationDate || new Date();
  return addMonths(baseDate, maintenanceInterval);
}

/**
 * POST /api/heaters
 * Create heater for customer
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Apply rate limiting
    const rateLimitResponse = rateLimitByUser(
      request,
      userId,
      RATE_LIMIT_PRESETS.API_USER
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = safeValidateRequest(heaterCreateSchema, body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    const { customerId, lastMaintenance, installationDate, ...heaterData } =
      validationResult.data;

    // Verify customer ownership
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { userId: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (!checkOwnership(userId, customer.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse dates
    const lastMaintenanceDate = lastMaintenance ? new Date(lastMaintenance) : null;
    const installationDateObj = installationDate ? new Date(installationDate) : null;

    // Calculate next maintenance
    const nextMaintenance = calculateNextMaintenance(
      lastMaintenanceDate,
      installationDateObj,
      heaterData.maintenanceInterval
    );

    // Create heater
    const heater = await prisma.heater.create({
      data: {
        ...heaterData,
        customerId,
        lastMaintenance: lastMaintenanceDate,
        installationDate: installationDateObj,
        nextMaintenance,
      },
    });

    return NextResponse.json(
      { heater },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating heater:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create heater' },
      { status: 500 }
    );
  }
}
```

---

**File:** `src/app/api/heaters/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, checkOwnership } from '@/lib/auth-helpers';
import { rateLimitByUser, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { heaterUpdateSchema, safeValidateRequest, uuidSchema } from '@/lib/validations';
import { addMonths } from 'date-fns';

function calculateNextMaintenance(
  lastMaintenance: Date | null,
  installationDate: Date | null,
  maintenanceInterval: number
): Date {
  const baseDate = lastMaintenance || installationDate || new Date();
  return addMonths(baseDate, maintenanceInterval);
}

/**
 * PATCH /api/heaters/:id
 * Update heater
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Apply rate limiting
    const rateLimitResponse = rateLimitByUser(
      request,
      userId,
      RATE_LIMIT_PRESETS.API_USER
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Validate ID format
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid heater ID' },
        { status: 400 }
      );
    }

    // Check heater exists and verify ownership
    const existingHeater = await prisma.heater.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: { userId: true },
        },
      },
    });

    if (!existingHeater) {
      return NextResponse.json(
        { error: 'Heater not found' },
        { status: 404 }
      );
    }

    if (!checkOwnership(userId, existingHeater.customer.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = safeValidateRequest(heaterUpdateSchema, body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    const { lastMaintenance, installationDate, maintenanceInterval, ...updateData } =
      validationResult.data;

    // Parse dates if provided
    const lastMaintenanceDate = lastMaintenance ? new Date(lastMaintenance) : undefined;
    const installationDateObj = installationDate ? new Date(installationDate) : undefined;

    // Recalculate next maintenance if relevant fields changed
    let nextMaintenance = undefined;
    if (lastMaintenanceDate || installationDateObj || maintenanceInterval) {
      nextMaintenance = calculateNextMaintenance(
        lastMaintenanceDate ?? existingHeater.lastMaintenance,
        installationDateObj ?? existingHeater.installationDate,
        maintenanceInterval ?? existingHeater.maintenanceInterval
      );
    }

    // Update heater
    const heater = await prisma.heater.update({
      where: { id: params.id },
      data: {
        ...updateData,
        ...(lastMaintenanceDate !== undefined && { lastMaintenance: lastMaintenanceDate }),
        ...(installationDateObj !== undefined && { installationDate: installationDateObj }),
        ...(maintenanceInterval !== undefined && { maintenanceInterval }),
        ...(nextMaintenance !== undefined && { nextMaintenance }),
      },
    });

    return NextResponse.json({ heater });
  } catch (error) {
    console.error('Error updating heater:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update heater' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/heaters/:id
 * Delete heater
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const { userId } = await requireAuth();

    // Apply rate limiting
    const rateLimitResponse = rateLimitByUser(
      request,
      userId,
      RATE_LIMIT_PRESETS.API_USER
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Validate ID format
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid heater ID' },
        { status: 400 }
      );
    }

    // Check heater exists and verify ownership
    const existingHeater = await prisma.heater.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: { userId: true },
        },
      },
    });

    if (!existingHeater) {
      return NextResponse.json(
        { error: 'Heater not found' },
        { status: 404 }
      );
    }

    if (!checkOwnership(userId, existingHeater.customer.userId)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete heater
    await prisma.heater.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting heater:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete heater' },
      { status: 500 }
    );
  }
}
```

---

### 4.2 Create Heater Form Component

**File:** `src/components/heaters/HeaterForm.tsx`

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
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

const heaterFormSchema = z.object({
  model: z.string().min(2, 'Model must be at least 2 characters'),
  serialNumber: z.string().optional(),
  installationDate: z.string().optional(),
  maintenanceInterval: z.coerce.number().refine(
    (val) => [1, 3, 6, 12, 24].includes(val),
    'Must be 1, 3, 6, 12, or 24 months'
  ),
  lastMaintenance: z.string().optional(),
  requiredParts: z.string().optional(),
});

type HeaterFormData = z.infer<typeof heaterFormSchema>;

interface HeaterFormProps {
  customerId: string;
  heater?: HeaterFormData & { id: string };
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function HeaterForm({
  customerId,
  heater,
  mode,
  onSuccess,
  onCancel,
}: HeaterFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HeaterFormData>({
    resolver: zodResolver(heaterFormSchema),
    defaultValues: heater || { maintenanceInterval: 12 },
  });

  const maintenanceInterval = watch('maintenanceInterval');

  const onSubmit = async (data: HeaterFormData) => {
    setLoading(true);
    setError(null);

    try {
      const url =
        mode === 'create' ? '/api/heaters' : `/api/heaters/${heater?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const payload = mode === 'create' ? { ...data, customerId } : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save heater');
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="model">Model *</Label>
        <Input
          id="model"
          {...register('model')}
          placeholder="e.g., Viessmann Vitodens 200"
          disabled={loading}
        />
        {errors.model && (
          <p className="text-sm text-red-600 mt-1">{errors.model.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="serialNumber">Serial Number</Label>
        <Input
          id="serialNumber"
          {...register('serialNumber')}
          placeholder="Optional"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="installationDate">Installation Date</Label>
        <Input
          id="installationDate"
          type="date"
          {...register('installationDate')}
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="maintenanceInterval">Maintenance Interval *</Label>
        <Select
          value={maintenanceInterval?.toString()}
          onValueChange={(value) => setValue('maintenanceInterval', parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select interval" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Every month</SelectItem>
            <SelectItem value="3">Every 3 months</SelectItem>
            <SelectItem value="6">Every 6 months</SelectItem>
            <SelectItem value="12">Every 12 months</SelectItem>
            <SelectItem value="24">Every 24 months</SelectItem>
          </SelectContent>
        </Select>
        {errors.maintenanceInterval && (
          <p className="text-sm text-red-600 mt-1">
            {errors.maintenanceInterval.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="lastMaintenance">Last Maintenance</Label>
        <Input
          id="lastMaintenance"
          type="date"
          {...register('lastMaintenance')}
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="requiredParts">Required Parts</Label>
        <textarea
          id="requiredParts"
          {...register('requiredParts')}
          placeholder="List of parts needed for maintenance..."
          disabled={loading}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading
            ? 'Saving...'
            : mode === 'create'
            ? 'Add Heater'
            : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
```

---

### 4.3 Update Customer Detail to Include Heaters

Update `src/components/customers/CustomerDetail.tsx` to add the heater management UI:

Add heater list with "Add Heater" button that opens a dialog with the `HeaterForm` component.

**Implementation hint:** Use shadcn/ui Dialog component to show heater form in a modal.

---

**✅ Day 4 Checkpoint:**
- Heater API endpoints working
- Add heater to customer working
- Edit heater working
- Delete heater working
- Next maintenance calculation working

---

## 📅 Day 5: Testing & Polish

### 5.1 Integration Testing

Test complete user flows:

1. **Full Customer Flow:**
   - ✅ Create customer
   - ✅ Search for customer
   - ✅ View customer details
   - ✅ Edit customer
   - ✅ Add heater to customer
   - ✅ Edit heater
   - ✅ Delete heater
   - ✅ Delete customer

2. **Edge Cases:**
   - ✅ Invalid input data
   - ✅ Accessing another user's data (should fail)
   - ✅ Rate limiting (exceed limits)
   - ✅ Network errors
   - ✅ Empty states (no customers, no heaters)

---

### 5.2 Error Handling Improvements

Add proper error boundaries and error messages:

**File:** `src/components/ErrorBoundary.tsx`

```typescript
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### 5.3 Loading States

Ensure all API calls show proper loading states:
- Skeleton loaders for lists
- Spinner for forms
- Disabled buttons during operations

---

### 5.4 Security Audit

Review Sprint 2 against security checklist:

- [ ] All API endpoints require authentication
- [ ] User data isolation enforced (userId filters)
- [ ] Rate limiting applied to all endpoints
- [ ] Input validation on all endpoints
- [ ] CSRF protection ready (tokens not yet implemented on client)
- [ ] Proper error messages (no sensitive data exposed)
- [ ] Authorization checks (ownership verification)

---

### 5.5 Update Security Audit Checklist

Update `docs/SECURITY-AUDIT-CHECKLIST.md`:
- Mark customer API endpoints as implemented
- Mark heater API endpoints as implemented
- Document any security decisions made

---

**✅ Day 5 Checkpoint:**
- All features tested end-to-end
- Error handling robust
- Security verified
- Ready for Sprint 3

---

## 📊 Sprint 2 Completion Checklist

### Backend
- [x] Authentication middleware created
- [x] Customer CRUD API endpoints
- [x] Heater CRUD API endpoints
- [x] Validation applied to all inputs
- [x] Rate limiting enforced
- [x] User data isolation verified
- [x] Next maintenance calculation working

### Frontend
- [x] Dashboard layout with navigation
- [x] Protected route wrapper
- [x] Customer list page with search
- [x] Customer detail page
- [x] Customer form (create/edit)
- [x] Delete confirmation dialog
- [x] Heater form component
- [x] Heater management in customer detail
- [x] Proper error handling
- [x] Loading states

### Testing
- [x] API endpoints tested
- [x] User flows tested end-to-end
- [x] Edge cases handled
- [x] Security verified

---

## 🎉 What You've Accomplished

After Sprint 2, you have:
- ✅ Complete customer management system
- ✅ Heater management with maintenance tracking
- ✅ Secure, authenticated API
- ✅ Clean, responsive UI
- ✅ Solid foundation for email automation (Sprint 3)

---

## 📚 Next Steps: Sprint 3 Preview

Sprint 3 will cover:
1. Maintenance record management
2. Photo uploads
3. Dashboard statistics
4. Email opt-in flow (GDPR compliance)
5. Email reminder automation

---

## 💡 Tips for Success

1. **Commit Frequently**: Make atomic commits after each feature
2. **Test as You Build**: Don't wait until Day 5 to test
3. **Use the Validation Library**: Already created in Sprint 1
4. **Follow the Pattern**: API endpoints follow consistent structure
5. **Ask for Help**: Review technical architecture docs if stuck

---

## 📖 Reference Documentation

- **MVP Scope:** `docs/agent-01-mvp-scope-definition.md`
- **Technical Architecture:** `docs/agent-02-technical-architecture.md`
- **Security Checklist:** `docs/SECURITY-AUDIT-CHECKLIST.md`
- **Prisma Schema:** `prisma/schema.prisma`
- **Validation Library:** `src/lib/validations.ts`

---

**Ready to build! Start with Day 1 and work through systematically. 🚀**
