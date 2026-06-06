# Agent Forge — MVP Technical Implementation Plan (Worlds 1–3)

> **Source spec:** `C:\COWORK\Agents game\.omc\specs\deep-interview-agent-forge-game.md`
> **Plan type:** Greenfield, browser-only static web game. Non-technical audience (PMs, office workers using claude.ai chat — never terminal).
> **Status:** PENDING APPROVAL — consensus reached (Architect SOUND-WITH-CHANGES → Critic APPROVE after v2). One MINOR residual (refusal-step tagging) applied post-approval.
> **Date:** 2026-06-06

---

## 1. Requirements Summary

**What we are building.** A static browser game where a non-technical player learns to assemble AI agents. Per mission, the player drags **detail-cards** into named **slots** (Role, Tools, Memory, Planner, Stopping, Guardrails), presses **Run**, and watches a deterministic, animated **"what the agent did" story** (a chat-like transcript with emoji markers), then sees a pass/fail verdict with a one-line plain-language diagnosis, a 3-star score, and retries until correct. The teaching goal is "pick the **minimal correct set of parts** for the task."

**Hard product constraints (non-technical audience — these drive everything):**
- **Zero code/JSON/terminal** ever visible on the player screen. Only cards, buttons, and the step-by-step story.
- **Office vocabulary**, not engineering jargon. The real technical term appears *only* behind an optional `(?)` tooltip.
- UI reads like a friendly **"assistant setup / chat"**, not an IDE or node-graph.
- Every failure renders as **one plain line**: consequence + cause + how to fix.
- The story reads like a **chat transcript** with emoji markers: 🤔 thinking / 🔍 searching / 👀 sees / ✅ done / ❌ failed.

**Functional scope (MVP = Worlds 1–3 only):**
- **World 1 "Дай чёткое поручение" (clear instruction/role):** 1.1 greet client, 1.2 polite complaint reply (tone), 1.3 reply in 2 sentences (format), 1.4 reply as company persona (role).
- **World 2 "Дай доступы" (tools):** 2.1 today's currency rate (needs 🔍 internet), 2.2 calc an estimate (needs 🧮 calculator), 2.3 find a clause in a contract (needs 📄 documents), 2.4 fresh industry news (needs internet; **trap:** calculator is useless → costs the "minimal set" star).
- **World 3 "Дай память и контекст" (memory):** 3.1 remember client name mid-dialog (working), 3.2 recall past correspondence (episodic), 3.3 use an FAQ base (semantic/docs), 3.4 don't invent what you don't remember (memory + honesty).
- **~12 missions, ~10–12 cards:** 3 roles, 4 tools (web-search, calculator, doc-reader, code-run), 3 memory types (working/episodic/semantic), 1 stopping-criteria, 1 guardrail teaser.
- **Deterministic engine** covering these cards + **≥6 failure modes**.
- **3 quiz gates** (one per world, ~8 questions each, **≥70%** to unlock the next world).
- **Two modes:** Campaign + Sandbox (Sandbox limited to MVP cards).
- **localStorage** progress + stars.
- **Full RU/EN i18n**, switchable at runtime with no reload, no re-running of the simulation.
- **3-star scoring:** pass • minimal-set (no extra cards) • within-budget (steps/cost).

**Explicitly out of MVP:** Worlds 4–7, real-LLM mode, multiplayer/accounts/cloud save/leaderboards, node-graph editor, native mobile (responsive web only).

---

## 2. Acceptance Criteria (testable)

Inherited from the spec and sharpened into verifiable, automatable checks. Each has an ID for traceability to the Verification section (§9).

**Engine & simulation**
- **AC-1** Placing a card into a slot updates state; invalid card→slot combinations are flagged in the UI within the same interaction (the card cannot be dropped, or is shown rejected) with a reason string. *Test: unit on slot-acceptance + component test on rejection rendering.*
- **AC-2** `run(agent, mission)` is a **pure function**: same inputs → byte-identical `Verdict` (steps + diagnosis keys) across 1000 repeated calls; no `Date.now`, `Math.random`, network, or global mutation reachable from the engine module. The signature carries **no `lang` parameter** — locale is never a simulation input (Principle 4 is literally true). *Test: determinism harness + static import-ban lint rule.*
- **AC-3** Failure-mode coverage is split into two claims so the count is honest:
  - **AC-3a (ENGINE-CAPABILITY):** **≥6 distinct failure modes** each fire on a **crafted unit fixture** and produce the correct diagnosis key: (a) `missing-tool` (no web-search), (b) `no-stopping-loop` (loop-expected, no stopping card → step cap hit), (c) `no-guardrail-injection` (injection flagged, no guardrail card), (d) `wrong-role` (placed role capability ≠ `requiredRole`), (e) `budget-exceeded` (steps or cost over cap), (f) one additional crafted mode reserved for engine completeness. *Test: one unit test per mode on a synthetic fixture asserting `verdict.failureModeId`.*
  - **AC-3b (MISSION-BACKED):** **exactly 3** of those modes are exercised by **real MVP missions** — `missing-tool` (World 2), `wrong-role` (World 1), `budget-exceeded` (a World-2/3 budget mission). `no-stopping-loop` and `no-guardrail-injection` are **FIXTURE-ONLY teasers** in MVP: the engine supports them and they are unit-tested, but **no MVP mission teaches them** (full mission coverage is Worlds 6/7, post-MVP). *Test: a coverage assertion that maps exactly these 3 mode ids to real missions; the 2 teasers are asserted present in the registry but absent from any MVP mission's triggerable path.*
- **AC-4** Star scoring computes exactly 3 booleans per mission — `passed`, `minimalSet` (no card outside `mission.minimalCardSet`), `withinBudget` (`stepsUsed ≤ budget.steps && costUsed ≤ budget.cost`) — and the total star count equals their sum. *Test: table-driven unit tests.*

**Content & progression**
- **AC-5** 3 worlds and ≥12 missions are loadable as data and every mission has at least one solution that yields 3 stars (verified by a content-completeness test that auto-solves each mission with its declared `minimalCardSet`). *Test: content smoke test iterating all missions.*
- **AC-6** Each world has a quiz gate of ~8 questions; scoring ≥70% sets `unlockedWorlds` to include the next world; <70% does not. *Test: unit on gate logic at boundary values 69%/70%/71%.*
- **AC-7** Mission 2.4 trap: adding the calculator card while the mission is still passed yields `minimalSet = false` (loses that star). *Test: dedicated unit.*
- **AC-8** Mission 3.4 (honest refusal): an agent without the required memory must **PASS** via an honest-refusal outcome, **not** fail and **not** fabricate. The assertion is `verdict.passed === true && verdict.outcomeKey === 'refusal'` (and the fabrication string is absent). This is driven by the step's `onMissingCap.mode === 'refuse'` declaration in data, not by engine special-casing. *Test: unit asserting `passed===true && outcomeKey==='refusal'`.*

**Persistence & platform**
- **AC-9** Progress (stars per mission, unlocked worlds, last locale) writes to localStorage on change and restores on reload; corrupt/missing storage degrades to a clean new-game state without throwing. *Test: integration with mocked storage incl. malformed JSON.*
- **AC-10** Production build is fully static (no server calls at runtime); the app loads and is fully playable with the network disabled after first load. *Test: build artifact has no fetch/XHR to app-owned endpoints; offline E2E smoke.*

