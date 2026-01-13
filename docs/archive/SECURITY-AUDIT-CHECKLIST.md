# Security Audit Checklist - Torqr Application

**Last Updated:** December 15, 2024
**Status:** Day 5 - Security Basics Complete

---

## 1. Authentication & Authorization

### Password Security
- [x] **Password Hashing**: bcryptjs with SALT_ROUNDS = 12 (`src/lib/password.ts`)
- [x] **Strong Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - Validation implemented in `src/lib/validations.ts`
- [ ] **Password Reset Flow**: Not yet implemented (Sprint 1)
- [ ] **Multi-Factor Authentication (MFA)**: Not planned for MVP

### Session Management
- [x] **NextAuth v5**: Configured for session management
- [x] **JWT Tokens**: Using NextAuth's built-in JWT handling
- [ ] **Session Expiration**: Verify NextAuth session timeout (7 days recommended)
- [ ] **Secure Session Storage**: HTTP-only cookies configured via NextAuth
- [x] **Session Invalidation**: NextAuth handles logout and session cleanup

### Authorization
- [ ] **Row-Level Security**: Implement middleware to filter by userId (Sprint 2)
- [ ] **API Route Protection**: Add auth checks to all protected routes
- [ ] **Ownership Verification**: Validate user owns resources before operations

---

## 2. Input Validation & Sanitization

### Zod Validation
- [x] **Validation Library Created**: `src/lib/validations.ts`
- [x] **User Registration Schema**: Email, password, name, phone validation
- [x] **Customer Schemas**: Create and update validation
- [x] **Heater Schemas**: Create and update validation
- [x] **Maintenance Schemas**: Create and update validation
- [x] **File Upload Schema**: Content type and size validation (max 5MB)
- [ ] **Apply to All API Routes**: Validate inputs on all endpoints

### SQL Injection Prevention
- [x] **Prisma ORM**: All database queries use Prisma (parameterized queries)
- [x] **No Raw SQL**: Avoid `prisma.$executeRaw` unless absolutely necessary

### XSS Prevention
- [x] **React Default Escaping**: React automatically escapes values
- [ ] **Sanitize User-Generated Content**: For notes and text fields with HTML
- [ ] **Content Security Policy (CSP)**: Add CSP headers (optional for MVP)

---

## 3. Rate Limiting

### IP-Based Rate Limiting
- [x] **Login Endpoint**: 10 attempts per 15 minutes (`RATE_LIMIT_PRESETS.LOGIN`)
- [x] **Registration Endpoint**: 5 attempts per 15 minutes (`RATE_LIMIT_PRESETS.REGISTER`)
- [x] **Rate Limit Middleware**: `src/lib/rate-limit.ts`

### User-Based Rate Limiting
- [x] **General API Routes**: 100 requests per minute per user (`RATE_LIMIT_PRESETS.API_USER`)
- [x] **File Upload Routes**: 10 uploads per minute per user (`RATE_LIMIT_PRESETS.FILE_UPLOAD`)
- [x] **Rate Limit by User Function**: `rateLimitByUser()` implemented
- [ ] **Apply to Protected Routes**: Integrate into API route handlers

### Rate Limit Response
- [x] **429 Status Code**: Returned on rate limit exceeded
- [x] **Retry-After Header**: Indicates when to retry
- [x] **X-RateLimit-* Headers**: Limit, Remaining, Reset headers included

---

## 4. CSRF Protection

### Double Submit Cookie Pattern
- [x] **CSRF Utility Created**: `src/lib/csrf.ts`
- [x] **Token Generation**: Cryptographically secure random tokens (32 bytes)
- [x] **Cookie Configuration**:
  - HttpOnly: Yes
  - Secure: Yes (production only)
  - SameSite: Strict
  - Max-Age: 24 hours
- [x] **Validation Function**: `validateCsrfToken()` using timing-safe comparison
- [x] **Middleware Function**: `csrfProtection()` for API routes
- [ ] **Apply to State-Changing Routes**: POST, PUT, PATCH, DELETE endpoints
- [ ] **Client-Side Integration**: Send CSRF token in `x-csrf-token` header

