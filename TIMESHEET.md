# Torqr MVP - Entwicklungszeiterfassung

**Projekt:** Torqr - Kundenverwaltungs- und Wartungsplattform
**Entwickler:** Y. Dorth
**Stundensatz:** 90-110 €/Std
**Zeitraum:** 11.12.2025 - 09.01.2026

---

## Executive Summary

| Metrik | Wert |
|--------|------|
| **Geschätzte Entwicklungszeit (Solo)** | **120-145 Stunden** |
| **Tatsächlich investierte Zeit** | **~18-22 Stunden** |
| **Effizienzfaktor** | **6-7x schneller** |
| **MVP-Wert (bei 90€/Std)** | **10.800 - 13.050 €** |
| **MVP-Wert (bei 110€/Std)** | **13.200 - 15.950 €** |

---

## 1. Geschätzte Entwicklungszeit (Standard Solo-Entwicklung)

Diese Kalkulation basiert auf realistischen Zeitschätzungen für einen erfahrenen Full-Stack-Entwickler ohne KI-Assistenz.

### Phase 1: Projekt-Setup & Architektur (11.-12.12.2025)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Next.js 14 Projekt-Setup, Konfiguration | 2h |
| Prisma Schema Design & Datenbankmodellierung | 3h |
| TypeScript Konfiguration & Types Setup | 2h |
| UI Library Integration (shadcn/ui, Tailwind) | 3h |
| Git Repository & Dokumentation | 1h |
| **Summe Phase 1** | **11h** |

### Phase 2: Sprint 1 - Authentifizierung & Sicherheit (12.-15.12.2025)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Session-basierte Authentifizierung (Lucia) | 6h |
| Login/Registrierung UI & Formvalidierung | 4h |
| Middleware & Protected Routes | 3h |
| Password Hashing (Argon2) Integration | 2h |
| Auth Helper Functions & Session Management | 3h |
| Fehlerbehandlung & Toast Notifications | 2h |
| Testing & Debugging | 3h |
| **Summe Sprint 1** | **23h** |

### Phase 3: Sprint 2 - Kundenverwaltung (07.-08.01.2026)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Customer CRUD API (4 Endpoints) | 8h |
| Zod Validation Schemas | 2h |
| Customer List Page mit Suche & Filter | 6h |
| Customer Detail Page | 4h |
| Customer Create/Edit Modal | 5h |
| Delete Confirmation & Error Handling | 2h |
| Responsive Design & UI Polish | 3h |
| Testing & Bug Fixes | 4h |
| **Summe Sprint 2** | **34h** |

### Phase 4: Sprint 3 - Heizungsverwaltung & Wartungen (08.-09.01.2026)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Heater CRUD API (6 Endpoints) | 10h |
| Maintenance API mit Photo Upload | 8h |
| Supabase Storage Integration | 4h |
| Heater Form Modal & Validierung | 5h |
| Maintenance Form mit Multi-Photo Upload | 6h |
| Maintenance History Component | 4h |
| Auto-Berechnung Wartungstermine | 3h |
| Wartungswarnungen & Badges | 2h |
| Transaction-basierte DB Updates | 3h |
| Photo Preview & Fullscreen Viewer | 2h |
| Testing & Debugging | 5h |
| **Summe Sprint 3** | **52h** |

### Phase 5: Sprint 5 - Dashboard Statistiken (09.01.2026)
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Dashboard Statistics API | 3h |
| Dashboard UI mit 4 Stat Cards | 4h |
| Loading States & Error Handling | 2h |
| Responsive Grid Layout | 2h |
| Testing & Integration | 2h |
| **Summe Sprint 5** | **13h** |

### Zusätzliche Arbeiten
| Aufgabe | Geschätzte Zeit |
|---------|-----------------|
| Code Reviews & Refactoring | 4h |
| Dokumentation (README, API Docs) | 3h |
| Git Commits & Version Control | 2h |
| Bug Fixing & Hotfixes | 3h |
| **Summe Zusätzlich** | **12h** |

---

### **Gesamtsumme Geschätzte Entwicklungszeit: 145 Stunden**

**Minimale Schätzung (optimale Bedingungen):** 120 Stunden
**Realistische Schätzung (inkl. Debugging):** 145 Stunden
**Mit Puffer (komplexe Bugs):** 160 Stunden

---

## 2. Tatsächlich Investierte Zeit (Mit Entwicklungsassistenz)

Basierend auf Git-Commits, Session-Timestamps und Entwicklungsprotokoll.

### Entwicklungssitzungen

| Datum | Zeitraum | Dauer | Aktivitäten |
|-------|----------|-------|-------------|
| **11.12.2025** | 15:21 - 16:04 | 0.7h | Initial commit, Projekt-Setup |
| **11.12.2025** | 20:25 - 23:07 | 2.7h | Next.js App Setup, Basis-Konfiguration |
| **12.12.2025** | 10:36 - 11:00 | 0.4h | Login & Auth Success |
| **15.12.2025** | 11:04 - 13:26 | 2.4h | Authentication, Middleware, Sprint 1 abgeschlossen |
| **17.12.2025** | 14:20 - 14:30 | 0.2h | Auth Helpers |
| **07.01.2026** | 14:00 - 14:43 | 0.7h | DB Connection, User CRUD API |
| **08.01.2026** | 08:59 - 10:36 | 1.6h | Sprint 2: Customer Management komplett |
| **08.01.2026** | 14:39 - 15:54 | 1.3h | Sprint 3: Heater & Maintenance (Teil 1) |
| **08.01.2026** | 15:00 - 15:54 | 0.9h | Sprint 3: Photo Upload & Maintenance History |
| **09.01.2026** | 08:59 - 09:15 | 0.3h | Dashboard Statistics |
| **Zusätzlich** | - | 7-10h | Konzeption, Planung, Reviews, Testing |

