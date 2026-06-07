import type { Stars } from '$engine/index.js';
import type { MissionStars, ProgressState, QuizResult } from '$lib/persistence.js';
import { WORLDS } from '$content/worlds.js';

// Pure progress logic — no runes, no DOM, no storage — so it is directly unit-testable in the
// node vitest env. The Svelte store (progress.svelte.ts) is a thin reactive wrapper over these.

// A quiz passes at 70% (mirrors QUIZ_PASS_RATIO in content/quizzes). Kept as a percent here since
// the store records whole-percent scores (0–100).
export const QUIZ_PASS_PERCENT = 70;

/** Narrow the engine's full Stars to the three persisted booleans. */
export function toMissionStars(stars: Stars): MissionStars {
  return {
    passed: stars.passed,
    minimalSet: stars.minimalSet,
    withinBudget: stars.withinBudget
  };
}

/** Count of earned stars (0–3). */
export function starsEarned(stars: MissionStars | undefined): number {
  if (!stars) return 0;
  return (stars.passed ? 1 : 0) + (stars.minimalSet ? 1 : 0) + (stars.withinBudget ? 1 : 0);
}

/** Total stars earned across the whole campaign, and the maximum possible (3 per mission). */
export function campaignStarTotals(stars: Record<string, MissionStars>): {
  earned: number;
  max: number;
} {
  const ids = WORLDS.flatMap((w) => w.missionIds);
  const earned = ids.reduce((sum, id) => sum + starsEarned(stars[id]), 0);
  return { earned, max: ids.length * 3 };
}

/** The first campaign mission not yet passed (campaign order), or null when everything is passed. */
export function nextUnsolvedMission(stars: Record<string, MissionStars>): string | null {
  const ids = WORLDS.flatMap((w) => w.missionIds);
  return ids.find((id) => stars[id]?.passed !== true) ?? null;
}

/** Merge new stars over old, never downgrading a previously-earned star (best-of per boolean). */
export function mergeStars(
  prev: MissionStars | undefined,
  next: MissionStars
): MissionStars {
  if (!prev) return next;
  return {
    passed: prev.passed || next.passed,
    minimalSet: prev.minimalSet || next.minimalSet,
    withinBudget: prev.withinBudget || next.withinBudget
  };
}

/** A quiz result for a whole-percent score: passed once it clears the 70% threshold. */
export function toQuizResult(scorePct: number): QuizResult {
  return { scorePct, passed: scorePct >= QUIZ_PASS_PERCENT };
}

/**
 * Merge a new quiz result over the old one, never downgrading: keep the best score AND, once a
 * quiz has ever been passed, it stays passed even if a later retake scores lower.
 */
export function mergeQuiz(prev: QuizResult | undefined, next: QuizResult): QuizResult {
  if (!prev) return next;
  return {
    scorePct: Math.max(prev.scorePct, next.scorePct),
    passed: prev.passed || next.passed
  };
}

/** Whether every mission of a world has been passed (≥1 star on each). */
function allMissionsPassed(worldId: string, stars: Record<string, MissionStars>): boolean {
  const world = WORLDS.find((w) => w.id === worldId);
  if (!world || world.missionIds.length === 0) return false;
  return world.missionIds.every((id) => stars[id]?.passed === true);
}

/**
 * Recompute unlocked worlds. World 1 is always unlocked; World N (N>1) unlocks only when EVERY
 * mission of World N-1 is passed AND World N-1's quiz checkpoint is passed. Order follows the
 * WORLDS registry.
 */
export function computeUnlockedWorlds(
  stars: Record<string, MissionStars>,
  quizzes: Record<string, QuizResult>
): string[] {
  const unlocked: string[] = [];
  let previousCleared = true; // nothing precedes the first world → treat as satisfied
  for (const world of WORLDS) {
    if (previousCleared) unlocked.push(world.id);
    previousCleared =
      allMissionsPassed(world.id, stars) && quizzes[world.id]?.passed === true;
  }
  return unlocked;
}

/**
 * Apply a run's stars to a progress state: best-star merge for the mission, then unlock recompute.
 * Returns a NEW state (immutable) — never mutates the input.
 */
export function applyResult(
  state: ProgressState,
  missionId: string,
  stars: Stars
): ProgressState {
  const mergedStars: Record<string, MissionStars> = {
    ...state.stars,
    [missionId]: mergeStars(state.stars[missionId], toMissionStars(stars))
  };
  return {
    ...state,
    stars: mergedStars,
    unlockedWorlds: computeUnlockedWorlds(mergedStars, state.quizzes)
  };
}

/**
 * Apply a quiz score (0–100) for a world: best-score merge (never downgrades a passed quiz), then
 * unlock recompute. Returns a NEW state (immutable) — never mutates the input.
 */
export function applyQuiz(
  state: ProgressState,
  worldId: string,
  scorePct: number
): ProgressState {
  const mergedQuizzes: Record<string, QuizResult> = {
    ...state.quizzes,
    [worldId]: mergeQuiz(state.quizzes[worldId], toQuizResult(scorePct))
  };
  return {
    ...state,
    quizzes: mergedQuizzes,
    unlockedWorlds: computeUnlockedWorlds(state.stars, mergedQuizzes)
  };
}
