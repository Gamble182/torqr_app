# Torqr (Drehmoment) - Project Summary & Implementation Roadmap

**Generated:** December 11, 2024
**Project Status:** ✅ Planning Complete - Ready for Development
**Timeline:** 8-10 weeks to MVP
**Budget:** €3,000 initial + €0/month hosting (MVP)

---

## 🎯 Executive Summary

**Torqr** (brand name: Drehmoment - "Der Hebel für dein Handwerk") is a mobile-first Progressive Web App designed to eliminate the €20,000/year opportunity cost self-employed heating technicians face due to manual Excel-based maintenance management.

**Core Value Proposition:**
Reduce Max's administrative overhead from 8 hours/week to <2 hours/week through automated customer reminders, mobile-accessible maintenance tracking, and intelligent scheduling—all while ensuring GDPR compliance.

**Market Opportunity:**
- ~15,000 Ein-Mann-Heizungsbaubetriebe in Germany
- Current solutions are too complex, expensive, or general-purpose
- Target: 50-100 customers in Year 1 = €23,400-46,800 ARR

---

## 📊 Project Overview

### Business Model

**MVP Phase (Q1 2025):**
- Single user: Max (validation partner)
- One-time payment: €3,000
- Equity split: 70% Developer, 30% Max
- Hosting: €0/month (free tiers)

**SaaS Phase (Q3 2025+):**
- Multi-tenant platform
- Pricing tiers: €29/€49/€99 per month
- Target: 100 customers = €3,900 MRR by end of Year 1

### Success Metrics

**MVP Validation (3 months):**
- ✅ Max's admin time reduced 75% (8h/week → <2h/week)
- ✅ Zero missed appointments
- ✅ Max satisfaction: 8/10+
- ✅ Max willing to recommend
- ✅ 100% of Max's customers migrated to system

**SaaS Growth (Year 1):**
- 👥 50-100 paying customers
- 💰 €23,400-46,800 ARR
- 📈 <5% monthly churn
- 🎯 <€100 CAC

---

## 📦 Deliverables Created

This project has generated **4 comprehensive planning documents** totaling over 100 pages of strategic, technical, and compliance specifications:

### 1. Business Model Canvas
**File:** `agent-01-business-model-canvas.md` (35 pages)
**Contents:**
- Complete Business Model Canvas (all 9 building blocks)
- Competitive analysis (vs. Handwerker-Office, meetergo, simpleSystem)
- Go-to-Market strategy (MVP → Beta → SaaS → Scale)
- Financial projections (Year 1-2 revenue forecasts)
- Risk analysis (12 identified risks with mitigation strategies)
- Success metrics and KPIs
- **Key Insight:** 26:1 LTV:CAC ratio potential, 95%+ gross margin

### 2. GDPR Compliance Framework
**File:** `agent-04-gdpr-compliance-framework.md` (42 pages)
**Contents:**
- Complete GDPR/BDSG compliance roadmap
- Auftragsverarbeitungsvertrag (AV-Vertrag) requirements
- Data processing inventory (all personal data categories)
- Double opt-in email flow specification
- Technical and organizational measures (TOMs)
- Data subject rights implementation guide
- Compliance checklist (must complete before go-live)
- **Key Requirement:** Double opt-in for email marketing is MANDATORY

### 3. MVP Scope Definition & Feature Prioritization
**File:** `agent-01-mvp-scope-definition.md` (50 pages)
**Contents:**
- 16 MUST-HAVE features (MoSCoW prioritization)
- Detailed user stories with acceptance criteria
- 8-week sprint plan (broken down by week)
- Feature effort estimates (54 development days)
- User journey mapping (4 core journeys documented)
- Non-functional requirements (performance, security, usability)
- Risk analysis specific to MVP features
- **Key Decision:** PWA (not native app) for faster time-to-market

### 4. Technical Architecture
**File:** `agent-02-technical-architecture.md` (65 pages)
**Contents:**
- Complete system architecture (C4 model diagrams)
- Full technology stack specification
- Complete Prisma database schema (ready to copy-paste)
- 30+ API endpoints fully specified
- Offline-first architecture with Service Worker implementation
- Email automation architecture (React Email templates)
- Security architecture (authentication, authorization, encryption)
- Performance optimization strategies
- Deployment & CI/CD procedures
- **Tech Stack:** Next.js 14, PostgreSQL (Supabase), Prisma, Resend, Vercel

---

