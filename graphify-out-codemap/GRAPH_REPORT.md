# Graph Report - src/ (Code Map)  (2026-04-27)

## Corpus Check
- 150 files · ~63,811 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 357 nodes · 350 edges · 92 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Domain Logic & API Handlers|Domain Logic & API Handlers]]
- [[_COMMUNITY_Auth & API Verbs|Auth & API Verbs]]
- [[_COMMUNITY_UI Helpers & Export|UI Helpers & Export]]
- [[_COMMUNITY_Bookings & Dashboard|Bookings & Dashboard]]
- [[_COMMUNITY_Employee Management|Employee Management]]
- [[_COMMUNITY_Rate Limiting & Middleware|Rate Limiting & Middleware]]
- [[_COMMUNITY_Account Page Cards|Account Page Cards]]
- [[_COMMUNITY_shadcn Select Primitive|shadcn Select Primitive]]
- [[_COMMUNITY_Display Helpers|Display Helpers]]
- [[_COMMUNITY_Customer CRUD|Customer CRUD]]
- [[_COMMUNITY_Cal.com API Client|Cal.com API Client]]
- [[_COMMUNITY_System Form Handlers|System Form Handlers]]
- [[_COMMUNITY_Admin Dashboard Hooks|Admin Dashboard Hooks]]
- [[_COMMUNITY_Route Test Setup|Route Test Setup]]
- [[_COMMUNITY_Follow-up Section UI|Follow-up Section UI]]
- [[_COMMUNITY_Customer Systems Hooks|Customer Systems Hooks]]
- [[_COMMUNITY_Admin Auth & Layout|Admin Auth & Layout]]
- [[_COMMUNITY_CatalogPicker|CatalogPicker]]
- [[_COMMUNITY_System Assignment Modal|System Assignment Modal]]
- [[_COMMUNITY_Follow-up Jobs Hooks|Follow-up Jobs Hooks]]
- [[_COMMUNITY_Setup Form Page|Setup Form Page]]
- [[_COMMUNITY_Admin Setup Page|Admin Setup Page]]
- [[_COMMUNITY_DashboardNav|DashboardNav]]
- [[_COMMUNITY_ErrorBoundary|ErrorBoundary]]
- [[_COMMUNITY_SystemPhotosCard|SystemPhotosCard]]
- [[_COMMUNITY_shadcn Card Primitive|shadcn Card Primitive]]
- [[_COMMUNITY_Checklist Items Hooks|Checklist Items Hooks]]
- [[_COMMUNITY_Maintenance Hooks|Maintenance Hooks]]
- [[_COMMUNITY_Form Submit Pages|Form Submit Pages]]
- [[_COMMUNITY_Status Badge Pages|Status Badge Pages]]
- [[_COMMUNITY_AssigneeBadge|AssigneeBadge]]
- [[_COMMUNITY_MaintenanceHistory|MaintenanceHistory]]
- [[_COMMUNITY_SystemChecklistManager|SystemChecklistManager]]
- [[_COMMUNITY_DangerZoneCard|DangerZoneCard]]
- [[_COMMUNITY_TermineList|TermineList]]
- [[_COMMUNITY_Email Logs Hook|Email Logs Hook]]
- [[_COMMUNITY_System Photos Hook|System Photos Hook]]
- [[_COMMUNITY_Wartungen Hook|Wartungen Hook]]
- [[_COMMUNITY_Tenant Isolation Test|Tenant Isolation Test]]
- [[_COMMUNITY_GlobalError|GlobalError]]
- [[_COMMUNITY_RootLayout|RootLayout]]
- [[_COMMUNITY_AdminLayoutShell|AdminLayoutShell]]
- [[_COMMUNITY_Type Handler Page|Type Handler Page]]
- [[_COMMUNITY_Search Handler Page|Search Handler Page]]
- [[_COMMUNITY_Filter Test|Filter Test]]
- [[_COMMUNITY_DashboardLayout|DashboardLayout]]
- [[_COMMUNITY_CompanyNameSetupModal|CompanyNameSetupModal]]
- [[_COMMUNITY_ProtectedRoute|ProtectedRoute]]
- [[_COMMUNITY_Providers|Providers]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_instrumentation-client.ts|instrumentation-client.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_route.ts|route.ts]]
- [[_COMMUNITY_route.test.ts|route.test.ts]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_page.tsx|page.tsx]]
- [[_COMMUNITY_alert-dialog.tsx|alert-dialog.tsx]]
- [[_COMMUNITY_switch.tsx|switch.tsx]]
- [[_COMMUNITY_textarea.tsx|textarea.tsx]]
- [[_COMMUNITY_AssigneeBadge.test.tsx|AssigneeBadge.test.tsx]]
- [[_COMMUNITY_auth.ts|auth.ts]]
- [[_COMMUNITY_checklist-defaults.ts|checklist-defaults.ts]]
- [[_COMMUNITY_constants.ts|constants.ts]]
- [[_COMMUNITY_prisma.ts|prisma.ts]]
- [[_COMMUNITY_client.test.ts|client.test.ts]]
- [[_COMMUNITY_client.ts|client.ts]]
- [[_COMMUNITY_BookingCancellationEmail.tsx|BookingCancellationEmail.tsx]]
- [[_COMMUNITY_BookingConfirmationEmail.tsx|BookingConfirmationEmail.tsx]]
- [[_COMMUNITY_BookingRescheduleEmail.tsx|BookingRescheduleEmail.tsx]]
- [[_COMMUNITY_ReminderEmail.tsx|ReminderEmail.tsx]]
- [[_COMMUNITY_WeeklySummaryEmail.tsx|WeeklySummaryEmail.tsx]]
- [[_COMMUNITY_opt-in.test.ts|opt-in.test.ts]]
- [[_COMMUNITY_admin-email.test.ts|admin-email.test.ts]]
- [[_COMMUNITY_checklist-defaults.test.ts|checklist-defaults.test.ts]]
- [[_COMMUNITY_checklist-validation.test.ts|checklist-validation.test.ts]]
- [[_COMMUNITY_system-schemas.test.ts|system-schemas.test.ts]]
- [[_COMMUNITY_brand.config.ts|brand.config.ts]]
- [[_COMMUNITY_setup.ts|setup.ts]]
- [[_COMMUNITY_smoke.test.ts|smoke.test.ts]]
- [[_COMMUNITY_checklist.ts|checklist.ts]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 39 edges
2. `POST()` - 29 edges
3. `DELETE()` - 18 edges
4. `PATCH()` - 15 edges
5. `format()` - 8 edges
6. `requireAuth()` - 7 edges
7. `requireOwner()` - 6 edges
8. `rateLimitMiddleware()` - 6 edges
9. `rateLimitByUser()` - 6 edges
10. `rateLimit()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `setAssignee()` --calls--> `DELETE()`  [INFERRED]
  src\app\dashboard\systems\page.tsx → src\app\api\user\account\route.ts
- `middleware()` --calls--> `rateLimitMiddleware()`  [INFERRED]
  src\middleware.ts → src\lib\rate-limit.ts
- `GET()` --calls--> `requireAdmin()`  [INFERRED]
  src\app\api\wartungen\route.ts → src\lib\admin-auth.ts
- `GET()` --calls--> `requireAuth()`  [INFERRED]
  src\app\api\wartungen\route.ts → src\lib\auth-helpers.ts
- `GET()` --calls--> `sendReminder()`  [INFERRED]
  src\app\api\wartungen\route.ts → src\lib\email\service.tsx

## Communities

### Community 0 - "Domain Logic & API Handlers"
Cohesion: 0.08
Nodes (11): parseFilters(), deriveStatus(), GET(), getEligibleSystemIds(), handleBookingCancelled(), handleBookingCreated(), handleBookingRescheduled(), POST() (+3 more)

### Community 1 - "Auth & API Verbs"
Cohesion: 0.13
Nodes (10): requireAuth(), requireOwner(), requireRole(), computeOptInData(), DELETE(), isManual(), PATCH(), deleteMaintenancePhoto() (+2 more)

### Community 2 - "UI Helpers & Export"
Cohesion: 0.14
Nodes (11): format(), exportToCSV(), exportToPDF(), getMaintenanceUrgency(), setAssignee(), sendBookingCancellation(), sendBookingConfirmation(), sendBookingReschedule() (+3 more)

### Community 3 - "Bookings & Dashboard"
Cohesion: 0.17
Nodes (6): BookingFormModal(), DashboardPage(), buildSearchParams(), useBookings(), useCreateBooking(), useDashboardStats()

### Community 4 - "Employee Management"
Cohesion: 0.17
Nodes (2): EmployeeDetailPage(), useEmployee()

### Community 5 - "Rate Limiting & Middleware"
Cohesion: 0.31
Nodes (8): middleware(), buildLimitResponse(), getClientIdentifier(), getLimiter(), inMemoryCheck(), rateLimit(), rateLimitByUser(), rateLimitMiddleware()

### Community 6 - "Account Page Cards"
Cohesion: 0.18
Nodes (5): EmailActionsCard(), register(), NotificationsCard(), ProfileCard(), useUser()

### Community 7 - "shadcn Select Primitive"
Cohesion: 0.2
Nodes (0): 

### Community 8 - "Display Helpers"
Cohesion: 0.22
Nodes (1): handleDelete()

### Community 9 - "Customer CRUD"
Cohesion: 0.25
Nodes (2): NewCustomerPage(), useCreateCustomer()

### Community 10 - "Cal.com API Client"
Cohesion: 0.36
Nodes (6): apiKey(), base(), CalComApiError, callJson(), cancelCalBooking(), rescheduleCalBooking()

### Community 11 - "System Form Handlers"
Cohesion: 0.29
Nodes (0): 

### Community 12 - "Admin Dashboard Hooks"
Cohesion: 0.29
Nodes (0): 

### Community 13 - "Route Test Setup"
Cohesion: 0.4
Nodes (2): makeRequest(), signedRequest()

### Community 14 - "Follow-up Section UI"
Cohesion: 0.4
Nodes (2): handleAdd(), handleKeyDown()

### Community 15 - "Customer Systems Hooks"
Cohesion: 0.33
Nodes (0): 

### Community 16 - "Admin Auth & Layout"
Cohesion: 0.33
Nodes (3): requireAdmin(), isAdminEmail(), AdminLayout()

### Community 17 - "CatalogPicker"
Cohesion: 0.5
Nodes (3): CatalogPicker(), useCatalog(), useCreateCatalogEntry()

### Community 18 - "System Assignment Modal"
Cohesion: 0.4
Nodes (0): 

### Community 19 - "Follow-up Jobs Hooks"
Cohesion: 0.4
Nodes (0): 

### Community 20 - "Setup Form Page"
Cohesion: 0.67
Nodes (2): handleSubmit(), validateForm()

### Community 21 - "Admin Setup Page"
Cohesion: 0.5
Nodes (0): 

### Community 22 - "DashboardNav"
Cohesion: 0.5
Nodes (0): 

### Community 23 - "ErrorBoundary"
Cohesion: 0.5
Nodes (0): 

### Community 24 - "SystemPhotosCard"
Cohesion: 0.5
Nodes (0): 

### Community 25 - "shadcn Card Primitive"
Cohesion: 0.5
Nodes (0): 

### Community 26 - "Checklist Items Hooks"
Cohesion: 0.5
Nodes (0): 

### Community 27 - "Maintenance Hooks"
Cohesion: 0.5
Nodes (0): 

### Community 28 - "Form Submit Pages"
Cohesion: 0.67
Nodes (1): onSubmit()

### Community 29 - "Status Badge Pages"
Cohesion: 0.67
Nodes (1): StatusBadge()

### Community 30 - "AssigneeBadge"
Cohesion: 0.67
Nodes (0): 

### Community 31 - "MaintenanceHistory"
Cohesion: 1.0
Nodes (2): formatDate(), handleDelete()

### Community 32 - "SystemChecklistManager"
Cohesion: 0.67
Nodes (0): 

### Community 33 - "DangerZoneCard"
Cohesion: 0.67
Nodes (0): 

### Community 34 - "TermineList"
Cohesion: 0.67
Nodes (0): 

### Community 35 - "Email Logs Hook"
Cohesion: 0.67
Nodes (0): 

### Community 36 - "System Photos Hook"
Cohesion: 0.67
Nodes (0): 

### Community 37 - "Wartungen Hook"
Cohesion: 0.67
Nodes (0): 

### Community 38 - "Tenant Isolation Test"
Cohesion: 0.67
Nodes (0): 

### Community 39 - "GlobalError"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "RootLayout"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "AdminLayoutShell"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Type Handler Page"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Search Handler Page"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Filter Test"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "DashboardLayout"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "CompanyNameSetupModal"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "ProtectedRoute"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Providers"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "instrumentation-client.ts"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 64 - "route.ts"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "route.test.ts"
Cohesion: 1.0
Nodes (0): 

### Community 66 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 67 - "page.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 68 - "alert-dialog.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 69 - "switch.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 70 - "textarea.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 71 - "AssigneeBadge.test.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 72 - "auth.ts"
Cohesion: 1.0
Nodes (0): 

### Community 73 - "checklist-defaults.ts"
Cohesion: 1.0
Nodes (0): 

### Community 74 - "constants.ts"
Cohesion: 1.0
Nodes (0): 

### Community 75 - "prisma.ts"
Cohesion: 1.0
Nodes (0): 

### Community 76 - "client.test.ts"
Cohesion: 1.0
Nodes (0): 

### Community 77 - "client.ts"
Cohesion: 1.0
Nodes (0): 

### Community 78 - "BookingCancellationEmail.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 79 - "BookingConfirmationEmail.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 80 - "BookingRescheduleEmail.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 81 - "ReminderEmail.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 82 - "WeeklySummaryEmail.tsx"
Cohesion: 1.0
Nodes (0): 

### Community 83 - "opt-in.test.ts"
Cohesion: 1.0
Nodes (0): 

### Community 84 - "admin-email.test.ts"
Cohesion: 1.0
Nodes (0): 

### Community 85 - "checklist-defaults.test.ts"
Cohesion: 1.0
Nodes (0): 

### Community 86 - "checklist-validation.test.ts"
Cohesion: 1.0
Nodes (0): 

### Community 87 - "system-schemas.test.ts"
Cohesion: 1.0
Nodes (0): 

### Community 88 - "brand.config.ts"
Cohesion: 1.0
Nodes (0): 

### Community 89 - "setup.ts"
Cohesion: 1.0
Nodes (0): 

### Community 90 - "smoke.test.ts"
Cohesion: 1.0
Nodes (0): 

### Community 91 - "checklist.ts"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `GlobalError`** (2 nodes): `GlobalError()`, `global-error.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `RootLayout`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AdminLayoutShell`** (2 nodes): `AdminLayoutShell()`, `AdminLayoutShell.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Type Handler Page`** (2 nodes): `handleType()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Search Handler Page`** (2 nodes): `handleSearch()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Filter Test`** (2 nodes): `makeRequest()`, `filter.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DashboardLayout`** (2 nodes): `DashboardLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CompanyNameSetupModal`** (2 nodes): `handleSubmit()`, `CompanyNameSetupModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ProtectedRoute`** (2 nodes): `ProtectedRoute()`, `ProtectedRoute.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Providers`** (2 nodes): `Providers()`, `Providers.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (2 nodes): `onSubmit()`, `EmailTemplateCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (2 nodes): `TorqrIcon.tsx`, `TorqrIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (2 nodes): `SystemTypeSelector.tsx`, `SystemTypeSelector()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (2 nodes): `format()`, `BookingDetailsDrawer.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (2 nodes): `handleSubmit()`, `RescheduleBookingModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (2 nodes): `TermineCalendar.tsx`, `onClick()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (2 nodes): `Badge()`, `badge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (2 nodes): `cn()`, `button.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (2 nodes): `Input()`, `input.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (2 nodes): `Label()`, `label.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (2 nodes): `ReactQueryProvider()`, `react-query.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (2 nodes): `utils.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `instrumentation-client.ts`** (1 nodes): `instrumentation-client.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `route.ts`** (1 nodes): `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `route.test.ts`** (1 nodes): `route.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `page.tsx`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `alert-dialog.tsx`** (1 nodes): `alert-dialog.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `switch.tsx`** (1 nodes): `switch.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `textarea.tsx`** (1 nodes): `textarea.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AssigneeBadge.test.tsx`** (1 nodes): `AssigneeBadge.test.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `auth.ts`** (1 nodes): `auth.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `checklist-defaults.ts`** (1 nodes): `checklist-defaults.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `constants.ts`** (1 nodes): `constants.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `prisma.ts`** (1 nodes): `prisma.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `client.test.ts`** (1 nodes): `client.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `client.ts`** (1 nodes): `client.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `BookingCancellationEmail.tsx`** (1 nodes): `BookingCancellationEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `BookingConfirmationEmail.tsx`** (1 nodes): `BookingConfirmationEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `BookingRescheduleEmail.tsx`** (1 nodes): `BookingRescheduleEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ReminderEmail.tsx`** (1 nodes): `ReminderEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WeeklySummaryEmail.tsx`** (1 nodes): `WeeklySummaryEmail.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `opt-in.test.ts`** (1 nodes): `opt-in.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `admin-email.test.ts`** (1 nodes): `admin-email.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `checklist-defaults.test.ts`** (1 nodes): `checklist-defaults.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `checklist-validation.test.ts`** (1 nodes): `checklist-validation.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `system-schemas.test.ts`** (1 nodes): `system-schemas.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `brand.config.ts`** (1 nodes): `brand.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `setup.ts`** (1 nodes): `setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `smoke.test.ts`** (1 nodes): `smoke.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `checklist.ts`** (1 nodes): `checklist.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Domain Logic & API Handlers` to `Admin Auth & Layout`, `Auth & API Verbs`, `UI Helpers & Export`, `Rate Limiting & Middleware`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `POST()` connect `Domain Logic & API Handlers` to `Auth & API Verbs`, `UI Helpers & Export`, `Rate Limiting & Middleware`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `DELETE()` connect `Auth & API Verbs` to `Cal.com API Client`, `UI Helpers & Export`, `Rate Limiting & Middleware`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `GET()` (e.g. with `requireAdmin()` and `requireAuth()`) actually correct?**
  _`GET()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `POST()` (e.g. with `rateLimitMiddleware()` and `safeValidateRequest()`) actually correct?**
  _`POST()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `DELETE()` (e.g. with `requireAuth()` and `cancelCalBooking()`) actually correct?**
  _`DELETE()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `PATCH()` (e.g. with `requireOwner()` and `sendBookingReschedule()`) actually correct?**
  _`PATCH()` has 6 INFERRED edges - model-reasoned connections that need verification._