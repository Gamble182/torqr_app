# Kostenaufstellung & Preisgestaltung
## Torqr - Wartungsmanagement-App

**Erstellt für**: Max
**Datum**: 14. Januar 2026
**Version**: 1.0

---

## Zusammenfassung

Diese Kostenaufstellung bietet eine transparente Übersicht über den tatsächlichen Wert der entwickelten Torqr-Anwendung. Sie basiert auf realistischen Marktpreisen für vergleichbare Softwareentwicklungsdienstleistungen und berücksichtigt den Umfang, die Komplexität und die Qualität der implementierten Lösung.

**Vorgeschlagene Zahlungsstruktur:**
- **Phase 1 (sofort)**: 2.000 € – Entwicklungsanteil & Risikoübernahme
- **Phase 2 (nach 6 Monaten Testphase)**: 3.000 € – Bei Zufriedenheit & weiterem Einsatz
- **Gesamt**: 5.000 € (einmalig)

Diese gestaffelte Zahlungsweise ermöglicht es dir, die Anwendung risikofrei zu testen und nur bei echtem Mehrwert vollständig zu investieren.

---

## 1. Projektumfang & Leistungen

### 1.1 Entwickelte Features

Die Torqr-App ist eine vollständig funktionale **Progressive Web App (PWA)** mit folgenden Hauptfunktionen:

#### **Kundenverwaltung**
- Vollständige CRUD-Funktionalität (Erstellen, Lesen, Aktualisieren, Löschen)
- Erweiterte Suchfunktion (Name, E-Mail, Stadt, PLZ)
- 11 verschiedene Heizsystem-Typen
- 3 zusätzliche Energiequellen (Photovoltaik, Solarthermie, Kleinwindanlage)
- 3 Energiespeichersysteme (Batterie-, Wärme-, Warmwasserspeicher)
- Detaillierte Kundenprofile mit Statistiken

#### **Heizsystem-Verwaltung**
- Über 50 vorkonfigurierte Hersteller
- Über 100 Modellvarianten in kaskadierende Dropdown-Menüs
- Technische Detaildaten (Seriennummer, Leistung, Baujahr)
- Wärmespeicher- und Batteriespeicher-Konfiguration
- Wartungsintervall-Management (1-24 Monate)
- Automatische Berechnung der nächsten Wartungstermine

#### **Wartungsverwaltung**
- Wartungsdokumentation mit Datum und Notizen
- Foto-Upload (bis zu 5 Fotos pro Wartung)
- Vollständige Wartungshistorie mit Bildergalerie
- Automatische Aktualisierung der Wartungstermine
- Farbcodierte Dringlichkeitsstufen (OK, Bald fällig, Überfällig)

#### **Dashboard & Reporting**
- Echtzeit-Statistiken (Kunden, Heizsysteme, Wartungen)
- Kalenderansicht für anstehende Wartungen
- Zeitraum-Filter (7 Tage, 30 Tage, 3/6 Monate)
- Übersicht der letzten Wartungen
- Schnellaktionen ("Erledigt"-Button direkt vom Dashboard)

#### **Mobile-First Design**
- Optimiert für Smartphone-Nutzung vor Ort
- Click-to-Call Funktionalität
- Responsive Design für alle Bildschirmgrößen
- Touch-optimierte Bedienelemente (min. 44px)
- PWA-Funktionalität (installierbar auf dem Home Screen)

#### **Sicherheit & Datenschutz**
- Benutzer-Authentifizierung (Login/Register)
- Passwort-Hashing mit bcrypt
- JWT-basiertes Session-Management
- DSGVO-konforme Datenspeicherung
- Input-Validierung zur Verhinderung von Sicherheitslücken
- SSL-Verschlüsselung über HTTPS

### 1.2 Technische Qualität

#### **Moderne Technologie-Stack**
- **Frontend**: Next.js 16, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 mit konsistentem Design-System
- **State Management**: TanStack Query v5 (optimiertes Caching)
- **Backend**: Next.js API Routes mit Prisma ORM 7
- **Datenbank**: PostgreSQL auf Supabase (mit automatischen Backups)
- **Deployment**: Vercel (globales CDN, automatische SSL-Zertifikate)

