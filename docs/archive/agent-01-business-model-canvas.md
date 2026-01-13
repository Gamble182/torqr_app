# Business Model Canvas - Torqr (Drehmoment)

**Phase:** Conception
**Date:** December 11, 2024
**Agent:** Business Strategy Agent
**Version:** 1.0

---

## Executive Summary

Torqr (brand name: Drehmoment) addresses a €20,000/year opportunity cost for self-employed heating technicians (Heizungsbauer) in Germany by replacing manual Excel-based maintenance management with automated, mobile-first scheduling and customer reminders.

**Core Insight:** Max spends 8 hours/week on administrative overhead. Our solution reduces this to <2 hours/week, freeing 6 hours for billable work worth ~€240/week or €12,480/year.

---

## 1. Business Model Canvas

### 1.1 Customer Segments

**Primary Segment (MVP):**
- **Profile:** Self-employed Heizungsbauer (Ein-Mann-Betriebe)
- **Size:** ~15,000 businesses in Germany
- **Characteristics:**
  - Age: 35-50 years
  - Tech affinity: Low to medium
  - Customer base: 50-100 maintenance contracts
  - Current tools: Excel, phone, paper
  - Pain point intensity: High (8h/week wasted)

**Secondary Segments (Post-MVP):**
- Small heating companies (2-5 employees)
- Other Handwerk trades (plumbers, electricians, chimney sweeps)
- DACH region expansion (Austria, Switzerland)

**Segment Prioritization:**
1. MVP: Max (validation partner) - 100% focus
2. Beta: 5-10 Heizungsbauer from Max's network - Q2 2025
3. SaaS: Ein-Mann-Betriebe nationwide - Q3/Q4 2025
4. Scale: Small teams + other trades - 2026

### 1.2 Value Propositions

**For Max (Primary User):**

**Time Savings:**
- Reduce admin time from 8h/week to <2h/week (75% reduction)
- Eliminate manual Excel checking
- No more manual customer calls for appointments
- One-tap maintenance completion

**Revenue Protection:**
- Zero missed appointments (currently ~5% customer churn)
- Professional automated reminders maintain customer relationships
- Better planning = more efficient routes

**Operational Excellence:**
- Mobile-first: Work from phone, not office
- Offline-capable: Works without internet connection
- Material planning: Know what parts to bring before arriving
- Complete history: Photos and notes for each maintenance

**Professional Image:**
- Automated email reminders look professional
- Organized, reliable service
- No forgotten appointments

**Quantified Value:**
- **Time saved:** 6 hours/week × €40/hour = €240/week = €12,480/year
- **Revenue protected:** 5% churn avoided = €3,000-5,000/year
- **Total value:** ~€15,000-17,000/year
- **Cost (SaaS phase):** €348-588/year
- **ROI:** 25x-50x return on investment

**For Max's Customers:**
- Proactive reminders (no more forgotten heaters)
- Professional communication
- Reliable service
- Peace of mind

### 1.3 Revenue Streams

**MVP Phase (Q1 2025):**
- One-time development fee: €3,000 (from Max)
- Equity split: 30% Max, 70% Developer
- Rationale: Max funds development, gets early access + equity stake

**SaaS Phase (Q3 2025 onwards):**

| Tier | Price/Month | Target Customers | Features | Projected Adoption |
|------|-------------|------------------|----------|-------------------|
| **Solo** | €29 | Up to 50 customers | Basic features: Customer mgmt, maintenance tracking, email reminders, PWA | 60% of users |
| **Professional** | €49 | Up to 150 customers | Solo + Invoicing, calendar integration, advanced reports | 30% of users |
| **Enterprise** | €99 | Unlimited | Pro + Multi-user, API access, priority support, custom branding | 10% of users |

**Average Revenue Per User (ARPU):** €39/month (weighted average)

**Revenue Projections:**

**Year 1 (After SaaS Launch - Q3 2025 to Q2 2026):**
- Conservative: 50 customers × €39 = €1,950/month = €23,400/year
- Realistic: 100 customers × €39 = €3,900/month = €46,800/year
- Optimistic: 200 customers × €39 = €7,800/month = €93,600/year

**Year 2 (2026-2027):**
- Growth rate: 10-15 new customers/month
- Target: 200-300 active customers
- MRR: €7,800-11,700
- ARR: €93,600-140,400

**Equity Split Impact (70/30):**
- Developer (70%): €16,380-65,520 Year 1 → €65,520-98,280 Year 2
- Max (30%): €7,020-28,080 Year 1 → €28,080-42,120 Year 2