## 🏗️ Technical Specifications

### Architecture Summary

**Frontend:**
- Next.js 14 (App Router)
- TypeScript + React 18
- Tailwind CSS + shadcn/ui
- PWA with Service Worker (offline-capable)
- IndexedDB for offline storage

**Backend:**
- Next.js API Routes (serverless)
- Prisma ORM
- PostgreSQL 15+ (Supabase)
- NextAuth.js for authentication

**Services:**
- **Email:** Resend (3,000 emails/month free)
- **Storage:** Supabase Storage (1GB free)
- **Hosting:** Vercel (free tier)
- **Monitoring:** Sentry (error tracking)

**Key Features:**
- 100% offline-capable (customer list, maintenance completion)
- Background sync when reconnected
- Automated email reminders (4 weeks, 1 week before maintenance)
- Weekly summary email for Max
- Photo capture and storage
- GDPR-compliant double opt-in

### Database Schema

**Core Models:**
- `User` - Max's account
- `Customer` - Max's customers (80+ records)
- `Heater` - Heating systems (1:n with Customer)
- `Maintenance` - Maintenance records with photos
- `EmailLog` - Email tracking (GDPR audit trail)
- `Session` - Authentication sessions
- `CronRun` - Job execution tracking

**Key Features:**
- UUID primary keys
- Automatic timestamp tracking
- Cascade deletes (GDPR right to erasure)
- Comprehensive indexing for performance
- Enum types for email opt-in status

### API Endpoints (30+)

**Authentication:**
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- POST `/api/auth/reset-password`

**Customers:**
- GET `/api/customers` (list with search/filter)
- GET `/api/customers/:id`
- POST `/api/customers` (create)
- PATCH `/api/customers/:id` (update)
- DELETE `/api/customers/:id` (GDPR delete)

**Heaters:**
- POST `/api/heaters` (create for customer)
- PATCH `/api/heaters/:id`
- DELETE `/api/heaters/:id`

**Maintenances:**
- POST `/api/maintenances` (mark completed)
- GET `/api/maintenances` (history)
- GET `/api/maintenances/:id`

**Photos:**
- POST `/api/upload` (upload to Supabase Storage)
- DELETE `/api/upload` (GDPR delete)

**Emails:**
- POST `/api/email/opt-in` (resend confirmation)
- GET `/api/email/confirm/:token` (customer confirms)
- GET `/api/email/unsubscribe/:token` (customer opts out)

**Dashboard:**
- GET `/api/dashboard` (stats summary)

**Cron Jobs:**
- POST `/api/cron/daily-reminders` (runs 6:00 AM)
- POST `/api/cron/weekly-summary` (runs Monday 7:00 AM)

---

## 🚀 Implementation Roadmap

### Phase 1: MVP Development (Weeks 1-8)

**Sprint 1: Foundation (Week 1)**
- ✅ Next.js project setup
- ✅ Prisma schema implementation
- ✅ Database migrations
- ✅ Authentication system (NextAuth.js)
- ✅ Security basics (bcrypt, HTTPS, input validation)
- **Deliverable:** Max can create account and log in

**Sprint 2: Customer Management (Weeks 2-3)**
- ✅ Customer CRUD operations
- ✅ Heater management (1:n relationship)
- ✅ Dashboard with statistics
- ✅ Search and filtering
- ✅ Mobile-responsive UI (Tailwind + shadcn/ui)
- **Deliverable:** Max can manage all 80 customers

**Sprint 3: Maintenance Tracking (Week 4)**
- ✅ "Wartung erledigt" flow
- ✅ Maintenance history display
- ✅ Photo capture and upload
- ✅ Automatic next maintenance calculation
- ✅ Required parts tracking
- **Deliverable:** Max can complete maintenances on-site

**Sprint 4: Email Automation (Week 5)**
- ✅ Resend integration
- ✅ React Email templates (4-week, 1-week reminders, weekly summary)
- ✅ Double opt-in flow (GDPR compliance)
- ✅ Unsubscribe mechanism
- ✅ Vercel Cron jobs (6:00 AM daily, 7:00 AM Monday)
- ✅ Email logging (tracking opens/clicks)
- **Deliverable:** Automated reminders sending reliably

**Sprint 5: Mobile & Offline (Week 6)**
- ✅ PWA setup (next-pwa, manifest, service worker)
- ✅ Offline data caching (IndexedDB)
- ✅ Background sync (Workbox)
- ✅ Offline/online status indicators
- ✅ Optimistic UI updates
- **Deliverable:** App works 100% offline