#### **Best Practices**
- Vollständige TypeScript-Typisierung (100% Type Safety)
- Component-basierte Architektur (45+ wiederverwendbare Komponenten)
- Optimiertes Caching (5 Minuten Stale Time)
- Code Splitting für schnelle Ladezeiten
- 170+ erfolgreich durchgeführte Testfälle
- ESLint & Prettier für konsistenten Code-Style

#### **Performance**
- First Contentful Paint: < 1,5 Sekunden
- Time to Interactive: < 3,0 Sekunden
- Bundle Size: ~150 KB (gzipped)
- Lighthouse Score: 90+ (Performance)
- Automatisches Bild-Optimization
- Server-Side Rendering (SSR)

### 1.3 Projektmetriken

- **Entwicklungszeitraum**: 8 Wochen (November 2025 - Januar 2026)
- **Entwicklungsstunden**: 50-70 Stunden (netto Entwicklungszeit)
- **Lines of Code**: ~15.000 LOC
- **React Components**: 45+ Komponenten
- **API Endpoints**: 20+ REST Endpoints
- **Datenbank-Tabellen**: 5 Haupttabellen mit Relationen

---

## 2. Kostenaufstellung nach Marktwerten

### 2.1 Berechnung nach Stundensatz

Für die Entwicklung einer maßgeschneiderten PWA mit diesem Funktionsumfang sind in der Branche folgende Stundensätze üblich:

| Qualifikationsstufe | Stundensatz | Anmerkung |
|---------------------|-------------|-----------|
| Junior Developer | 50-70 € | 0-2 Jahre Erfahrung |
| Mid-Level Developer | 70-100 € | 3-5 Jahre Erfahrung |
| Senior Developer | 100-140 € | 5+ Jahre Erfahrung |
| Freelance Developer | 80-150 € | Je nach Spezialisierung |
| Agentur | 100-200 € | Inklusive Projektmanagement |

**Deine Hauptberufliche Position**: 110-125 €/Stunde

Bei einer realistischen **Entwicklungszeit von 60 Stunden** (Mittelwert aus 50-70h):

| Szenario | Stundensatz | Berechnung | Gesamtkosten |
|----------|-------------|------------|--------------|
| Mindestpreis | 70 € | 60h × 70 € | 4.200 € |
| **Realistische Basis** | **90 €** | **60h × 90 €** | **5.400 €** |
| Dein Hauptberuf | 110 € | 60h × 110 € | 6.600 € |
| Agenturpreis | 120 € | 60h × 120 € | 7.200 € |

**Vorgeschlagener Preis**: 5.000 € liegt im **unteren bis mittleren Bereich** und ist damit fair kalkuliert.

### 2.2 Pauschalpreise für vergleichbare Projekte

Für maßgeschneiderte Web-Anwendungen mit ähnlichem Funktionsumfang werden in Deutschland üblicherweise folgende Pauschalpreise berechnet:

| Projekttyp | Preisspanne | Beschreibung |
|------------|-------------|--------------|
| Einfaches CMS/Admin-Dashboard | 2.000-5.000 € | Basis CRUD-Funktionen |
| Business-App (MVP) | 5.000-10.000 € | Mehrere Module, Auth, Dashboard |
| **Custom PWA (wie Torqr)** | **8.000-15.000 €** | Mobile-optimiert, komplex |
| Enterprise-Lösung | 15.000-50.000 € | Mehrere Teams, hohe Komplexität |
| SaaS-Plattform | 30.000-100.000+ € | Multi-Tenant, Subscriptions |

**Vergleich**: Eine vergleichbare PWA mit diesem Funktionsumfang würde bei einer Agentur zwischen **8.000 € und 15.000 €** kosten.

### 2.3 Vergleich mit bestehenden Lösungen

Alternativ zu einer individuellen Entwicklung könntest du fertige Wartungsmanagement-Software nutzen:

