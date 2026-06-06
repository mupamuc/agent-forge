import type { Stars } from '$engine/index.js';

// Persisted progress (AC-9). Plain serialisable data — stars per mission, per-world quiz results,
// and unlocked worlds. Versioned with a schemaVersion so a migration can detect old saves; any
// save that doesn't match the CURRENT schema (old version, corrupt, structurally wrong) degrades
// to a clean new game WITHOUT throwing.
//
// v2 (Phase F) adds the `quizzes` record. A v1 save has no quizzes and an older shape, so it fails
// the version check and loads as a fresh state — exactly the AC-9 corrupt-storage fallback.
export const SCHEMA_VERSION = 2;

// We only persist the three star booleans (never the full Verdict, which carries i18n keys).
export type MissionStars = Pick<Stars, 'passed' | 'minimalSet' | 'withinBudget'>;

/** A world's quiz outcome: best score so far (0–100) and whether it has ever been passed. */
export interface QuizResult {
  scorePct: number;
  passed: boolean;
}

export interface ProgressState {
  schemaVersion: number;
  stars: Record<string, MissionStars>;
  quizzes: Record<string, QuizResult>;
  unlockedWorlds: string[];
}

const STORAGE_KEY = 'agent-forge.progress';

/** A fresh save: nothing earned yet, no quizzes passed, World 1 unlocked by default. */
export function newProgress(): ProgressState {
  return {
    schemaVersion: SCHEMA_VERSION,
    stars: {},
    quizzes: {},
    unlockedWorlds: ['world-1']
  };
}

// Structural guard — anything that doesn't match the current schema degrades to a new game.
function isMissionStars(value: unknown): value is MissionStars {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.passed === 'boolean' &&
    typeof v.minimalSet === 'boolean' &&
    typeof v.withinBudget === 'boolean'
  );
}

function isQuizResult(value: unknown): value is QuizResult {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.scorePct === 'number' && typeof v.passed === 'boolean';
}

function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.schemaVersion !== SCHEMA_VERSION) return false;
  if (!Array.isArray(v.unlockedWorlds)) return false;
  if (!v.unlockedWorlds.every((w) => typeof w === 'string')) return false;
  if (typeof v.stars !== 'object' || v.stars === null) return false;
  if (!Object.values(v.stars as Record<string, unknown>).every(isMissionStars)) return false;
  if (typeof v.quizzes !== 'object' || v.quizzes === null) return false;
  return Object.values(v.quizzes as Record<string, unknown>).every(isQuizResult);
}

/**
 * Load progress from localStorage. Corrupt, missing, or out-of-schema storage (including any old
 * v1 save) degrades to a clean new-game state WITHOUT throwing (AC-9): JSON.parse is wrapped and
 * the result validated against the current schema.
 */
export function loadProgress(): ProgressState {
  if (typeof localStorage === 'undefined') return newProgress();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return newProgress();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isProgressState(parsed)) return parsed;
  } catch {
    // malformed JSON — fall through to a clean state
  }
  return newProgress();
}

/** Persist progress. Silently no-ops when storage is unavailable (private mode, SSR, quota). */
export function saveProgress(state: ProgressState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked — progress simply isn't persisted this run
  }
}
