# Design restyle prompts — Agent Forge

Two ready-to-paste prompts for Claude (design mode / artifacts). Each is self-contained:
it carries the product context, the target design system, a mapping onto the existing
CSS-variable token architecture in `src/app.css`, and the hard constraints (WCAG AA,
RU/EN, no technical jargon on screen, no new dependencies).

Pick **Prompt A** (recommended — leans into the warm editorial look the app already has)
or **Prompt B** (warmer, more playful, more "game"). Do not mix both in one pass.

---

## Shared context block (already embedded in each prompt)

- **Product:** Agent Forge — a browser game that teaches NON-technical office workers
  (project managers, office staff) how to assemble an AI agent by dragging "parts"
  (role, model, memory, tools, guardrails, approval) into slots.
- **Audience rule:** zero code / JSON / terminal on screen. Office vocabulary. Technical
  terms only behind a "(?)" tooltip.
- **Stack:** SvelteKit + Svelte 5 + TypeScript, static adapter, GitHub Pages. Styling is
  plain CSS driven by CSS custom properties declared in `src/app.css` `:root`.
- **Languages:** Russian default, English runtime toggle. Copy lives in i18n JSON — the
  redesign must NOT hardcode text; it only changes look.
- **Accessibility (non-negotiable):** WCAG 2.2 AA. Body text ≥ 4.5:1, large text ≥ 3:1,
  focus ring ≥ 3:1. Respect `prefers-reduced-motion`. 44px touch targets.
- **Token names that must keep working** (other components reference them — do not rename,
  only re-value): `--bg --surface --surface-soft --ink --ink-soft --line --accent
  --accent-strong --accent-text --accent-ink --accent-soft --ok --ok-text --ok-soft
  --warn --warn-text --warn-soft --locked --star --radius --radius-sm --shadow
  --shadow-soft --focus --font` plus the per-family pairs `--cat-<family>` /
  `--cat-<family>-soft` for: role, model, tools, memory, planner, review, stopping,
  guardrails, approval.

---

## Prompt A — Claude editorial-warm (RECOMMENDED)

> You are a senior product designer. Restyle an existing SvelteKit educational game,
> **Agent Forge**, to a refined, warm, editorial look in the spirit of Anthropic's Claude
> brand — "the warmest, most editorial interface in the AI category." The app already uses
> a cream canvas and a terracotta accent, so this is an evolution, not a teardown.
>
> **Product & audience:** Agent Forge teaches NON-technical office workers to assemble an
> AI agent by placing parts (role, model, memory, tools, guardrails, approval) into slots.
> No code/JSON/terminal anywhere on screen — office vocabulary only, technical terms hidden
> behind "(?)" tooltips. Russian default + English toggle; never hardcode copy. Theme of the
> product: "an educational trainer that reads like a book."
>
> **Target design system (Claude):**
> - Canvas cream `#faf9f5`; card surface `#efe9de`; optional dark navy `#181715` /
>   `#252320` for "agent screen / trace" moments only (used sparingly, like a product mockup).
> - Coral accent `#cc785c`, active `#a9583e`, disabled `#e6dfd8`. Coral is scarce: primary
>   CTAs and full-bleed callout cards only — never scattered as little highlights.
> - Ink `#141413`, body `#3d3d3a`, muted `#6c6a64`. Hairline borders `#e6dfd8`.
> - **Editorial type split:** serif display headlines (Tiempos/Copernicus feel; web-safe
>   fallback Georgia / 'Times New Roman' serif), weight **400 only, never bold**, with
>   negative letter-spacing (-0.3px small → -1.5px hero). Humanist sans for body/UI (Inter
>   / system stack). Display scale 64/48/36/28; body 16/1.55; buttons 14/500.
> - Radius ladder 4/6/8/12/16 + pill. Buttons 8px radius, 40px tall, 12×20 padding. Cards
>   12px radius, 32px padding.
> - **Elevation by color-blocking, not shadow.** Hairline borders feel like one step of
>   elevation. Sections breathe at ~96px vertical rhythm, alternating cream canvas →
>   cream card → (occasional) dark navy.
>
> **Map onto the existing token system in `src/app.css` — keep every variable NAME, only
> change VALUES:** set `--bg` to the warm cream, `--surface` white-cream, `--surface-soft`
> to card cream `#efe9de`, `--accent`/`--accent-strong`/`--accent-active` to the coral
> family, `--line` to the hairline, `--ink`/`--ink-soft` to the editorial inks. Keep the
> per-family `--cat-*` pairs but re-tune them so they sit harmoniously on the cream canvas
> (muted, warm versions — still distinguishable, never neon). Introduce a serif font
> variable (e.g. `--font-display`) and apply it to `h1,h2,h3`.
>
> **Hard constraints:**
> - WCAG 2.2 AA: verify every text/background pair ≥ 4.5:1 (≥ 3:1 large), focus ring ≥ 3:1.
>   State the contrast ratio for each accent-on-surface pair you choose.
> - Respect `prefers-reduced-motion`. 44px min touch targets. No new runtime dependencies
>   (system/Google-font link at most). Don't rename tokens; don't touch i18n text.
>
> **Deliverables:**
> 1. A rewritten `:root` token block for `src/app.css` (drop-in), with a one-line comment
>    + contrast ratio beside each color decision.
> 2. Base element styles (body, h1–h3 with the serif, button base, focus-visible) updated
>    to the editorial split.
> 3. A short component style guide (in CSS or prose) for: primary button, secondary button,
>    feature/mission card, the dark "agent trace" panel, badge pill, slot tile. Give the
>    exact padding/radius/border/background per component.
> 4. Note any place the editorial serif should NOT be used (e.g. numbers, mono-like data).
>
> Output the CSS as copy-paste blocks. Be specific with hex + px. No lorem text.

