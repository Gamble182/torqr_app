# Torqr MVP - Testing Checklist

**Version:** 1.0
**Date:** 09.01.2026
**Status:** Ready for Testing

---

## 1. Authentication & Session Management

### Registration Flow
- [ ] New user can register with email and password
- [ ] Password must meet minimum requirements
- [ ] Duplicate email shows appropriate error
- [ ] Invalid email format shows validation error
- [ ] Successful registration redirects to dashboard
- [ ] User session is created after registration

### Login Flow
- [ ] Existing user can login with correct credentials
- [ ] Wrong password shows error message
- [ ] Non-existent email shows error message
- [ ] Successful login redirects to dashboard
- [ ] Session persists on page refresh
- [ ] Remember me functionality works

### Logout Flow
- [ ] Logout button in sidebar works
- [ ] Session is destroyed after logout
- [ ] User is redirected to login page
- [ ] Cannot access protected routes after logout

### Protected Routes
- [ ] Dashboard pages require authentication
- [ ] Unauthenticated users redirect to login
- [ ] Logged-in users cannot access login/register pages

---

## 2. Dashboard Statistics

### Data Display
- [ ] Dashboard shows correct customer count
- [ ] Dashboard shows correct heater count
- [ ] Overdue maintenances count is accurate
- [ ] Upcoming maintenances count is accurate (within 30 days)
- [ ] Loading spinner shows while fetching data
- [ ] Error toast appears if API fails

### Edge Cases
- [ ] Dashboard works with zero customers
- [ ] Dashboard works with zero heaters
- [ ] Statistics update after adding/deleting data
- [ ] Page handles API timeout gracefully

---

## 3. Customer Management

### Customer List Page
- [ ] All customers display in list
- [ ] Search functionality works (name, city, street)
- [ ] "Kunde anlegen" button opens creation modal
- [ ] Empty state shows when no customers exist
- [ ] Loading state displays correctly
- [ ] Pagination works if many customers (if implemented)

### Create Customer
- [ ] Modal opens when clicking "Kunde anlegen"
- [ ] All required fields are marked with *
- [ ] Name field validation works
- [ ] Email validation works (format check)
- [ ] Phone validation works
- [ ] Form shows validation errors inline
- [ ] Success toast appears after creation
- [ ] User is redirected to customer detail page
- [ ] New customer appears in list immediately

### View Customer Details
- [ ] Customer detail page loads correctly
- [ ] All customer information displays
- [ ] Contact information is formatted properly
- [ ] Address displays correctly
- [ ] Heaters section shows all heaters for customer
- [ ] "Zurück" button returns to customer list

### Edit Customer
- [ ] "Bearbeiten" button opens edit modal
- [ ] Form pre-fills with existing data
- [ ] Can update all fields
- [ ] Validation works during editing
- [ ] Success toast appears after update
- [ ] Changes reflect immediately on page
- [ ] Cancel button closes modal without saving

### Delete Customer
- [ ] "Löschen" button shows confirmation dialog
- [ ] Confirmation dialog has clear warning
- [ ] Canceling confirmation does nothing
- [ ] Confirming deletion removes customer
- [ ] Associated heaters are deleted (cascade)
- [ ] Success toast appears after deletion
- [ ] User redirects to customer list
- [ ] Customer no longer appears in list

---

## 4. Heater Management

### View Heaters
- [ ] All heaters display under customer
- [ ] Empty state shows if no heaters
- [ ] Heater cards show all information
- [ ] Installation date formats correctly (DD.MM.YYYY)
- [ ] Last maintenance date formats correctly
- [ ] Next maintenance date formats correctly
- [ ] Maintenance interval displays correctly

### Maintenance Warnings
- [ ] Red badge shows if maintenance overdue
- [ ] Amber badge shows if maintenance due within 30 days
- [ ] No badge if maintenance not due soon
- [ ] Badge text is accurate (e.g., "5 Tage überfällig")

### Create Heater
- [ ] "Heizung hinzufügen" button opens modal
- [ ] All required fields are marked
- [ ] Model field validation works
- [ ] Serial number is optional
- [ ] Installation date picker works
- [ ] Maintenance interval dropdown works (1, 3, 6, 12, 24 months)
- [ ] Last maintenance date is optional
- [ ] Success toast appears after creation
- [ ] New heater appears immediately
- [ ] Next maintenance date calculates correctly