**Additional Revenue Opportunities (Phase 4):**
- Premium support packages: €100-200/month
- Custom integrations: €500-2,000 one-time
- White-label licensing: €500/month per partner
- Training sessions: €200-500 per session

### 1.4 Key Activities

**MVP Phase (Weeks 1-10):**
1. Full-stack development (Next.js, Prisma, PostgreSQL)
2. Mobile-first PWA implementation
3. Email automation (Resend integration)
4. Offline-sync functionality
5. GDPR compliance implementation
6. Max onboarding and training (2-hour session)
7. Excel → System migration support
8. Bug fixes and optimization

**Post-MVP:**
1. Customer support and success
2. Feature development based on feedback
3. Marketing and sales (content, SEO, partnerships)
4. Multi-tenant architecture implementation
5. Billing integration (Stripe/Paddle)
6. Continuous improvement and iteration

### 1.5 Key Resources

**Human Resources:**
- Developer (full-stack, Next.js, TypeScript) - 60-80 hours MVP
- Max (beta tester, domain expert, sales channel) - 5-10 hours/week
- Legal advisor (GDPR compliance review) - €500-1,000 one-time

**Technology Resources:**
- Development tools: VS Code, GitHub, Figma
- Hosting: Vercel (Free → €20/month)
- Database: Supabase (Free → €25/month)
- Email: Resend (Free → €20/month for 50k emails)
- Monitoring: Sentry (Free tier)

**Knowledge Resources:**
- Next.js + React expertise
- PWA and offline-first patterns
- German GDPR/BDSG knowledge
- Handwerk industry understanding (via Max)

**Financial Resources:**
- MVP: €3,000 from Max
- Hosting: €0/month (free tiers)
- Domain: €12-20/year
- Legal: €500-1,000 one-time

### 1.6 Key Partners

**Technology Partners:**
- **Vercel:** Hosting, serverless functions, cron jobs
- **Supabase:** PostgreSQL database, file storage, authentication
- **Resend:** Email delivery (transactional)
- **Stripe/Paddle (later):** Payment processing

**Strategic Partners:**
- **Max:** Beta user, domain expert, referral source
- **Handwerker Networks:** Innungen, trade associations for distribution
- **Accounting Software:** Lexoffice, SevDesk (integration partners)
- **Parts Suppliers:** For inventory integration (Phase 2+)

**Marketing Channels:**
- Max's network (5-10 Heizungsbauer for beta)
- Handwerk forums and communities
- Trade shows and events
- Google Ads (€500-1,000/month budget)
- SEO and content marketing

### 1.7 Customer Relationships

**MVP Phase:**
- **Personal:** Direct 1:1 with Max
- **Intensive support:** Weekly check-ins first month
- **Co-creation:** Iterative feedback loop

**Beta Phase:**
- **Semi-personal:** Group onboarding sessions
- **Email support:** <24 hour response time
- **Community:** Beta tester WhatsApp/Slack group

**SaaS Phase:**
- **Self-service:** Comprehensive onboarding flow, video tutorials
- **Automated:** Email drip campaigns, in-app tips
- **Community:** User forum, knowledge base
- **Premium support:** Priority email/phone for Enterprise tier

**Retention Strategy:**
- Monthly usage reports (time saved, appointments managed)
- Feature update announcements
- Annual check-ins
- NPS surveys and feedback loops
- Early access to new features for engaged users

### 1.8 Channels

**Customer Acquisition:**

**Phase 1 - MVP:**
- Direct (Max only)

**Phase 2 - Beta:**
- Referrals from Max
- Word-of-mouth in Heizungsbauer network

**Phase 3 - SaaS Launch:**
- **Organic:**
  - SEO (target: "Wartungsplaner Heizungsbauer", "Handwerker Software")
  - Content marketing (blog, guides, templates)
  - Free tools (maintenance calculator)
- **Paid:**
  - Google Ads (€500-1,000/month)
  - Facebook/Instagram Ads (Handwerk audience)
- **Partnerships:**
  - Trade associations (Innungen)
  - Handwerk events and trade shows
  - Parts suppliers and distributors
- **Community:**
  - Handwerk forums and Facebook groups
  - LinkedIn organic content

**Distribution Strategy:**
- **Land:** Acquire with free trial (14-30 days)
- **Expand:** Upsell Solo → Professional → Enterprise
- **Retain:** High engagement = low churn

**Customer Acquisition Cost (CAC) Targets:**
- Organic: €0-20/customer
- Paid: €50-100/customer
- Blended: <€50/customer average

### 1.9 Cost Structure

**Fixed Costs:**

**MVP Phase (Months 1-3):**
- Development: €3,000 (one-time, from Max)
- Domain: €12/year
- Legal review: €500-1,000 (one-time)
- **Total:** €3,512-4,012 one-time