**i18n**
- **AC-11** Runtime RU↔EN toggle re-renders all visible strings — including an already-rendered trace — **without reloading and without re-running** `run()`. *Test: E2E toggles locale on the Result screen and asserts trace text changed while step count/structure is identical.*
- **AC-12** Locale coverage: every key present in `ru.json` exists in `en.json` and vice-versa; no UI-reachable hardcoded human-readable string outside locale files. *Test: key-parity script + lint rule banning string literals in render paths (allowlist for non-text).*

**Non-technical UX (new, sharpened)**
- **AC-13 (no-tech-surface)** No screen in Campaign or Sandbox renders code, JSON, curly-brace/bracket literals, stack traces, or terminal styling to the player. *Test: E2E DOM scan across all screens asserting absence of `{`, `}`, `</`, `function`, `[object` and of monospace-coded "console" containers; plus manual review checklist.*
- **AC-14 (one-line-diagnosis)** Every failure diagnosis renders as a single line with three plain-language parts (consequence, cause, fix) and contains no English technical term except inside a `(?)` tooltip. *Test: snapshot of all `FailureMode` diagnosis strings parsed into 3 parts; lint that diagnosis strings contain no banned jargon tokens.*
- **AC-15 (chat-transcript trace)** The trace renders as sequential chat-style lines, each prefixed by exactly one of the emoji markers 🤔/🔍/👀/✅/❌, with office vocabulary; technical terms only via `(?)`. *Test: component test asserting every rendered step line starts with an allowed marker and that the marker matches the step's semantic type.*

**Content sourcing & licensing**
- **AC-16 (quiz attribution)** When quiz questions are adapted from an external bank, a `CONTENT-LICENSES.md` file exists at the repo root recording the source (e.g. `FlorianBruniaux/claude-code-ultimate-guide`), its license, and an attribution line; the build/test asserts the file exists and is non-empty whenever the external bank is reused. *Test: presence + non-empty assertion on `CONTENT-LICENSES.md` gated on the "external bank reused" flag.*

> **Coverage target:** ≥90% of acceptance criteria are concrete and automatable. Of AC-1…AC-16, 15 are fully automatable; AC-13 also carries a manual review checklist as a backstop = **94% fully automatable**.

---

## 3. Proposed File / Folder Structure

Recommended stack: **SvelteKit + `@sveltejs/adapter-static` + TypeScript** (justification in §10). Tree below is concrete; paths are referenced throughout the plan.

```
agent-forge/
├─ package.json
├─ svelte.config.js                 # adapter-static, prerender all
├─ vite.config.ts
├─ tsconfig.json                    # path alias $engine, $content, $lib
├─ .eslintrc.cjs                    # custom rules: no-network-in-engine, no-jargon-in-diagnosis, no-raw-strings-in-ui
├─ playwright.config.ts
├─ vitest.config.ts
│
├─ src/
│  ├─ engine/                       # PURE. No DOM, no fetch, no Date, no Math.random.
│  │  ├─ types.ts                   # AgentConfig, Mission, Card, Slot, Step, Verdict, FailureMode, World, Quiz, ProgressState
│  │  ├─ run.ts                     # run(agent, mission) -> Verdict  (the deterministic walk; NO lang param)
│  │  ├─ capabilities.ts            # capability set math: required vs provided
│  │  ├─ failure-modes.ts           # FAILURE_MODES registry (data); evaluation order
│  │  ├─ scoring.ts                 # computeStars(verdict, agent, mission)
│  │  ├─ budget.ts                  # step/cost accounting helpers
│  │  └─ index.ts                   # re-exports only
│  │
│  ├─ content/                      # PURE DATA. Designer-editable. No logic.
│  │  ├─ schema.ts                  # zod schemas validating cards/missions/worlds/quizzes at build/test time
│  │  ├─ cards.ts                   # ~10–12 Card definitions (capability/cost + locale KEYS, never prose)
│  │  ├─ worlds/
│  │  │  ├─ world-1.ts              # missions 1.1–1.4 + quizGate ref
│  │  │  ├─ world-2.ts              # missions 2.1–2.4 (2.4 trap)
│  │  │  └─ world-3.ts              # missions 3.1–3.4 (3.4 honesty)
│  │  ├─ quizzes/
│  │  │  ├─ quiz-1.ts  quiz-2.ts  quiz-3.ts   # ~8 Q each, locale KEYS for stems/options
│  │  └─ registry.ts                # WORLDS[], CARDS[], QUIZZES[] aggregation + integrity asserts
│  │
│  ├─ i18n/
│  │  ├─ index.ts                   # init, runtime locale store, t(), term() helpers
│  │  ├─ locales/
│  │  │  ├─ ru.json
│  │  │  └─ en.json
│  │  └─ terms.ts                   # term registry: officeLabel + (?) techTerm + explanation, both locales
│  │
│  ├─ lib/
│  │  ├─ stores/
│  │  │  ├─ progress.ts             # localStorage-backed Svelte store (load/save/migrate/version)
│  │  │  ├─ session.ts              # current mission, current agent draft, run result
│  │  │  └─ locale.ts               # current locale store (re-exported from i18n)
│  │  ├─ persistence.ts             # safe localStorage read/write w/ schema guard + corruption fallback
│  │  └─ trace-render.ts            # maps Verdict.steps (keys) -> renderable lines using t() (no sim re-run)
│  │
│  ├─ ui/                           # presentational components
│  │  ├─ cards/
│  │  │  ├─ CardChip.svelte          # one detail-card (icon, office label, (?) tooltip, cost dots)
│  │  │  └─ Inventory.svelte         # available cards palette
│  │  ├─ assembly/
│  │  │  ├─ SlotBoard.svelte         # the six labeled slots
│  │  │  ├─ Slot.svelte              # single slot, accept/reject highlight (AC-1)
│  │  │  └─ MissionBrief.svelte      # goal + constraints + budget, office wording
│  │  ├─ run/
│  │  │  ├─ TraceStory.svelte        # animated chat-style transcript (AC-15)
│  │  │  └─ StepLine.svelte          # one emoji-marked line
│  │  ├─ result/
│  │  │  ├─ Verdict.svelte           # pass/fail banner
│  │  │  ├─ Diagnosis.svelte         # one-line consequence+cause+fix (AC-14)
│  │  │  └─ StarRow.svelte           # 3-star display + which star + why
│  │  ├─ quiz/
│  │  │  ├─ QuizScreen.svelte        # question flow, ≥70% gate (AC-6)
│  │  │  └─ QuizResult.svelte
│  │  ├─ common/
│  │  │  ├─ TermTooltip.svelte       # the (?) reveal system (AC-13/14)
│  │  │  ├─ LocaleToggle.svelte      # RU/EN switch (AC-11)
│  │  │  └─ Button.svelte  Modal.svelte  ProgressBadge.svelte
│  │  └─ map/
│  │     └─ WorldMap.svelte          # worlds + missions + stars + lock state
│  │
│  ├─ routes/                        # SvelteKit pages (thin; logic lives in lib/engine/content)
│  │  ├─ +layout.svelte              # locale provider, theme, header w/ LocaleToggle
│  │  ├─ +page.svelte                # title / mode select (Campaign | Sandbox)
│  │  ├─ campaign/+page.svelte       # WorldMap
│  │  ├─ mission/[id]/+page.svelte   # Assembly -> Run -> Result orchestration for one mission
│  │  ├─ quiz/[world]/+page.svelte   # QuizScreen
│  │  └─ sandbox/+page.svelte        # free assembly against any MVP mission/cards
│  │
│  ├─ app.html
│  └─ app.css                        # design tokens; friendly "assistant setup" look, NOT IDE
│
├─ static/                           # favicons, card icons (svg), og image
│
└─ tests/
   ├─ engine/
   │  ├─ determinism.test.ts         # AC-2
   │  ├─ failure-modes.test.ts       # AC-3 (one per mode)
   │  ├─ scoring.test.ts             # AC-4, AC-7
   │  └─ honesty-3-4.test.ts         # AC-8
   ├─ content/
   │  ├─ schema-valid.test.ts        # zod validation of all content
   │  └─ solvable.test.ts            # AC-5 auto-solve each mission w/ minimalCardSet
   ├─ i18n/
   │  └─ key-parity.test.ts          # AC-12
   ├─ persistence/
   │  └─ progress.test.ts            # AC-9 incl. corrupt storage
   └─ e2e/                           # Playwright
      ├─ play-mission.spec.ts        # vertical slice happy path
      ├─ locale-toggle.spec.ts       # AC-11
      ├─ no-tech-surface.spec.ts     # AC-13
      ├─ offline.spec.ts             # AC-10
      └─ a11y.spec.ts                # axe-core scan (WCAG 2.2 AA)
```

