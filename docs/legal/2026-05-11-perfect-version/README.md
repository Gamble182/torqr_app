# Torqr Legal-Dokumente — "Perfekte" Referenz-Baseline (2026-05-11)

> **HARTER DISCLAIMER**
>
> Diese Dokumente sind eine **LLM-generierte Referenz-Baseline** und ersetzen **keine** anwaltliche Beratung. Sie wurden auf Anweisung des Inhabers (Yannik Dorth) erstellt, um vor Eintreffen der echten Anwalts-Redlines (siehe [`../2026-05-04-anwalt-review-package.md`](../2026-05-04-anwalt-review-package.md)) eine in-house Vergleichsversion zu haben. Vor Public-Launch muss die Anwalts-Review zwingend abgeschlossen sein. Bei Abweichungen zwischen dieser Version und den Anwalts-Redlines gilt **immer** die Anwalts-Version.

---

## Inhalt dieses Bundles

| Datei | Inhalt |
|---|---|
| [`datenschutz.md`](datenschutz.md) | Datenschutzerklärung nach DSGVO Art. 13 + TDDDG §25, 9 Sektionen |
| [`impressum.md`](impressum.md) | Impressum nach §5 DDG, 7 Sektionen |
| [`agb.md`](agb.md) | Allgemeine Geschäftsbedingungen (B2B-only, §14 BGB), 12 Sektionen, Beta-Klausel |
| [`avv-mustervertrag.md`](avv-mustervertrag.md) | AVV-Mustervertrag nach Art. 28 DSGVO, 14 Sektionen, TOM-Anhang |
| [`README.md`](README.md) | Dieses Dokument |

Die in `src/app/{datenschutz,impressum,agb,avv}/page.tsx` deployten Pages sind aus diesen Markdown-Quellen abgeleitet (Sektionsstruktur und Wortlaut 1:1 übernommen).

---

## Wie diese Baseline gegen Anwalts-Redlines vergleichen?

1. **Anwalts-PDF lesen** und alle Änderungsvorschläge nummerieren.
2. **Sektion-für-Sektion** durch die jeweilige `*.md` gehen — bei jeder Anwalts-Empfehlung prüfen:
   - Wird in der Baseline bereits adressiert? → notieren, keine Änderung.
   - Steht im Widerspruch zur Baseline? → Anwalt gewinnt, Baseline anpassen, im PR begründen.
   - Anwalt geht über Baseline hinaus? → übernehmen, Quelle dokumentieren.
3. **Endversion in die `.tsx`-Pages spielen** — Markdown-Quelle bleibt im Repo als Audit-Trail, was vor Anwalt war.
4. **Backlog #69** auf `done` setzen, sobald Anwalt-finalisierte Texte deployed sind.

---

## Annahmen-Log (warum diese Baseline so aussieht, wie sie aussieht)

Jede dieser Annahmen kann von einem Anwalt anders bewertet werden — wenn ja, gewinnt der Anwalt.

### Rechtsgrundlagen aktuell gemacht (2026-05-Stand)