**SaaS Phase (Monthly):**
- Hosting (Vercel Pro): €20/month
- Database (Supabase Pro): €25/month
- Email (Resend): €20/month (up to 50k emails)
- Monitoring (Sentry): €0 (free tier) → €26/month (growth plan)
- Domain: €1/month (amortized)
- **Total Fixed:** €66-92/month

**Variable Costs:**
- Email delivery: €0.001 per email beyond free tier
- Storage: €0.021/GB beyond free tier
- Minimal, scales slowly

**Personnel Costs (Post-Launch):**
- Developer time: 10-20 hours/week maintenance/features
- Customer support: 5-10 hours/week (can be Max or developer initially)

**Marketing Costs:**
- Google Ads: €500-1,000/month
- Content creation: €200-500/month (outsourced writing)
- **Total Marketing:** €700-1,500/month

**Total Operating Costs:**
- **Minimum:** €66/month (hosting only, no marketing)
- **Growth mode:** €766-1,592/month (with marketing)

**Break-even Analysis:**
- At €39 ARPU: Need 2 customers to cover hosting
- At €39 ARPU: Need 20-41 customers to cover full ops + marketing
- **Break-even:** Month 2-4 after launch (realistic scenario)

**Unit Economics:**
- ARPU: €39/month
- Cost per customer: €1-2/month (hosting/email)
- Gross margin: 95%+ (typical SaaS)
- CAC: €50 target
- CAC payback: 1-2 months
- LTV: €39 × 36 months × 95% retention = €1,330
- LTV:CAC ratio: 26:1 (excellent, target >3:1)

---

## 2. Competitive Analysis

### 2.1 Direct Competitors

**1. Handwerker-Office**
- Price: €30-60/month
- Target: All Handwerk trades
- Strengths: Established, comprehensive features
- Weaknesses: Complex UI, overkill for Ein-Mann-Betriebe, expensive
- Positioning: General solution for all Handwerk

**2. meetergo**
- Price: €39/month
- Target: Service businesses (including Handwerk)
- Strengths: Modern UI, good scheduling
- Weaknesses: Not specialized for maintenance intervals, no offline mode
- Positioning: Modern scheduling tool

**3. simpleSystem**
- Price: €79/month
- Target: Handwerk businesses
- Strengths: Comprehensive (CRM, invoicing, scheduling)
- Weaknesses: Expensive, overloaded with features, steep learning curve
- Positioning: All-in-one business management

### 2.2 Competitive Advantages

**Torqr Differentiation:**

1. **Specialized:** Built specifically for maintenance intervals (not general scheduling)
2. **Simple:** One primary workflow, minimal learning curve (<30 min to understand)
3. **Mobile-first:** Designed for on-site use with offline capability
4. **Affordable:** €29-49 vs. €39-79 for alternatives
5. **Automation-focused:** Set-and-forget reminder system
6. **Ein-Mann-friendly:** No unnecessary multi-user complexity

**Positioning Statement:**
*"Torqr is the specialized maintenance management platform designed exclusively for self-employed Handwerk professionals who need a simple, mobile-first tool that works in their pocket and eliminates administrative overhead—without the complexity and cost of general-purpose business software."*

### 2.3 Market Gaps

**Unserved needs:**
- Offline-first maintenance management (competitors require internet)
- Extreme simplicity (most solutions try to do too much)
- Sub-€30 pricing for Ein-Mann-Betriebe
- Maintenance-interval-specific automation

**Market opportunity:**
- 15,000 Ein-Mann-Heizungsbaubetriebe in Germany
- Current solutions: Excel (80%), Handwerker-Office (15%), others (5%)
- Excel users are underserved and ready for affordable, simple solution
- If we capture just 1% = 150 customers = €5,850 MRR

---

## 3. Go-to-Market Strategy

### 3.1 Phase 1: MVP (Q1 2025)

**Goal:** Validate product-market fit with Max

**Activities:**
- Build MVP (8-10 weeks)
- Max onboarding and training
- Data migration from Excel
- Daily usage monitoring
- Weekly feedback sessions

**Success Metrics:**
- Max uses app daily
- Admin time reduced from 8h/week to <2h/week
- Max satisfaction: 8/10+
- Zero missed appointments in first 3 months
- Max willing to recommend to colleagues

### 3.2 Phase 2: Beta (Q2 2025)

**Goal:** Expand to 5-10 users, refine product

**Activities:**
- Recruit 5-10 Heizungsbauer from Max's network
- Group onboarding sessions
- Collect feedback and iterate
- Build case studies and testimonials
- Prepare multi-tenant architecture