---

## 4. Architecture

### 4.1 Engine (`src/engine/`) — pure, deterministic, data-driven

**Design principle:** the engine knows *how* to walk a mission and check capabilities/budget/failures; it knows **nothing** mission-specific. All mission-specific behavior is **data** (`Mission.solutionPath`, `Mission.requiredCaps`, `Mission.requiredRole`, `StepTemplate.onMissingCap`, `FailureMode.trigger`). Adding a new mission = adding data, **never** touching engine code. The honest-refusal path (3.4) is *declared* in data via `StepTemplate.onMissingCap` and *interpreted* by ~6 mission-agnostic engine lines — those lines are reused by any future refusal mission, so Principle 2 ("new mission = no new code") still holds: new missions only add data.

**Core data types (`engine/types.ts`):**

```
CapabilityId   = 'web-search' | 'calculator' | 'doc-reader' | 'code-run'
                 | 'mem-working' | 'mem-episodic' | 'mem-semantic'
                 | 'role-greeter' | 'role-formal' | 'role-concise' | 'role-persona'
                 | 'stopping' | 'guardrail'
                 # NOTE: roles are CONCRETE capabilities (one per World-1 mission), not a single
                 # 'role-set' token — this is what makes `wrong-role` real and lets World 1's
                 # 4 distinct-role missions be 3-star-distinguished.
                 # NOTE: 'code-run' is a SANDBOX-ONLY distractor capability — no MVP mission requires
                 # it (it exists so Sandbox has a tempting-but-wrong card to teach minimal-set).

SlotType       = 'role' | 'tools' | 'memory' | 'planner' | 'stopping' | 'guardrails'

Card = {
  id: string
  type: SlotType
  capability: CapabilityId
  cost: number                     // budget contribution
  labelKey: string                 // i18n key — NEVER prose
  termKey?: string                 // (?) technical-term reveal, optional
}

Slot = { type: SlotType; accepts: SlotType[]; multiple: boolean; cardIds: string[] }

AgentConfig = { slots: Record<SlotType, string[]> }   // slotType -> cardIds placed

Mission = {
  id: string
  worldId: string
  goalKey: string; constraintKeys: string[]           // i18n keys
  budget: { steps: number; cost: number }
  requiredCaps: CapabilityId[]                          // must be provided to pass
  requiredRole?: CapabilityId                           // the ONE correct role capability (World 1);
                                                        //   `wrong-role` fires if placed role ≠ this
  forbiddenOrUselessCaps?: CapabilityId[]              // present-but-useless -> minimalSet star lost
                                                        //   AND drives the 👀 waste-step narrative (2.4)
  loopExpected?: boolean                                // true => a step-cap hit is a STOPPING-loop, not
                                                        //   merely over-budget (discriminator, see P1-4)
  minimalCardSet: string[]                              // card ids of the canonical minimal solution
  solutionPath: StepTemplate[]                          // the deterministic narrative skeleton (keys, not prose)
  expectedOutcomeKey: string                            // the outcome the trace should reach
}

StepTemplate = {
  marker: '🤔' | '🔍' | '👀' | '✅' | '❌'
  kind: 'thought' | 'action' | 'observation' | 'done' | 'fail' | 'refusal'
  requiresCap?: CapabilityId                            // if set, step only succeeds when cap is provided
  onMissingCap?: {                                      // what to do when `requiresCap` is absent:
    mode: 'fail' | 'refuse'                             //   'fail' (default) = hard ❌; 'refuse' = honest ✅
    textKey: string                                     //   line to render in that branch
    failureModeId?: string                              //   which mode explains a 'fail' (optional)
  }
  firesWhenCapPresent?: CapabilityId                    // observation/waste steps (2.4 👀): render only
                                                        //   if this cap is present (forbiddenOrUseless)
  textKey: string                                       // i18n key for the office-language line
  cost?: number
}

Step = {                                                // resolved instance (still keys, no prose)
  marker: '🤔' | '🔍' | '👀' | '✅' | '❌'
  kind: 'thought' | 'action' | 'observation' | 'done' | 'fail' | 'refusal'
  textKey: string
  ok: boolean
}

FailureMode = {
  id: string
  trigger: (ctx: WalkContext) => boolean               // pure predicate over (agent, mission, walkCtx)
  diagnosisKey: string                                  // -> one-line consequence+cause+fix
  evalOrder: number                                     // first matching mode wins
  requiresPreWalk: boolean                              // true => checked BEFORE the walk (setup-level);
                                                        //   false (default) => checked DURING the walk so
                                                        //   the story plays before any ❌ (AC-15 spirit)
}

Verdict = {
  passed: boolean
  steps: Step[]                                          // the renderable story (keys only)
  outcomeKey: string                                     // 'success' | 'refusal' | a failure outcome key
  failureModeId?: string
  diagnosisKey?: string
  stepsUsed: number; costUsed: number
  stars: { passed: boolean; minimalSet: boolean; withinBudget: boolean }
}
```

**`run(agent, mission)` algorithm (deterministic — no `lang` param):**