**Sprint 6: Testing & Polish (Week 7)**
- ✅ End-to-end testing (Playwright)
- ✅ Mobile device testing (real iPhone, Android)
- ✅ Performance optimization (Lighthouse >90)
- ✅ Accessibility audit (WCAG 2.1 Level AA)
- ✅ Security audit (OWASP Top 10)
- ✅ UI polish (loading states, error handling)
- **Deliverable:** Production-ready app

**Sprint 7-8: Onboarding & Go-Live (Weeks 8-9)**
- ✅ Max training session (2 hours)
- ✅ Excel data migration (CSV import if needed)
- ✅ Production deployment (Vercel)
- ✅ Email domain configuration (SPF/DKIM/DMARC)
- ✅ First week monitoring (daily check-ins)
- **Deliverable:** Max using app daily with real customers

### Phase 2: Beta Testing (Weeks 10-13)

**Activities:**
- Recruit 5-10 Heizungsbauer from Max's network
- Group onboarding sessions
- Collect feedback and iterate
- Bug fixes and feature refinements
- Build testimonials and case studies

**Success Criteria:**
- 5+ active beta users
- 80%+ weekly active usage
- Average satisfaction: 7.5/10+
- 3+ written testimonials

### Phase 3: SaaS Preparation (Months 4-6)

**Technical:**
- Multi-tenancy architecture (already designed for this)
- Stripe/Paddle integration (billing)
- User onboarding flow
- Marketing website

**Business:**
- Pricing finalization (€29/€49/€99 tiers)
- Marketing materials
- SEO optimization
- Legal review (AV-Vertrag, Datenschutzerklärung)

**Launch:**
- Public launch announcement
- Google Ads campaign (€500-1,000/month)
- Trade association outreach
- Content marketing

### Phase 4: Scale (2026+)

**Growth:**
- 200-300 active customers
- Expansion to other Handwerk trades (Klempner, Elektriker)
- Geographic expansion (Austria, Switzerland)

**Features:**
- Calendar integration (Google Calendar)
- Invoicing module
- Advanced reporting
- Multi-user/team features
- API for integrations

---

## ⚠️ Critical Success Factors

### MUST-DO Before Go-Live

**Legal & Compliance:**
- [ ] Double opt-in email flow 100% complete and tested
- [ ] Unsubscribe mechanism working
- [ ] Datenschutzerklärung created and linked
- [ ] AV-Vertrag signed between Max and platform
- [ ] Supabase EU data center confirmed
- [ ] SPF/DKIM/DMARC configured correctly

**Technical:**
- [ ] App works offline (tested in airplane mode)
- [ ] Photo uploads work on slow connection
- [ ] Email reminders send at correct times (test with cron)
- [ ] PWA installable on Max's iPhone
- [ ] Performance: <3s initial load on 3G

**Business:**
- [ ] Max trained (2-hour session completed)
- [ ] Max's customers migrated from Excel
- [ ] Max satisfied with app (feedback collected)

### Top Risks to Mitigate

**RISK #1: Max doesn't adopt the system**
- **Mitigation:** Intensive training, weekly check-ins, extreme simplicity focus
- **Contingency:** If not adopted after 4 weeks, major redesign or pivot

**RISK #2: Email deliverability issues**
- **Mitigation:** Use Resend, configure DNS correctly, monitor bounce rates
- **Contingency:** Switch to Postmark or SendGrid if problems persist

**RISK #3: Offline sync causes data conflicts**
- **Mitigation:** Last-Write-Wins strategy, log all conflicts, clear user feedback
- **Contingency:** Disable offline editing, keep offline read-only if conflicts >1%

**RISK #4: GDPR violation (emails without consent)**
- **Mitigation:** Double opt-in MANDATORY, legal review €500-1,000
- **Contingency:** Immediate cease of email sending, legal consultation

---

## 💰 Budget & Resources

### MVP Phase (Months 1-3)

**One-Time Costs:**
- Development: €3,000 (from Max)
- Domain: €12/year
- Legal review: €500-1,000 (GDPR compliance)
- **Total:** €3,512-4,012

**Monthly Operating Costs:**
- Hosting (Vercel): €0 (free tier)
- Database (Supabase): €0 (free tier)
- Email (Resend): €0 (free tier, 3,000 emails/month)
- Monitoring (Sentry): €0 (free tier)
- **Total:** €0/month

