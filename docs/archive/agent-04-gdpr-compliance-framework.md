# GDPR Compliance Framework - Torqr

**Phase:** Conception
**Date:** December 11, 2024
**Agent:** Compliance & Legal Agent
**Version:** 1.0

---

## Executive Summary

Torqr processes personal data of Max's customers (homeowners/property managers) for maintenance scheduling purposes. Under GDPR, Max is the **Verantwortlicher** (Data Controller) and Torqr platform is the **Auftragsverarbeiter** (Data Processor).

**Compliance Status:** This document establishes the framework for GDPR-compliant operations. Full compliance required before processing real customer data.

**Critical Requirements:**
- ✅ Double opt-in for email marketing
- ✅ Auftragsverarbeitungsvertrag (AV-Vertrag) between Max and platform
- ✅ Technical and organizational measures (TOMs)
- ✅ Data subject rights implementation
- ✅ Privacy-by-design architecture

---

## 1. Legal Framework

### 1.1 Applicable Laws

**Primary Legislation:**
- **GDPR (Datenschutz-Grundverordnung)** - EU Regulation 2016/679
- **BDSG (Bundesdatenschutzgesetz)** - German Federal Data Protection Act
- **UWG (Gesetz gegen den unlauteren Wettbewerb)** - German Unfair Competition Act (email marketing)
- **TMG (Telemediengesetz)** - German Telemedia Act

**Key Principles (Art. 5 GDPR):**
1. **Lawfulness, fairness, transparency** - Clear communication about data processing
2. **Purpose limitation** - Data only used for stated purposes (maintenance scheduling)
3. **Data minimization** - Only collect necessary data
4. **Accuracy** - Keep data up-to-date
5. **Storage limitation** - Delete data when no longer needed
6. **Integrity and confidentiality** - Secure data processing
7. **Accountability** - Demonstrate compliance

### 1.2 Roles and Responsibilities

**Max (Verantwortlicher / Data Controller):**
- Determines purposes and means of processing
- Responsible for compliance with GDPR
- Must inform customers about data processing
- Must respond to data subject rights requests
- Liable for violations (fines up to €20 million or 4% revenue)

**Torqr Platform (Auftragsverarbeiter / Data Processor):**
- Processes data only on Max's instructions
- Implements technical and organizational measures
- Assists Max with data subject rights
- Reports data breaches to Max
- Subject to Art. 28 GDPR obligations

**Data Subjects:**
- Max's customers (homeowners, property managers)
- Have rights under GDPR (access, deletion, portability, etc.)

### 1.3 Legal Bases for Processing

**Art. 6(1) GDPR - Lawfulness of Processing:**

| Data Processing Activity | Legal Basis | Rationale |
|--------------------------|-------------|-----------|
| Customer contact data (name, address, phone) | Art. 6(1)(b) - Contract | Necessary for performing maintenance contract |
| Email address for reminders | Art. 6(1)(a) - Consent | Marketing communication requires explicit consent |
| Maintenance history | Art. 6(1)(b) - Contract | Necessary for contract performance and record-keeping |
| Photos of heating systems | Art. 6(1)(a) - Consent OR Art. 6(1)(b) - Contract | Documentation for maintenance work |
| Max's data (name, email, phone) | Art. 6(1)(b) - Contract | B2B relationship with platform |

**Important:** Email reminders = marketing communication under German law (UWG) → requires **double opt-in**.

---

## 2. Data Processing Inventory

### 2.1 Personal Data Collected

**Category: Customer Master Data**
- Name (Vorname, Nachname)
- Address (Straße, PLZ, Ort)
- Phone number
- Email address (optional)
- Notes (free text field)

**Category: Heating System Data**
- Heating model/manufacturer
- Serial number
- Installation date
- Maintenance interval
- Required parts list

**Category: Maintenance Records**
- Date of maintenance
- Technician notes
- Photos (heating system, work performed)
- Next maintenance date

**Category: Communication Logs**
- Email sent (date, type, recipient)
- Email opened (boolean)
- Email clicked (boolean)
- Unsubscribe status

**Category: Max's Business Data**
- Business name
- Max's name, email, phone
- Login credentials (hashed password)