| Anbieter/Lösung | Kosten (Jahr 1) | Einschränkungen |
|-----------------|-----------------|-----------------|
| Planday (Schichtplanung + Wartung) | ~1.200-2.400 €/Jahr | Nicht spezialisiert, monatliche Kosten |
| Feld Service Management (z.B. mHelpDesk) | ~1.800-3.600 €/Jahr | Generische Lösung, keine Anpassung |
| Custom CRM + Wartungsmodul | ~3.000-8.000 € Setup | Wartungskosten zusätzlich |
| **Torqr (maßgeschneidert)** | **5.000 € (einmalig)** | Vollständig angepasst, keine laufenden Kosten |

**Vorteil Torqr**: Nach 2-3 Jahren ist die Investition bereits günstiger als Abo-Modelle, und du besitzt den vollständigen Code.

---

## 3. Mehrwert & ROI-Betrachtung

### 3.1 Zeitersparnis im Alltag

Die App automatisiert und vereinfacht viele manuelle Prozesse:

| Tätigkeit | Vorher (pro Woche) | Mit Torqr (pro Woche) | Ersparnis |
|-----------|---------------------|------------------------|-----------|
| Wartungen planen | 30 Min. | 5 Min. | 25 Min. |
| Wartung dokumentieren | 3 Min./Wartung × 10 = 30 Min. | 1 Min./Wartung × 10 = 10 Min. | 20 Min. |
| Kunden kontaktieren | 20 Min. | 5 Min. | 15 Min. |
| Daten suchen/nachschlagen | 15 Min. | 2 Min. | 13 Min. |
| **Gesamt pro Woche** | **~95 Min.** | **~22 Min.** | **~73 Min. (1,2h)** |

**Hochrechnung aufs Jahr**:
- 73 Minuten/Woche × 48 Arbeitswochen = **3.504 Minuten = ~58 Stunden/Jahr**
- Bei einem Stundensatz von 80 €/h: **4.640 € eingesparte Arbeitszeit pro Jahr**

**ROI nach 1 Jahr**: Die App hat sich bereits nach etwa **1 Jahr** amortisiert.

### 3.2 Reduzierte Fehlerquote

Manuelle Systeme (Excel, Papier) sind anfällig für:
- Vergessene Wartungstermine → Unzufriedene Kunden, potenzielle Haftung
- Falsche Daten oder verlorene Informationen → Zeitverlust
- Fehlende Dokumentation → Rechtliche Risiken

**Torqr minimiert diese Risiken durch**:
- Automatische Wartungstermin-Berechnung
- Zentrale, sichere Datenspeicherung
- Foto-Dokumentation für Nachweispflicht
- DSGVO-konforme Archivierung

### 3.3 Professionelles Image

Eine moderne, mobile App signalisiert Professionalität gegenüber Kunden:
- Schnelle Wartungsdokumentation vor Ort
- Direkte Terminvergabe
- Transparente Wartungshistorie

Dies kann zu **höherer Kundenzufriedenheit** und **Weiterempfehlungen** führen.

---

## 4. Zukünftige Erweiterungen (nicht im Preis enthalten)

Die App ist bereits produktionsreif, kann aber bei Bedarf erweitert werden:

### 4.1 Geplante Features (optional)

| Feature | Beschreibung | Geschätzter Aufwand | Geschätzte Kosten |
|---------|--------------|---------------------|-------------------|
| **Email-Automatisierung** | Automatische Wartungserinnerungen per E-Mail | 8-12h | 800-1.200 € |
| **PDF-Exporte** | Wartungsberichte als PDF generieren | 6-8h | 600-800 € |
| **Kalender-Integration** | Google/Outlook Calendar Sync | 10-15h | 1.000-1.500 € |
| **Team-Features** | Mehrere Techniker, Rollen & Berechtigungen | 15-20h | 1.500-2.000 € |
| **Offline-Modus** | Nutzung ohne Internetverbindung | 12-18h | 1.200-1.800 € |
| **Native Mobile App** | iOS & Android App (React Native) | 40-60h | 4.000-6.000 € |

**Wichtig**: Diese Features sind nicht im aktuellen Preis enthalten und würden bei Bedarf separat kalkuliert.

### 4.2 Langfristige Skalierung

Für eine zukünftige **Vermarktung** der App an andere Heizungstechniker wären folgende Erweiterungen sinnvoll:

