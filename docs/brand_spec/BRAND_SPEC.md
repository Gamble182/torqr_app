# Torqr – Brand Spec

Übergabe-Dokument für den Coding-Agenten.
Alle Design-Entscheidungen sind hier final dokumentiert.

---

## Icon

**Konzept:** Puls / Diagnose-Linie
**Bedeutung:** Anlage wird geprüft, Zustand wird überwacht
**Datei:** `TorqrIcon.tsx`

```
SVG viewBox: 0 0 96 96
Hintergrund: rect rx="22" → abgerundetes Quadrat (iOS-Style)
Puls-Linie:  polyline, stroke white, strokeWidth 5.5
Akzent-Dot:  circle cx=54 cy=58 r=6, fill #EF9F27
```

**Varianten:**
| Variant   | Hintergrund              | Verwendung                        |
|-----------|--------------------------|-----------------------------------|
| `default` | `#008000`                | Standard überall                  |
| `dark`    | `#004D00`                | Auf hellen Hintergründen          |
| `ghost`   | `rgba(255,255,255,0.15)` | Auf grünem Hintergrund (Header)   |

**Größen:**
| Size  | px  | Verwendung              |
|-------|-----|-------------------------|
| `sm`  | 20  | Favicon, kleine Icons   |
| `md`  | 32  | Navigation, Listen      |
| `lg`  | 48  | Cards, Spaltenköpfe     |
| `xl`  | 72  | Splash, Onboarding      |
| `2xl` | 96  | App Store Icon          |

---

## Farben

### Primär – Grün
| Token              | Hex       | Tailwind-Klasse      |
|--------------------|-----------|----------------------|
| `brand.primary`    | `#008000` | `bg-brand`           |
| `brand.primaryDark`| `#006600` | `bg-brand-600`       |
| `brand.primaryDeep`| `#004D00` | `bg-brand-700`       |
| `brand.surface`    | `#E6F2E6` | `bg-brand-50`        |

### Akzent – Bernstein
| Token               | Hex       | Tailwind-Klasse       |
|---------------------|-----------|-----------------------|
| `brand.accent`      | `#EF9F27` | `bg-accent`           |
| `brand.accentLight` | `#FAC775` | `bg-accent-light`     |
| `brand.accentSurface`|`#FAEEDA` | `bg-accent-surface`   |

### Status-Semantik
| Status    | bg        | border    | text      | Bedeutung         |
|-----------|-----------|-----------|-----------|-------------------|
| ok        | `#E6F2E6` | `#99CC99` | `#006600` | Gewartet, OK      |
| due       | `#FAEEDA` | `#FAC775` | `#633806` | Wartung bald      |
| overdue   | `#FAECE7` | `#F5C4B3` | `#712B13` | Überfällig        |
| info      | `#E6F1FB` | `#B5D4F4` | `#0C447C` | Hinweis / Info    |

---

## Typografie

```css
font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
```

**Strategie:** System-Font-Stack
- Windows → Segoe UI (nativ)
- macOS / iOS → San Francisco (nativ via system-ui / -apple-system)
- Android / Linux → jeweiliger System-Font

**Gewichte:**
- `400` Regular – Fließtext, Labels
- `500` Medium – Subheadings, Buttons
- `600` Semibold – Headlines, Wordmark

---

## Border Radius

| Token  | Wert   | Verwendung                   |
|--------|--------|------------------------------|
| `sm`   | `6px`  | Chips, Badges, kleine Inputs |
| `md`   | `8px`  | Buttons, Inputs              |
| `lg`   | `12px` | Cards, Modals                |
| `xl`   | `16px` | Bottom Sheets                |
| `2xl`  | `22px` | App-Icon Hintergrund         |
| `full` | `9999px` | Pills, Avatare             |

---

## Komponenten

### `<TorqrIcon />`
```tsx
import { TorqrIcon } from "@/components/brand/TorqrIcon";

<TorqrIcon size="lg" />
<TorqrIcon size="sm" variant="ghost" />
<TorqrIcon size={40} variant="dark" />
```

### `<TorqrWordmark />`
```tsx
import { TorqrWordmark } from "@/components/brand/TorqrIcon";

<TorqrWordmark size="md" theme="light" />
<TorqrWordmark size="sm" theme="dark" showTagline={false} />
<TorqrWordmark size="lg" theme="green" />
```

---

## Email-Template

**Datei:** `email-template.html`

**Platzhalter zum Ersetzen:**
| Platzhalter          | Beschreibung                        |
|----------------------|-------------------------------------|
| `{{KUNDE_ANREDE}}`   | Herr / Frau                         |
| `{{KUNDE_NAME}}`     | Nachname des Kunden                 |
| `{{ANLAGE_TYP}}`     | z.B. "Viessmann Vitodens 200"       |
| `{{ANLAGE_BAUJAHR}}` | z.B. "2019"                         |
| `{{LETZTE_WARTUNG}}` | z.B. "März 2024"                    |
| `{{ANLAGE_STANDORT}}`| Adresse / Raum                      |
| `{{TERMIN_URL}}`     | Buchungs-Link                       |
| `{{EMPFOHLEN_BIS}}`  | z.B. "April 2025"                   |
| `{{TECHNIKER_NAME}}` | Name des Technikers                 |
| `{{TECHNIKER_FIRMA}}`| Firmenname                          |
| `{{TECHNIKER_TELEFON}}`| Telefonnummer                     |
| `{{TECHNIKER_EMAIL}}`| E-Mail-Adresse                      |
| `{{ABMELDEN_URL}}`   | Unsubscribe-Link                    |

---

## Dateistruktur (Empfehlung für das Projekt)

```
src/
  components/
    brand/
      TorqrIcon.tsx       ← Icon + Wordmark Komponenten
  styles/
    brand.config.ts       ← Design Tokens
  emails/
    email-template.html   ← Wartungs-Email Template
tailwind.config.ts        ← Tailwind mit Brand Tokens
```
