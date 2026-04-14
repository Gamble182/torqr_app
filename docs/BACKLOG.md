# Backlog — Torqr

> Known issues and improvements to address in future sessions.
> Add items here as they are discovered. Prioritize and assign to sprints as needed.

---

## Format

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| | | | | |

---

## Open Items

| # | Area | Description | Priority | Found |
|---|------|-------------|----------|-------|
| 1 | Email | Unsubscribe link used `localhost:3000` in production — fixed in code, requires `APP_URL` env var set in Vercel | ~~Fixed~~ | 2026-04-14 |
| 2 | Email | Weekly summary and reminder emails land in GMX junk folder — new domain reputation issue, improves over time; consider adding DMARC record | Medium | 2026-04-14 |
| 3 | UI | Edit customer page: entering a new email address does not trigger a page reload / data refresh after save | Medium | 2026-04-14 |
| 4 | UI | Dashboard page: nested `<a>` inside `<Link>` (phone `tel:` link inside customer card link) — causes hydration error in Next.js. Fix: replace outer `<Link>` with `div` + `onClick` router push | High | 2026-04-14 |
| 5 | Feature / Sprint | Account page — user can change password, update personal info, manage account settings. Bottom-left avatar/user chip should link to it | Medium | 2026-04-14 |
| 6 | UX / Sprint | Full mobile responsiveness — all pages must feel native on mobile. Audit and rework layouts, touch targets, typography, spacing across entire app | High | 2026-04-14 |
| 7 | Feature / Sprint | Admin panel — `/admin` route (same project), role-based access (`User.role: USER\|ADMIN`). Views: all users, EmailLog, CronRun, user CRUD. No separate app needed. | Medium | 2026-04-14 |

---

## Completed / Resolved

| # | Area | Description | Resolved |
|---|------|-------------|----------|
| 1 | Email | Unsubscribe URL used `localhost:3000` — changed `buildUnsubscribeUrl()` to use `APP_URL` env var | 2026-04-14 |