- Multi-Tenant-Architektur (mehrere Unternehmen auf einer Plattform)
- Subscription-Modell (monatliche Zahlungen)
- White-Label-Lösung (anpassbares Branding)
- Erweiterte Reporting & Analytics

**Geschätzter Aufwand**: 80-120 Stunden (8.000-12.000 €)

Diese Investition würde sich lohnen, sobald mehrere zahlende Kunden gewonnen werden.

---

## 5. Kostenvergleich: Eigenentwicklung vs. Agentur

### 5.1 Was du gespart hast

Hätte eine externe Agentur das Projekt übernommen, wären folgende Kosten angefallen:

| Position | Agenturpreis | Dein Preis | Ersparnis |
|----------|--------------|------------|-----------|
| Konzeption & Planung | 1.500 € | — | 1.500 € |
| UI/UX Design | 2.000 € | — | 2.000 € |
| Frontend-Entwicklung | 4.500 € | — | 4.500 € |
| Backend-Entwicklung | 3.000 € | — | 3.000 € |
| Testing & QA | 1.500 € | — | 1.500 € |
| Deployment & Dokumentation | 1.000 € | — | 1.000 € |
| Projektmanagement (15%) | 2.025 € | — | 2.025 € |
| **Gesamt (Agentur)** | **15.525 €** | **5.000 €** | **10.525 €** |

**Dein Vorteil**: Du erhältst eine maßgeschneiderte Lösung zu einem **Freundschaftspreis**, der etwa **32% des Marktwertes** entspricht.

### 5.2 Warum dieser Preis möglich ist

Der reduzierte Preis ist möglich durch:

1. **Persönliche Partnerschaft**: Keine Agentur-Overheads, direkter Kontakt
2. **Effiziente Entwicklung**: Moderne Tools und Best Practices verkürzen die Entwicklungszeit
3. **Langfristige Perspektive**: Potenzial für gemeinsame Firma und Weiterentwicklung
4. **Risikoverteilung**: Gestaffelte Zahlung ermöglicht dir risikofreies Testen

---

## 6. Zahlungsstruktur & Konditionen

### 6.1 Empfohlene Zahlungsaufteilung

**Phase 1: Sofortige Rechnung (2.000 €)**
- Abdeckung des initialen Entwicklungsaufwands
- Risikoübernahme für Konzeption und Implementierung
- Fällig bei Übergabe der Anwendung

**Phase 2: Nach 6 Monaten Testphase (3.000 €)**
- Fällig bei Zufriedenheit und weiterem Einsatz
- Abdeckung zusätzlicher Features und Optimierungen während der Testphase
- Nur bei echtem Mehrwert für dich

**Gesamtpreis: 5.000 € (einmalig)**

### 6.2 Was ist im Preis enthalten?

✅ Vollständig funktionale PWA (Production-Ready)
✅ Alle in Kapitel 1.1 aufgeführten Features
✅ Deployment auf Vercel (inklusive SSL, CDN)
✅ Supabase-Datenbank (1 Jahr kostenlos, danach ~25 €/Monat)
✅ Vollständige Dokumentation
✅ 170+ durchgeführte Testfälle
✅ Source Code (vollständiger Zugriff)

### 6.3 Was ist NICHT im Preis enthalten?

❌ Laufender Support nach der Testphase (siehe Kapitel 6.4)
❌ Zukünftige Feature-Erweiterungen (siehe Kapitel 4)
❌ Server- & Hosting-Kosten (Vercel & Supabase, aktuell kostenlos)
❌ Schulung & Einführung (optional buchbar)

### 6.4 Support-Optionen (zur Diskussion)

Für die Zeit nach der 6-monatigen Testphase gibt es verschiedene Optionen:

**Option 1: Inklusiv-Support (empfohlen für Partnerschaft)**
- Kleinere Bugfixes und Anpassungen kostenlos
- Größere Features werden separat berechnet
- Geeignet bei langfristiger gemeinsamer Firmen-Planung

**Option 2: Bezahlter Support-Vertrag**
- Monatliche Pauschale (z.B. 100-200 €/Monat)
- Inklusive: Bugfixes, kleinere Anpassungen, Server-Monitoring
- Exklusive: Neue Features (werden stundenweise berechnet)

