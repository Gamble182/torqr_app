# Sprint 32 Handover — Lead-Magnet, Brand-Polish, Compliance

**Erstellt:** 2026-05-11 nach Sprint-31-Close-out
**Branch:** `main` (13 Commits ahead of origin/main, push noch ausstehend)
**Letzter Commit:** `d7d25cd chore: refresh graphify auto-rebuilds + gitignore .claude/worktrees`
**Test-Stand:** 747/747 vitest grün · `npm run build` sauber · TypeScript clean
**Vorheriger Sprint:** Sprint 31 — Conversion + Polish (siehe `docs/BACKLOG.md` § Completed)

---

## TL;DR — Was ich heute Nachmittag mache

**Empfohlener Sprint 32: "Lead-Magnet, Brand-Polish, Compliance"** — 3 Core-Items + 2 Stretch, alle ohne externe Blocker, alle bauen auf Sprint-31-Momentum auf.

Wenn du mit weniger Setup anfangen willst, ist Path B ("Backend-Leveling") oder Path C ("Sprint-31-Carry-Over") auch valide — Comparison unten.

---

## Repo-Zustand (Snapshot)

```
Branch: main
Commits ahead of origin: 13 (NICHT gepusht — du machst das selbst)
Working tree: clean

Letzte 5 Commits:
d7d25cd chore: refresh graphify auto-rebuilds + gitignore .claude/worktrees
1faf6d4 docs(sprint31): close out — backlog sweep + timesheet entry
04ca594 feat(brand): add standalone wordmark SVG asset set (#78)
68790db docs(backlog): log Sprint 31 pricing-toggle add-on as completed
f0f5cf5 refactor(marketing): drop monthly/annual pricing toggle, flat €29/49/99 only
```

**Frische Artefakte aus Sprint 31** (kontextrelevant für Sprint 32):
- `src/lib/marketing/roi.ts` — TDD-cover'd pure function, **Vorlage für Lead-Magnet-Calculator**
- `src/components/marketing/RoiCalculator.tsx` — Client-Component-Pattern für interaktive Tools
- `public/brand/wordmark/*.svg` — Asset-Folder-Pattern, **Vorlage für Social-Media-Assets**
- `docs/brand_spec/BRAND_SPEC.md` — neue "Wordmark Asset Set"-Section + Drift-Hinweis-Pattern

---

## 3 Sprint-Optionen — kurze Auswahl

| Path | Scope | Echtzeit | Solo-Dev | Risiko | Vorbedingung |
|---|---|---|---|---|---|
| **A — Lead-Magnet, Brand-Polish, Compliance** *(Recommended)* | #75 Wartungsintervall-Rechner · #79 Social-Media-Assets · #86 Datenschutz-Daten-Export | ~2.5–3 h | ~10–12 h | Niedrig | Keine |
| **B — Backend-Leveling** | #25 CSV-Customer-Import · #33 Multi-System-Booking · #44 Cal.com Target Email | ~3 h | ~14 h | Mittel (Multi-System-Booking braucht Cal.com-Spielraum) | Keine |
| **C — Sprint-31-Carry-Over** *(blocked unless du heute morgen pre-tests machst)* | #52 Cal.com E2E + Fix · #88 Workload-Screenshot · #94 CSP Header | ~3 h | ~14 h | **Hoch** (CSP kann Booking-Flow brechen) | Manueller Cal-Booking-Test + Screenshot zuerst |

---

## Path A (Recommended) — Detail-Briefing

### Warum diese Auswahl

