# Graph Report - src/app + src/lib + src/hooks (Backbone)  (2026-04-27)

## Corpus Check
- 105 files · ~49,990 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 241 nodes · 261 edges · 57 communities detected
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Domain Logic & API Handlers|Domain Logic & API Handlers]]
- [[_COMMUNITY_Auth & API Verbs|Auth & API Verbs]]
- [[_COMMUNITY_Employee Management|Employee Management]]
- [[_COMMUNITY_Dashboard & Bookings|Dashboard & Bookings]]
- [[_COMMUNITY_Display Helpers|Display Helpers]]
- [[_COMMUNITY_Export & Maintenance UI|Export & Maintenance UI]]
- [[_COMMUNITY_Rate Limiting|Rate Limiting]]
- [[_COMMUNITY_Cal.com API Client|Cal.com API Client]]
- [[_COMMUNITY_Customer CRUD|Customer CRUD]]
- [[_COMMUNITY_Email Service|Email Service]]
- [[_COMMUNITY_Admin Dashboard Hooks|Admin Dashboard Hooks]]
- [[_COMMUNITY_Route Test Setup|Route Test Setup]]
- [[_COMMUNITY_Admin Auth & Layout|Admin Auth & Layout]]
- [[_COMMUNITY_Customer Systems Hooks|Customer Systems Hooks]]
- [[_COMMUNITY_Follow-up Jobs Hooks|Follow-up Jobs Hooks]]
- [[_COMMUNITY_Form Page Handlers|Form Page Handlers]]
- [[_COMMUNITY_Setup Page Handlers|Setup Page Handlers]]
- [[_COMMUNITY_Checklist Items Hooks|Checklist Items Hooks]]
- [[_COMMUNITY_Maintenance Hooks|Maintenance Hooks]]
- [[_COMMUNITY_Form Submit Pages|Form Submit Pages]]
- [[_COMMUNITY_Status Badge Pages|Status Badge Pages]]
- [[_COMMUNITY_Catalog Hook|Catalog Hook]]
- [[_COMMUNITY_Email Logs Hook|Email Logs Hook]]
- [[_COMMUNITY_System Photos Hook|System Photos Hook]]
- [[_COMMUNITY_User Profile Hook|User Profile Hook]]
- [[_COMMUNITY_Wartungen Hook|Wartungen Hook]]
- [[_COMMUNITY_Global Error Boundary|Global Error Boundary]]
- [[_COMMUNITY_Root Layout|Root Layout]]
- [[_COMMUNITY_Admin Layout Shell|Admin Layout Shell]]
- [[_COMMUNITY_Type Handler Page|Type Handler Page]]
- [[_COMMUNITY_Search Page Handler|Search Page Handler]]
- [[_COMMUNITY_Filter Test|Filter Test]]
- [[_COMMUNITY_Dashboard Layout|Dashboard Layout]]
- [[_COMMUNITY_React Query Provider|React Query Provider]]
- [[_COMMUNITY_shadcn cn Util|shadcn cn Util]]
- [[_COMMUNITY_Page (singleton)|Page (singleton)]]
- [[_COMMUNITY_Page (singleton)|Page (singleton)]]
- [[_COMMUNITY_API Route (singleton)|API Route (singleton)]]
- [[_COMMUNITY_Route Test (singleton)|Route Test (singleton)]]
- [[_COMMUNITY_Page (singleton)|Page (singleton)]]
- [[_COMMUNITY_Page (singleton)|Page (singleton)]]
- [[_COMMUNITY_NextAuth Config|NextAuth Config]]
- [[_COMMUNITY_Checklist Defaults|Checklist Defaults]]
- [[_COMMUNITY_App Constants|App Constants]]
- [[_COMMUNITY_Prisma Client|Prisma Client]]
- [[_COMMUNITY_Client Test (singleton)|Client Test (singleton)]]
- [[_COMMUNITY_Resend Client|Resend Client]]
- [[_COMMUNITY_Booking Cancellation Email|Booking Cancellation Email]]
- [[_COMMUNITY_Booking Confirmation Email|Booking Confirmation Email]]
- [[_COMMUNITY_Booking Reschedule Email|Booking Reschedule Email]]
- [[_COMMUNITY_Reminder Email|Reminder Email]]
- [[_COMMUNITY_Weekly Summary Email|Weekly Summary Email]]
- [[_COMMUNITY_Opt-in Test|Opt-in Test]]
- [[_COMMUNITY_Admin Email Test|Admin Email Test]]
- [[_COMMUNITY_Checklist Defaults Test|Checklist Defaults Test]]
- [[_COMMUNITY_Checklist Validation Test|Checklist Validation Test]]
- [[_COMMUNITY_System Schemas Test|System Schemas Test]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 39 edges
2. `POST()` - 29 edges
3. `DELETE()` - 17 edges
4. `PATCH()` - 15 edges
5. `requireAuth()` - 7 edges
6. `requireOwner()` - 6 edges
7. `rateLimitByUser()` - 6 edges
8. `rateLimit()` - 5 edges
9. `rateLimitMiddleware()` - 5 edges
10. `verifySystemOwnership()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `sendBookingConfirmation()`  [INFERRED]
  src\app\api\webhooks\cal\route.ts → src\lib\email\service.tsx
- `PATCH()` --calls--> `sendBookingReschedule()`  [INFERRED]
  src\app\api\user\profile\route.ts → src\lib\email\service.tsx
- `DELETE()` --calls--> `sendBookingCancellation()`  [INFERRED]
  src\app\api\user\account\route.ts → src\lib\email\service.tsx
- `setAssignee()` --calls--> `DELETE()`  [INFERRED]
  src\app\dashboard\systems\page.tsx → src\app\api\user\account\route.ts
- `GET()` --calls--> `requireAdmin()`  [INFERRED]
  src\app\api\wartungen\route.ts → src\lib\admin-auth.ts

## Communities

### Community 0 - "Domain Logic & API Handlers"
Cohesion: 0.07
Nodes (12): computeOptInData(), parseFilters(), deriveStatus(), GET(), getEligibleSystemIds(), handleBookingCancelled(), handleBookingCreated(), handleBookingRescheduled() (+4 more)

### Community 1 - "Auth & API Verbs"
Cohesion: 0.17
Nodes (8): requireAuth(), requireOwner(), requireRole(), DELETE(), isManual(), PATCH(), deleteMaintenancePhoto(), getSupabaseAdmin()

### Community 2 - "Employee Management"
Cohesion: 0.17
Nodes (2): EmployeeDetailPage(), useEmployee()

### Community 3 - "Dashboard & Bookings"
Cohesion: 0.2
Nodes (4): DashboardPage(), buildSearchParams(), useBookings(), useDashboardStats()

### Community 4 - "Display Helpers"
Cohesion: 0.22
Nodes (1): handleDelete()

### Community 5 - "Export & Maintenance UI"
Cohesion: 0.22
Nodes (2): getMaintenanceUrgency(), setAssignee()

### Community 6 - "Rate Limiting"
Cohesion: 0.42
Nodes (7): buildLimitResponse(), getClientIdentifier(), getLimiter(), inMemoryCheck(), rateLimit(), rateLimitByUser(), rateLimitMiddleware()

### Community 7 - "Cal.com API Client"
Cohesion: 0.36
Nodes (6): apiKey(), base(), CalComApiError, callJson(), cancelCalBooking(), rescheduleCalBooking()

### Community 8 - "Customer CRUD"
Cohesion: 0.25
Nodes (2): NewCustomerPage(), useCreateCustomer()

### Community 9 - "Email Service"
Cohesion: 0.33
Nodes (6): sendBookingCancellation(), sendBookingConfirmation(), sendBookingReschedule(), sendReminder(), sendWeeklySummary(), sendWeeklySummaryToAll()

### Community 10 - "Admin Dashboard Hooks"
Cohesion: 0.29
Nodes (0): 

### Community 11 - "Route Test Setup"
Cohesion: 0.4
Nodes (2): makeRequest(), signedRequest()

### Community 12 - "Admin Auth & Layout"
Cohesion: 0.33
Nodes (3): requireAdmin(), isAdminEmail(), AdminLayout()

### Community 13 - "Customer Systems Hooks"
Cohesion: 0.33
Nodes (0): 

### Community 14 - "Follow-up Jobs Hooks"
Cohesion: 0.4
Nodes (0): 

### Community 15 - "Form Page Handlers"
Cohesion: 0.67
Nodes (2): handleSubmit(), validateForm()

### Community 16 - "Setup Page Handlers"
Cohesion: 0.5
Nodes (0): 

### Community 17 - "Checklist Items Hooks"
Cohesion: 0.5
Nodes (0): 

### Community 18 - "Maintenance Hooks"
Cohesion: 0.5
Nodes (0): 

### Community 19 - "Form Submit Pages"
Cohesion: 0.67
Nodes (1): onSubmit()

### Community 20 - "Status Badge Pages"
Cohesion: 0.67
Nodes (1): StatusBadge()

### Community 21 - "Catalog Hook"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Email Logs Hook"
Cohesion: 0.67
Nodes (0): 

### Community 23 - "System Photos Hook"
Cohesion: 0.67
Nodes (0): 

### Community 24 - "User Profile Hook"
Cohesion: 0.67
Nodes (0): 

### Community 25 - "Wartungen Hook"
Cohesion: 0.67
Nodes (0): 

### Community 26 - "Global Error Boundary"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Root Layout"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Admin Layout Shell"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Type Handler Page"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Search Page Handler"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Filter Test"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Dashboard Layout"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "React Query Provider"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "shadcn cn Util"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Page (singleton)"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Page (singleton)"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "API Route (singleton)"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Route Test (singleton)"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Page (singleton)"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Page (singleton)"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "NextAuth Config"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Checklist Defaults"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "App Constants"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Prisma Client"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Client Test (singleton)"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Resend Client"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Booking Cancellation Email"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Booking Confirmation Email"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Booking Reschedule Email"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Reminder Email"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Weekly Summary Email"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Opt-in Test"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Admin Email Test"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Checklist Defaults Test"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Checklist Validation Test"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "System Schemas Test"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Global Error Boundary`** (2 nodes): `GlobalError()`, `global-error.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Layout Shell`** (2 nodes): `AdminLayoutShell()`, `AdminLayoutShell.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Type Handler Page`** (2 nodes): `handleType()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Search Page Handler`** (2 nodes): `handleSearch()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Filter Test`** (2 nodes): `makeRequest()`, `filter.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Layout`** (2 nodes): `DashboardLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `React Query Provider`** (2 nodes): `ReactQueryProvider()`, `react-query.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `shadcn cn Util`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page (singleton)`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page (singleton)`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Route (singleton)`** (1 nodes): `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Route Test (singleton)`** (1 nodes): `route.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page (singleton)`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page (singleton)`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `NextAuth Config`** (1 nodes): `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Checklist Defaults`** (1 nodes): `checklist-defaults.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Constants`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Prisma Client`** (1 nodes): `prisma.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Client Test (singleton)`** (1 nodes): `client.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Resend Client`** (1 nodes): `client.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Booking Cancellation Email`** (1 nodes): `BookingCancellationEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Booking Confirmation Email`** (1 nodes): `BookingConfirmationEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Booking Reschedule Email`** (1 nodes): `BookingRescheduleEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Reminder Email`** (1 nodes): `ReminderEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Weekly Summary Email`** (1 nodes): `WeeklySummaryEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Opt-in Test`** (1 nodes): `opt-in.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Admin Email Test`** (1 nodes): `admin-email.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Checklist Defaults Test`** (1 nodes): `checklist-defaults.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Checklist Validation Test`** (1 nodes): `checklist-validation.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `System Schemas Test`** (1 nodes): `system-schemas.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Domain Logic & API Handlers` to `Auth & API Verbs`, `Admin Auth & Layout`, `Email Service`, `Rate Limiting`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `POST()` connect `Domain Logic & API Handlers` to `Auth & API Verbs`, `Rate Limiting`, `Email Service`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `DELETE()` connect `Auth & API Verbs` to `Email Service`, `Export & Maintenance UI`, `Rate Limiting`, `Cal.com API Client`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `GET()` (e.g. with `requireAdmin()` and `requireAuth()`) actually correct?**
  _`GET()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `POST()` (e.g. with `rateLimitMiddleware()` and `safeValidateRequest()`) actually correct?**
  _`POST()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `DELETE()` (e.g. with `requireAuth()` and `cancelCalBooking()`) actually correct?**
  _`DELETE()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `PATCH()` (e.g. with `requireOwner()` and `sendBookingReschedule()`) actually correct?**
  _`PATCH()` has 6 INFERRED edges - model-reasoned connections that need verification._