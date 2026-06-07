// Agent Forge — engine types. PURE: no DOM, no fetch, no Date, no Math.random.
// All mission-specific behavior lives in DATA (Mission/StepTemplate/FailureMode), never in code.

export type CapabilityId =
  // tools
  | 'web-search'
  | 'calculator'
  | 'doc-reader'
  | 'code-run' // Sandbox-only distractor — no MVP mission requires it
  // memory
  | 'mem-working'
  | 'mem-episodic'
  | 'mem-semantic'
  // roles (concrete so wrong-role is real across World 1)
  | 'role-greeter'
  | 'role-formal'
  | 'role-concise'
  | 'role-persona'
  // control
  | 'planner'
  | 'critic'
  | 'stopping'
  | 'guardrail'
  // model tier (Advanced: cost/quality trade-off)
  | 'model-cheap'
  | 'model-strong';

export type SlotType =
  | 'role'
  | 'model'
  | 'tools'
  | 'memory'
  | 'planner'
  | 'stopping'
  | 'guardrails'
  | 'review';

export type Marker = '🤔' | '🔍' | '👀' | '✅' | '❌';
export type StepKind = 'thought' | 'action' | 'observation' | 'done' | 'fail' | 'refusal';

export interface Card {
  id: string;
  type: SlotType;
  capability: CapabilityId;
  cost: number;
  labelKey: string; // i18n key — NEVER prose
  termKey?: string; // optional (?) technical-term reveal
}

export interface OnMissingCap {
  mode: 'fail' | 'refuse'; // 'fail' (default) = hard ❌; 'refuse' = honest ✅ that PASSES
  textKey: string;
  failureModeId?: string;
}

export interface StepTemplate {
  marker: Marker;
  kind: StepKind;
  textKey: string;
  requiresCap?: CapabilityId; // step only succeeds when this cap is provided
  onMissingCap?: OnMissingCap; // what to do when requiresCap is absent
  firesWhenCapPresent?: CapabilityId; // observation/waste step (2.4 👀): render only if cap present
  cost?: number;
}

export interface Step {
  marker: Marker;
  kind: StepKind;
  textKey: string;
  ok: boolean;
}

export interface Mission {
  id: string;
  worldId: string;
  goalKey: string;
  constraintKeys: string[];
  budget: { steps: number; cost: number };
  requiredCaps: CapabilityId[];
  requiredRole?: CapabilityId; // which role is correct (World 1)
  forbiddenOrUselessCaps?: CapabilityId[]; // present-but-useless -> costs minimalSet star (2.4 trap)
  minimalCardSet: string[]; // card ids of the canonical minimal solution
  solutionPath: StepTemplate[];
  expectedOutcomeKey: string;
  loopExpected?: boolean; // discriminates no-stopping-loop vs budget-exceeded
  injectionExpected?: boolean; // fixture-only guardrail teaser (Worlds 6/7)
  requiresModel?: boolean; // Advanced trade-off: the task needs SOME model (cheap or strong)
  needsStrongModel?: boolean; // Advanced trade-off: only the strong model is good enough here
}

export interface AgentConfig {
  cards: Card[]; // resolved cards placed into slots (UI does slot->card resolution)
}

export interface Stars {
  passed: boolean;
  minimalSet: boolean;
  withinBudget: boolean;
}

export interface Verdict {
  passed: boolean;
  steps: Step[];
  failureModeId?: string;
  diagnosisKey?: string;
  outcomeKey?: string;
  stepsUsed: number;
  costUsed: number;
  stars: Stars;
}

export interface WalkContext {
  agent: AgentConfig;
  mission: Mission;
  providedCaps: Set<CapabilityId>;
  placedCardIds: string[];
  extraCards: string[]; // placed cards outside minimalCardSet
  requiredMissing: CapabilityId[]; // requiredCaps not provided
  stepsUsed: number; // mutated during the walk
  costUsed: number; // mutated during the walk
}

export interface FailureMode {
  id: string;
  trigger: (ctx: WalkContext) => boolean; // pure predicate
  diagnosisKey: string;
  evalOrder: number; // first matching wins
  requiresPreWalk: boolean; // true => checked BEFORE the walk; false (default) => during
}
