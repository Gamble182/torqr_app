import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

// Asserts that src/app/globals.css carries the design-system v3 tokens
// and the two brand-specific type helpers ported per docs/design-system/DELTA.md.
// This is a content-level test — it checks the CSS source as text, not its
// runtime application. The point is to catch typos/regressions in the token
// values, since a wrong hex breaks every status pill silently.

describe('Design System v3 — globals.css tokens', () => {
  const cssPath = path.join(__dirname, '../globals.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Light-mode status triplets (live in :root)
  test('OK status — v3 light triplet', () => {
    expect(css).toMatch(/--status-ok-bg:\s*#ECFDF3/);
    expect(css).toMatch(/--status-ok-border:\s*#067647/);
    expect(css).toMatch(/--status-ok-text:\s*#054F31/);
  });

  test('DUE status — v3 light triplet', () => {
    expect(css).toMatch(/--status-due-bg:\s*#FEF6E7/);
    expect(css).toMatch(/--status-due-border:\s*#B54708/);
    expect(css).toMatch(/--status-due-text:\s*#7A2E0E/);
  });

  test('OVERDUE status — v3 light triplet', () => {
    expect(css).toMatch(/--status-overdue-bg:\s*#FEF3F2/);
    expect(css).toMatch(/--status-overdue-border:\s*#B42318/);
    expect(css).toMatch(/--status-overdue-text:\s*#7A271A/);
  });

  test('INFO status — v3 light triplet', () => {
    expect(css).toMatch(/--status-info-bg:\s*#EFF4FF/);
    expect(css).toMatch(/--status-info-border:\s*#175CD3/);
    expect(css).toMatch(/--status-info-text:\s*#1E40AF/);
  });

  // Dark-mode status triplets — production already matches bundle target;
  // this is a regression guard against accidental dark-mode edits.
  test('OK status — dark triplet preserved', () => {
    expect(css).toMatch(/--status-ok-bg:\s*#1A2D1A/);
    expect(css).toMatch(/--status-ok-border:\s*#2D4D2D/);
    expect(css).toMatch(/--status-ok-text:\s*#4DA64D/);
  });

  // Brand-specific type helpers (D-3 — port .t-wordmark + .t-tagline only)
  test('.t-wordmark helper is defined', () => {
    expect(css).toMatch(/\.t-wordmark\s*\{[^}]*letter-spacing:\s*-1px[^}]*\}/);
    expect(css).toMatch(/\.t-wordmark\s*\{[^}]*text-transform:\s*lowercase[^}]*\}/);
    expect(css).toMatch(/\.t-wordmark\s*\{[^}]*font-weight:\s*600[^}]*\}/);
  });

  test('.t-tagline helper is defined', () => {
    expect(css).toMatch(/\.t-tagline\s*\{[^}]*letter-spacing:\s*1\.5px[^}]*\}/);
    expect(css).toMatch(/\.t-tagline\s*\{[^}]*text-transform:\s*uppercase[^}]*\}/);
    expect(css).toMatch(/\.t-tagline\s*\{[^}]*font-weight:\s*400[^}]*\}/);
  });
});