### SaaS Phase (Month 4+)

**Monthly Operating Costs:**
- Hosting (Vercel Pro): €20/month
- Database (Supabase Pro): €25/month
- Email (Resend): €20/month (50k emails)
- Domain: €1/month (amortized)
- **Total:** €66/month

**Break-even:** 2 customers at €39/month ARPU

### Scaling Costs (1000+ users)

- Vercel: ~€200/month
- Supabase: ~€600/month
- Redis (Upstash): ~€50/month
- **Total:** ~€850/month

**Break-even:** 22 customers at €39/month ARPU

---

## 📋 File Structure Overview

```
torqr/
├── outputs/
│   ├── PROJECT-SUMMARY.md (this file)
│   ├── agent-01-business-model-canvas.md
│   ├── agent-01-mvp-scope-definition.md
│   ├── agent-02-technical-architecture.md
│   └── agent-04-gdpr-compliance-framework.md
├── context/
│   ├── projectidea.md (original requirements)
│   └── requirements.md (detailed specs)
├── agents/
│   ├── agent-01-business-strategy-agent.md
│   ├── agent-02-technical-architecture-agent.md
│   ├── agent-03-ux-design-agent.md
│   ├── agent-04-compliance-legal-agent.md
│   ├── agent-05-backend-development-agent.md
│   ├── agent-06-frontend-development-agent.md
│   └── agent-07-integration-automation-agent.md
├── project-config.json
├── project-analysis.json (38 requirements extracted)
├── agent-assignments.json (7 agents)
└── workflow.json (12 steps)
```

---

## 🎓 Key Learnings & Decisions

### Why This Tech Stack?

**Next.js:** Full-stack in one framework, excellent DX, Vercel-optimized
**TypeScript:** Type safety prevents bugs, excellent for large codebase
**Prisma:** Type-safe database access, automatic migrations
**Supabase:** Free PostgreSQL, EU data center (GDPR), built-in storage
**PWA:** Single codebase for web/iOS/Android, no app store approval needed
**Resend:** Developer-friendly email API, good deliverability

### Why Not X?

**Why not native app?** PWA faster to market, no app store delays, instant updates
**Why not Laravel/Django?** JavaScript ecosystem for full-stack, easier to find developers
**Why not MongoDB?** Relational data (customers → heaters), PostgreSQL more robust
**Why not SendGrid?** Resend more developer-friendly, better DX
**Why not Firebase?** Vendor lock-in concerns, Supabase more PostgreSQL-standard

### Critical Design Decisions

1. **Offline-First:** Essential for on-site usage without internet
2. **Mobile-First:** Max uses phone 80% of the time
3. **Single-Tenant MVP:** Multi-tenant architecture from day 1 (easier scaling later)
4. **Double Opt-In:** GDPR compliance is non-negotiable for German market
5. **Last-Write-Wins:** Simple conflict resolution sufficient for single-user MVP
6. **PWA over Native:** Faster MVP, can always build native later if needed
7. **Monolith over Microservices:** Simpler architecture, easier to develop/deploy
8. **Free Tier Hosting:** Validate product before spending on infrastructure

---

## 🚦 Go/No-Go Decision Criteria

### After MVP (Month 3):

**✅ GO to Beta IF:**
- Max using app daily for 2+ months
- Max satisfaction ≥8/10
- Admin time reduced ≥50%
- Zero critical bugs in last 2 weeks
- Max actively recommending to ≥3 colleagues
- ≥5 Heizungsbauer interested in beta

**❌ NO-GO IF:**
- Max stopped using app
- Max satisfaction <7/10
- No measurable time savings
- No referral interest from colleagues

**If NO-GO:**
- Conduct exit interview with Max
- Analyze usage data and pain points
- Decide: Pivot features OR shut down project

### After Beta (Month 6):

**✅ GO to SaaS Launch IF:**
- 5+ active beta users
- Average satisfaction ≥7.5/10
- ≥50% willing to pay €29-49/month
- <20% churn in first 3 months
- 3+ written testimonials

**❌ NO-GO IF:**
- <3 active users after 3 months
- Average satisfaction <7/10
- <30% willing to pay
- High churn (>30%)

**If NO-GO:**
- Remain MVP product for Max only
- Consider pivoting to different market
- Consider open-sourcing as learning project

---

## 📞 Next Steps & Contacts