### Edit Heater
- [ ] Edit button opens modal with pre-filled data
- [ ] Can update all fields
- [ ] Changing maintenance interval recalculates next date
- [ ] Changing last maintenance recalculates next date
- [ ] Success toast appears after update
- [ ] Changes reflect immediately

### Delete Heater
- [ ] Delete button shows confirmation
- [ ] Confirmation dialog warns about maintenance history
- [ ] Canceling does nothing
- [ ] Confirming deletes heater and maintenances
- [ ] Success toast appears
- [ ] Heater removed from list immediately

---

## 5. Maintenance Tracking

### View Maintenance History
- [ ] Maintenance history shows under each heater
- [ ] Empty state shows if no maintenances
- [ ] Maintenances display in reverse chronological order (newest first)
- [ ] Date formats correctly (DD.MM.YYYY)
- [ ] Notes display if present
- [ ] Photos display as thumbnails if present
- [ ] Multiple photos scroll horizontally

### Record Maintenance
- [ ] "Wartung erledigt" button opens modal
- [ ] Modal shows heater model
- [ ] Date field defaults to today
- [ ] Date field validation works (required)
- [ ] Notes field is optional
- [ ] Notes support multi-line text
- [ ] Photo upload area displays

### Photo Upload
- [ ] Can select multiple photos (up to 5)
- [ ] File type validation works (images only)
- [ ] File size validation works (5MB limit)
- [ ] Selected photos show preview thumbnails
- [ ] Can remove photos before uploading
- [ ] Upload progress indicator shows
- [ ] Success toast after upload
- [ ] Photos appear in maintenance history immediately

### Supabase Storage
- [ ] Photos upload to `maintenance-photos` bucket
- [ ] File names include maintenance ID and timestamp
- [ ] Public URLs are generated correctly
- [ ] Photos are accessible via public URL
- [ ] RLS policies allow authenticated upload
- [ ] RLS policies allow public read
- [ ] RLS policies allow authenticated delete

### Photo Viewer
- [ ] Clicking thumbnail opens fullscreen viewer
- [ ] Fullscreen image displays correctly
- [ ] "Schließen" button closes viewer
- [ ] Clicking outside image closes viewer
- [ ] Works on mobile devices

### Update Heater After Maintenance
- [ ] Last maintenance date updates automatically
- [ ] Next maintenance date recalculates correctly
- [ ] Maintenance warning badge updates if needed
- [ ] Changes persist in database

### Delete Maintenance
- [ ] Delete button shows confirmation
- [ ] Confirmation includes maintenance date
- [ ] Canceling does nothing
- [ ] Confirming deletes maintenance
- [ ] Associated photos deleted from Supabase
- [ ] Success toast appears
- [ ] Maintenance removed from history

---

## 6. Error Handling

### API Errors
- [ ] 401 Unauthorized shows "Nicht autorisiert"
- [ ] 404 Not Found shows appropriate message
- [ ] 500 Server Error shows generic error message
- [ ] Network errors show toast notification
- [ ] Form validation errors display inline
- [ ] Zod validation errors are user-friendly in German

### Edge Cases
- [ ] Handles missing/null data gracefully
- [ ] Handles empty arrays correctly
- [ ] Handles very long text in notes
- [ ] Handles special characters in names
- [ ] Handles multiple rapid clicks (prevents double submission)
- [ ] Loading states prevent multiple submissions

---

## 7. User Experience & Polish

### Loading States
- [ ] All API calls show loading indicators
- [ ] Buttons show loading text during submission
- [ ] Spinner icon animates correctly
- [ ] Loading states disable form interactions

### Toast Notifications
- [ ] Success toasts are green and positive
- [ ] Error toasts are red and clear
- [ ] Toasts auto-dismiss after appropriate time
- [ ] Multiple toasts stack correctly
- [ ] Toast messages are in German

### Form UX
- [ ] Tab key navigation works through form fields
- [ ] Enter key submits forms where appropriate
- [ ] Escape key closes modals
- [ ] Required fields have visual indicators (*)
- [ ] Field labels are clear and in German
- [ ] Placeholder text is helpful