**Special Categories (Art. 9 GDPR):** NONE
- No health data, racial/ethnic origin, political opinions, etc.

**Children's Data (Art. 8 GDPR):** NOT APPLICABLE
- Service targets business customers (property owners), not children

### 2.2 Data Sources

- Direct input by Max (customer data entry)
- Direct input by Max's customers (if future self-service portal)
- Photo capture via smartphone camera
- Automated calculation (next maintenance dates)

### 2.3 Data Recipients

**Internal:**
- Max (full access to his customers' data)
- Future: Max's employees (if multi-user)

**External (Sub-processors):**
- **Supabase** (PostgreSQL database, file storage) - EU data center
- **Resend** (email delivery) - EU/US, investigate data location
- **Vercel** (hosting, API) - EU data center preferred
- **Sentry** (error monitoring) - investigate data location

**Third Countries:** Avoid transfers outside EU/EEA if possible

### 2.4 Retention Periods

| Data Category | Retention Period | Legal Basis | Deletion Trigger |
|---------------|------------------|-------------|------------------|
| Customer master data | Duration of business relationship + 3 years | Legal obligation (warranty claims) | Customer relationship ends + 3 years |
| Maintenance history | 10 years | Legal obligation (product liability, warranty) | After 10 years OR customer requests deletion (balance interests) |
| Email logs | 6 months | Legitimate interest (deliverability tracking) | After 6 months automatic deletion |
| Photos | Duration of business relationship + 3 years | Contract performance | Customer requests deletion OR 3 years after relationship ends |
| Max's data | Duration of platform contract + 1 year | Contract + legal obligations | After contract ends + 1 year |

**Note:** Maintenance records may be required for product liability claims (BGB §195, 199 - 3-year limitation period from knowledge, 10-year absolute limit). Recommend 10-year retention for maintenance records unless customer objects.

---

## 3. Consent Management

### 3.1 Email Marketing Consent (Double Opt-In)

**Requirement:** German law (UWG §7) requires **double opt-in** for marketing emails.

**Maintenance reminders = marketing** because:
- Not strictly necessary for contract performance
- Intended to encourage future business
- Contains business contact information

**Double Opt-In Process:**

1. **Initial Opt-In (Checkbox):**
   - Max enters customer data
   - Checkbox: "Customer möchte Wartungserinnerungen per Email erhalten"
   - Pre-checked checkboxes = NOT valid consent
   - Clear link to privacy policy

2. **Confirmation Email:**
   - Sent to customer immediately
   - Subject: "Bitte bestätigen Sie Ihre Email-Adresse"
   - Contains unique confirmation link
   - Expires after 48 hours
   - Logs timestamp and IP address (evidence)

3. **Confirmed Opt-In:**
   - Customer clicks confirmation link
   - Status changed to "confirmed" in database
   - Confirmation page: "Email-Adresse bestätigt. Sie erhalten ab jetzt Wartungserinnerungen."
   - Log confirmation timestamp

**Consent Record (Art. 7(1) GDPR):**
Must document:
- Who consented (email address)
- When consented (timestamp)
- What they consented to (exact wording)
- How they consented (double opt-in process)
- IP address (optional, but recommended for proof)

**Consent Wording Example:**
```
☐ Ich möchte rechtzeitig per Email an anstehende Wartungstermine meiner Heizung
  erinnert werden. Diese Einwilligung kann ich jederzeit über den Abmelde-Link
  in jeder Email oder durch Nachricht an [Max's Email] widerrufen.

Weitere Informationen zum Datenschutz finden Sie in unserer
Datenschutzerklärung: [Link]
```

### 3.2 Photo Consent

**Options:**

**Option A: Implied Consent (Contract Performance)**
- Photos are part of normal maintenance documentation
- Customer aware that technician takes photos
- Covered under Art. 6(1)(b) - Contract
- **Recommended for MVP** (simpler)

**Option B: Explicit Consent**
- Separate checkbox: "Ich bin damit einverstanden, dass Fotos meiner Heizung zur Dokumentation der Wartung angefertigt werden."
- More conservative approach
- Recommended if photos include sensitive areas (e.g., inside living spaces)

**Recommendation for MVP:** Option A (implied), but add note in Datenschutzerklärung explaining photo documentation practice.

### 3.3 Consent Withdrawal

**Right to Withdraw (Art. 7(3) GDPR):**
- Must be as easy to withdraw as to give consent
- Withdrawal does not affect lawfulness of processing before withdrawal

**Implementation:**
- **Email unsubscribe link** in every automated email
- One-click unsubscribe (no login required)
- Confirmation page: "Sie wurden abgemeldet und erhalten keine weiteren Erinnerungen."
- Log unsubscribe timestamp
- Customer can still be contacted by phone (consent only for email)

---

## 4. Technical and Organizational Measures (TOMs)

### 4.1 Access Control

**User Authentication:**
- Max logs in with email + password
- Password requirements: min. 12 characters, complexity rules
- Password hashed with bcrypt (cost factor ≥12)
- Session management with JWT tokens
- Session timeout after 7 days inactivity
- Password reset via email link (expires after 24 hours)

**Authorization:**
- Max can only access HIS customers' data (tenant isolation)
- Future: Role-based access (admin, employee, read-only)

**Database Access:**
- No direct database access for Max
- All access via API with authentication
- Developer access logged and limited

### 4.2 Encryption

**In Transit:**
- HTTPS mandatory (TLS 1.2+)
- All API calls encrypted
- Email delivery via TLS

**At Rest:**
- Database encrypted at rest (Supabase default)
- File storage encrypted (Supabase Storage default)
- Passwords hashed (bcrypt, never plain text)

### 4.3 Data Security Measures

**Application Level:**
- Input validation (prevent SQL injection, XSS)
- Rate limiting (prevent brute-force attacks)
- CSRF protection
- Security headers (CSP, X-Frame-Options, etc.)

**Infrastructure Level:**
- Automatic security updates (Vercel, Supabase)
- Firewall (Supabase database not publicly accessible)
- DDoS protection (Vercel)

**Monitoring:**
- Error logging (Sentry)
- Security event logging
- Failed login attempt tracking

### 4.4 Backup and Recovery

**Backups:**
- Automatic daily backups (Supabase)
- 30-day retention
- Point-in-time recovery possible
- Backups encrypted at rest
- Backup location: EU data center

**Recovery:**
- Recovery time objective (RTO): 4 hours
- Recovery point objective (RPO): 24 hours (daily backups)
- Tested recovery procedure (quarterly test)

### 4.5 Data Breach Response

**Detection:**
- Monitoring for unauthorized access
- Logging of all data exports
- Alerts for suspicious activity

**Response Procedure (Art. 33, 34 GDPR):**

**Within 72 hours of breach discovery:**
1. Assess severity and scope
2. Notify Max (Data Controller) immediately
3. Max must notify Datenschutzbehörde if breach likely to result in risk
4. Document breach (date, scope, consequences, remediation)

**If high risk to data subjects:**
- Max must notify affected customers directly
- Provide information about breach and protective measures

**Breach Categories:**
- **Confidentiality breach:** Unauthorized access (e.g., hacker attack)
- **Integrity breach:** Unauthorized modification (e.g., data corruption)
- **Availability breach:** Data loss (e.g., ransomware, deletion)

### 4.6 Sub-Processor Management

**Sub-processors (Art. 28(2), (4) GDPR):**

| Sub-processor | Service | Data Processed | Location | GDPR Compliant? |
|---------------|---------|----------------|----------|-----------------|
| Supabase | Database, Storage | All personal data | EU (Frankfurt or Ireland) | ✅ Yes (DPA available) |
| Resend | Email delivery | Email addresses, names | Investigate | ⚠️ Verify location & DPA |
| Vercel | Hosting, API | All data in transit | EU preferred | ⚠️ Verify EU data center |
| Sentry | Error monitoring | Error logs (may contain emails) | US/EU | ⚠️ Minimize personal data |

**Action Items:**
1. ✅ Supabase: Verify EU data center, obtain DPA
2. ⚠️ Resend: Confirm data location, obtain DPA, check EU routing
3. ⚠️ Vercel: Deploy to EU region, confirm data residency
4. ⚠️ Sentry: Configure to strip personal data from error logs OR obtain DPA

**Max must approve sub-processors** (include list in AV-Vertrag)

---

## 5. Data Subject Rights Implementation

### 5.1 Right of Access (Art. 15 GDPR)

**Customer Request:** "What data do you have about me?"

**Response Obligation:**
- Confirm whether processing personal data
- Provide copy of data (free of charge, first request)
- Additional copies: reasonable fee
- Format: Structured, commonly used, machine-readable (CSV, JSON)

**Implementation:**
- Max receives request (email, phone, letter)
- Max logs into platform → "Kundendaten exportieren" function
- System generates CSV export:
  - Customer master data
  - Heating systems
  - Maintenance history (dates, notes)
  - Photos (ZIP file)
  - Email logs
- Max sends export to customer within 1 month

**Response Time:** 1 month (extendable by 2 months if complex)

### 5.2 Right to Rectification (Art. 16 GDPR)

**Customer Request:** "My address is wrong, please correct it."

**Response Obligation:**
- Correct inaccurate data without undue delay
- Complete incomplete data

**Implementation:**
- Max updates data directly in platform
- Change logged (audit trail)
- Confirmation to customer

### 5.3 Right to Erasure / "Right to be Forgotten" (Art. 17 GDPR)

**Customer Request:** "Delete all my data."

**Response Obligation:**
- Delete data if one of these applies:
  1. Data no longer necessary for purpose
  2. Consent withdrawn (and no other legal basis)
  3. Data processed unlawfully
  4. Legal obligation to delete
  5. Customer objects and no overriding legitimate interests

**Exceptions (Art. 17(3) GDPR):**
- Legal obligation to keep data (e.g., tax records, warranty claims)
- Defense of legal claims

**Implementation:**
- Max receives deletion request
- Max assesses: Still legal obligation to keep data?
  - If YES (e.g., maintenance < 3 years ago): Inform customer of retention obligation
  - If NO: Delete customer and all associated data
- Platform "Kunde löschen" function:
  - Deletes customer record
  - Deletes associated heating systems
  - Deletes maintenance history
  - Deletes photos (files in storage)
  - Deletes email logs
  - CASCADE deletion ensures no orphaned data
- Log deletion action (who, when, which customer)
- Confirmation to customer

**Retention vs. Deletion:**
- **Warranty claims (BGB):** 2-5 years depending on defect type
- **Product liability (ProdHaftG):** 10 years from product placement
- **Recommendation:** Keep maintenance records 3 years after last service, allow deletion after if customer requests (unless ongoing warranty claim)

### 5.4 Right to Data Portability (Art. 20 GDPR)

**Customer Request:** "I want my data to transfer to another service provider."

**Response Obligation:**
- Provide data in structured, machine-readable format (CSV, JSON)
- Transmit directly to other controller if technically feasible

**Implementation:**
- Same as Right of Access
- CSV export includes all customer data
- Customer can import into other system

### 5.5 Right to Object (Art. 21 GDPR)

**Customer Request:** "I object to processing my data for maintenance reminders."

**Response Obligation:**
- If processing based on legitimate interest: Stop unless compelling legitimate grounds
- If processing for marketing: Always stop (no exceptions)

**Implementation:**
- Email unsubscribe = automated objection to email reminders
- Customer can still receive service (contract), just no automated emails
- Max contacts customer by phone instead

### 5.6 Right to Restrict Processing (Art. 18 GDPR)

**Rare, but possible:** Customer wants data kept but not actively processed (e.g., during dispute about accuracy)

**Implementation:**
- "Kunden-Status: Eingeschränkt" flag in database
- No automated emails sent
- Data not deleted but not actively used
- Max resolves issue with customer

---

## 6. Documentation Requirements

### 6.1 Verzeichnis von Verarbeitungstätigkeiten (VVT)
**Record of Processing Activities (Art. 30 GDPR)**

**Required for:** All controllers (Max) and processors (platform)

**Template for Max (Verantwortlicher):**

```
Verarbeitungstätigkeit: Wartungsverwaltung für Heizungsanlagen

Zwecke der Verarbeitung:
- Verwaltung von Kundenstammdaten
- Planung und Dokumentation von Wartungsterminen
- Erinnerung der Kunden an anstehende Wartungen
- Nachweisführung über durchgeführte Wartungsarbeiten

Kategorien betroffener Personen:
- Kunden (Hauseigentümer, Hausverwaltungen)

Kategorien personenbezogener Daten:
- Stammdaten (Name, Adresse, Telefon, Email)
- Vertragsdaten (Heizungsmodelle, Wartungsintervalle)
- Kommunikationsdaten (Email-Versand-Logs)
- Dokumentationsfotos

Kategorien von Empfängern:
- Auftragsverarbeiter: WartungsWerk GmbH (Plattformbetreiber)
- Unterauftragsverarbeiter: Supabase (Datenbank), Resend (Email), Vercel (Hosting)

Übermittlung an Drittländer: Nein (alle Verarbeitung in EU)

Löschfristen:
- Kundendaten: 3 Jahre nach Ende der Geschäftsbeziehung
- Wartungshistorie: 10 Jahre (Produkthaftung)
- Email-Logs: 6 Monate

Technische und organisatorische Maßnahmen (Verweis):
- Siehe Datenschutzerklärung Abschnitt "Datensicherheit"
- Siehe AV-Vertrag mit WartungsWerk GmbH
```

**Platform VVT:** Similar, but from processor perspective (processing on behalf of Max)

### 6.2 Auftragsverarbeitungsvertrag (AV-Vertrag)
**Data Processing Agreement (Art. 28 GDPR)**

**Parties:**
- Verantwortlicher: Max (Heizungsbau Wagner o.ä.)
- Auftragsverarbeiter: Torqr GmbH / Platform operator

**Must include (Art. 28(3) GDPR):**
- Subject matter and duration of processing
- Nature and purpose of processing
- Type of personal data
- Categories of data subjects
- Rights and obligations of controller (Max)
- Processor's obligations:
  - Process only on instructions
  - Ensure confidentiality
  - Implement TOMs
  - Use sub-processors only with approval
  - Assist with data subject rights
  - Assist with compliance
  - Delete or return data after contract ends
  - Provide information for audits

**Template:** See separate AV-Vertrag template document

### 6.3 Datenschutzerklärung (Privacy Policy)

**Required (Art. 13, 14 GDPR):** Transparent information about data processing

**Must include:**
- Identity of controller (Max)
- Contact details of controller
- Data Protection Officer (if applicable - likely not required for Ein-Mann-Betrieb)
- Purposes and legal bases
- Recipients of data
- Retention periods
- Data subject rights (how to exercise)
- Right to lodge complaint with Datenschutzbehörde
- Information about cookies (if any)

**Template:** See separate Datenschutzerklärung template document

**Where to display:**
- Prominent link in customer-facing emails
- Link during email opt-in
- On platform website (if public-facing)

### 6.4 Impressum (Legal Notice)

**Required (§5 TMG):** For all German commercial websites

**Must include:**
- Name and address of business owner (Max)
- Contact details (phone, email)
- Business registration details (Handwerkskammer)
- VAT ID (if applicable)
- Professional chamber (Handwerkskammer)
- Professional title and jurisdiction

**Template:**
```
Angaben gemäß § 5 TMG:

Max Mustermann
Heizungsbau Mustermann
Musterstraße 123
12345 Musterstadt

Kontakt:
Telefon: +49 (0) 123 456789
E-Mail: info@heizungsbau-mustermann.de

Umsatzsteuer-ID:
Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:
DE123456789

Berufsbezeichnung:
Heizungsbaumeister (verliehen in Deutschland)

Zuständige Kammer:
Handwerkskammer Musterstadt
Kammerbezirk Musterstadt

Zuständige Aufsichtsbehörde:
Gewerbeaufsichtsamt Musterstadt
```

---

## 7. Compliance Checklist for Launch

### 7.1 Technical Implementation ✅ Required Before Real Data

- [ ] **Double opt-in for email reminders implemented**
  - [ ] Confirmation email sends automatically
  - [ ] Unique confirmation link generated
  - [ ] Opt-in status tracked in database
  - [ ] Timestamp and IP logged

- [ ] **Unsubscribe mechanism implemented**
  - [ ] Unsubscribe link in every email
  - [ ] One-click unsubscribe (no login)
  - [ ] Status updated in database
  - [ ] Confirmation page shown

- [ ] **Data subject rights functions implemented**
  - [ ] CSV export function (access request)
  - [ ] Delete customer function (erasure request)
  - [ ] Edit customer function (rectification request)

- [ ] **Security measures implemented**
  - [ ] HTTPS enforced
  - [ ] Password hashing (bcrypt)
  - [ ] Input validation
  - [ ] Rate limiting
  - [ ] CSRF protection

- [ ] **Logging implemented**
  - [ ] Email send logs
  - [ ] Consent changes logged
  - [ ] Data access logged (for audit trail)

- [ ] **Sub-processor compliance**
  - [ ] Supabase: EU data center selected
  - [ ] Resend: Email routing via EU confirmed
  - [ ] Vercel: EU region deployment confirmed
  - [ ] DPAs obtained from all sub-processors

### 7.2 Documentation ✅ Required Before Real Data

- [ ] **AV-Vertrag signed** between Max and platform
- [ ] **Datenschutzerklärung created** and linked in emails
- [ ] **Impressum created** and displayed on website
- [ ] **VVT (Record of Processing) created** for Max
- [ ] **VVT (Record of Processing) created** for platform
- [ ] **Consent wording finalized** and implemented
- [ ] **Cookie policy created** (if applicable)

### 7.3 Operational Procedures ✅ Required Before Real Data

- [ ] **Data breach response procedure documented**
- [ ] **Data subject rights request handling procedure documented**
- [ ] **Backup and recovery procedure tested**
- [ ] **Data retention policy implemented** (automatic deletion after retention periods)
- [ ] **Sub-processor change notification process** (notify Max of new sub-processors)

### 7.4 Legal Review ✅ Recommended

- [ ] **Datenschutzerklärung reviewed by lawyer** (€500-1,000 investment)
- [ ] **AV-Vertrag reviewed by lawyer**
- [ ] **Consent mechanism validated**
- [ ] **Compliance with UWG (email marketing) confirmed**

---

## 8. Risk Assessment

### 8.1 High Risks

**RISK-LEGAL-001: Email marketing without proper consent**
- **Impact:** Very High (fines up to €20M or 4% revenue, plus UWG violations)
- **Probability:** High if no double opt-in
- **Mitigation:** ✅ Implement double opt-in BEFORE sending any emails
- **Residual Risk:** Low (after mitigation)

**RISK-LEGAL-002: Data breach without notification**
- **Impact:** Very High (GDPR Art. 33 violation, fines, reputation damage)
- **Probability:** Medium (cyber attacks are common)
- **Mitigation:**
  - Implement security measures (TOMs)
  - Monitoring and logging
  - Data breach response procedure
  - Insurance (Cyberversicherung) - recommended for SaaS phase
- **Residual Risk:** Medium

**RISK-LEGAL-003: Sub-processor in non-EU country**
- **Impact:** High (GDPR Art. 44 violation, data transfer outside EU/EEA)
- **Probability:** Medium (depends on service providers)
- **Mitigation:**
  - ✅ Use only EU-based services (Supabase EU, Vercel EU)
  - ⚠️ If US services needed: Verify adequacy decision or use Standard Contractual Clauses (SCCs)
  - Audit sub-processor agreements
- **Residual Risk:** Low (if all services EU-based)

### 8.2 Medium Risks

**RISK-LEGAL-004: Inadequate response to data subject rights requests**
- **Impact:** Medium (fines, reputation damage)
- **Probability:** Low (few requests expected)
- **Mitigation:**
  - Clear procedures for Max
  - Platform functions for export/delete
  - 1-month response deadline tracking
- **Residual Risk:** Low

**RISK-LEGAL-005: Retention periods not followed**
- **Impact:** Medium (GDPR Art. 5(1)(e) violation if kept too long)
- **Probability:** Medium (easy to forget manual deletion)
- **Mitigation:**
  - Automated deletion based on retention policies
  - Retention policy review annually
- **Residual Risk:** Low

### 8.3 Low Risks

**RISK-LEGAL-006: Missing Impressum on website**
- **Impact:** Low (€500-5,000 fine under TMG)
- **Probability:** Low (easy to implement)
- **Mitigation:** ✅ Create and display Impressum
- **Residual Risk:** Very Low

---

## 9. Recommendations

### 9.1 MVP Launch Requirements (MUST HAVE)

**Before processing ANY real customer data:**
1. ✅ Double opt-in implemented and tested
2. ✅ Unsubscribe mechanism implemented and tested
3. ✅ Datenschutzerklärung created and linked
4. ✅ AV-Vertrag signed between Max and platform
5. ✅ EU data center confirmed for all services
6. ✅ Basic security measures (HTTPS, password hashing, input validation)

**Legal Review Investment:**
- Budget: €500-1,000
- Scope: Review Datenschutzerklärung, AV-Vertrag, consent mechanism
- ROI: Risk mitigation worth far more than cost
- Timing: Before MVP go-live with real data

### 9.2 Post-Launch (First 3 Months)

- Quarterly review of sub-processor compliance
- Test data subject rights procedures (mock requests)
- Test backup and recovery
- Monitor for security incidents
- Review and update documentation

### 9.3 SaaS Phase Requirements (Additional)

- Data Protection Impact Assessment (DPIA) - likely required for larger scale
- Data Protection Officer (DSB) - required if >20 employees processing personal data
- Regular GDPR audits (annual)
- Cyberversicherung (cyber insurance) - recommended
- Employee training on data protection (if hiring)

---

## 10. Templates and Next Steps

### 10.1 Templates to Create

1. **AV-Vertrag (Data Processing Agreement)**
   - See separate document: agent-04-av-vertrag-template.md

2. **Datenschutzerklärung (Privacy Policy)**
   - See separate document: agent-04-datenschutzerklaerung-template.md

3. **Impressum (Legal Notice)**
   - Simple template provided in Section 6.4

4. **Consent Wording**
   - Provided in Section 3.1

5. **Data Breach Response Procedure**
   - To be created during development phase

### 10.2 Action Items for Next Phase

**Immediate (Before Development):**
- [ ] Obtain legal review budget approval (€500-1,000)
- [ ] Research lawyers specializing in IT/GDPR
- [ ] Verify Supabase EU data center option pricing
- [ ] Verify Resend EU email routing

**During Development:**
- [ ] Implement double opt-in flow (Sprint 1)
- [ ] Implement unsubscribe mechanism (Sprint 1)
- [ ] Implement data subject rights functions (Sprint 2)
- [ ] Create Datenschutzerklärung (Sprint 2)
- [ ] Create and sign AV-Vertrag (Sprint 3)

**Before Go-Live:**
- [ ] Legal review of all documentation
- [ ] Compliance checklist 100% complete
- [ ] Test all GDPR functions
- [ ] Train Max on data subject rights procedures

---

## 11. Contact Information

**German Data Protection Authority (Bundesbeauftragter für den Datenschutz und die Informationsfreiheit - BfDI):**
- Website: https://www.bfdi.bund.de
- Phone: +49 (0)228 997799-0
- Email: poststelle@bfdi.bund.de

**State Data Protection Authorities:**
- Each German state has its own authority (e.g., Berliner Beauftragte für Datenschutz und Informationsfreiheit)
- Find yours: https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html

**Legal Resources:**
- IT-Rechtkanzlei for GDPR review (Google: "DSGVO Anwalt [your city]")
- Datenschutz-Generator: https://www.datenschutz-generator.de (free template, but review recommended)

---

**Document Status:** ✅ COMPLETE
**Next Agent:** Business Strategy Agent (MVP Planning)
**Dependencies:** Business Model Canvas (agent-01)
**Approval:** Legal review recommended before implementation
**Risk Level:** 🔴 HIGH - Compliance critical for launch
