# React Query Guide

**Quick reference for working with React Query in Torqr**

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Available Hooks](#available-hooks)
3. [Common Patterns](#common-patterns)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Using a Hook in Your Component

```typescript
import { useCustomers } from '@/hooks/useCustomers';

export default function MyComponent() {
  const { data: customers, isLoading, error } = useCustomers();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  if (!customers) return null;

  return (
    <div>
      {customers.map(customer => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
}
```

### Creating/Updating Data

```typescript
import { useCreateCustomer } from '@/hooks/useCustomers';

export default function CreateForm() {
  const createCustomer = useCreateCustomer();

  const handleSubmit = (formData) => {
    createCustomer.mutate(formData);
    // Automatic success toast, query invalidation, and UI update!
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createCustomer.isPending}>
        {createCustomer.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

---

## Available Hooks

### Customers (`src/hooks/useCustomers.ts`)

```typescript
// Fetch all customers
const { data, isLoading, error } = useCustomers();

// Fetch single customer
const { data: customer } = useCustomer(customerId);

// Create customer
const createMutation = useCreateCustomer();
createMutation.mutate(customerData);

// Update customer
const updateMutation = useUpdateCustomer(customerId);
updateMutation.mutate(partialCustomerData);

// Delete customer
const deleteMutation = useDeleteCustomer();
deleteMutation.mutate(customerId);
```

### Heaters (`src/hooks/useHeaters.ts`)

```typescript
// Fetch all heaters
const { data } = useHeaters();

// Fetch heaters with search
const { data } = useHeaters({ search: 'boiler' });

// Fetch heaters for a customer
const { data } = useHeaters({ customerId: 'uuid' });

// Fetch single heater
const { data: heater } = useHeater(heaterId);

// Create heater
const createMutation = useCreateHeater();
createMutation.mutate(heaterData);

// Update heater
const updateMutation = useUpdateHeater(heaterId);
updateMutation.mutate(partialHeaterData);

// Delete heater
const deleteMutation = useDeleteHeater();
deleteMutation.mutate(heaterId);
```

### Dashboard (`src/hooks/useDashboard.ts`)

```typescript
// Fetch dashboard stats (default 30 days)
const { data: stats } = useDashboardStats();

// Fetch dashboard stats for specific time range
const { data: stats } = useDashboardStats(90); // 90 days
```

### Maintenances (`src/hooks/useMaintenances.ts`)

```typescript
// Fetch all maintenances
const { data } = useMaintenances();

// Fetch maintenances for a heater
const { data } = useMaintenances({ heaterId: 'uuid' });

// Fetch single maintenance
const { data: maintenance } = useMaintenance(maintenanceId);

// Create maintenance
const createMutation = useCreateMaintenance();
createMutation.mutate(maintenanceData);

// Update maintenance
const updateMutation = useUpdateMaintenance(maintenanceId);
updateMutation.mutate(partialMaintenanceData);

// Delete maintenance
const deleteMutation = useDeleteMaintenance();
deleteMutation.mutate(maintenanceId);
```

---

## Common Patterns

### Pattern 1: Loading and Error States

```typescript
export default function Page() {
  const { data, isLoading, error } = useResource();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2Icon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-destructive">Error loading data</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (!data) return null;

  return <Content data={data} />;
}
```

### Pattern 2: Client-Side Filtering

```typescript
export default function Page() {
  const { data } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];

    return data.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {filtered.map(customer => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
}
```

### Pattern 3: Mutation with Loading State

```typescript
export default function Form() {
  const createMutation = useCreateResource();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    createMutation.mutate(Object.fromEntries(formData));
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button
        type="submit"
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Saving...' : 'Save'}
      </button>

      {createMutation.error && (
        <p className="text-destructive">
          {createMutation.error.message}
        </p>
      )}
    </form>
  );
}
```

### Pattern 4: Dependent Queries

```typescript
export default function Page({ customerId }: Props) {
  // First query
  const { data: customer } = useCustomer(customerId);

  // Second query depends on first
  const { data: heaters } = useHeaters(
    { customerId },
    { enabled: !!customer } // Only fetch if customer exists
  );

  return (
    <div>
      <h1>{customer?.name}</h1>
      {heaters?.map(heater => (
        <HeaterCard key={heater.id} heater={heater} />
      ))}
    </div>
  );
}
```

### Pattern 5: Manual Refetch

```typescript
export default function Page() {
  const { data, refetch } = useCustomers();

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh</button>
      {/* content */}
    </div>
  );
}
```

---

## Best Practices

### ✅ Do's

1. **Always handle loading and error states**
   ```typescript
   if (isLoading) return <Loading />;
   if (error) return <Error />;
   ```

2. **Use `useMemo` for expensive client-side operations**
   ```typescript
   const filtered = useMemo(() => {
     return data.filter(/* ... */);
   }, [data, filters]);
   ```

3. **Destructure with meaningful names**
   ```typescript
   const { data: customers } = useCustomers();
   ```

4. **Check for data existence before rendering**
   ```typescript
   if (!data) return null;
   ```

5. **Use mutation hooks for all write operations**
   ```typescript
   const createMutation = useCreateResource();
   createMutation.mutate(data);
   ```

### ❌ Don'ts

1. **Don't manually fetch data**
   ```typescript
   // ❌ Bad
   useEffect(() => {
     fetch('/api/customers')
       .then(res => res.json())
       .then(setCustomers);
   }, []);

   // ✅ Good
   const { data: customers } = useCustomers();
   ```

2. **Don't manually invalidate unrelated queries**
   ```typescript
   // ❌ Bad - hook already handles this
   queryClient.invalidateQueries(['customers']);

   // ✅ Good - let the hook handle it
   createCustomer.mutate(data);
   ```

3. **Don't use `data!` (non-null assertion)**
   ```typescript
   // ❌ Bad
   return <div>{data!.length}</div>;

   // ✅ Good
   if (!data) return null;
   return <div>{data.length}</div>;
   ```

4. **Don't forget disabled state on buttons**
   ```typescript
   // ❌ Bad
   <button>Save</button>

   // ✅ Good
   <button disabled={mutation.isPending}>
     {mutation.isPending ? 'Saving...' : 'Save'}
   </button>
   ```

---

## Troubleshooting

### Problem: Data not updating after mutation

**Cause**: Query invalidation not working

**Solution**: Check that the mutation hook calls `queryClient.invalidateQueries` with the correct query key:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['customers'] });
}
```

---

### Problem: Infinite refetch loop

**Cause**: Query key dependencies causing constant refetches

**Solution**: Use stable query keys and memoize objects:

```typescript
// ❌ Bad - new object every render
useHeaters({ search: searchTerm, filter: { type: 'gas' } });

// ✅ Good - stable query key
const params = useMemo(() => ({
  search: searchTerm,
  filter: { type: 'gas' }
}), [searchTerm]);

useHeaters(params);
```

---

### Problem: Stale data showing

**Cause**: Default 5-minute stale time

**Solution**: Either:
1. Wait for automatic background refetch
2. Manual refetch: `refetch()`
3. Reduce stale time in hook options (not recommended)

---

### Problem: TypeScript errors with data

**Cause**: Data might be undefined during loading

**Solution**: Always check for data existence:

```typescript
const { data } = useCustomers();

// ❌ Bad
console.log(data.length);

// ✅ Good
if (data) {
  console.log(data.length);
}
```

---

## DevTools

React Query DevTools are available in development mode at the bottom-left of the screen.

### Features:
- View all queries and their states
- See cache contents
- Force refetch queries
- View query timelines
- Debug stale/fresh states

### How to Use:
1. Start development server: `npm run dev`
2. Look for the React Query icon in bottom-left corner
3. Click to open DevTools panel
4. Inspect queries, cache, and mutations

---

## Query Configuration

Default configuration (from `src/lib/react-query.tsx`):

```typescript
{
  staleTime: 1000 * 60 * 5,        // 5 minutes
  gcTime: 1000 * 60 * 30,           // 30 minutes
  retry: 1,                         // Retry once on failure
  refetchOnWindowFocus: false       // Don't refetch on window focus
}
```

### What This Means:

- **staleTime**: Data is considered fresh for 5 minutes
- **gcTime**: Unused data is garbage collected after 30 minutes
- **retry**: Failed requests are retried once automatically
- **refetchOnWindowFocus**: No automatic refetch when switching tabs

---

## Further Reading

- [Official React Query Docs](https://tanstack.com/query/latest)
- [Project Architecture](../ARCHITECTURE.md)
- [Changelog](../CHANGELOG.md)

---

**Last Updated**: 2026-01-13
