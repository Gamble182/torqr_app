# Torqr Wordmark Asset Set

Standalone SVG-Wordmarks für externe Verwendung — Outbound-Materialien, E-Mail-Signaturen, Pitchdecks, Print-Drucksachen, Innungs-/Kammer-Materialien. **Nicht für In-App-Verwendung** — dort `<TorqrWordmark />` aus [`src/components/brand/TorqrIcon.tsx`](../../../src/components/brand/TorqrIcon.tsx) nutzen.

## Varianten

| Datei | Verwendung | Hintergrund |
|---|---|---|
| `wordmark-horizontal.svg` | Default. E-Mail-Footer, Web-Embeds, Header. Breite : Höhe ≈ 3,3 : 1. | Hell (weiß / brand-50 / hell-grau) |
| `wordmark-vertical.svg` | Quadratische Surfaces — Social-Profile, Stempel, Avatar-Kacheln, Print-Kopfzeile auf engen Spalten. Breite : Höhe ≈ 1,25 : 1. | Hell |
| `wordmark-monochrome-black.svg` | Schwarzweiß-Print, Faxe, Drucksachen ohne Farbverwendung, Embossed-Print. Icon als Outline (keine Fläche). | Hell |
| `wordmark-monochrome-white.svg` | "Negativ" — Wordmark in Weiß auf dunklem Hintergrund. Pitchdeck-Cover, dunkle Hero-Surfaces, dunkle Photo-Overlays. | **Dunkel** (schwarz / brand-700+ / dunkler Photo-Overlay) |

## Farb-Anker

| Element | Color-Variant | Mono-Black | Mono-White |
|---|---|---|---|
| Icon-BG (rect) | `#008000` Brand-Green Fill | Outline `#000`, kein Fill | Outline `#FFF`, kein Fill |
| Polyline (Wartungs-Signal) | `#FFFFFF` | `#000000` | `#FFFFFF` |
| Amber-Dot | `#EF9F27` | weggelassen (single-color) | weggelassen (single-color) |
| Text "torqr" | `#1A1A1A` | `#000000` | `#FFFFFF` |
| Tagline | `#008000` | `#000000` | `#FFFFFF` |

## Typografie

Beide Text-Elemente nutzen `'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`. Auf Windows + Office-Maschinen rendert lokal installiertes Segoe UI; Mac/Linux fallen auf System-Fonts (San Francisco / DejaVu) zurück.

**Wichtig für Druck-/Pitchdeck-Auslieferung:** Wenn pixel-identisches Rendering über alle Empfänger-Systeme garantiert sein muss, in Adobe Illustrator / Inkscape öffnen und Text-zu-Pfad konvertieren (*Schrift → in Pfade umwandeln*). Die hier ausgelieferten SVGs nutzen Live-Text für kleinere File-Größe und Editierbarkeit.

## Einbindung

```html
<!-- Direkt als <img> -->
<img src="https://torqr.de/brand/wordmark/wordmark-horizontal.svg" alt="torqr — Wartungsmanagement" width="200">

<!-- Als CSS-Background -->
<div style="background: url('/brand/wordmark/wordmark-horizontal.svg') center/contain no-repeat; height: 60px;"></div>

<!-- Inline (für Color-Manipulation via CSS currentColor — nur bei mono-Varianten sinnvoll) -->
<!-- Bei Inline-Verwendung müsste #000 / #FFF durch currentColor ersetzt werden — bewusst nicht im File, weil Outbound-Verteilung Klartext-Farbe braucht. -->
```

## Niemals

- Wordmark verzerren (nur proportional skalieren).
- Eigenes Layout neu bauen — wenn eine andere Anordnung gebraucht wird, neue Variante hier anlegen, nicht ad-hoc komponieren.
- Farben modifizieren — die Color-Variante ist `#008000` Brand-Green. Andere Greens, Blau-Tönungen oder Saturation-Anpassungen sind off-brand.
- Mono-Black auf farbigen Hintergrund packen — nutze stattdessen die Color-Variante.
- Mono-White auf hellen Hintergrund packen — wird unsichtbar.

## Source of Truth

Die in diesen SVGs genutzten Geometrie-Werte (Polyline-Punkte, Amber-Dot-Position, Border-Radius) **müssen identisch zur React-Komponente** [`src/components/brand/TorqrIcon.tsx`](../../../src/components/brand/TorqrIcon.tsx) bleiben. Wenn sich dort etwas ändert, hier nachziehen — sonst driften die externe und die in-App-Wordmark auseinander.

Brand-Spec mit Farb-Tokens und Typo-System: [`docs/brand_spec/BRAND_SPEC.md`](../../../docs/brand_spec/BRAND_SPEC.md).