### NextAuth CSRF Protection
- [x] **NextAuth Built-in CSRF**: NextAuth v5 includes CSRF protection for auth routes

---

## 5. Security Headers

### HTTP Security Headers (next.config.ts)
- [x] **X-Frame-Options**: DENY (prevents clickjacking)
- [x] **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- [x] **Referrer-Policy**: strict-origin-when-cross-origin
- [x] **Permissions-Policy**: camera=(), microphone=(), geolocation=()
- [ ] **Content-Security-Policy (CSP)**: Optional - Add if needed for enhanced security
- [ ] **Strict-Transport-Security (HSTS)**: Auto-configured by Vercel in production

### HTTPS/TLS
- [ ] **Force HTTPS**: Vercel automatically redirects HTTP → HTTPS in production
- [ ] **TLS 1.3**: Verify Vercel uses TLS 1.3 (should be default)

---

## 6. File Upload Security

### Upload Validation
- [x] **File Type Validation**: Only JPEG, PNG, WebP allowed
- [x] **File Size Limit**: Maximum 5MB per file
- [x] **Schema Validation**: `fileUploadSchema` in validations library
- [ ] **File Content Validation**: Verify file headers match declared type
- [ ] **Virus Scanning**: Consider integration (optional for MVP)

### Storage Security
- [ ] **Supabase Storage**: Configure private bucket for customer photos
- [ ] **Signed URLs**: Generate time-limited URLs for file access
- [ ] **Access Control**: Verify only owner can access files

---

## 7. Database Security

### Connection Security
- [x] **Connection String**: Uses DATABASE_URL from environment variables
- [x] **SSL Connection**: Supabase requires SSL by default
- [ ] **Connection Pooling**: Configured via Prisma and Supabase

### Data Protection
- [x] **Password Hashing**: Never store plain text passwords
- [ ] **User Data Isolation**: All queries filter by userId
- [ ] **Cascade Deletes**: Configured in Prisma schema (User → Customers → Heaters)
- [x] **GDPR Compliance Fields**: optInToken, optInConfirmedAt, unsubscribedAt

### Backup & Recovery
- [ ] **Automated Backups**: Verify Supabase automatic backups are enabled
- [ ] **Point-in-Time Recovery**: Available on Supabase paid plans

---

## 8. Environment Variables & Secrets

### Secret Management
- [x] **.env.local in .gitignore**: Prevents committing secrets
- [x] **Environment Variables**: All secrets in .env.local
- [ ] **Vercel Environment Variables**: Configure in Vercel dashboard for production
- [ ] **JWT_SECRET**: Strong random secret (min 32 characters)
- [ ] **NEXTAUTH_SECRET**: Strong random secret (min 32 characters)

### Required Secrets Checklist
- [ ] DATABASE_URL (Supabase connection string)
- [ ] JWT_SECRET
- [ ] NEXTAUTH_SECRET
- [ ] NEXTAUTH_URL (production URL)
- [ ] RESEND_API_KEY
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SENTRY_DSN (optional)

---

## 9. API Security