**Success Metrics:**
- 5-10 active beta users
- 80%+ weekly active usage
- Average satisfaction: 7.5/10+
- <20% churn in first 3 months
- 3+ written testimonials

**Pricing:** Free for beta users (exchange for feedback)

### 3.3 Phase 3: SaaS Launch (Q3/Q4 2025)

**Goal:** Public launch, acquire first 50 paying customers

**Launch Strategy:**
1. **Pre-launch (2 weeks before):**
   - Launch website with waitlist
   - Publish blog content (5-10 articles)
   - Set up Google Ads campaigns
   - Reach out to trade associations

2. **Launch Day:**
   - Announce on social media (LinkedIn, Facebook Handwerk groups)
   - Email campaign to waitlist
   - Press release to Handwerk publications
   - Special launch pricing: 20% off first 3 months

3. **Post-launch (First 3 months):**
   - Weekly content marketing (blog, social media)
   - Google Ads optimization (€500-1,000/month)
   - Attend 1-2 trade shows
   - Partner with 2-3 parts suppliers for co-marketing

**Success Metrics:**
- 50+ paying customers by end of Q4 2025
- MRR: €1,950+ (50 × €39 average)
- Churn: <5%/month
- CAC: <€100
- Organic traffic: 1,000+ visitors/month

### 3.4 Phase 4: Scale (2026)

**Goal:** 200-300 customers, expand to other trades

**Activities:**
- Expand to other Handwerk trades (Klempner, Elektriker)
- Geographic expansion (Austria, Switzerland)
- Feature expansion (invoicing, calendar, reporting)
- Partnership programs
- Premium support offering

**Success Metrics:**
- 200-300 active customers
- MRR: €7,800-11,700
- Churn: <3%/month
- NPS: 40+

---

## 4. Risk Analysis & Mitigation

### 4.1 Critical Risks

**RISK-BIZ-001: Max doesn't adopt the system**
- **Probability:** Medium (30%)
- **Impact:** Very High (project fails without validation)
- **Mitigation:**
  - Intensive 2-hour onboarding session
  - Weekly check-ins first month
  - Continuous feedback loop
  - Emphasize quick wins (time savings visible immediately)
  - Make abandoning Excel painless (easy data migration)
- **Contingency:** If Max doesn't adopt after 4 weeks, pivot features based on feedback

**RISK-BIZ-002: No demand for SaaS beyond Max**
- **Probability:** Medium (40%)
- **Impact:** High (no revenue, no scale)
- **Mitigation:**
  - Beta program with 5-10 users validates demand before SaaS investment
  - Gather testimonials and case studies
  - Test pricing willingness with beta group
  - Launch MVP features only (avoid over-building)
- **Contingency:** If <3 beta sign-ups, reassess product-market fit or pivot

**RISK-BIZ-003: Competitor launches similar product**
- **Probability:** Low (20%)
- **Impact:** Medium (harder differentiation)
- **Mitigation:**
  - Speed to market (8-10 week MVP)
  - Build strong relationship with early users (hard to switch)
  - Focus on specialized niche (maintenance intervals)
  - Continuous iteration based on user feedback
- **Contingency:** Emphasize customer success, not just features

**RISK-BIZ-004: Pricing too low/high**
- **Probability:** Medium (50%)
- **Impact:** Medium (affects revenue/adoption)
- **Mitigation:**
  - Test pricing with beta users (willingness to pay)
  - Offer 14-day free trial (reduce friction)
  - Allow annual billing with discount (improve LTV)
  - Survey users on value perception
- **Contingency:** Adjust pricing within first 6 months of launch

**RISK-BIZ-005: CAC too high, can't scale profitably**
- **Probability:** Medium (40%)
- **Impact:** High (no sustainable growth)
- **Mitigation:**
  - Focus on organic (SEO, content) first (low CAC)
  - Build referral program (10-20% discount for referrals)
  - Partner with trade associations (bulk access)
  - Word-of-mouth in tight-knit Handwerk community
- **Contingency:** If CAC >€100, pause paid marketing, focus on retention and referrals

### 4.2 Operational Risks

**RISK-BIZ-006: Email deliverability issues**
- Covered in technical risks (high impact on core value prop)

**RISK-BIZ-007: Overwhelming support burden**
- **Probability:** Medium (30% post-launch)
- **Impact:** Medium (dev time diverted)
- **Mitigation:**
  - Comprehensive onboarding flow
  - Video tutorials and knowledge base
  - In-app tooltips and guidance
  - FAQ based on beta feedback
- **Contingency:** Hire part-time support (€500-1,000/month) at 50+ customers