- **Momentum-Continuation:** Sprint 31 hat Lead-Conversion-Direction etabliert (ROI-Rechner inline, Pricing simplified). Lead-Magnet (#75) ist die natürliche nächste Stufe — Email-Capture-Tool, das Outbound-Akquise befeuert.
- **Patterns recycelbar:** Wartungsintervall-Rechner kann 1:1 das ROI-Rechner-Pattern nutzen (pure-function lib + TDD + Client-Component). Geringer kognitiver Overhead, sehr schnell umsetzbar.
- **Asset-Continuation:** Social-Media-Assets (#79) bauen direkt auf gestrigem Wordmark-Set auf. Brand-Discipline-Run.
- **Compliance-Schuld abbauen:** Daten-Export Art. 20 (#86) ist kein Marketing-Item, aber FAQ-relevant ("Was passiert mit meinen Daten beim Kündigen?") — schließt eine echte Compliance-Lücke ohne Anwalt-Wartezeit.
- **Keine externen Blocker** — du kannst sofort starten ohne auf Cal-Test, Lawyer oder User-Asset zu warten.

### Item-Briefings

#### #75 Lead-Magnet-Tools — Wartungsintervall-Rechner *(Core, M ~1.5 h Echtzeit)*

**Spec-Auszug aus BACKLOG:** *"Wartungsintervall-Rechner + Wartungsprotokoll-PDF-Vorlage als kostenloser Download (Email-Capture)."*

**Empfohlener Scope-Cut für Sprint 32:** **NUR der Wartungsintervall-Rechner**, kein PDF-Download (das ist Phase 2 mit `@react-pdf/renderer` — scope creep).

**Was zu bauen:**
- Pure-function lib: `src/lib/marketing/wartungsintervall.ts`
  - Input: `{ systemType: 'HEATING' | 'AC' | 'WATER_TREATMENT' | 'ENERGY_STORAGE', baujahr: number, leistung_kw?: number }`
  - Output: `{ empfohlenInMonaten: number, gesetzlichePflicht: boolean, begruendung: string }`
  - Konstanten aus existierenden `src/config/heating-systems.json` ableiten (siehe Catalog-Daten dort)
- vitest tests in `src/lib/marketing/__tests__/wartungsintervall.test.ts` (Pattern wie `roi.test.ts`)
- Client-Component: `src/components/marketing/WartungsintervallCalculator.tsx`
  - System-Type-Selector + Baujahr-Input + (optional) Leistung
  - Live-Result mit Empfehlung + Begründung
  - Email-Capture-Form unter dem Result (verknüpft mit existierendem `BetaListForm`-Pattern)
- Routing: neue Page `src/app/wartungsintervall-rechner/page.tsx` (wegen SEO-Wert eigener URL-Pfad, nicht inline)
- Cross-Link aus Landingpage (z.B. nach Pricing oder im FAQ)

**Vorlagen im Repo:**
- `src/lib/marketing/roi.ts` — pure-function-Pattern
- `src/components/marketing/RoiCalculator.tsx` — Client-Component-Pattern
- `src/components/marketing/BetaListForm.tsx` — Email-Capture-Pattern + Honeypot + Zod-Validation

**Domain-Daten — wo nachschlagen:**
- DIN 4795 (Heizungsanlagen-Wartungspflicht): bei Gas-Heizungen jährlich gesetzlich, bei Wärmepumpen Hersteller-Empfehlung (idR alle 12 Monate, Inverter alle 18 Monate)
- F-Gas-Verordnung (EU 517/2014): Klima ≥3 kg CO₂-Äquivalent jährlich pflichtig
- Ableitbare Werte sind in `src/config/heating-systems.json` schon teilweise hinterlegt

**Quality-Gate:** Tests grün, Build grün, Browser-Verifikation: 4 System-Typen ergeben plausible Ergebnisse, Email-Capture funktioniert (siehe Demo-Schreibweise auf BetaListForm).

**Plan-Skill:** Empfohlen — TDD-Tasks für die pure-function lib, dann Component + Routing + Email-Capture in 3 weiteren Tasks.

---

#### #79 Social-Media-Asset-Pack *(Core, M ~1 h Echtzeit)*

**Spec-Auszug:** *"Social-Media-Asset-Pack (LinkedIn, Instagram, Facebook) im Brand-Stil."*

**Was zu bauen:** SVG/PNG-Asset-Set in `public/brand/social/` für die 3 Plattformen + 2 Post-Templates pro Plattform.

**Vorgeschlagene Files:**

| Datei | Format | Zweck |
|---|---|---|
| `social/linkedin-banner.svg` | 1584×396 | LinkedIn-Profil-Banner für Y. Dorth oder Torqr-Page |
| `social/linkedin-post-default.svg` | 1200×627 | LinkedIn-Post-Hero (Wordmark + Headline-Slot) |
| `social/instagram-profile-square.svg` | 1080×1080 | Instagram-Profilbild + Stories |
| `social/instagram-post-square.svg` | 1080×1080 | Instagram-Feed-Post-Template |
| `social/facebook-banner.svg` | 851×315 | Facebook-Page-Cover |
| `social/og-image-fallback.png` | 1200×630 | Statisches OG-Image-Backup (live OG ist via `next/og` dynamisch) |

**Vorlagen im Repo:**
- `public/brand/wordmark/wordmark-horizontal.svg` — Geometrie + Color-Tokens
- `src/components/brand/TorqrIcon.tsx` — Reference-Implementierung
- `src/app/opengraph-image.tsx` — `next/og`-Pattern als Inspiration
- `docs/brand_spec/BRAND_SPEC.md` — Brand-Tokens + Typo

**Wichtig:** Geometrie-Drift zur React-Komponente vermeiden (siehe Drift-Hinweis im aktuellen `wordmark/README.md`). Nutze die Polyline-Punkte 1:1.

**README im Asset-Folder** mit Verwendungs-Regeln (analog zu `wordmark/README.md`) + Hinweis: PNG-Variante des og-image-fallback ist bewusst statisch (für E-Mail-Signaturen, wo dynamisches `next/og` nicht greift).

**Quality-Gate:** XML-Valid, im Browser visuell auf jeweiligem Plattform-Mockup geprüft (LinkedIn-Profil-Preview, etc.).

---

#### #86 Daten-Export für DSGVO Art. 20 *(Core, M ~1 h Echtzeit)*

**Spec-Auszug:** *"Daten-Export für DSGVO-Pflicht (Art. 20) als Self-Service-Funktion. Aktuell nur per DB-Dump möglich."*

**Was zu bauen:**
- API-Route `src/app/api/user/export/route.ts` (GET) — gibt JSON mit allen tenant-eigenen Daten des aufrufenden Users zurück
  - `requireAuth()` zuerst (Pattern siehe `src/lib/auth-helpers.ts`)
  - Scoped via `companyId` aus Auth-Result (Multi-Tenancy-Rule!)
  - Tabellen: `Customer`, `CustomerSystem`, `Maintenance`, `Booking`, `FollowUpJob`, `EmailLog` (alle tenant-eigenen)
  - Optional: User-Profil-Felder (eigener User, ohne sensible PasswordHash)
  - Export-Format: JSON mit klarer Top-Level-Struktur `{ exportedAt, companyId, customers: [...], systems: [...], ... }`
  - Response als Download (`Content-Disposition: attachment; filename="torqr-export-${date}.json"`)
- UI-Trigger: Button "Daten exportieren (DSGVO Art. 20)" in `src/app/account/page.tsx` (existing Account-Page)
  - On-click → fetch `/api/user/export` → trigger browser-download
- Tests: vitest in `src/app/api/user/export/__tests__/route.test.ts`
  - Auth-Required-Check
  - Tenant-Isolation-Check (User von Company A bekommt KEINE Daten von Company B)
  - JSON-Shape-Snapshot

**Compliance-Hinweis im UI:** Kurzer Text neben dem Button: *"Sie erhalten eine vollständige Kopie aller Daten Ihres Betriebs in maschinenlesbarem JSON-Format. Dauer: wenige Sekunden."*

**FAQ-Update:** Neue Frage in `src/components/marketing/Faq.tsx`: *"Was passiert mit meinen Daten, wenn ich kündige?"* mit Verweis auf den Export.

**Vorlagen im Repo:**
- `src/app/api/user/profile/route.ts` (oder ähnlich) — Pattern für Own-Record-API
- `src/lib/auth-helpers.ts` — `requireAuth()`-Helper
- `src/app/account/page.tsx` — Account-Page-Layout
- ADR `docs/architecture/CHANGELOG.md` — Multi-Tenancy-Rule-Referenz

**Quality-Gate:** Tests grün (besonders Tenant-Isolation), Browser-Test: Login → Account → Export-Klick → JSON-Datei landet im Downloads, Inhalt enthält ALLE eigenen Customers aber NICHTS von einem anderen Tenant (manueller Multi-User-Test mit zweitem Account).

---

### Stretch (optional, falls Core gut läuft)

#### #49 Delete old Supabase Project *(S, ~15 min)*

**Spec:** alten Supabase-Projekt `vvsmxzebaoslofigxakt` (eu-west-1) löschen — Migration zum neuen `hwagqyywixhhorhjtydt` (eu-central-1) ist seit Sprint 21 abgeschlossen.

**Risiko:** **DESTRUKTIV** — wenn irgendwo noch ein DB-Connection-String auf den alten Projekt zeigt (Cron-Job, lokale Entwicklungs-`.env`, alte Vercel-Env-Variable), bricht das hart.

**Pre-Check vor Löschung:**
- Vercel-Env-Variables review: alle `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_*` Keys → zeigen auf neue Projekt-ID?
- Lokale `.env`-Files: dito
- Sentry-Logs der letzten 7 Tage: irgendwo noch alte Projekt-Verweise?
- Backup ziehen vor Löschung (Supabase-Dashboard → "Database backup")

**User-Action:** Supabase-Dashboard → Project-Settings → Delete Project. **Claude kann das nicht für dich machen.**

#### #44 Cal.com Target Email *(S, trivial Config)*

**Spec:** Cal.com Booking-Confirmation geht an persönliche Email. Auf Business-Adresse (`hello@torqr.de`?) ändern.

**Wo:** Cal.com-Account-Settings (extern), KEINE Code-Änderung nötig — KÖNNTE aber der `RESEND_FROM_EMAIL` env-var-Sync benötigen, falls die irgendwo die persönliche Adresse fest verdrahtet ist (bitte nachprüfen).

#### #92 Cal.com Multi-Customer-Strategie *(M, Decision-Document)*

**Spec:** aktuell 1 Cal.com-Event-Type für alle Pilot-Kunden. Phase-2 (≥ 5 Kunden) braucht andere Strategie.

**Was zu bauen:** Decision-Document in `docs/decisions/` (oder ADR in `docs/architecture/CHANGELOG.md`) — kein Code, nur Strategie:

| Option | Setup-Aufwand | Pro | Contra |
|---|---|---|---|
| Pro Kunde eigener Event-Type | Linear mit Kundenanzahl | Saubere Slot-Trennung | Manueller Pflegeaufwand |
| Routing über `metadata.customerId` | Einmalig | Skaliert beliebig | Komplexere Webhook-Logik |
| Cal.com-Teams-Plan | Einmalig + Subscription-Cost | Built-in Multi-User-Support | Kosten + Migration |
| Custom-Booking-UI via Cal.com-API | Hoch | Volle Kontrolle | Kein "Cal.com-as-Black-Box"-Vorteil mehr |

Decision treffen + dokumentieren. Implementation kommt später wenn ≥ 5 Kunden gleichzeitig sind.

---

## Path B (Alternative) — Backend-Leveling

Wenn du heute Nachmittag in Backend-Mode sein willst statt Marketing/Brand:

**Core:**
- **#25 CSV/Excel customer import** — Tooltime-Export-kompatibel. M-L (~6h Solo). File-Upload + CSV-Parser (z.B. `papaparse`) + Column-Mapping-UI + Zod-Validation pro Row + Bulk-`prisma.customer.createMany`. Kombinierbar mit N-7 (InventoryItems-Bulk-Import).
- **#33 Multi-system booking** — Cal.com-Webhook + UI: wenn Customer mehrere Systems mit gleichem Maintenance-Intervall hat, alle für einen Termin auswählen. M (~4h).
- **#44 Cal.com Target Email** — siehe Stretch oben (trivial).

**Stretch:** #49 Supabase-Cleanup, #51 Cal.com-Multi-Tenant-Decision-Doc.

**Risiko:** #33 braucht Cal.com-Spielraum — wenn die Custom-Field-Logik nicht mitspielt, Re-Scope nötig.

---

## Path C (Forced Carry-Over) — Sprint-31-Restpunkte

**Vorbedingung:** **DU MUSST HEUTE MORGEN MANUELL TESTEN:**
1. Cal.com-Booking-Flow von Endkunden-Sicht: Reminder-Mail → Cal-Link → Slot wählen → Booking abschließen → in Torqr-Dashboard auftauchen?
2. Workload-Screenshot exportieren: `/dashboard/team/workload` in 1440×900 Browser-Window screenshot, ≤ 200 KB optimieren

**Wenn ja, dann Sprint-Plan:**
- **#52 Cal.com E2E** — deine Befund-Liste durcharbeiten, Fixes umsetzen. Variable Aufwand je nach Bug-Anzahl (1.5–4 h).
- **#88 Workload-Screenshot** — `public/marketing/features/workload-desktop.png` ersetzen, Backlog-Markierung. Triviale 15 min.
- **#94 CSP Header** — Handover existiert: [`docs/superpowers/handovers/2026-05-04-csp-introduction-handover.md`](./2026-05-04-csp-introduction-handover.md). L (~3h, multi-flow regression). **Risiko: kann Cal.com-iFrame-Embeds brechen → erst nach #52 angehen.**

---

## Pre-Sprint-Checkliste (User-Side)

**Vor Path A (Lead-Magnet, Brand-Polish, Compliance):**
- [ ] `git push origin main` (13 Commits aus Sprint 31)
- [ ] Vercel-Production-Deploy verifizieren (~3 min nach Push)
- [ ] Browser-Sanity-Check: torqr.de → ROI-Rechner spielt (Default 33×?), Pricing zeigt €29/€49/€99 ohne Toggle, Wordmark-SVGs sind unter `https://torqr.de/brand/wordmark/wordmark-horizontal.svg` erreichbar

**Vor Path C (Carry-Over):**
- [ ] Cal-Booking-Flow manuell testen + Befund-Liste schreiben (5–15 min)
- [ ] Workload-Screenshot erstellen + optimieren (5 min)
- [ ] Anwalt-Status für #69 prüfen — falls Antwort da, Path C kann auch #69 mit aufnehmen

---

## Risiko-Register (Path-übergreifend)

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| `npm install` scheitert lokal (posthog/vercel-analytics-Module-Lücke wieder?) | Niedrig (heute morgen behoben) | Block Build | `npm install` als allererstes ausführen, nicht annehmen dass node_modules current ist |
| Dev-Server orphaned (Stop-Hook killt nur Bash-Wrapper, nicht Node) | Mittel (2× heute passiert) | Port 3000 belegt, neuer Dev-Server crasht | `Get-NetTCPConnection -LocalPort 3000 \| Stop-Process` als Cleanup-Reflex |
| Pre-existing TypeScript-Errors außerhalb Sprint-Scope | Hoch (siehe `npx tsc --noEmit`-Output) | Falsch-Positiv-Verifikation | Filter-Pattern `tsc --noEmit 2>&1 \| grep -v "src/lib/analytics"` etc. — IMMER auf NEU eingeführte Errors prüfen, nicht auf Total-Count |
| Multi-Tenancy-Verletzung in #86 Daten-Export | Mittel (kritisch wenn passiert) | DSGVO-Compliance-Bruch | TDD: Tenant-Isolation-Test ZUERST schreiben, vor Implementation. Pattern siehe `src/app/api/__tests__/tenant-isolation.test.ts` |
| Cal.com-iFrame durch CSP gebrochen (Path C) | Hoch | Booking-Flow tot | Erst #52 grün haben, dann CSP. NICHT umgekehrt. |

---

## Wie du den Sprint startest (Quick-Start)

**Option 1 — Mit dem Plan-Skill (empfohlen für Path A):**

In neuer Claude-Session:

```
Lies docs/superpowers/handovers/2026-05-11-sprint32-handover.md.
Ich wähle Path A (Lead-Magnet, Brand-Polish, Compliance).
Starte mit /superpowers:writing-plans für #75 Wartungsintervall-Rechner —
nutze die im Handover beschriebene Pure-Function + Component-Architektur.
```

**Option 2 — Direkt loslegen, Plan-Skill nur wenn nötig:**

In neuer Claude-Session:

```
Lies docs/superpowers/handovers/2026-05-11-sprint32-handover.md.
Path A. Starte mit #75 Wartungsintervall-Rechner — TDD für die pure-function lib,
dann Component, dann Routing. Pattern wie src/lib/marketing/roi.ts und
src/components/marketing/RoiCalculator.tsx.
```

**Option 3 — Path B oder C:**

Analog, aber Path-Bezeichnung ändern + (für Path C) erwähnen, dass du den manuellen Cal-Test schon gemacht hast inklusive Befund-Liste.

---

## Was die nächste Claude-Session SOFORT wissen sollte

(Damit ein cold-start nicht in einen Re-Discovery-Loop läuft.)

1. **Sprint 31 ist abgeschlossen, 13 Commits ungepusht.** Nicht nochmal denselben Backlog-Sweep machen.
2. **`npm install` als erstes** falls Build/Tests/dev fehlschlagen mit Module-Not-Found — node_modules-Drift war heute schon einmal ein Problem.
3. **Multi-Tenancy-Rule ist load-bearing** — alle tenant-eigenen Reads/Writes via `companyId` aus `requireAuth()`. CLAUDE.md § "Multi-Tenancy Isolation Rule" ist Pflichtlektüre vor jedem API-Route-Touch.
4. **Patterns aus Sprint 31 sind die Vorlage**: `roi.ts` für pure-function libs, `RoiCalculator.tsx` für interaktive Client-Components, `BetaListForm.tsx` für Email-Capture, `wordmark/README.md` für Asset-Folder-Konvention.
5. **Tests + Build vor jedem Commit:** `npm run test:run` (747+ Tests grün-Erwartung) + `npm run build` (clean expected).
6. **Conventional Commits, kein --no-verify, push macht der User selbst.**
7. **Backlog continuous pflegen** — completed-Items SOFORT in Completed-Section schieben, nicht batchen.
8. **Timesheet erst am Session-Ende, niemals mid-session.** Idempotent prüfen (existierende 2026-05-11-Zeilen schon da).

---

## Referenzen

- **Sprint 31 Final-State:** [`docs/BACKLOG.md`](../../BACKLOG.md) § Sprint 31 Completed
- **Project-Architecture:** [`docs/architecture/ARCHITECTURE.md`](../../architecture/ARCHITECTURE.md)
- **ADR-Log:** [`docs/architecture/CHANGELOG.md`](../../architecture/CHANGELOG.md)
- **Marketing-Briefing (Single Source of Truth):** [`docs/marketing/MARKETING_BRIEFING.md`](../../marketing/MARKETING_BRIEFING.md)
- **Brand-Spec:** [`docs/brand_spec/BRAND_SPEC.md`](../../brand_spec/BRAND_SPEC.md)
- **CSP-Handover (für Path C):** [`docs/superpowers/handovers/2026-05-04-csp-introduction-handover.md`](./2026-05-04-csp-introduction-handover.md)
- **ROI-Rechner-Plan (Vorlage für #75):** [`docs/superpowers/plans/2026-05-11-roi-rechner-inline.md`](../plans/2026-05-11-roi-rechner-inline.md)

---

*Erstellt von Claude Opus 4.7 (1M context) am Ende der Sprint-31-Session. Bei Unklarheiten: dieses File ist die kanonische Sprint-32-Spec — bei Konflikt mit anderen Quellen, hier nachlesen.*