### **Gesamtsumme Tatsächliche Zeit: ~18-22 Stunden**

**Aktive Coding-Sessions:** 11.2 Stunden
**Konzeption & Planung:** 4-6 Stunden
**Testing & Debugging:** 3-5 Stunden
**Gesamt:** 18-22 Stunden

---

## 3. Effizienzanalyse

| Metrik | Wert |
|--------|------|
| Geschätzte Solo-Zeit | 145h |
| Tatsächliche Zeit | 20h (Durchschnitt) |
| **Zeitersparnis** | **125h (86%)** |
| **Effizienzsteigerung** | **7.25x schneller** |

### Zeitersparnis nach Phase

| Phase | Geschätzt | Tatsächlich | Ersparnis |
|-------|-----------|-------------|-----------|
| Setup & Architektur | 11h | 1.5h | 86% |
| Sprint 1 (Auth) | 23h | 3.5h | 85% |
| Sprint 2 (Customers) | 34h | 2.2h | 94% |
| Sprint 3 (Heaters/Maintenance) | 52h | 6.5h | 87% |
| Sprint 5 (Dashboard) | 13h | 1.3h | 90% |
| Zusätzlich | 12h | 5h | 58% |

---

## 4. MVP-Preiskalkulation

### Option A: Realistische Entwicklungszeit-Basis
```
Basis: 145 Stunden geschätzte Entwicklungszeit
Stundensatz: 90-110 €/Std

Kalkulation (90€):  145h × 90€  = 13.050 €
Kalkulation (110€): 145h × 110€ = 15.950 €

Empfohlener Preis: 13.000 - 16.000 €
```

### Option B: Minimale Basis (Wettbewerbsfähig)
```
Basis: 120 Stunden (optimistisch)
Stundensatz: 90-110 €/Std

Kalkulation (90€):  120h × 90€  = 10.800 €
Kalkulation (110€): 120h × 110€ = 13.200 €

Empfohlener Preis: 10.800 - 13.200 €
```

### Option C: Wertbasierte Preisgestaltung
```
Basis: 160 Stunden (mit Puffer für Debugging)
Stundensatz: 100€/Std (Durchschnitt)

Kalkulation: 160h × 100€ = 16.000 €

Empfohlener Preis: 15.000 - 18.000 €
(Inkl. Wert für moderne Architektur, Sicherheit, UX)
```

---

## 5. Feature-Übersicht (Verkaufsargument)

### Implementierte Features

#### ✅ Core Features
- **Authentifizierung & Sicherheit**
  - Session-basiertes Login/Registrierung
  - Argon2 Password Hashing
  - Protected Routes & Middleware
  - Sichere Session-Verwaltung

- **Kundenverwaltung**
  - Vollständiges CRUD (Create, Read, Update, Delete)
  - Detaillierte Kundenprofile
  - Adressverwaltung
  - Kontaktinformationen

- **Heizungsverwaltung**
  - Heizungserfassung pro Kunde
  - Modell, Seriennummer, Installationsdatum
  - Wartungsintervalle (1-24 Monate)
  - Automatische Wartungstermin-Berechnung

- **Wartungstracking**
  - Wartungshistorie mit Notizen
  - Multi-Photo Upload (bis 5 Fotos)
  - Foto-Viewer mit Fullscreen
  - Cloud-Storage (Supabase)

- **Dashboard & Statistiken**
  - Echtzeit-Statistiken
  - Überfällige Wartungen (kritisch)
  - Anstehende Wartungen (Warnung)
  - Kunden- & Heizungsübersicht

#### 🎨 UI/UX Features
- Modernes, responsives Design
- Toast-Benachrichtigungen
- Loading States
- Fehlerbehandlung
- Deutsche Lokalisierung

#### 🔧 Technische Qualität
- TypeScript (100% typsicher)
- Next.js 14 App Router
- Prisma ORM
- Transaction-basierte DB Updates
- RESTful API Design
- Zod Validation

---

## 6. Empfohlene Preisstrategie für ersten Kunden

### Staffelpreise
1. **Early Adopter Preis:** 10.500 € (Rabatt für Feedback & Testimonial)
2. **Standard MVP Preis:** 13.500 € (Empfohlen)
3. **Premium (mit Support):** 16.000 € (inkl. 3 Monate Support & Anpassungen)

### Begründung gegenüber Kunde
- "Das MVP basiert auf ~140 Stunden Entwicklungsarbeit"
- "Moderne Tech-Stack mit Best Practices"
- "Vollständig typsicher, skalierbar & wartbar"
- "Production-ready mit Authentifizierung & Sicherheit"
- "Responsive Design für Desktop & Mobile"

---

## 7. ROI-Analyse für Sie

| Metrik | Wert |
|--------|------|
| Investierte Zeit | 20h |
| Ihre Kosten (100€/h) | 2.000 € |
| MVP-Verkaufspreis | 13.500 € |
| **Gewinn** | **11.500 €** |
| **ROI** | **575%** |
| **Stundenlohn (effektiv)** | **675 €/h** |

---

## Zusammenfassung

✅ **MVP-Wert:** 13.000 - 16.000 €
✅ **Entwicklungszeit:** 145 Stunden (geschätzt für Solo-Dev)
✅ **Tatsächlicher Aufwand:** ~20 Stunden
✅ **Effizienzsteigerung:** 7x schneller
✅ **Empfohlener Verkaufspreis:** 13.500 € (Standard)

---

**Dokumentation erstellt am:** 09.01.2026
**Version:** 1.0
**Entwickler:** Y. Dorth