| Was | Warum |
|---|---|
| **§5 DDG statt §5 TMG** | DDG (Digitale-Dienste-Gesetz) hat seit 14.05.2024 die §§5-7 TMG abgelöst. Quelle: [gesetze-im-internet.de/ddg](https://www.gesetze-im-internet.de/ddg/__5.html). |
| **TDDDG §25 statt TTDSG §25** | TDDDG hat das TTDSG im Mai 2024 abgelöst. §25 (Einwilligung für Cookies) blieb inhaltsgleich. |
| **MStV §18 entfällt komplett** | Bisheriger "Verantwortlich nach §55 Abs. 2 RStV"-Block ist nur für *journalistisch-redaktionelle Telemedien* erforderlich. Torqr ist eine B2B-SaaS-Plattform ohne redaktionelles Angebot — Block ersatzlos gestrichen statt durch MStV-§18-Variante ersetzt. |
| **EU-US DPF + SCCs erwähnt** | Für Vercel/Resend (USA-Mutterhäuser). DPF wurde am 10.07.2023 als Angemessenheitsbeschluss verabschiedet und im September 2025 vom EuGH bestätigt (Schrems-III-Klage abgewiesen). SCCs als Fallback, weil DPF-Bestand politisch unsicher ist. |
| **Kleinunternehmer §19 UStG explizit benannt** | Statt USt-IdNr-Feld leerzulassen. Quelle: [eRecht24 Kleinunternehmer-Impressum](https://www.e-recht24.de/impressum/13097-impressum-fuer-kleinunternehmer.html). |
| **Aufsichtsbehörde Hessen** | Inhaber wohnt in Mengerskirchen (35794, Hessen). Zuständig: Hessischer Beauftragter für Datenschutz und Informationsfreiheit (HBDI), Wiesbaden. |

### Stilentscheidungen

| Was | Warum |
|---|---|
| **Sie statt Du** | Legal-Dokumente sind in deutschsprachigen B2B-Kontexten konventionell formell. Reduziert spätere Anwalts-Redlines. Marketing-Voice (Du) bleibt auf der eigentlichen Marketing-Seite. |
| **Pragmatisch-lesbar** | Alle DSGVO-Pflichten vollständig erfüllt, aber kompakt formuliert. Keine bloß abgeschriebenen Generator-Wall-of-Texte. |
| **Keine Hex-Werte / kein hartes Datum** | `<time>{new Date().toLocaleDateString('de-DE')}</time>` für Stand-Anzeige bleibt — verhindert veraltete Stand-Daten in Live-Pages. |

### Inhaltliche Entscheidungen mit Risikobewertung

| Entscheidung | Risiko | Mitigation |
|---|---|---|
| **B2B-only AGB nach §14 BGB** | Solo-Selbständige könnten als Verbraucher buchen. | Onboarding muss "Firmenname"/"USt-ID" zwingend abfragen. AGB §1 ist explizit: Vertragsschluss setzt Unternehmer-Eigenschaft voraus. |
| **AVV als Page + Print-CSS, nicht als PDF** | Kein versionsfester Anhang zum Vertrag. | Stand-Datum auf der Page, in jeder neuen Version mit `git log` nachvollziehbar. Kunden können beim Vertragsschluss eigenständig Browser-PDF generieren. Spätere Migration auf signiertes PDF möglich. |
| **Sentry nicht in Datenschutz §6 erwähnt** | Sentry verarbeitet Server-IPs + Stack-Traces (Client-Bundle). Wenn ein Auditor das findet ohne Erwähnung in §6 → Verstoß gegen Art. 13 DSGVO. | **Neues Backlog-Item #71** dokumentiert die Entscheidung. Zwei Auflösungspfade: (a) Sentry-Erwähnung nachziehen, oder (b) Sentry serverseitig-only umkonfigurieren + Client-Bundle entfernen. Muss **vor Public-Launch** entschieden sein. |
| **Production-AGB mit Beta-Paragraph statt reine Beta-AGB** | Beta-Pilotkunden lesen die AGB und sehen Production-Klauseln, die in Beta nicht greifen. | Beta-Paragraph (AGB §4) ist hervorgehoben und stellt explizit klar, welche Production-Klauseln in der Beta-Phase nicht/eingeschränkt gelten. |

---

## Quellen-Verzeichnis

### Gesetze und amtliche Texte

- [DDG (Digitale-Dienste-Gesetz)](https://www.gesetze-im-internet.de/ddg/) — Pflichtangaben Impressum
- [DSGVO (EU-Verordnung 2016/679)](https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679) — Datenschutzgrundverordnung
- [BDSG (Bundesdatenschutzgesetz)](https://www.gesetze-im-internet.de/bdsg_2018/) — Nationale Ergänzung
- [TDDDG](https://www.gesetze-im-internet.de/tdddg/) — Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz, §25 für Cookies
- [BGB §14](https://www.gesetze-im-internet.de/bgb/__14.html) — Unternehmer-Definition
- [VSBG (Verbraucherstreitbeilegungsgesetz)](https://www.gesetze-im-internet.de/vsbg/) — §36 für B2B-Hinweis
- [UStG §19](https://www.gesetze-im-internet.de/ustg_1980/__19.html) — Kleinunternehmerregelung

### Behördliche Leitlinien

- [DSK-Beschluss 01.07.2025: Telemedien-Datenschutz](https://www.datenschutzkonferenz-online.de/) — Cookie-Banner-Mindestanforderungen
- [DSK-Kurzpapier Nr. 13](https://www.datenschutzkonferenz-online.de/media/kp/dsk_kpnr_13.pdf) — Auftragsverarbeitung Art. 28 DSGVO
- [HBDI Hessen](https://datenschutz.hessen.de/) — Aufsichtsbehörde für Verantwortlichen-Sitz Mengerskirchen
- [EU-Kommission: EU-US Data Privacy Framework](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/eu-us-data-transfers_en) — Drittland-Transfer-Adequacy

### Rechtsprechung

- **EuGH, Urteil v. 01.10.2019 — C-673/17 (Planet49)** — Opt-in-Anforderung für nicht-essentielle Cookies
- **EuGH, Urteil v. 16.07.2020 — C-311/18 (Schrems II)** — Privacy-Shield-Aufhebung, SCC-Anforderungen
- **EuGH, Beschluss 03.09.2025 — Schrems-III-Klage abgewiesen** — DPF-Bestand vorerst gesichert

### Best-Practice-Generatoren (zum Quervergleich, nicht 1:1 übernommen)

- [datenschutz-generator.de](https://datenschutz-generator.de/) — Stand Mai 2026
- [eRecht24 Datenschutz-Generator](https://www.e-recht24.de/muster-datenschutzerklaerung.html) — Update 1.50, Februar 2026
- [GDD-Muster AVV](https://gdd.de/) — Gesellschaft für Datenschutz und Datensicherheit

### Verwandte Repo-Dokumente

- [`../2026-05-04-anwalt-review-package.md`](../2026-05-04-anwalt-review-package.md) — Anwalts-Briefing mit Datenfluss-Tabellen und Backend-Kontext
- [`../../superpowers/plans/2026-05-04-cookie-consent-and-analytics.md`](../../superpowers/plans/2026-05-04-cookie-consent-and-analytics.md) — Cookie-Banner-Implementierungsspec
- [`../../BACKLOG.md`](../../BACKLOG.md) — Items #69 (Datenschutz-Final), #70 (AVV-PDF), #71 (Sentry-Status)

---

## Cross-Check-Checkliste (für Verification)

### Datenschutz
- [ ] Verantwortlichen-Vollangaben in §1 statt TODO-Marker
- [ ] Dual-Rolle (Verantwortlicher vs. Auftragsverarbeiter) in §2 erklärt
- [ ] Server-Logfile-Speicherdauer (30 Tage) in §3 genannt
- [ ] Auftragsverarbeiter-Tabelle in §6 mit Sitz, Daten, Rechtsgrundlage, DPF/SCC-Status, Speicherdauer
- [ ] TDDDG §25 in §7 referenziert (nicht TTDSG)
- [ ] Aufsichtsbehörde HBDI Hessen in §8 genannt
- [ ] **Sentry NICHT erwähnt** (per Entscheidung — Backlog #71 nachziehen)

### Impressum
- [ ] Überschrift "§5 DDG" (nicht "§5 TMG")
- [ ] Kleinunternehmer §19 UStG explizit
- [ ] Kein "Verantwortlich nach §55 Abs. 2 RStV"-Block (gestrichen)
- [ ] B2B-Schlichtungs-Klausel mit Verweis auf §36 VSBG
- [ ] Haftungsparagraph zitiert §§7-10 DDG (nicht TMG)

### AGB
- [ ] §1 enthält B2B-only-Klausel mit Verweis auf §14 BGB
- [ ] §4 ist eindeutig als Beta-Paragraph erkennbar (eigene Überschrift, SLA-Disclaimer)
- [ ] §12 Gerichtsstand: Mengerskirchen oder Sitz des Anbieters
- [ ] §9 Haftungsbeschränkung enthält Kardinalpflicht-Ausnahme

### AVV
- [ ] Verweist auf Art. 28 DSGVO
- [ ] §7 TOM-Anhang vollständig (Verschlüsselung, Zugriffskontrolle, Backup, Pseudonymisierung)
- [ ] §8 Subunternehmer-Liste konsistent zu Datenschutz §6
- [ ] §12 enthält Datenrückgabe/Löschung bei Beendigung
- [ ] Platzhalter `[AUFTRAGGEBER]` für Heizungsbauer-Daten markiert

---

## Changelog

- **2026-05-11** — Initial-Version dieser Baseline. Erstellt parallel zur Anwalts-Review-Wartezeit (Backlog #69) im Worktree `feature/legal-docs-perfect-v1`. Quellen-Stand: Mai 2026.