### Authentication Middleware
- [ ] **Require Auth Helper**: Create `requireAuth()` middleware
- [ ] **Extract User from Session**: Get userId from NextAuth session
- [ ] **Apply to Protected Routes**: All /api/* routes except public endpoints

### Error Handling
- [x] **Generic Error Messages**: Don't expose internal details
- [x] **Proper Status Codes**: 400, 401, 403, 404, 429, 500
- [ ] **Error Logging**: Log errors to Sentry (optional)
- [ ] **No Stack Traces**: Don't expose stack traces in production

### API Design
- [ ] **CORS Configuration**: Restrict origins in production
- [ ] **API Versioning**: Not needed for MVP (internal API)
- [ ] **Request Size Limits**: Next.js default is 4MB (verify sufficient)

---

## 10. Email Security

### GDPR Compliance
- [x] **Double Opt-In Flow**: Schema includes optInToken, optInTokenExpires
- [x] **Unsubscribe Tracking**: unsubscribedAt field in Customer model
- [x] **Opt-In IP Logging**: optInIpAddress field for proof
- [ ] **Unsubscribe Links**: Implement in all reminder emails
- [ ] **Email Preferences**: Allow users to manage email consent

### Email Sending
- [x] **Resend Integration**: Using Resend API for email delivery
- [ ] **SPF/DKIM/DMARC**: Configure DNS records for domain
- [ ] **Rate Limiting**: Respect Resend's rate limits
- [ ] **Email Templates**: Use React Email for templates

---

## 11. Logging & Monitoring

### Application Monitoring
- [x] **Sentry Integration**: Configured (commented out in next.config.ts)
- [ ] **Enable Sentry**: Uncomment and configure for production
- [ ] **Error Tracking**: Monitor application errors
- [ ] **Performance Monitoring**: Track API response times

### Audit Logging
- [ ] **Email Logs**: EmailLog model tracks all sent emails
- [ ] **Cron Job Logs**: CronRun model tracks automated jobs
- [ ] **Authentication Events**: Log login attempts (optional)
- [ ] **Data Access Logs**: Log sensitive data access (optional for MVP)

---

## 12. Dependency Security

### Package Management
- [ ] **npm audit**: Run regularly to check for vulnerabilities
- [ ] **Dependabot**: Enable GitHub Dependabot for automated updates
- [ ] **Lock File**: Commit package-lock.json for reproducible builds
- [ ] **Minimal Dependencies**: Review and remove unused packages

### Third-Party Services
- [x] **Vercel**: Trusted deployment platform
- [x] **Supabase**: Trusted database provider
- [x] **Resend**: Trusted email service
- [x] **Sentry**: Trusted monitoring service (optional)

---

## 13. Offline & PWA Security

### Service Worker
- [ ] **Service Worker Validation**: Verify SW only caches safe resources
- [ ] **Cache Poisoning Prevention**: Use versioned cache names
- [ ] **Background Sync Security**: Validate sync requests before processing

### Local Storage
- [ ] **Sensitive Data**: Never store passwords or tokens in localStorage
- [ ] **IndexedDB Encryption**: Consider encryption for offline data (optional)

---

## 14. Testing & Quality Assurance

### Security Testing
- [ ] **Manual Penetration Testing**: Test common vulnerabilities
- [ ] **Automated Security Scans**: Use tools like OWASP ZAP (optional)
- [ ] **Code Review**: Review security-critical code

### Test Coverage
- [ ] **Unit Tests**: Test validation schemas and security utilities
- [ ] **Integration Tests**: Test API routes with authentication
- [ ] **E2E Tests**: Test complete flows with security checks

---

## 15. Deployment Security

### Production Checklist
- [ ] **Environment Variables**: All secrets configured in Vercel
- [ ] **HTTPS Only**: Verified via Vercel
- [ ] **Security Headers**: Verified via security headers checker
- [ ] **Rate Limiting**: Tested and working
- [ ] **CSRF Protection**: Tested and working
- [ ] **Error Handling**: No sensitive info exposed

### Monitoring Setup
- [ ] **Sentry Enabled**: Error tracking active
- [ ] **Uptime Monitoring**: Optional - Use Vercel Analytics or external service
- [ ] **Log Retention**: Configure appropriate retention period

---

## Summary of Day 5 Completed Tasks

### ✅ Completed
1. **Input Validation (Zod)**: Comprehensive validation schemas library created
2. **Rate Limiting**: Extended to support user-based limits for API and file uploads
3. **CSRF Protection**: Double Submit Cookie pattern implemented
4. **Security Headers**: Added missing Permissions-Policy header

### 🔄 In Progress (Future Sprints)
- Apply validation to all API endpoints
- Implement authentication middleware for protected routes
- Apply rate limiting to all API endpoints
- Apply CSRF protection to state-changing endpoints
- Configure Sentry for production monitoring

### ⏳ Pending (Sprint 1+)
- Row-level security implementation
- File upload security enhancements
- Email GDPR compliance flow
- Security testing and penetration testing

---

## Notes

- This checklist should be reviewed before each deployment
- Security is an ongoing process - revisit regularly
- Prioritize items marked with ⚠️ HIGH PRIORITY
- Document any deviations from this checklist

**Next Steps:** Continue with Sprint 1 (Authentication) and integrate security measures as features are built.