**Option 3: On-Demand Support**
- Stundensatz 80-100 €/Stunde
- Nur bei Bedarf abgerechnet
- Keine monatlichen Fixkosten

**Empfehlung**: Zunächst **Option 1** für die erste 6-12 Monate, dann Neubewertung basierend auf dem tatsächlichen Support-Bedarf und der Firmen-Perspektive.

---

## 7. Vergleich: Marktpreis vs. Freundschaftspreis

### 7.1 Übersicht

| Position | Marktwert | Dein Preis | Differenz |
|----------|-----------|------------|-----------|
| Entwicklungszeit (60h à 90 €) | 5.400 € | — | — |
| Konzeption & Planung | 1.500 € | — | — |
| Testing & QA | 1.000 € | — | — |
| Dokumentation | 800 € | — | — |
| **Gesamtwert (Markt)** | **8.700 €** | **5.000 €** | **-3.700 €** |
| **Rabatt** | — | — | **~43%** |

### 7.2 Transparenz

Der reduzierte Preis ist ein **Freundschaftspreis** und berücksichtigt:

- Unsere persönliche Beziehung
- Dein Vertrauen in mich als Entwickler
- Potenzial für zukünftige gemeinsame Geschäftsaktivitäten
- Deine Rolle als "Early Adopter" und Feedback-Geber

**Dennoch**: Der Preis liegt nicht unter meinem Mindest-Stundensatz (70-90 €/h) und ist wirtschaftlich fair.

---

## 8. Nächste Schritte

### 8.1 Sofort (Januar 2026)

1. **Rechnungsstellung Phase 1**: 2.000 € (netto)
2. **Live-Demo & Einführung**: Gemeinsame Session zur Funktionsübersicht
3. **Produktiv-Start**: Erste echte Kunden und Wartungen anlegen

### 8.2 Während der Testphase (Januar - Juli 2026)

1. **Feedback sammeln**: Was funktioniert gut? Was fehlt?
2. **Kleinere Anpassungen**: Bugfixes und Optimierungen (inkludiert)
3. **Feature-Priorisierung**: Welche Erweiterungen sind am wichtigsten?

### 8.3 Nach 6 Monaten (Juli 2026)

1. **Evaluierung**: Ist die App ein echter Mehrwert?
2. **Rechnungsstellung Phase 2**: 3.000 € (netto) bei Zufriedenheit
3. **Support-Modell festlegen**: Inklusiv vs. Bezahlvertrag
4. **Firmen-Planung**: Gespräch über gemeinsame Vermarktung

---

## 9. Fazit

### 9.1 Warum ist dieser Preis fair?

✅ **Realistische Marktpreise**: 5.000 € liegen im unteren bis mittleren Bereich für vergleichbare Projekte
✅ **Qualität**: Moderne Technologie, Best Practices, Production-Ready
✅ **Transparenz**: Nachvollziehbare Berechnung basierend auf Stundensatz und Marktwerten
✅ **Risikoverteilung**: Gestaffelte Zahlung mit 6-monatiger Testphase
✅ **ROI**: Die App amortisiert sich nach etwa 1 Jahr durch Zeitersparnis

### 9.2 Warum ist es ein gutes Angebot?

🎯 **Marktwert**: Eine vergleichbare Agentur-Lösung würde 8.000-15.000 € kosten
🎯 **Freundschaftspreis**: ~43% unter Marktwert, aber fair kalkuliert
🎯 **Kein Risiko**: Nur 2.000 € initial, Rest nach erfolgreicher Testphase
🎯 **Zukunftspotenzial**: Basis für gemeinsame Firma und Weitervermarktung

### 9.3 Was passiert als Nächstes?

1. **Rechnung Phase 1**: 2.000 € (Entwicklungsanteil)
2. **Live-Demo**: Funktionen gemeinsam durchgehen
3. **Testphase**: 6 Monate intensives Testen im Alltag
4. **Rechnung Phase 2**: 3.000 € (bei Zufriedenheit)
5. **Langfristige Partnerschaft**: Gespräche über Firma, Support & Vermarktung