### Navigation
- [ ] Sidebar navigation works on all pages
- [ ] Active page is highlighted in sidebar
- [ ] "Zurück" buttons work correctly
- [ ] Browser back button works as expected

---

## 8. Responsive Design (Mobile Testing)

### Layout
- [ ] Dashboard grid responsive (1 col mobile, 2 tablet, 4 desktop)
- [ ] Customer cards stack on mobile
- [ ] Heater cards stack on mobile
- [ ] Modals are usable on mobile
- [ ] Forms are easy to fill on mobile
- [ ] Buttons are touch-friendly (min 44px)

### Typography
- [ ] Text is readable on small screens
- [ ] Headings scale appropriately
- [ ] No horizontal overflow
- [ ] Line length is comfortable

### Navigation
- [ ] Sidebar works on mobile (if collapsible)
- [ ] Touch gestures work correctly
- [ ] No hover-only interactions

### Images
- [ ] Photo thumbnails scale correctly
- [ ] Fullscreen viewer works on mobile
- [ ] Photos don't cause layout shift

---

## 9. Data Integrity

### Database Operations
- [ ] Creating customer creates record in DB
- [ ] Updating customer updates existing record
- [ ] Deleting customer cascades to heaters
- [ ] Heater maintenance dates calculate correctly
- [ ] Maintenance transactions are atomic
- [ ] No orphaned records after deletions

### Date Calculations
- [ ] Next maintenance = last maintenance + interval months
- [ ] Handles month boundaries correctly (e.g., Jan 31 + 1 month)
- [ ] Timezone handling is consistent
- [ ] Dates persist correctly in database (ISO format)

---

## 10. Security

### Authentication
- [ ] Passwords are hashed (never stored plaintext)
- [ ] Session tokens are secure
- [ ] Session expires after timeout
- [ ] CSRF protection is active (if implemented)

### Authorization
- [ ] Users can only see their own customers
- [ ] Users can only modify their own customers
- [ ] Users can only see their own heaters
- [ ] Users can only delete their own data
- [ ] API endpoints verify ownership

### Input Validation
- [ ] All API endpoints validate input
- [ ] SQL injection is prevented (Prisma parameterized queries)
- [ ] XSS is prevented (React escapes by default)
- [ ] File upload validation prevents malicious files

---

## 11. Performance

### Page Load
- [ ] Dashboard loads in < 2 seconds
- [ ] Customer list loads in < 2 seconds
- [ ] Customer detail page loads in < 2 seconds
- [ ] Images load progressively

### API Response Times
- [ ] Customer CRUD operations < 500ms
- [ ] Heater CRUD operations < 500ms
- [ ] Maintenance operations < 1s
- [ ] Photo uploads < 5s (depends on file size)

### Optimization
- [ ] Images are optimized
- [ ] No unnecessary re-renders
- [ ] API calls are debounced where needed (search)
- [ ] Database queries are optimized (no N+1 problems)

---

## 12. Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest, if Mac available)

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile

---

## Known Issues / Deferred

- [ ] **Supabase RLS Policy**: SELECT policy needs to be `public` instead of `authenticated` for photo viewing
- [ ] **Middleware Deprecation**: Warning about middleware → proxy naming (Next.js 16)

---

## Pre-Production Checklist

Before deploying to production:

- [ ] Environment variables are set correctly
- [ ] Database is backed up
- [ ] Supabase storage bucket is configured
- [ ] All RLS policies are correct
- [ ] Error monitoring is set up (Sentry configured)
- [ ] Analytics are configured (if needed)
- [ ] Domain/DNS is configured
- [ ] SSL certificate is active
- [ ] Database connection string is production
- [ ] API rate limiting is configured (if needed)

---

## Testing Notes

**Tested by:** _________________
**Date:** _________________
**Environment:** Dev / Staging / Production

**Issues Found:**
1. _______________________________________________________
2. _______________________________________________________
3. _______________________________________________________

**Overall Assessment:**
- [ ] Ready for Production
- [ ] Needs Minor Fixes
- [ ] Needs Major Fixes

---

**Last Updated:** 09.01.2026