---

## Prompt B — Notion playful-pastel (warmer, more "game")

> You are a senior product designer. Restyle an existing SvelteKit educational game,
> **Agent Forge**, toward Notion's confident, illustration-friendly, pastel look — friendly
> and a little playful, so the "assemble-an-agent" loop feels like a colorful game rather
> than enterprise software.
>
> **Product & audience:** (same as above) — teaches NON-technical office workers to place
> agent parts into slots. No code/JSON/terminal on screen; office vocabulary; "(?)" tooltips
> for jargon. Russian default + English toggle; never hardcode copy.
>
> **Target design system (Notion):**
> - Warm charcoal body text `#37352f`; supporting grays for hierarchy.
> - Single confident purple CTA `#5645d4`; inline link blue `#0075de`. A deep navy `#0a1530`
>   "hero band" for the top of the home screen, decorated with brand-colored dots.
> - **Pastel feature-card tints** — peach, rose, mint, lavender, sky, yellow, cream. THIS is
>   the hook: map each agent-part FAMILY to one pastel tint so role/model/tools/memory/
>   planner/review/stopping/guardrails/approval each read as their own friendly color. Bold
>   yellow `#f9e79f` for high-priority banners.
> - Type: one humanist sans throughout (Inter), display down to micro, tight leading at
>   large sizes, body 1.55 line-height, headlines weight 600, buttons 500.
> - Rectangular **8px** buttons (NOT pills); cards 12px radius, 32px padding. 4px spacing
>   base, 64–96px section rhythm. Workspace/mockup cards break out below with a deep soft
>   shadow `0 24px 48px -8px`. Centered hero layout.
>
> **Map onto the existing token system in `src/app.css` — keep every variable NAME, only
> change VALUES:** `--accent` → the Notion purple (and pick `--accent-strong`/`--accent-text`
> dark enough to pass AA on light); `--ink` → warm charcoal; `--bg`/`--surface` light;
> re-tune each `--cat-<family>` / `--cat-<family>-soft` pair to a distinct PASTEL (soft =
> tile fill, base = AA-passing label text on that tile). Add a navy hero token for the home
> band.
>
> **Hard constraints:** identical to Prompt A — WCAG 2.2 AA with stated ratios (pastels are
> the risky part: prove each family's label text clears 4.5:1 on its own soft tile),
> `prefers-reduced-motion`, 44px targets, no token renames, no i18n edits, no heavy deps.
>
> **Deliverables:** same four as Prompt A, but the component guide must include the pastel
> family card and the navy hero band, and a small swatch table listing each of the 9
> families → {soft hex, label hex, contrast ratio}.
>
> Output CSS as copy-paste blocks. Be specific with hex + px. No lorem text.

---

## After you get the CSS back

1. Drop the new `:root` block into `src/app.css`; keep the a11y comments.
2. Run the gates: `npm run check`, `npm run build`, then the e2e a11y + no-tech specs
   (`tests/e2e/a11y.spec.ts`, `tests/e2e/no-tech-surface.spec.ts`) — they will catch any
   contrast regression the prompt's self-reported ratios missed.
3. Eyeball home / mission / advanced / encyclopedia / settings at mobile + desktop widths.