```
function run(agent, mission) -> Verdict:
  ctx = buildWalkContext(agent, mission)         # provided caps, extra caps, costs
  steps = []
  costUsed = 0

  # 1. Pre-walk failure check — ONLY modes with requiresPreWalk===true (setup-level).
  #    Default modes are in-walk so the story plays before any ❌ (AC-15 spirit).
  #    `missing-tool` is IN-WALK (not pre-walk). `wrong-role` is pre-walk (setup mismatch).
  for fm in FAILURE_MODES sorted by evalOrder where fm.requiresPreWalk:
      if fm.trigger(ctx):
          return failVerdict(fm, steps, ctx)     # emits a ❌ step + diagnosisKey

  # 2. Deterministic walk of mission.solutionPath
  for tpl in mission.solutionPath:
      # 2a. Conditional observation/waste step (2.4 👀): render only if the named cap is present.
      if tpl.firesWhenCapPresent and not ctx.provides(tpl.firesWhenCapPresent):
          continue                                # the waste line is skipped when no useless card
      costUsed += tpl.cost ?? 0

      # 2b. Missing-required-cap branch — refusal vs. fail decided by DATA (onMissingCap).
      if tpl.requiresCap and not ctx.provides(tpl.requiresCap):
          mode = tpl.onMissingCap?.mode ?? 'fail'
          if mode == 'refuse':                    # honest refusal (3.4): emit ✅ refusal and CONTINUE
              steps.push({marker:'✅', kind:'refusal',   # tagged 'refusal' so outcomeKey can detect it
                          textKey: tpl.onMissingCap.textKey, ok:true})
              continue                            # do NOT failVerdict — passed stays true
          else:                                   # default hard-fail (Worlds 1–2 unchanged)
              steps.push({marker:'❌', kind:'fail',
                          textKey: tpl.onMissingCap?.textKey ?? tpl.textKey, ok:false})
              fm = matchInWalkFailure(ctx, tpl)   # which mode explains this
              return failVerdict(fm, steps, ctx)

      # 2c. Step-cap / loop guard — discriminate loop vs. plain over-budget.
      if ctx.stepCount > mission.budget.steps:
          fm = (mission.loopExpected and not ctx.provides('stopping'))
                 ? NO_STOPPING_LOOP : BUDGET_EXCEEDED
          return failVerdict(fm, steps, ctx)

      steps.push({marker: tpl.marker, kind: tpl.kind, textKey: tpl.textKey, ok:true})

  # 3. Success — the refusal path above already kept passed=true via DATA (onMissingCap.mode='refuse').
  #    No mission-specific special-casing here: the ~6 lines in 2b are mission-agnostic engine code,
  #    reused by any future refusal mission.
  passed = true
  outcomeKey = steps.some(s => s.kind == 'refusal') ? 'refusal' : mission.expectedOutcomeKey  # 'success'
  return {
    passed, steps, outcomeKey,
    stepsUsed: ctx.stepCount, costUsed,
    stars: computeStars({passed, agent, mission, costUsed, stepCount: ctx.stepCount})
  }
```

**`matchInWalkFailure(ctx, tpl)` (defined helper, not a hand-wave):**

```
function matchInWalkFailure(ctx, tpl) -> FailureMode:
  # tool capability missing -> missing-tool
  if tpl.requiresCap is a tool cap and not ctx.provides(tpl.requiresCap):
      return MISSING_TOOL
  # mem-* missing WITH onMissingCap.mode='refuse' is NOT reached here (handled as a refusal pass in 2b)
  # otherwise: the first registered mode whose trigger(ctx) matches (evalOrder order)
  return first FAILURE_MODES (by evalOrder) where fm.trigger(ctx)
```

**Capability check (`capabilities.ts`):** `ctx.provides(cap)` = `cap ∈ providedCaps`, where `providedCaps` is the union of `card.capability` for all placed cards. `requiredMissing = mission.requiredCaps \ providedCaps`. `extraCards = placedCards \ mission.minimalCardSet`.

**Budget check (`budget.ts`):** `withinBudget = stepsUsed ≤ mission.budget.steps && costUsed ≤ mission.budget.cost`. The step budget doubles as the **infinite-loop guard** (no stopping card → the walk would exceed the cap → `BUDGET_EXCEEDED`).