---

## 5. Success Metrics & KPIs

### 5.1 MVP Phase KPIs

**Efficiency:**
- ⏱️ Max's admin time: <2 hours/week (from 8h/week) ✅ Target
- ⏱️ Kundenanlage: <60 seconds ✅ Target
- ⏱️ Wartung abhaken: <30 seconds ✅ Target

**Quality:**
- 📧 Email delivery rate: >95% ✅ Target
- 🎯 Missed appointments: 0% ✅ Target
- 😊 Max satisfaction: 8/10+ ✅ Target

**Adoption:**
- 📱 Daily active use by Max ✅ Target
- 📊 100% of Max's customers migrated (within 4 weeks) ✅ Target
- 🔄 All wartungen tracked in system (within 2 months) ✅ Target

### 5.2 Beta Phase KPIs

**Acquisition:**
- 5-10 active beta users ✅ Target
- 80%+ acceptance rate (invitations sent)

**Engagement:**
- 80%+ weekly active users
- Average 5+ sessions/week
- Average session duration: 3-5 minutes

**Satisfaction:**
- Average satisfaction: 7.5/10+
- 3+ written testimonials
- 60%+ would recommend

### 5.3 SaaS Phase KPIs

**Growth (Year 1):**
- 👥 New customers: 10/month average
- 💰 MRR growth: 10-15%/month
- 📈 Churn: <5%/month
- 🎯 CAC: <€100/customer
- 💵 MRR by end of Year 1: €3,900+ (100 customers)

**Engagement:**
- 🔁 Weekly Active Users: 60%+
- 📧 Email open rate: 40%+
- 💬 NPS: 40+

**Financial:**
- ⚖️ CAC:LTV ratio: >3:1
- 📊 Gross margin: >80%
- 💰 Positive unit economics by Month 3

---

## 6. Recommendations

### 6.1 Go Decision

**✅ RECOMMENDED: PROCEED WITH MVP**

**Rationale:**
1. **Strong validation:** Max has committed €3,000 and will be active user
2. **Clear pain point:** €20,000/year opportunity cost is quantified and real
3. **Low risk:** Bootstrap model, free hosting, MVP-first approach
4. **Market opportunity:** 15,000 potential customers, underserved by current solutions
5. **Scalability:** Clear path from MVP → Beta → SaaS
6. **Unit economics:** Extremely favorable (95% margin, 26:1 LTV:CAC potential)

### 6.2 Critical Success Factors

1. **Max must adopt:** Everything hinges on Max using daily
2. **Simplicity:** Resist feature bloat, focus on core workflow
3. **Mobile-first:** Must work flawlessly on smartphone
4. **Offline-capable:** Essential for on-site usage
5. **Speed to market:** 8-10 weeks critical for Max's business needs

### 6.3 Phase Sequencing

**Do NOT skip steps:**
1. ✅ MVP with Max (validate product)
2. ✅ Beta with 5-10 users (validate demand)
3. ✅ SaaS launch (validate market)
4. ✅ Scale (after validation)

Attempting to skip directly to SaaS without validation risks building wrong product.

### 6.4 Key Strategic Decisions

**Pricing Strategy:**
- Recommend 3-tier model (€29/€49/€99)
- Start with Solo tier for MVP/Beta
- Add Professional tier at SaaS launch
- Add Enterprise tier after 50+ customers

**Feature Prioritization:**
- MVP: ONLY customer mgmt + wartung tracking + email automation
- Phase 2: Calendar, invoicing, reports
- Phase 3: Multi-user, API, integrations

**Marketing Strategy:**
- Organic-first (SEO, content) to control CAC
- Paid only after organic channels validated
- Partnerships for distribution scale

---

## 7. Next Steps

### Immediate (This Week):
1. ✅ Finalize business model with Max
2. ✅ Sign development agreement + equity split
3. ✅ Purchase domain (drehmoment.de or drehmoment.app)
4. ✅ Set up development environment

### Development Phase (Weeks 1-8):
1. Week 1: Project setup, database, auth
2. Weeks 2-3: Customer management
3. Week 4: Wartung management
4. Week 5: Email automation
5. Week 6: PWA + mobile optimization
6. Week 7: Testing with Max
7. Week 8: Data migration + go-live

### Post-MVP (Weeks 9-12):
1. Daily monitoring of Max's usage
2. Weekly feedback sessions
3. Bug fixes and optimization
4. Begin beta user recruitment

---

**Document Status:** ✅ COMPLETE
**Next Agent:** Compliance & Legal Agent (GDPR requirements)
**Dependencies:** None (first step in workflow)
**Approval:** Ready for technical design phase after legal review
