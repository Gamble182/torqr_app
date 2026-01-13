# MVP Scope Definition & Feature Prioritization - Torqr

**Phase:** MVP Planning
**Date:** December 11, 2024
**Agent:** Business Strategy Agent
**Version:** 1.0

---

## Executive Summary

This document defines the Minimum Viable Product (MVP) scope for Torqr, targeting 8-10 weeks development timeline with single-user (Max) focus. The MVP validates core value proposition: **reducing Max's admin time from 8h/week to <2h/week through automated maintenance management**.

**MVP Success Criteria:**
- Max uses app daily
- Admin time reduced by 75% (6 hours saved/week)
- Zero missed appointments in first 3 months
- Max willing to recommend to colleagues

---

## 1. MVP Philosophy

### 1.1 Core Principle

**"Simple enough to build in 8 weeks, valuable enough Max can't live without it."**

The MVP must:
- ✅ Solve Max's BIGGEST pain point (time waste + missed appointments)
- ✅ Be usable immediately (no manual required)
- ✅ Work on smartphone (Max's primary device)
- ✅ Work offline (customer sites without internet)
- ✅ Demonstrate clear time savings (quantifiable ROI)
- ❌ NOT try to do everything (invoicing, calendar, reports can wait)

### 1.2 MVP vs. Full Vision

| Capability | MVP (8 weeks) | Phase 2 (Beta) | Phase 3 (SaaS) |
|------------|---------------|----------------|----------------|
| Customer Management | ✅ Basic CRUD | Advanced search/filters | Tags, custom fields |
| Maintenance Tracking | ✅ Manual completion | Checklists, signatures | Templates, analytics |
| Email Automation | ✅ 4-week & 1-week reminders | Configurable timing | A/B testing, personalization |
| Mobile | ✅ PWA, offline-capable | Push notifications | Native app features |
| Calendar | ❌ Phase 2 | ✅ Manual scheduling | Google Calendar sync |
| Invoicing | ❌ Phase 2 | ✅ Basic invoices | Lexoffice integration |
| Reporting | ❌ Phase 3 | Basic dashboard | Advanced analytics |
| Multi-User | ❌ Phase 3 | ❌ Phase 3 | ✅ Roles & permissions |

---

## 2. Feature Prioritization (MoSCoW Method)

### 2.1 MUST HAVE (Core MVP - Sprint 1-6)

These features are absolutely essential. Without them, MVP fails to solve Max's problem.

**M-001: User Authentication**
- **User Story:** As Max, I want to log in securely so only I can access my customer data
- **Acceptance Criteria:**
  - Max can create account with email + password
  - Max can log in with credentials
  - Session persists for 7 days
  - Password reset via email
- **Effort:** 2 days
- **Priority:** P0 (Foundational)
- **Sprint:** Sprint 1

**M-002: Customer CRUD**
- **User Story:** As Max, I want to create, view, edit, and delete customers so I can manage my customer base digitally
- **Acceptance Criteria:**
  - Create customer with name, address, phone, email (optional), notes
  - View list of all customers (sortable by name, next maintenance)
  - Edit customer details
  - Delete customer (with confirmation dialog)
  - Search customers by name or address
  - Duplicate detection (warn if similar name + address)
- **Effort:** 3 days
- **Priority:** P0
- **Sprint:** Sprint 2

**M-003: Heizung (Heater) Management**
- **User Story:** As Max, I want to assign heating systems to customers so I know what equipment needs maintenance
- **Acceptance Criteria:**
  - Add heater to customer (1:n relationship)
  - Heater fields: Model, serial number, installation date, maintenance interval (dropdown: 1/3/6/12/24 months)
  - Set "last maintenance" date
  - System auto-calculates "next maintenance" date
  - Edit heater details
  - Delete heater
  - Customer can have multiple heaters
- **Effort:** 3 days
- **Priority:** P0
- **Sprint:** Sprint 2

**M-004: Wartung (Maintenance) Tracking**
- **User Story:** As Max, I want to mark maintenance as completed while on-site so the next maintenance date is automatically calculated
- **Acceptance Criteria:**
  - "Wartung erledigt" button on heater detail page
  - Default date: today (editable)
  - Optional notes field: "What was done?"
  - Optional photo upload (max 5 photos, taken with camera)
  - On submit: Create maintenance record, update heater's "last maintenance", recalculate "next maintenance"
  - Process completes in <30 seconds
  - Works offline (syncs when online)
- **Effort:** 4 days
- **Priority:** P0
- **Sprint:** Sprint 3

**M-005: Wartung History**
- **User Story:** As Max, I want to see all past maintenances for a heater so I know what was done previously
- **Acceptance Criteria:**
  - Chronological list of maintenances (newest first)
  - Shows: Date, notes, photos (thumbnails)
  - Click photo → view full size
  - Filter: Last year, last 5 maintenances, all
- **Effort:** 2 days
- **Priority:** P0
- **Sprint:** Sprint 3

**M-006: Photo Upload & Storage**
- **User Story:** As Max, I want to take photos during maintenance so I have visual documentation
- **Acceptance Criteria:**
  - Camera integration (direct photo capture on mobile)
  - Upload existing photos from gallery
  - Store photos in cloud (Supabase Storage)
  - Display thumbnails in maintenance history
  - Full-size view on click
  - Max 5 photos per maintenance (prevent storage abuse)
  - Image compression (max 2MB per photo)
- **Effort:** 3 days
- **Priority:** P0
- **Sprint:** Sprint 3

**M-007: Email Automation - 4 Week Reminder**
- **User Story:** As Max's customer, I want to receive an email 4 weeks before my maintenance is due so I can plan ahead
- **Acceptance Criteria:**
  - Cronjob runs daily at 6:00 AM
  - Identifies heaters with maintenance due in exactly 28 days
  - Sends email only if: customer has email, opt-in confirmed, email not already sent for this cycle
  - Email contains: Customer name, heater model, due date, Max's contact info, unsubscribe link
  - Logs email send (timestamp, recipient, status)
  - Tracks opens/clicks (via Resend)
- **Effort:** 4 days
- **Priority:** P0
- **Sprint:** Sprint 4

**M-008: Email Automation - 1 Week Reminder**
- **User Story:** As Max's customer, I want a second reminder 1 week before maintenance so I don't forget
- **Acceptance Criteria:**
  - Same as M-007, but checks for 7 days before
  - Different email template (shorter, more urgent tone)
- **Effort:** 1 day (reuses M-007 infrastructure)
- **Priority:** P0
- **Sprint:** Sprint 4

**M-009: Weekly Summary Email for Max**
- **User Story:** As Max, I want a weekly email every Monday showing upcoming maintenances so I can plan my week
- **Acceptance Criteria:**
  - Cronjob runs every Monday at 7:00 AM
  - Email grouped by:
    - **Überfällig:** Maintenances overdue
    - **Diese Woche:** Due this week (Mon-Sun)
    - **Nächste Woche:** Due next week
  - Per customer: Name, address, phone, heater model, due date, direct link to customer in app
  - Include: Required parts (aggregated from heater configurations)
  - Max can click-to-call phone numbers
- **Effort:** 3 days
- **Priority:** P0
- **Sprint:** Sprint 4

**M-010: Double Opt-In for Email**
- **User Story:** As Max, I need my customers to confirm their email address to comply with GDPR
- **Acceptance Criteria:**
  - When Max adds customer email, status = "pending"
  - System sends confirmation email with unique link
  - Customer clicks link → status = "confirmed"
  - Only send reminders to "confirmed" emails
  - Log: timestamp of opt-in, IP address (for proof)
  - Confirmation link expires after 48 hours
- **Effort:** 3 days
- **Priority:** P0 (GDPR compliance)
- **Sprint:** Sprint 4

**M-011: Unsubscribe Mechanism**
- **User Story:** As Max's customer, I want to unsubscribe from reminder emails easily
- **Acceptance Criteria:**
  - Every email has "Abmelden" link
  - One-click unsubscribe (no login required)
  - Updates customer email opt-in status to "unsubscribed"
  - Confirmation page: "Sie wurden erfolgreich abgemeldet"
  - Log unsubscribe action
- **Effort:** 2 days
- **Priority:** P0 (GDPR compliance)
- **Sprint:** Sprint 4

**M-012: PWA (Progressive Web App) Setup**
- **User Story:** As Max, I want to install the app on my phone's home screen so it feels like a native app
- **Acceptance Criteria:**
  - Manifest.json configured
  - Service worker registered
  - "Add to Home Screen" prompt works on iOS and Android
  - App loads without browser UI
  - Custom app icon
  - Splash screen
- **Effort:** 2 days
- **Priority:** P0 (Mobile-first requirement)
- **Sprint:** Sprint 5

**M-013: Offline Functionality**
- **User Story:** As Max, I want to view customer data and complete maintenances even without internet so I'm not blocked on-site
- **Acceptance Criteria:**
  - Service worker caches: Customer list, customer details, heater details
  - Offline banner shows when no connection
  - Can complete maintenance offline (queued for sync)
  - Background sync when connection restored
  - Conflict resolution: Last-write-wins (simple strategy for MVP)
  - User notified when sync completes
- **Effort:** 5 days
- **Priority:** P0 (Essential for on-site usage)
- **Sprint:** Sprint 5

**M-014: Dashboard / Home Screen**
- **User Story:** As Max, I want to see an overview of urgent tasks when I open the app
- **Acceptance Criteria:**
  - Shows counts:
    - Maintenances overdue
    - Maintenances due this week
    - Maintenances due next week
    - Total customers
  - Quick actions:
    - "Neue Wartung erledigen"
    - "Kunde hinzufügen"
    - "Kunden durchsuchen"
  - Link to weekly summary (if generated today)
- **Effort:** 2 days
- **Priority:** P0
- **Sprint:** Sprint 2

**M-015: Material/Parts Planning (Basic)**
- **User Story:** As Max, I want to know what parts I need for upcoming maintenances so I can bring the right materials
- **Acceptance Criteria:**
  - Heater configuration has "Required parts" field (multi-line text)
  - Format: "1x Brennerplatte, 1x Filter, 2x O-Ringe"
  - Display required parts when viewing heater
  - Weekly email aggregates parts needed for upcoming maintenances
  - Example: "Diese Woche brauchst du: 3x Brennerplatte, 2x Filter"
- **Effort:** 2 days
- **Priority:** P0
- **Sprint:** Sprint 3

**M-016: Security Basics**
- **User Story:** As Max, I need my customer data to be secure
- **Acceptance Criteria:**
  - HTTPS enforced (all traffic encrypted)
  - Passwords hashed with bcrypt
  - Input validation (prevent SQL injection, XSS)
  - Rate limiting on login (prevent brute force)
  - CSRF protection
  - Security headers (CSP, X-Frame-Options)
- **Effort:** 2 days
- **Priority:** P0 (GDPR/Security)
- **Sprint:** Sprint 1

### 2.2 SHOULD HAVE (Post-MVP, Beta Phase)

Important but can wait until after MVP validation. Add based on Max's feedback.

**S-001: Advanced Search & Filters**
- Filter customers by: City, overdue maintenances, heater model
- Search by phone number
- **Effort:** 2 days
- **When:** After MVP if Max requests

**S-002: Bulk Operations**
- Select multiple customers
- Bulk email (custom message, not automated)
- Bulk export to CSV
- **Effort:** 3 days
- **When:** If Max has >50 customers

**S-003: Customer Notes with Timestamps**
- Add multiple timestamped notes per customer
- Use case: "Customer prefers Thursday appointments"
- **Effort:** 2 days
- **When:** If Max requests

**S-004: Email Template Customization**
- Max can edit email templates (subject, body)
- Preview before sending
- **Effort:** 4 days
- **When:** Beta phase (test with multiple users first)

**S-005: Manual Scheduling / Calendar View**
- Calendar view of upcoming maintenances
- Drag-and-drop to reschedule
- Appointment status: Scheduled, Confirmed, Completed
- **Effort:** 5 days
- **When:** Phase 2 (after MVP proves value)

**S-006: Basic Invoicing**
- Create invoice after maintenance
- PDF generation
- Send via email
- Track payment status
- **Effort:** 7 days
- **When:** Phase 2 (not core to MVP value prop)

**S-007: Maintenance Checklists**
- Pre-defined checklist per heater model
- Check off items during maintenance
- Stored in maintenance history
- **Effort:** 4 days
- **When:** After 10+ beta users request it

**S-008: Customer Portal**
- Customers can log in
- View their maintenance history
- Request appointment
- **Effort:** 10 days
- **When:** Phase 2-3 (significant scope increase)

### 2.3 COULD HAVE (Nice-to-Have, Low Priority)

Features that add polish but aren't essential for core value.

**C-001: Dark Mode**
- **Effort:** 2 days
- **When:** If users request (unlikely priority for Handwerk)

**C-002: Multi-Language Support (English, Turkish)**
- **Effort:** 5 days
- **When:** If expanding beyond Germany

**C-003: Statistics Dashboard**
- Maintenances per month chart
- Revenue per customer
- Most common heater models
- **Effort:** 4 days
- **When:** After 50+ customers (data becomes interesting)

**C-004: Geolocation & Route Optimization**
- Map view of customers
- Suggest efficient route for week's appointments
- **Effort:** 7 days
- **When:** Phase 3 (advanced feature)

**C-005: Integration with Parts Suppliers**
- Automatic ordering of required parts
- Track shipments
- **Effort:** 10+ days
- **When:** Phase 3 (requires partnerships)

**C-006: Signature Capture**
- Customer signs on phone after maintenance
- Adds to PDF protocol
- **Effort:** 3 days
- **When:** If Max requests (common in other industries)

### 2.4 WON'T HAVE (Out of Scope for MVP/Beta)

Features explicitly excluded to maintain focus.

**W-001: Google Calendar Integration**
- Reason: Adds complexity, not core pain point
- When: Phase 2 after manual scheduling proven

**W-002: Multi-User / Team Management**
- Reason: Max is Ein-Mann-Betrieb (single user)
- When: Phase 3 for SaaS (multi-tenant architecture needed)

**W-003: Accounting Software Integration (Lexoffice, SevDesk)**
- Reason: Not part of core value prop
- When: Phase 2-3, after basic invoicing

**W-004: SMS Reminders**
- Reason: Cost per SMS adds complexity, email sufficient for MVP
- When: Only if customers prefer SMS (test in beta)

**W-005: Push Notifications**
- Reason: Nice-to-have, not essential for MVP
- When: After PWA adoption proven, if Max requests

**W-006: Advanced Reporting & Analytics**
- Reason: Max doesn't need complex reports initially
- When: Phase 3 for SaaS (multi-tenant, more data)

**W-007: Video Tutorials / In-App Help**
- Reason: App should be self-explanatory
- When: Only if usability testing shows confusion

**W-008: Affiliate/Referral Program**
- Reason: Too early, no SaaS customers yet
- When: Phase 3 after 50+ paying customers

---

## 3. Development Sprint Plan (8 Weeks)

### Sprint 1: Foundation (Week 1)
**Goal:** Project setup, authentication, security basics

**Features:**
- M-016: Security basics
- M-001: User authentication
- Database schema design (Prisma)
- Project structure (Next.js, TypeScript, Tailwind)
- Development environment setup

**Deliverables:**
- Max can create account and log in
- Database schema finalized
- CI/CD pipeline configured

**Risks:**
- Tech stack learning curve
- Supabase setup complexity

---

### Sprint 2: Customer Management (Week 2-3)
**Goal:** Max can manage customers and heaters

**Features:**
- M-002: Customer CRUD
- M-003: Heizung management
- M-014: Dashboard
- M-015: Parts planning (basic)

**Deliverables:**
- Max can add, edit, view, delete customers
- Max can assign heaters to customers
- Dashboard shows customer count and upcoming maintenances
- Required parts field on heater

**Acceptance Test:**
- Max adds 5 test customers with heaters
- Search and edit work flawlessly
- Mobile UI is touch-friendly

---

### Sprint 3: Maintenance Tracking (Week 4)
**Goal:** Max can complete maintenances on-site

**Features:**
- M-004: Wartung tracking
- M-005: Wartung history
- M-006: Photo upload

**Deliverables:**
- "Wartung erledigt" flow works end-to-end
- Photos can be captured and stored
- Maintenance history displays correctly
- Next maintenance date auto-calculated

**Acceptance Test:**
- Max completes 3 maintenances with photos
- Process takes <30 seconds per maintenance
- History shows all past maintenances

---

### Sprint 4: Email Automation (Week 5)
**Goal:** Automated reminders send reliably

**Features:**
- M-007: 4-week reminder
- M-008: 1-week reminder
- M-009: Weekly summary
- M-010: Double opt-in
- M-011: Unsubscribe

**Deliverables:**
- Resend integration complete
- Email templates designed (React Email)
- Cronjobs configured (Vercel Cron)
- Opt-in/opt-out flows functional
- SPF/DKIM/DMARC configured

**Acceptance Test:**
- Simulate maintenance 28 days out → email sends
- Simulate maintenance 7 days out → email sends
- Monday summary email generates correctly
- Opt-in confirmation works
- Unsubscribe link works

**Risks:**
- Email deliverability (spam filters)
- Cronjob reliability

---

### Sprint 5: Mobile & Offline (Week 6)
**Goal:** App works seamlessly on mobile, even offline

**Features:**
- M-012: PWA setup
- M-013: Offline functionality

**Deliverables:**
- PWA installable on iOS/Android
- Service worker caches critical data
- Offline mode works (customer list, maintenance completion)
- Background sync when reconnected
- UI indicates online/offline status

**Acceptance Test:**
- Max installs app on iPhone
- Max opens app without internet → can view customers
- Max completes maintenance offline → syncs when online
- No data loss during offline/online transitions

**Risks:**
- Service worker complexity
- Sync conflict handling

---

### Sprint 6: Testing & Polish (Week 7)
**Goal:** Bug-free, polished user experience

**Activities:**
- End-to-end testing (all workflows)
- Mobile testing on real devices (iPhone, Android)
- Performance optimization (Lighthouse, Core Web Vitals)
- UI/UX polish (loading states, error messages, micro-interactions)
- Accessibility audit (WCAG 2.1 Level AA)
- Security audit (OWASP Top 10)

**Deliverables:**
- All critical bugs fixed
- App loads in <3 seconds on 3G
- Touch targets all meet 44x44px minimum
- Error handling graceful (no crashes)
- Lighthouse score >90

**Acceptance Test:**
- Max uses app for 1 week with real customers
- No critical bugs found
- Max satisfaction: 8/10+

---

### Sprint 7-8: Max Onboarding & Go-Live (Week 8-9)
**Goal:** Max fully migrated from Excel, using app daily

**Activities:**
- Max training session (2 hours)
- Excel data migration (CSV import tool if needed)
- Setup Max's account (production environment)
- Import customers and heaters
- Configure email settings (SPF/DKIM on Max's domain)
- First week monitoring (daily check-ins)

**Deliverables:**
- Max's 80 customers migrated
- Max comfortable using all features
- Max completes first real maintenances via app
- First automated emails sent

**Acceptance Test:**
- Max uses app daily without prompting
- Max completes 5+ maintenances via app in first week
- Max provides positive feedback
- Admin time measurably reduced

**Risks:**
- Max finds app confusing
- Data migration errors
- Email deliverability issues

---

## 4. Success Metrics

### 4.1 MVP Validation Metrics (First 3 Months)

**Primary Metric: Time Savings**
- **Baseline:** 8 hours/week admin time
- **Target:** <2 hours/week admin time
- **Measurement:** Weekly survey (self-reported)
- **Success:** 75% reduction (6 hours saved/week)

**Quality Metrics:**
- **Missed appointments:** 0% (vs. current ~5%)
- **Email delivery rate:** >95%
- **Email open rate:** >30% (industry average ~20%)
- **App uptime:** >99.5%

**Adoption Metrics:**
- **Daily active use:** Max uses app 5+ days/week
- **Maintenances tracked:** 100% of Max's maintenances logged in app
- **Customer migration:** 100% of Max's customers in system (within 4 weeks)

**Satisfaction Metrics:**
- **Max NPS:** 9-10/10 (Promoter)
- **Max satisfaction:** 8/10+ overall
- **Willingness to recommend:** Yes
- **Willingness to pay (SaaS):** €29-49/month

### 4.2 Feature Usage Metrics

Track to understand what Max uses most (informs Phase 2 priorities):

- Customer CRUD operations (adds, edits, searches)
- Maintenance completions per week
- Photo uploads per maintenance
- Dashboard page views
- Weekly summary email opens/clicks
- Customer reminder email opens/clicks

### 4.3 Technical Performance Metrics

- **Page load time:** <3 seconds (3G mobile, p95)
- **API response time:** <500ms (p95)
- **Offline sync success rate:** >99%
- **Photo upload success rate:** >95%
- **Email delivery rate:** >95%
- **App crashes:** 0 (critical bugs)

### 4.4 Business Validation Metrics

These determine if SaaS expansion is viable:

- **Max retention:** Uses app continuously for 3+ months
- **Max referrals:** Recommends to ≥3 colleagues
- **Beta sign-ups:** ≥5 Heizungsbauer from Max's network
- **Conversion interest:** ≥50% of beta users willing to pay

**Go/No-Go Decision (After 3 Months):**
- ✅ GO to Beta if: Max actively using, satisfied 8/10+, ≥3 referrals interested
- ❌ NO-GO if: Max stopped using OR satisfied <7/10 OR no referral interest

---

## 5. User Stories (Detailed)

### 5.1 Core User Journeys

**Journey 1: Max adds a new customer**

**Actors:** Max
**Frequency:** 1-2 times/month
**Duration:** 60 seconds

**Steps:**
1. Max opens app on phone
2. Taps "Neuer Kunde" button on dashboard
3. Fills form:
   - Name: "Herr Schmidt"
   - Address: "Hauptstraße 45, 10115 Berlin"
   - Phone: "030 12345678"
   - Email: "schmidt@example.com" (optional)
4. Taps "Heizung hinzufügen"
5. Fills heater form:
   - Model: "Viessmann Vitodens 200"
   - Serial: "12345ABC"
   - Installation: "15.01.2020"
   - Interval: "12 Monate" (dropdown)
   - Last maintenance: "15.12.2024"
6. System calculates: Next maintenance = 15.12.2025
7. Adds required parts: "1x Brennerplatte, 1x Filter"
8. Taps "Speichern"
9. If email provided: System sends opt-in confirmation email to customer
10. Max sees success message: "Kunde erfolgreich angelegt"
11. Max redirected to customer detail page

**Acceptance Criteria:**
- ✅ Process completes in <60 seconds
- ✅ All fields validated (no empty names, valid email format)
- ✅ Next maintenance auto-calculated correctly
- ✅ Opt-in email sent immediately (if email provided)
- ✅ Mobile-optimized (large touch targets, no pinch-zoom)

---

**Journey 2: Max completes a maintenance on-site**

**Actors:** Max
**Frequency:** 3-5 times/week
**Duration:** 30 seconds

**Context:** Max is at customer's home, just finished servicing heater, wants to log completion quickly

**Steps:**
1. Max opens app (works offline)
2. Searches customer by name or scrolls list
3. Taps customer → sees heater(s)
4. Taps heater with upcoming maintenance
5. Sees "Wartung heute fällig!" banner
6. Taps "Wartung erledigt" button
7. Popup appears:
   - Date: [Today] (pre-filled, editable)
   - Notes: [Empty] (optional)
   - Photos: [Camera icon] "Fotos hinzufügen"
8. Max taps camera icon → phone camera opens
9. Max takes 2 photos of heater
10. Photos appear as thumbnails
11. Max adds note: "Filter getauscht, alles ok"
12. Taps "Fertig"
13. System:
    - Creates maintenance record
    - Updates "last maintenance" to today
    - Calculates "next maintenance" (today + 12 months = 15.12.2025)
14. Success message: "Wartung erfolgreich gespeichert"
15. If offline: "Wird synchronisiert sobald Online" banner
16. Max sees updated maintenance history

**Acceptance Criteria:**
- ✅ Process completes in <30 seconds
- ✅ Works completely offline
- ✅ Photos stored locally, synced later
- ✅ Next maintenance date recalculated correctly
- ✅ No data loss if app closed mid-process

---

**Journey 3: Customer receives and confirms email reminder**

**Actors:** Customer (Herr Schmidt), Max (indirect)
**Frequency:** Once per maintenance cycle per customer
**Duration:** 2 minutes (customer), 0 minutes (Max - automated)

**Steps:**

**Day -28 (4 weeks before maintenance):**
1. 6:00 AM: Cronjob runs
2. System identifies: Herr Schmidt's heater due in 28 days (15.12.2025)
3. System checks:
   - ✅ Customer has email (schmidt@example.com)
   - ✅ Email status: "pending" → System does NOT send (not confirmed yet)
4. (In this scenario, email was not confirmed, so no email sent)

**Day -27:**
1. Herr Schmidt opens email from Max (opt-in confirmation)
2. Clicks "Email-Adresse bestätigen" link
3. Lands on confirmation page: "Email-Adresse bestätigt. Sie erhalten ab jetzt Wartungserinnerungen."
4. System sets status: "confirmed"

**Day -28 (next cycle):**
1. 6:00 AM: Cronjob runs again
2. System identifies: Another customer's heater due in 28 days
3. System checks:
   - ✅ Customer has email
   - ✅ Email status: "confirmed"
   - ✅ Email not yet sent for this cycle
4. System sends email:

```
Betreff: Wartungserinnerung für Ihre Heizung

Sehr geehrter Herr Schmidt,

Ihre Heizung (Viessmann Vitodens 200) ist in ca. 4 Wochen
(voraussichtlich am 15. Dezember 2025) wieder zur Wartung fällig.

Wir werden uns zeitnah bei Ihnen melden, um einen Termin zu vereinbaren.

Mit freundlichen Grüßen
Max Wagner
Heizungsbau Wagner
Tel: 030 12345678

---
Sie möchten keine Erinnerungen mehr erhalten? [Hier abmelden]
Datenschutzerklärung: [Link]
```

5. Herr Schmidt receives email in inbox
6. Opens email (tracked via Resend)
7. Makes mental note: "Heizung bald fällig"

**Day -7 (1 week before):**
1. 6:00 AM: Cronjob runs
2. System identifies: Herr Schmidt's heater due in 7 days
3. Sends second, shorter reminder:

```
Betreff: Erinnerung: Wartung Ihrer Heizung nächste Woche

Sehr geehrter Herr Schmidt,

Ihre Heizung ist nächste Woche zur Wartung fällig.

Sollten wir noch keinen Termin vereinbart haben,
melden Sie sich gerne unter 030 12345678.

Mit freundlichen Grüßen
Max Wagner

[Abmelden] [Datenschutz]
```

4. Herr Schmidt calls Max to schedule

**Max's Experience:**
- ⏱️ Time spent: 0 minutes (100% automated)
- Result: Customer proactively contacts Max (inbound call, not outbound)

**Acceptance Criteria:**
- ✅ Email sends at exactly 28 days and 7 days before
- ✅ Email only sends to confirmed opt-ins
- ✅ Email not sent twice for same cycle
- ✅ Email delivery rate >95%
- ✅ Unsubscribe link works instantly

---

**Journey 4: Max reviews weekly summary**

**Actors:** Max
**Frequency:** Every Monday morning
**Duration:** 5 minutes

**Steps:**
1. Monday, 7:00 AM: Cronjob generates weekly summary
2. System queries database:
   - Overdue maintenances (past due date)
   - This week maintenances (Mon-Sun)
   - Next week maintenances
3. System generates email:

```
Betreff: Deine anstehenden Wartungen (KW 50)

Hallo Max,

**Dringend (überfällig):**
• Frau Müller - Lindenstraße 23, 10115 Berlin - 030 98765432
  Wartung seit 3 Tagen überfällig

**Diese Woche fällig (3 Wartungen):**
• Herr Schmidt - Hauptstraße 45, 10115 Berlin - 030 12345678
  Wartung am 15.12.2025 - [Kunde öffnen]
• Herr Schneider - Parkstraße 67, 10117 Berlin - 030 55566677
  Wartung am 17.12.2025 - [Kunde öffnen]
• Frau Weber - Gartenweg 89, 10119 Berlin - 030 44455566
  Wartung am 19.12.2025 - [Kunde öffnen]

**Nächste Woche (2 Wartungen):**
• ...

**Benötigte Teile (für diese Woche):**
• 3x Brennerplatte
• 2x Filter
• 1x O-Ringe Set

Viel Erfolg!
Dein WartungsWerk
```

4. Max receives email at 7:05 AM
5. Opens email during morning coffee
6. Reviews overdue: Calls Frau Müller immediately
7. Plans this week: Calls 3 customers to schedule
8. Clicks "[Kunde öffnen]" links → opens app to specific customer
9. Checks if he has required parts in stock
10. Orders missing parts from supplier

**Value:**
- ⏱️ Time saved: ~2 hours/week (vs. manually checking Excel + calling all customers)
- 📞 Proactive planning: Max calls customers instead of scrambling
- 🔧 Material prep: Max knows what parts to order ahead of time

**Acceptance Criteria:**
- ✅ Email arrives every Monday at 7:00 AM (±5 minutes)
- ✅ Grouping is accurate (overdue, this week, next week)
- ✅ Links to customers work (deep links)
- ✅ Required parts aggregated correctly
- ✅ Email well-formatted on mobile (Max reads on phone)

---

## 6. Non-Functional Requirements (MVP)

### 6.1 Performance

**Target Device:** iPhone 12 / Samsung Galaxy S21 (mid-range smartphone)
**Target Network:** 3G (slow mobile connection)

| Metric | Target | Critical Threshold |
|--------|--------|--------------------|
| Initial page load (cold start) | <3 seconds | <5 seconds |
| Customer list load | <2 seconds | <3 seconds |
| Wartung completion | <1 second | <2 seconds |
| Photo upload (per photo) | <3 seconds | <5 seconds |
| API response time (p95) | <500ms | <1000ms |

**Optimization Strategies:**
- Code splitting (load only needed JS)
- Image optimization (compress photos before upload)
- Lazy loading (load images as user scrolls)
- Caching (aggressive browser caching)
- Database indexing (on customer name, next_maintenance date)

### 6.2 Reliability

- **Uptime:** 99.5% (3.6 hours downtime/month acceptable for MVP)
- **Data Loss:** 0% (no acceptable data loss)
- **Offline Resilience:** App must work 100% offline for core features

### 6.3 Usability

- **Learning Time:** Max should understand system in <30 minutes without manual
- **Task Efficiency:** Core tasks (add customer, complete maintenance) <60 seconds each
- **Error Tolerance:** Forgiving UI (undo, confirmation dialogs, autosave)
- **Accessibility:** WCAG 2.1 Level AA (minimum 4.5:1 contrast, keyboard navigation)

### 6.4 Compatibility

**Browsers:**
- Chrome/Edge (latest 2 versions)
- Safari iOS (latest 2 versions)
- Safari Desktop (latest 2 versions)
- Firefox (latest 2 versions)

**Devices:**
- iPhone (iOS 15+)
- Android smartphones (Android 10+)
- Tablets (secondary)
- Desktop (tertiary)

### 6.5 Security

**MVP Security Requirements:**
- HTTPS enforced (no HTTP allowed)
- Password hashing (bcrypt, cost ≥12)
- Input validation (prevent SQL injection, XSS)
- CSRF protection
- Rate limiting (login: 5 attempts/minute)
- Session timeout (7 days inactivity)

**Post-MVP (SaaS):**
- Two-factor authentication (2FA)
- Advanced rate limiting
- Web Application Firewall (WAF)
- Penetration testing
- Bug bounty program

---

## 7. Risks & Mitigation

### 7.1 MVP-Specific Risks

**RISK-MVP-001: Max doesn't like the UI/UX**
- **Probability:** Medium (30%)
- **Impact:** Very High (MVP fails)
- **Mitigation:**
  - Early mockups shared with Max (Sprint 1)
  - Weekly demos during development
  - Max tests on HIS phone (not simulator)
  - Iterative design based on feedback
- **Contingency:** Redesign critical screens if Max confused

**RISK-MVP-002: Offline sync causes data conflicts**
- **Probability:** Medium (40%)
- **Impact:** Medium (data confusion)
- **Mitigation:**
  - Simple conflict resolution: Last-Write-Wins
  - Log all syncs for debugging
  - Clear user feedback during sync
  - Thorough testing of offline/online transitions
- **Contingency:** Disable offline editing for problem areas, keep offline read-only

**RISK-MVP-003: Email deliverability issues (spam filters)**
- **Probability:** Medium (30%)
- **Impact:** High (core value prop fails)
- **Mitigation:**
  - Use Resend (good reputation)
  - Configure SPF/DKIM/DMARC correctly
  - Warm sender reputation (start with small batch)
  - Test with multiple email providers (Gmail, Outlook, etc.)
  - Monitor bounce/spam rates
- **Contingency:** If spam issues persist, consider transactional email provider like Postmark

**RISK-MVP-004: Photo uploads fail on poor networks**
- **Probability:** Medium (40%)
- **Impact:** Medium (frustrating UX)
- **Mitigation:**
  - Compress photos before upload (max 2MB)
  - Retry logic with exponential backoff
  - Background upload (queue for later)
  - Clear progress indicator
- **Contingency:** Allow photo upload later (not during maintenance flow)

**RISK-MVP-005: Max overwhelmed by learning new system**
- **Probability:** Low (20%)
- **Impact:** High (abandonment)
- **Mitigation:**
  - 2-hour intensive training session
  - Step-by-step onboarding in app
  - Tooltips for key features
  - Weekly check-ins first month
  - Max can always call developer for help
- **Contingency:** Simplify UI further, add video tutorials

### 7.2 Technical Risks

**RISK-MVP-006: PWA installation doesn't work on iOS**
- **Probability:** Medium (30%) (iOS has PWA quirks)
- **Impact:** Medium (less "app-like" feel)
- **Mitigation:**
  - Test extensively on real iPhone
  - Follow iOS-specific PWA guidelines
  - Provide manual install instructions
- **Contingency:** Treat as web app on iOS, full PWA on Android

**RISK-MVP-007: Service worker caching causes stale data**
- **Probability:** Medium (30%)
- **Impact:** Medium (user confusion)
- **Mitigation:**
  - Cache-busting strategy (versioned assets)
  - Stale-while-revalidate pattern
  - Clear cache button in settings
  - Automatic cache refresh on app load
- **Contingency:** Reduce caching aggressiveness, prefer network-first

**RISK-MVP-008: Supabase free tier limits hit**
- **Probability:** Low (10%) (should be sufficient for single user)
- **Impact:** Low (upgrade to paid)
- **Mitigation:**
  - Monitor database size and bandwidth
  - Optimize queries and storage
  - Compress photos aggressively
- **Contingency:** Upgrade to Supabase Pro ($25/month) if needed

---

## 8. Definition of Done (MVP)

### 8.1 Feature Checklist

For each MUST HAVE feature (M-001 through M-016):
- [ ] Feature fully implemented
- [ ] Unit tests written (business logic)
- [ ] Integration tests written (API endpoints)
- [ ] E2E test written (critical user flows)
- [ ] Code reviewed by developer
- [ ] Tested on real iPhone
- [ ] Tested on real Android phone
- [ ] Tested on slow 3G network (throttled)
- [ ] Tested offline (airplane mode)
- [ ] Accessibility checked (keyboard, screen reader)
- [ ] Security checked (OWASP Top 10 considerations)
- [ ] Performance benchmarked (meets targets)
- [ ] Documentation updated (code comments, README)

### 8.2 MVP Completion Criteria

**The MVP is DONE when:**
- ✅ All 16 MUST HAVE features complete and tested
- ✅ Max can perform all core workflows without help
- ✅ App works flawlessly on Max's iPhone
- ✅ Offline mode works (tested in airplane mode)
- ✅ Emails send reliably (tested with real emails)
- ✅ No critical bugs (P0 severity)
- ✅ Performance targets met (<3s initial load on 3G)
- ✅ GDPR compliance checklist 100% complete
- ✅ Max's Excel data migrated successfully
- ✅ Max has completed 3+ real maintenances via app
- ✅ Max provides positive feedback (satisfaction ≥8/10)

**NOT required for MVP completion:**
- SHOULD HAVE features (deferred to Phase 2)
- Perfect UI polish (good enough is fine for MVP)
- 100% test coverage (critical paths covered)
- Multi-user support (Max only)
- Advanced analytics/reporting

---

## 9. Post-MVP: Continuous Improvement

### 9.1 Feedback Collection

**Weekly (First Month):**
- 30-minute call with Max
- Questions:
  - What frustrated you this week?
  - What feature did you miss?
  - How much time did you save?
  - Would you recommend to colleagues?

**Monthly (Months 2-3):**
- Detailed satisfaction survey
- Feature request prioritization
- Observational session (watch Max use app)

### 9.2 Metrics-Driven Iteration

**Track & Act:**
- If email open rate <30%: Improve subject lines, send times
- If Max uses search frequently: Improve search/filters
- If photo uploads failing >5%: Improve compression/retry logic
- If Max asks for feature 3+ times: Add to Phase 2 backlog

### 9.3 Beta Expansion Criteria

**Expand to Beta (5-10 users) ONLY IF:**
- ✅ Max satisfaction ≥8/10 after 2 months
- ✅ Max uses app daily for 2+ months
- ✅ Max completed 20+ maintenances via app
- ✅ Max time savings measured ≥50%
- ✅ Max actively recommends to ≥3 colleagues
- ✅ No critical bugs reported in last 2 weeks

**If criteria not met:**
- Continue iterating with Max
- Do NOT expand to beta prematurely
- Focus on making Max 100% satisfied first

---

## 10. Appendix: Feature Estimation Summary

### 10.1 Effort by Sprint

| Sprint | Features | Total Days | Confidence |
|--------|----------|------------|------------|
| Sprint 1 | M-001, M-016, Setup | 5 days | High |
| Sprint 2 | M-002, M-003, M-014, M-015 | 10 days | High |
| Sprint 3 | M-004, M-005, M-006 | 9 days | Medium |
| Sprint 4 | M-007, M-008, M-009, M-010, M-011 | 13 days | Medium |
| Sprint 5 | M-012, M-013 | 7 days | Low (offline complexity) |
| Sprint 6 | Testing, Polish | 5 days | Medium |
| Sprint 7-8 | Onboarding, Migration | 5 days | High |

**Total:** 54 development days (~8 weeks at 7 days/week, or 10.8 weeks at 5 days/week)

**Buffer:** 20% added for unknowns = 65 days total (~13 weeks realistic)

### 10.2 Risk-Adjusted Timeline

**Optimistic:** 8 weeks (everything goes smoothly, no major blockers)
**Realistic:** 10-12 weeks (some technical challenges, iteration with Max)
**Pessimistic:** 14-16 weeks (major roadblocks, significant rework needed)

**Recommendation:** Commit to 10-week timeline, with buffer to 12 weeks if needed.

---

**Document Status:** ✅ COMPLETE
**Next Agent:** Technical Architecture Agent (System Design)
**Dependencies:** Business Model Canvas (agent-01), GDPR Framework (agent-04)
**Approval:** Ready for technical design phase
**Implementation:** Sprint plan to be followed by development agents