**Star computation (`scoring.ts`):**
- `passed` ← verdict.passed.
- `minimalSet` (the **minimal-set penalty**, formerly mislabeled `extra-card` failure) ← `passed && extraCards.length === 0 && no forbiddenOrUselessCap is provided`. This is a **scoring penalty, not a failure mode** — it costs the minimal-set star (2.4's calculator trap — AC-7) without ever emitting a ❌. `extraCards = placedCards \ mission.minimalCardSet`. **Single source of truth:** the *same* `mission.forbiddenOrUselessCaps` array drives BOTH this star penalty AND the 2.4 👀 waste-step narrative (the `StepTemplate` with `firesWhenCapPresent` set to a member of that array — P1-5), so the lost star and the "you wasted a step" story line can never disagree.
- `withinBudget` ← `passed && withinBudget(...)`.
- Stars only awarded when `passed` is true (a failed run = 0 stars).

**Failure modes are declared as DATA (`failure-modes.ts`).** The registry is an ordered array of `FailureMode` records. Each `trigger` is a small pure predicate over `WalkContext`. **The registry holds 5 true failure modes** (the former `extra-card` entry is NOT a failure — it is the `minimalSet` scoring penalty above). Of these 5, **3 are mission-backed in MVP** and **2 are fixture-only teasers**:

| id | trigger (plain) | requiresPreWalk | MVP status | diagnosisKey theme |
|----|-----------------|-----------------|-----------|--------------------|
| `missing-tool` | a tool `requiredCap` not provided | **false (in-walk)** | **mission-backed** (World 2) | "couldn't get the data because it had no internet/calculator/documents; add that access" |
| `wrong-role` | placed role capability ≠ `mission.requiredRole` | **true (pre-walk)** | **mission-backed** (World 1) | "it answered in the wrong voice/style; set the right role" |
| `budget-exceeded` | `stepsUsed > steps` or `costUsed > cost` (and not a loop) | false (in-walk) | **mission-backed** (budget mission) | "it took too long / cost too much; trim the parts" |
| `no-stopping-loop` | `mission.loopExpected && no stopping card` → step cap hit | false (in-walk) | **fixture-only teaser** (Worlds 6/7 post-MVP) | "it kept going in circles; add a 'when to stop' rule" |
| `no-guardrail-injection` | mission flags injection and no `guardrail` card | true (pre-walk) | **fixture-only teaser** (Worlds 6/7 post-MVP) | "it blindly followed a hidden instruction; add 'ask a human first'" |

> **Pre-walk vs. in-walk:** `wrong-role` and `no-guardrail-injection` are **pre-walk** (a setup-level mismatch makes the story moot). Everything else is **in-walk** so the chat-story plays out before any ❌ (AC-15 spirit). Default for a new mode is in-walk.
> **Honest MVP coverage:** the engine *capability* supports ≥6 modes on crafted fixtures (AC-3a), but only **3 modes are exercised by real MVP missions** (AC-3b: `missing-tool`, `wrong-role`, `budget-exceeded`). The two teasers are unit-tested on fixtures and reserved for Worlds 6/7.
> Because triggers are pure predicates over data, **a new mission introduces no new engine code** — it reuses existing modes by declaring `requiredCaps`, `requiredRole`, `budget`, `loopExpected`, `solutionPath`. New *kinds* of failure (post-MVP) = append one record to the registry.

### 4.2 Content model (`src/content/`) — pure data, designer-editable

- **Cards, missions, worlds, quizzes are plain TS objects** (typed by `engine/types.ts`) holding **capability/cost/budget numbers and i18n KEYS only** — never human prose. This guarantees i18n coverage by construction and keeps RU/EN swap free.
- **`schema.ts`** defines zod schemas; **`registry.ts`** runs integrity asserts at module load (in tests/build): every `requiredCap` is satisfiable by some card; every `minimalCardSet` id exists; every `textKey`/`labelKey` exists in both locales.
- **Adding a mission (designer workflow, no engine edits):**
  1. Append a `Mission` object to the relevant `content/worlds/world-N.ts` with `goalKey`, `constraintKeys`, `budget`, `requiredCaps`, `requiredRole` (World 1 / role missions), `minimalCardSet`, optional `forbiddenOrUselessCaps`/`loopExpected`, and `solutionPath` (list of `StepTemplate` with markers + `textKey`; refusal missions add `onMissingCap.mode='refuse'`; waste-step missions add a `firesWhenCapPresent` 👀 step).
  2. Add the referenced keys to `i18n/locales/ru.json` and `en.json`.
  3. `tests/content/solvable.test.ts` and `key-parity.test.ts` confirm it auto-passes with its minimal set and is fully localized.
- **World 1 content note (`content/worlds/world-1.ts`):** each of the 4 missions sets a distinct `requiredRole` (`role-greeter`, `role-formal`, `role-concise`, `role-persona`). The AC-5 auto-solver places the **correct** role; the `wrong-role` fixture test places a different role card to trigger the mode.
- **wrong-role trace beat (parallels the 2.4 👀 waste-step).** So the story *shows the cause* rather than only diagnosing it, the `wrong-role` ❌ verdict carries a narrative step keyed `step.<missionId>.wrong-voice.fail` rendering "ответил не тем голосом/стилем" / "answered in the wrong voice/style". Because `wrong-role` is **pre-walk**, this single beat is emitted by `failVerdict` (a ❌ step keyed off the mode) *before* the verdict, mirroring how 2.4's `firesWhenCapPresent` 👀 beat shows the wasted action — both the failure narrative and the `wrong-role` predicate read the **same** `requiredRole` vs. placed-role data, so the story and the verdict cannot drift.

### 4.3 UI (`src/ui/`, `src/routes/`) — friendly assistant-setup look

**Screen list (six):**
1. **World Map** (`map/WorldMap.svelte`, `/campaign`): worlds as friendly stages; missions as cards; per-mission stars; locked worlds shown with the quiz-gate requirement.
2. **Assembly** (`assembly/*` in `/mission/[id]`): MissionBrief (office wording) + SlotBoard (six labeled slots) + Inventory (card palette). Invalid placements rejected with reason (AC-1).
3. **Run / "what the agent did" story** (`run/TraceStory.svelte`): animated chat-style transcript built from `Verdict.steps`.
4. **Result + stars** (`result/*`): Verdict banner, one-line Diagnosis (AC-14), StarRow with which star + why.
5. **Quiz** (`quiz/QuizScreen.svelte`, `/quiz/[world]`): ~8 questions, ≥70% gate.
6. **Sandbox** (`/sandbox`): free assembly with MVP cards against any MVP mission.

**Component breakdown:** see tree §3. Routes are thin orchestrators; all decisions live in `engine` + `content`; all text via `i18n`.

**State management (Svelte stores, `lib/stores/`):**
- `progress` — localStorage-backed: `{ stars: Record<missionId, {passed,minimalSet,withinBudget}>, unlockedWorlds: string[], locale }`. Versioned with a `schemaVersion` for forward migration.
- `session` — ephemeral: current mission id, the in-progress `AgentConfig` draft, and the last `Verdict`.
- `locale` — current language; re-exported from i18n.

**How the trace renders from keyed strings (the critical i18n decoupling):**
- `run()` returns `Verdict.steps` as **keys + markers only** (no prose, no language). The `Verdict` is stored in the `session` store **once**.
- `lib/trace-render.ts` maps each `Step` to a renderable line via `t(step.textKey)` against the **current** locale.
- `StepLine.svelte` renders `marker + t(textKey)`. When the locale store changes, Svelte reactivity re-renders the same `Verdict` in the new language — **`run()` is never re-invoked** (satisfies AC-11). Determinism is preserved because the language is purely a render concern, not a simulation input. **`run()` takes no `lang` parameter at all** in MVP, so Principle 4 ("locale never a sim input") is literally true. A future real-LLM mode would re-introduce locale handling behind a separate proxy/seam — not inside the deterministic `run()` signature.

---

## 5. i18n Plan

**Library:** `svelte-i18n` (lightweight, runtime locale store, format-message support). JSON locale files.

**Locale file structure (`i18n/locales/{ru,en}.json`)** — nested namespaces:
```
{
  "ui":      { "run": "...", "retry": "...", "next": "..." },
  "world":   { "1.title": "...", "1.subtitle": "..." },
  "mission": { "1.1.goal": "...", "1.1.constraint.0": "...", "2.4.goal": "..." },
  "card":    { "web-search.label": "...", "calculator.label": "..." },
  "step":    { "1.1.greet.thought": "🤔 ...", "2.1.fetch.action": "..." },
  "diag":    { "missing-tool": "...", "no-stopping-loop": "..." },
  "quiz":    { "1.q0.stem": "...", "1.q0.opt.0": "..." },
  "term":    { "tool.explain": "...", "react.explain": "..." }
}
```

**Key naming convention:** `namespace.entityId.role[.index]` — deterministic, mechanically checkable, mirrors content ids. Step keys mirror `missionId.stepName.kind`. This lets `key-parity.test.ts` and `solvable.test.ts` cross-check content↔locale by construction.

**Runtime switch mechanism:** `svelte-i18n`'s `locale` store; `LocaleToggle.svelte` sets it. All components read text via the reactive `$_('key')` (`t`) helper, so flipping the store re-renders everything — including an already-computed trace (AC-11) — with no reload and no `run()` re-execution.

**Term-reveal `(?)` tooltip system:** `i18n/terms.ts` maps an office label to its optional technical term + explanation, both locales. `TermTooltip.svelte` shows the office word inline and reveals `term + explanation` on click/focus (keyboard-accessible, `aria-describedby`). This is the **only** place a real technical term (tool, ReAct, prompt, memory-type) may appear (supports AC-13/AC-14). Diagnosis and step strings are lint-banned from containing jargon tokens outside this system.

**Coverage check:** `tests/i18n/key-parity.test.ts` asserts (a) `keys(ru) === keys(en)`, (b) every content-referenced key exists in both, (c) no orphan keys (present in locale, referenced nowhere) beyond an allowlist. An ESLint rule (`no-raw-strings-in-ui`) bans human-readable string literals in `ui/` and `routes/` render paths.

---

## 6. Build Order (numbered phases — each a verifiable increment)

> Each phase ends with a green test suite or a demoable artifact. Phases A–C are the **critical path** (everything depends on a correct, pure engine + one playable slice).

**Phase A — Engine + types + tests.** Implement `engine/types.ts`, `run.ts`, `capabilities.ts`, `failure-modes.ts` (the **5 registered failure modes** — `missing-tool`, `wrong-role`, `budget-exceeded`, `no-stopping-loop`, `no-guardrail-injection` — plus the one extra crafted-completeness fixture that makes AC-3a's ≥6; note `extra-card` is NOT here, it is the `minimalSet` scoring penalty in `scoring.ts`), `scoring.ts`, `budget.ts`. Write `tests/engine/*`. **Verify:** AC-2, AC-3, AC-4, AC-8 green; determinism harness passes; engine has zero DOM/fetch/Date/random imports (lint rule).

**Phase B — Content schema + World 1 data.** `content/schema.ts`, `cards.ts` (the ~10–12 cards), `worlds/world-1.ts` (1.1–1.4), `registry.ts`. Seed RU+EN keys for World 1. **Verify:** AC-5 (World-1 subset) + AC-12 (World-1 keys) green via `schema-valid` + `solvable` + `key-parity`.

**Phase C — Assembly + Run + Result UI vertical slice (one mission playable).** Build `assembly/*`, `run/TraceStory + StepLine`, `result/*`, wire `routes/mission/[id]`, `session` store, `trace-render.ts`. **Verify:** AC-1, AC-14, AC-15 component tests + `e2e/play-mission.spec.ts` (1 mission start→pass) green. **This is the demoable vertical slice.**

**Phase D — World map + stars + localStorage.** `map/WorldMap.svelte`, `lib/persistence.ts`, `progress` store, `routes/campaign` + `/+page` mode select. **Verify:** AC-9 green; stars persist across reload; world/mission lock UI correct.

**Phase E — Worlds 2–3 content + new cards / failure-mode coverage.** Add `world-2.ts` (incl. 2.4 trap with its 👀 waste-step and a `budget-exceeded` mission) and `world-3.ts` (incl. 3.4 honest refusal via `onMissingCap.mode='refuse'`), tool + memory cards, RU/EN keys. Also set World-1 `requiredRole` per mission and add a `wrong-role` trace beat ("answered in the wrong voice/style"). **Verify:** AC-3a (≥6 modes on crafted fixtures) **and** AC-3b (exactly **3** modes — `missing-tool`, `wrong-role`, `budget-exceeded` — exercised by real missions; the 2 teasers fixture-only), AC-5 full (≥12 missions auto-solvable), AC-7 (2.4 trap), AC-8 (3.4 `passed===true && outcomeKey==='refusal'`) green.

**Phase F — Quizzes + gating + sourcing/license.** `content/quizzes/*`, `quiz/QuizScreen + QuizResult`, `routes/quiz/[world]`, gate logic into `progress`. **Quiz sourcing:** select/adapt ~8 questions per world from the repo bank (`FlorianBruniaux/claude-code-ultimate-guide`, 271-Q), translate into the keyed RU/EN locale model, and record license + attribution in `CONTENT-LICENSES.md`. **Verify:** AC-6 green at 69/70/71% boundaries; gate blocks/unlocks correctly; AC-16 (attribution file exists + non-empty when the bank is reused) green.

**Phase G — i18n full pass + term-reveal.** Complete `ru.json`/`en.json` for all MVP strings; `terms.ts` + `TermTooltip`; `LocaleToggle` in layout. **Verify:** AC-11 (`locale-toggle.spec.ts`), AC-12 (full parity) green; manual no-jargon review of diagnosis/step strings.

**Phase H — Sandbox mode.** `routes/sandbox` reusing Assembly/Run/Result with any MVP card/mission. **Verify:** sandbox playable; uses same engine; no new engine code.

**Phase I — Polish / a11y / responsive.** Design tokens, friendly assistant-setup styling, focus management, keyboard nav, `prefers-reduced-motion` for trace animation, responsive layout, axe-core pass. **Verify:** AC-10 (offline E2E), AC-13 (`no-tech-surface.spec.ts`), `a11y.spec.ts` (WCAG 2.2 AA) green.

---

## 7. Estimate (relative effort S/M/L; critical path)

| Phase | Effort | Notes |
|-------|--------|-------|
| A Engine + tests | **M** | Highest-value, highest-care. Determinism + 6 modes. **Critical path.** |
| B Content schema + World 1 | **S** | Mostly data + zod. **Critical path.** |
| C Vertical-slice UI | **L** | Assembly DnD, animated trace, result wiring. **Critical path.** |
| D Map + stars + storage | **M** | Persistence + migration + lock UI. |
| E Worlds 2–3 content | **M** | Data + keys; traps/honesty need careful `solutionPath` authoring. |
| F Quizzes + gating | **S** | Straightforward once content model exists. |
| G i18n full + term-reveal | **M** | Coverage discipline; tooltip a11y. |
| H Sandbox | **S** | Reuses everything. |
| I Polish / a11y / responsive | **M** | WCAG 2.2 AA, offline, no-tech-surface scan. |

**Critical path:** **A → B → C** (correct pure engine → content schema → one playable mission). Everything else (D–I) layers on the slice and can partly parallelize (e.g., E content authoring can overlap with D once the schema from B is frozen; G can begin as strings accrue). Total relative size ≈ **2L + 4M + 3S**.

---

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Engine over-generalization** (building a generic agent simulator instead of exactly what 12 missions need) | Schedule blowout, untestable complexity | Lock the type surface in Phase A to *only* what AC-1…AC-8 require; `solutionPath` is a flat skeleton, not a branching interpreter; "no feature without a mission that uses it" rule. |
| **Content-authoring burden** (12 missions × keys × RU/EN by hand) | Slow, error-prone, drift | `schema.ts` + `registry.ts` integrity asserts catch missing keys/caps at test time; `solvable.test.ts` proves each mission winnable; designer workflow documented in §4.2. |
| **i18n drift** (RU/EN out of sync, hardcoded strings creep in) | Broken AC-11/AC-12 | `key-parity.test.ts` in CI + `no-raw-strings-in-ui` lint rule; content holds keys only by construction. |
| **Non-tech UX clarity slips** (jargon/code leaks to screen) | Core product failure (AC-13/14/15) | `no-tech-surface.spec.ts` DOM scan; `no-jargon-in-diagnosis` lint; all tech terms funneled through `(?)` tooltip; manual review checklist in Phase I. |
| **Trace re-renders by re-running sim on locale switch** (would break determinism guarantee) | AC-11 fail, subtle bugs | Architectural decoupling: `Verdict` stores **keys**, render maps keys→text; `run()` never called on locale change (§4.3). E2E asserts step structure identical across toggle. |
| **Scope creep into Worlds 4–7 / real-LLM** | MVP never ships | Non-Goals enforced; `lang` param reserved but inert; multi-agent/guardrail kept as a single Phase-E teaser card only. |
| **Drag-and-drop a11y** (DnD often inaccessible) | WCAG 2.2 AA fail | Provide keyboard-operable placement (select card → select slot) as the primary interaction; DnD as enhancement; axe-core + keyboard E2E in Phase I. |

---

## 9. Verification Steps

**Engine purity / determinism (AC-2):** `tests/engine/determinism.test.ts` runs `run()` 1000× on a fixed (agent, mission) and asserts identical `Verdict` (deep-equal on keys/markers/stars). Static lint rule bans `fetch`, `XMLHttpRequest`, `Date`, `Math.random`, and DOM globals inside `src/engine/**`. CI fails the build on any violation.

**Failure modes (AC-3):** `tests/engine/failure-modes.test.ts` — one test per mode with a crafted (agent, mission) asserting `verdict.failureModeId` and `diagnosisKey` (AC-3a, ≥6 modes on fixtures). Phase E's `tests/content/mission-coverage.test.ts` re-asserts that **exactly 3** modes fire from *real* MVP missions (`missing-tool`, `wrong-role`, `budget-exceeded` — AC-3b) and that the 2 teasers (`no-stopping-loop`, `no-guardrail-injection`) are present in the registry but **unreachable from any MVP mission's path**.

**Scoring & traps (AC-4, AC-7, AC-8):** table-driven `scoring.test.ts`; dedicated assertions for 2.4 (`minimalSet=false` when calculator added) and 3.4 (refusal, not fabrication).

**Content coverage (AC-5):** `tests/content/solvable.test.ts` iterates all missions, auto-builds the agent from `minimalCardSet`, runs `run()`, asserts 3 stars. `schema-valid.test.ts` zod-validates all content.

**i18n coverage (AC-11, AC-12):** `key-parity.test.ts` (ru↔en parity + content-referenced keys exist + no orphans). `e2e/locale-toggle.spec.ts` toggles locale on the Result screen and asserts trace text changed while step count/order are identical (proves no sim re-run).

**Persistence (AC-9):** `tests/persistence/progress.test.ts` writes/reads/restores; injects malformed JSON and asserts clean-state fallback without throwing.

**Static/offline (AC-10):** build then serve `build/`; `e2e/offline.spec.ts` loads, disables network, completes a mission. Grep build output for app-owned network calls.

**A11y (WCAG 2.2 AA):** `e2e/a11y.spec.ts` runs axe-core across all six screens; keyboard-only E2E completes a mission (no mouse); contrast and focus-indicator checks; `prefers-reduced-motion` honored by trace animation.

**Non-tech UX (AC-13, AC-14, AC-15):** `e2e/no-tech-surface.spec.ts` scans rendered DOM on every screen for banned tokens (`{`,`}`,`</`,`function`,`[object`, monospace "console" containers). Snapshot test parses every `diag.*` string into exactly 3 plain-language parts and asserts no banned jargon token. Component test asserts every trace line begins with an allowed emoji marker matching its step kind.

**Spec acceptance traceability:** the 9 original spec criteria (lines 94–105) map to AC-1…AC-12; the 3 new non-tech-UX criteria map to AC-13/14/15; AC-16 covers quiz sourcing/attribution. CI gate: all 16 (counting AC-3a/AC-3b as the split AC-3) green before "done."

---

## 10. RALPLAN-DR Summary

**Mode:** SHORT (greenfield MVP, low operational risk — static client-only, deterministic, no data/security surface). Not `--deliberate`.

### Principles (4)
1. **The simulation is a pure function.** `run(agent, mission)` has no network, no clock, no randomness — and **no `lang` parameter** (locale is never a sim input) — so it is unit-testable, byte-deterministic, and trivially scales on static hosting (50+ concurrent is free).
2. **Behavior lives in data, code stays fixed.** Missions/cards/failure modes are declarative; a designer adds a mission with **zero engine changes**.
3. **The player never sees the machine.** Office vocabulary, chat-style story, one-line diagnoses; every technical term is opt-in behind `(?)`. This is a product requirement, enforced by tests, not a nicety.
4. **Localization is a render concern, never a simulation input.** The trace is computed once as keys+markers; RU↔EN is a re-render, never a re-run.

### Decision Drivers (top 3)
1. **Non-technical UX fidelity** — zero code/jargon on screen; the friendly "assistant setup/chat" feel must be effortless to build and police.
2. **Deterministic, testable engine** — the entire teaching value and ≥6 failure modes hinge on a pure, reproducible simulation.
3. **Static-only deploy + tiny bundle** — GitHub Pages/Netlify, offline-capable, 50+ concurrent for free; small bundle keeps load fast for office users on managed laptops.

### Biggest architectural choice — Framework: SvelteKit (static) vs React / Preact / SolidJS / vanilla-TS

**First, what is NOT a differentiator (locale credit, corrected).** The headline "instant RU↔EN re-render with no sim re-run" is an **architectural** property, not a framework gift: it follows from (a) the `Verdict` storing keys+markers only and (b) a render layer that reads the current locale reactively and maps keys→text. That pattern is reproducible in **React** (context + `useSyncExternalStore`), **Preact** (signals or context), **SolidJS** (signals), and even **vanilla TS** (a tiny observable + manual re-render). Svelte's stores make it *ergonomic*, but they are **not the reason** the toggle works — so the locale benefit is removed from the deltas below and must not be counted as Svelte-specific.

**Option A — SvelteKit + `adapter-static` + TypeScript (RECOMMENDED).**
- *Pros (honest, remaining deltas only):* single-file `.svelte` component ergonomics (markup + logic + scoped style co-located) suit a small presentational UI; **built-in stores** give `progress`/`session`/`locale` state with zero extra dependency; `@sveltejs/adapter-static` produces a pure prerendered static site out of the box (AC-10) with no config wrestling; compiler output has no virtual-DOM runtime, so the baseline bundle is small for office-laptop load times.
- *Cons:* smaller ecosystem/talent pool; fewer prebuilt component libs; some contributors less familiar with Svelte idioms.

**Option B — React + Vite + TypeScript.**
- *Pros:* largest ecosystem and hiring pool; abundant DnD/UI/i18n libraries; familiarity lowers onboarding; Vite static build is straightforward.
- *Cons:* heaviest baseline runtime (React + ReactDOM) for a UI this small; needs a separate static-export step; more boilerplate for state than Svelte stores; no payoff from React's large-dynamic-app strengths at this scope.

**Option C — Preact + Vite + TypeScript.**
- *Pros:* React-compatible mental model and JSX with a ~3–4 kB runtime (much lighter than React); signals available for the same reactive locale pattern; static export via Vite is simple.
- *Cons:* smaller component-lib coverage than React; some React libs need the `preact/compat` shim; still slightly heavier and more wiring than Svelte's single-file + store ergonomics.

**Option D — SolidJS + Vite + TypeScript.**
- *Pros:* fine-grained signals give excellent reactivity and a very small runtime; the keyed-Verdict + reactive-locale pattern is a natural fit; JSX familiarity for React refugees.
- *Cons:* smaller ecosystem and talent pool than even Svelte; fewer batteries-included conventions (routing/static-adapter) than SvelteKit; team ramp-up cost.

**Option E — vanilla TS + a tiny router (no framework).**
- *Pros:* absolute minimum bundle; zero framework lock-in; the pure `engine`/`content`/`i18n` layers don't care what renders them.
- *Cons:* you hand-roll reactivity, routing, list-diffing, and component structure — exactly the boilerplate a six-screen app with an animated trace does NOT want to own; slowest to build and most error-prone for DnD + a11y.

**Convergence + invalidation rationale (on honest deltas only).** Choose **Option A (SvelteKit static)**. With the locale benefit reclassified as architectural (and therefore neutral across A–E), the remaining honest deltas are: single-file component ergonomics, built-in stores with no extra dependency, and `adapter-static` working out of the box — these three directly serve Driver 1 (effortless friendly UI) and Driver 3 (static/tiny/offline) at the lowest build cost. **B (React)** is invalidated: its ecosystem/hiring edge moves none of the three drivers at this scope, while its heavier runtime + extra static-export wiring work against Driver 3. **C (Preact)** and **D (Solid)** are *technically excellent and close* — both can reproduce every architectural property — but neither beats SvelteKit's batteries-included static adapter + routing, and both add either shim friction (Preact/compat) or a thinner ecosystem (Solid) without a compensating driver win. **E (vanilla)** is invalidated: the bundle saving is marginal versus Svelte's compiled output, while the hand-rolled reactivity/routing/a11y cost is large and directly harms build speed and UX quality. The engine and content layers are framework-agnostic pure TS, so a reversal to C/D/E would touch only `src/ui/` + `src/routes/`; the valuable parts (`engine/`, `content/`, `i18n` data) port unchanged. (The second architectural axis — **data-driven engine vs hardcoded-per-mission** — has an obviously correct answer given Principle 2 and the "new mission = no new code" requirement, so the hardcoded option is rejected without further deliberation: it would re-violate Driver 2 and the content-authoring risk in §8.)

### ADR (condensed)
- **Decision:** SvelteKit + adapter-static + TypeScript; pure data-driven deterministic engine; i18n as keys + render-time mapping.
- **Drivers:** non-tech UX fidelity; deterministic testable engine; static/tiny/offline deploy.
- **Alternatives considered:** React + Vite, Preact + Vite, SolidJS + Vite, vanilla-TS + tiny-router (framework axis — all five fairly compared; the keyed-Verdict + reactive-locale re-render is architectural and reproducible in any of them, so it was NOT counted as a Svelte advantage); hardcoded-per-mission engine (architecture axis).
- **Why chosen:** lightest static bundle + native reactive stores for instant locale/progress; data-driven engine makes content additions code-free and keeps determinism.
- **Consequences:** smaller talent pool / ecosystem; mitigated by keeping `engine`/`content`/`i18n` framework-agnostic so only UI is Svelte-specific.
- **Follow-ups (post-MVP):** real-LLM mode re-introduces a `lang`/locale input **only** behind a separate proxy seam (never back into the deterministic `run()` signature, preserving Principle 4); Worlds 6/7 promote the two fixture-only teasers (`no-stopping-loop`, `no-guardrail-injection`) from crafted fixtures to real missions (using `loopExpected` / injection-flag missions); Worlds 4–5 reuse the same engine/registry; if the quiz bank grows beyond the initial ~24 adapted questions, keep `CONTENT-LICENSES.md` attribution current; optional component-lib adoption if Sandbox grows; decide whether `code-run` graduates from Sandbox-only distractor to a real tool mission.
```

---

## 11. Changelog (consensus revision 1)

This revision applies the Architect + Critic consensus feedback. The plan's good bones are preserved (pure deterministic engine, data-driven content, keyed-render i18n) and all section numbering is unchanged. Each change is tagged with its defect id.

**P0 — structural (the type surface now encodes what the ACs assert):**
- **P0-1 (3.4 honest-refusal must PASS):** Added `StepTemplate.onMissingCap?: { mode: 'fail' | 'refuse'; textKey; failureModeId? }` to the type surface (§4.1). The `run()` missing-cap branch (§4.1, step 2b) now branches on `tpl.onMissingCap?.mode`: `'refuse'` pushes a ✅ refusal step and **continues** with `passed` staying true; absent/`'fail'` keeps the prior hard-fail. Deleted the false "encoded entirely in solutionPath / no special-casing" claim and replaced it (§4.1 Design principle) with "behavior stays in DATA via `onMissingCap`; `run()` gains ~6 mission-agnostic lines — still honors Principle 2." AC-8 now asserts `verdict.passed===true && verdict.outcomeKey==='refusal'` with no fabrication string.
- **P0-2 (failure-mode count overclaim):** Split AC-3 into **AC-3a** (ENGINE-CAPABILITY: ≥6 modes each fire on a crafted unit fixture) and **AC-3b** (MISSION-BACKED: exactly 3 modes — `missing-tool`, `wrong-role`, `budget-exceeded` — exercised by real MVP missions). Marked `no-stopping-loop` and `no-guardrail-injection` as FIXTURE-ONLY teasers for deferred Worlds 6/7. Removed every "all 6 modes exercised by real missions" claim (Phase A §6, §9 Failure-modes, §9 traceability count corrected to 16 ACs). Moved `extra-card` out of the failure-mode registry into the scoring section as the `minimalSet` penalty (drives `minimalSet=false`, never a ❌).
- **P0-3 (roles must be distinguishable):** Replaced the monolithic `role-set` with concrete role capabilities `role-greeter | role-formal | role-concise | role-persona` in `CapabilityId` (§4.1). Added `Mission.requiredRole: CapabilityId`. `wrong-role` now fires when the placed role capability ≠ `mission.requiredRole`. Updated AC-5 (auto-solver places the CORRECT role; wrong-role test places a wrong one), the `Mission` type, and the `content/worlds/world-1.ts` note. Added a wrong-role **trace beat** ("answered in the wrong voice/style") paralleling the 2.4 waste-step (§4.2) driven from the same `requiredRole` data.

**P1:**
- **P1-4 (distinguish no-stopping-loop from budget-exceeded):** Added `Mission.loopExpected?: boolean` (§4.1). On a step-cap hit, `run()` (step 2c) picks `no-stopping-loop` when `loopExpected && no stopping card`, else `budget-exceeded` (fixture-test only, since both relate to deferred worlds).
- **P1-5 (2.4 trap waste must show in the story):** Added a `StepTemplate` (`kind:'observation'`, marker 👀) via `firesWhenCapPresent` to 2.4's solutionPath; documented that BOTH the `minimalSet` penalty AND the 👀 narrative read the SAME `mission.forbiddenOrUselessCaps` array (§3 scoring note + §4.2) so they cannot drift.
- **P1-6 (fair framework ADR):** Replaced the SvelteKit-vs-React strawman in §10 with an honest five-option treatment (SvelteKit, React, Preact, SolidJS, vanilla-TS+router). Reclassified the "instant RU↔EN re-render with no sim re-run" benefit as **architectural** (keyed Verdict + reactive locale read), reproducible in React/Preact/Solid/vanilla — removed the mis-attributed locale credit from Svelte's pros. Re-justified the Svelte conclusion on honest deltas only (single-file ergonomics, built-in stores, adapter-static out-of-box). Updated the ADR "Alternatives considered" accordingly.
- **P1-7 (quiz sourcing + license):** Added quiz sourcing to Phase B/F (§6): adapt ~8 questions per world from `FlorianBruniaux/claude-code-ultimate-guide` (271-bank) into the keyed RU/EN model and record license + attribution in `CONTENT-LICENSES.md`. Added **AC-16** asserting the attribution file exists and is non-empty when the bank is reused.

**P2:**
- **P2-1 (drop dead `lang` param):** Removed `lang` from the `run()` MVP signature everywhere it leaked — AC-2, the §4.1 algorithm header, the §3 file tree (`run.ts` comment), §4.3, and Principle 1 in §10. The `lang`/locale input is re-introduced **only** behind the future real-LLM proxy seam (ADR Follow-ups), resolving the Principle-4 contradiction (locale is never a sim input).
- **P2-2 (tighten `Step` type):** The resolved `Step` type lists field types matching `StepTemplate` (`marker`, `kind`, `textKey`, `ok`) in §4.1.
- **P2-3:** Covered by P0-2 — `extra-card` moved to scoring.

**Undefined helpers specified (Critic gaps closed):**
- Added `FailureMode.requiresPreWalk: boolean` to the FailureMode **type** (§4.1); documented per-mode which are pre-walk (`wrong-role`, `no-guardrail-injection`) vs in-walk (default; story plays before any ❌, AC-15 spirit) in the failure-mode table and the pre-walk/in-walk note.
- Specified `matchInWalkFailure(ctx, tpl)` (§4.1): tool cap → `missing-tool`; a `mem-*` cap whose StepTemplate has `onMissingCap.mode='refuse'` is NOT a failure (handled as a refusal pass in 2b); otherwise the first registered mode whose `trigger(ctx)` matches by `evalOrder`.
- Clarified `code-run`: marked **Sandbox-only distractor** capability (no MVP mission requires it) in `CapabilityId` notes (§4.1); a follow-up flags the decision to graduate it or not.

**Status:** advanced to "Draft v2 — consensus revision 1 (Architect+Critic feedback applied)."

**Consensus close + post-approval MINOR fix:** Critic re-verified v2 and returned **APPROVE (consensus reached)** — all P0/P1 confirmed resolved in the actual type surface and `run()` body. One MINOR residual applied afterward: added `'refusal'` to the `Step`/`StepTemplate` `kind` unions and tagged the refuse-branch step `kind:'refusal'`, so `outcomeKey = steps.some(s => s.kind == 'refusal') ? 'refusal' : mission.expectedOutcomeKey` has a concrete field to detect (closes the AC-8 derivation gap). Plan status: **PENDING APPROVAL** (non-interactive consensus run — no auto-execution).
