# Marketing & Content Workflow

**Purpose**: All marketing, branding, copy, positioning, landing-page, and content work for Torqr is backed by `docs/graphify/graphify-out-marketing/`. This is the canonical knowledge base for everything *outside* the product UI — voice, tone, claims, audience, GTM, brand tokens, page composition.

**Linked from**: [CLAUDE.md](../../CLAUDE.md) Marketing & Content section.

---

## 1. Mandatory: consult the marketing graph first

Before writing/editing any of the following, read the relevant subgraph in `docs/graphify/graphify-out-marketing/`:

| Task | Where to look in the graph |
|------|----------------------------|
| Headline / sub-headline / hero copy | nodes labeled `Headline:` / `Marketing-Claim:` + their `addresses_pain` edges |
| Pain block copy | community **Audience Segments, CTAs & FAQ** + nodes labeled `Pain:` |
| Feature claim / feature image | feature-specific community (Photo Doku / Workload / Multi-System / Mobile-First) — nodes have `backs_up_claim` and `demonstrates` edges |
| Pricing copy / tier change | hyperedge **Pricing-Tier-Set** + community **Annual Billing Rationale** + unit-economics nodes (ARPU/LTV/CAC) |
| FAQ entry | community **Audience Segments, CTAs & FAQ** — verify question is not already answered, check tone alignment with **Brand Voice & Anti-Tonality** |
| CTA wording | nodes labeled `Primary CTA:` / `Secondary CTA:` / `CTA-Microcopy:` — check existing variants before introducing new |
| Brand color usage | hyperedges **Brand-Grün family**, **Bernstein/Amber family**, community **Color Token Palette**, **Status Color: Overdue/Info** |
| Logo / wordmark variant | god node `TorqrWordmark` + community **TorqrIcon Component** + community **Logo & Accent Palette** |
| Email template copy/styling | god node `email-template.html (Wartungsbenachrichtigung)` (16 edges — check what brand tokens it already uses) |
| Tone of voice / German microcopy | community **Brand Voice & Anti-Tonality** — explicit anti-patterns ('revolutionär', 'next-gen', 'AI-powered' VERBOTEN), Du vs. Sie rules |
| New marketing channel / GTM idea | community **GTM Channels & Phases** — confirm channel isn't already covered or rejected |
| Lead-capture form change | community **Lead Capture Forms (Beta/Demo)** + the rationale `Solo+Pro → Beta-Liste, Enterprise → Demo-Anfrage` |
| Landing-page section reorder/add | hyperedge **Vollständige Landing-Page-Sektion-Sequenz** (10-section flow) + spec node `Public Landing Page — Design Spec` |
| Legal page edit (Impressum/Datenschutz) | hyperedge **Legal footprint (Impressum §5 TMG + Datenschutz DSGVO + AVV processors)** |
| OG / SEO metadata | community **OG Metadata & Root Layout** |

---

## 2. Hard rules for marketing/content output

These come from the marketing graph itself (community **Brand Voice & Anti-Tonality**, decision D-6, brand spec):

1. **Anti-tonality (verboten):** "revolutionär", "next-gen", "Game-changer", "AI-powered", "disruptiv", Marketing-Hype-Adjektive. Tone is *ruhig, technisch, sachlich, nüchtern*.
2. **Anrede:**
   - Marketing/Outbound an Heizungsbauer → **Du** (Decision D-6)
   - Endkunden-E-Mails (Senioren-Empfänger) → **Sie**
   - In-App-UI an OWNER/TECHNICIAN → **Sie** (B2B-Standard)
3. **Emojis:** Keine Emojis in Produkt-UI oder transaktionalen E-Mails. Marketing-Site: sparsam erlaubt, nie in Headlines.
4. **Brand-Token-Disziplin:** Niemals Hex-Werte hardcoden. Immer Tokens aus `globals.css` / `brand.config.ts` / `tailwind.config.ts` nutzen (siehe hyperedge **Design Token Triangle**).
5. **Sprache:** Sämtliche User-facing Texte (Marketing, Produkt, E-Mail, Fehler) auf **Deutsch**. Code, Variablen, Kommentare auf Englisch.
6. **Claims müssen belegbar sein:** Jeder Marketing-Claim auf der Landing Page hat einen entsprechenden `Capability:`-Node oder `backs_up_claim`-Edge zu einem Feature-Image. Keine Claims ohne Beleg im Graph.

---

## 3. Query patterns for the marketing graph

```bash
# Pattern A — find all marketing claims and what they back up
python -c "
import json
from networkx.readwrite import json_graph
G = json_graph.node_link_graph(json.load(open('docs/graphify/graphify-out-marketing/graph.json')), edges='links')
for n, d in G.nodes(data=True):
    if 'Claim' in d.get('label','') or 'Marketing-Claim' in d.get('label',''):
        print(d['label'])
        for nbr in G.neighbors(n):
            rel = G.edges[n, nbr].get('relation','')
            print(f'  --{rel}--> {G.nodes[nbr].get(\"label\")}')"

# Pattern B — landing-page section flow (read the hyperedge)
python -c "
import json
data = json.load(open('docs/graphify/graphify-out-marketing/graph.json'))
for h in data.get('hyperedges', []):
    if 'Sektion-Sequenz' in h.get('label','') or 'Composition' in h.get('label',''):
        print(h['label']); print(' ->', ' -> '.join(h['nodes']))"

# Pattern C — pain ↔ feature mapping
python -c "
import json
from networkx.readwrite import json_graph
G = json_graph.node_link_graph(json.load(open('docs/graphify/graphify-out-marketing/graph.json')), edges='links')
for u, v, d in G.edges(data=True):
    if d.get('relation') == 'addresses_pain':
        print(f'{G.nodes[u].get(\"label\")} addresses {G.nodes[v].get(\"label\")} [{d.get(\"confidence\")}]')"
```

---

## 4. Scope of the marketing graph

The graph is built from a **staged corpus** that combines, at extraction time:

- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
- All of `src/components/marketing/*`
- `src/components/brand/TorqrIcon.tsx`
- `src/app/datenschutz/page.tsx`, `src/app/impressum/page.tsx`
- All of `docs/brand_spec/` (BRAND_SPEC.md, brand.config.ts, tailwind.config.ts, email-template.html, TorqrIcon.tsx)
- `docs/marketing/MARKETING_BRIEFING.md`
- `docs/superpowers/specs/2026-04-29-landingpage-design.md`
- `docs/superpowers/plans/2026-04-29-landingpage.md`
- `public/marketing/hero/*` and `public/marketing/features/*` (vision-extracted)

When *any* of these change beyond cosmetic edits, the graph is stale — rebuild via `/graphify` with the marketing scope brief (see [KNOWLEDGE-GRAPHS.md](./KNOWLEDGE-GRAPHS.md) §5). The post-commit hook does **not** cover this graph.

---

## Changelog

- **2026-05-07** — Extracted from CLAUDE.md to slim it down. Content unchanged.