### Immediate Actions (This Week)

1. **Max:** Review all documents, approve business model and timeline
2. **Developer:** Set up development environment
   - Install Node.js, npm, Git
   - Create Vercel account
   - Create Supabase account (EU region)
   - Create Resend account
   - Create Sentry account
3. **Legal:** Budget €500-1,000 for GDPR legal review
4. **Domain:** Purchase drehmoment.de or drehmoment.app

### Week 1 Kickoff Meeting

**Agenda:**
1. Review project summary (this document)
2. Confirm business model and equity split
3. Sign development agreement
4. Confirm Max's availability for training/feedback
5. Set up weekly check-in schedule
6. Developer starts Sprint 1 (project setup)

### Communication Plan

**During Development (Weeks 1-8):**
- Weekly 30-minute check-in (developer + Max)
- Ad-hoc questions via email/WhatsApp
- Demo after each sprint (weekly)

**Post-Launch (Weeks 9-12):**
- Daily check-in first week (5-10 min)
- Weekly call ongoing (30 min)
- Monthly detailed feedback session (1 hour)

---

## 📖 How to Use This Documentation

### For Max (Business Owner):

1. **Start here:** Read PROJECT-SUMMARY.md (this file)
2. **Business understanding:** Read agent-01-business-model-canvas.md
3. **Legal requirements:** Skim agent-04-gdpr-compliance-framework.md (focus on Section 11 "Compliance Checklist")
4. **Features to expect:** Read agent-01-mvp-scope-definition.md (focus on Section 2.1 "MUST HAVE features")

**Don't worry about:** Technical Architecture (that's for developers)

### For Developer:

1. **Start here:** Read PROJECT-SUMMARY.md (this file)
2. **Technical specs:** Read agent-02-technical-architecture.md IN FULL
3. **Feature requirements:** Read agent-01-mvp-scope-definition.md (Section 2 and Section 5)
4. **Legal requirements:** Read agent-04-gdpr-compliance-framework.md (focus on implementation requirements)
5. **Database:** Copy Prisma schema from agent-02-technical-architecture.md Section 3.1

**Implementation order:**
1. Sprint 1: Follow technical architecture Section 2 (tech stack setup)
2. Sprint 2-7: Follow MVP scope document Section 3 (sprint plan)
3. Throughout: Reference technical architecture for API design, offline sync, email automation

### For Investors/Stakeholders:

1. **Start here:** Read PROJECT-SUMMARY.md (this file)
2. **Business case:** Read agent-01-business-model-canvas.md Sections 1-2 (Business Model, Competitive Analysis)
3. **Market opportunity:** Read agent-01-business-model-canvas.md Section 6 (Success Metrics)
4. **Risks:** Read agent-01-business-model-canvas.md Section 5 (Risk Analysis)

**Key numbers:**
- TAM: 15,000 Ein-Mann-Betriebe in Germany
- ARPU: €39/month
- Year 1 Target: 50-100 customers = €23k-47k ARR
- LTV:CAC: 26:1 potential
- Gross Margin: 95%+

---

## 🎉 Conclusion

Torqr is a **well-defined, thoroughly planned, technically feasible project** ready for development. With:

✅ **Clear business model** (Bootstrap MVP → SaaS expansion)
✅ **Validated problem** (Max's €20k/year opportunity cost)
✅ **Complete technical specifications** (database schema, API design, architecture)
✅ **GDPR compliance roadmap** (legal requirements documented)
✅ **Realistic timeline** (8-10 weeks to MVP)
✅ **Manageable budget** (€3k development + €0/month hosting)
✅ **Success metrics** (time savings, satisfaction, adoption)

**The project is ready to move from planning to development.**

---

## 📄 Document Versions

- **v1.0** - December 11, 2024 - Initial comprehensive planning complete
- All agent outputs generated and reviewed
- Ready for development kickoff

---

**Project Status:** 🟢 GREEN - All planning complete, ready for implementation
**Confidence Level:** 🟢 HIGH - Thorough analysis, validated requirements, proven tech stack
**Risk Level:** 🟡 MEDIUM - Normal startup risks, well-mitigated
**Recommendation:** ✅ **PROCEED TO DEVELOPMENT**

---

*Generated by Jarvis Multi-Agent Orchestration System*
*Date: December 11, 2024*
*Total Planning Time: Comprehensive analysis and specification*
*Documentation Pages: 100+ pages across 4 major documents*
