import { describe, it, expect, beforeEach } from 'vitest';
import type { Stars } from '$engine/index.js';
import {
  loadProgress,
  saveProgress,
  newProgress,
  SCHEMA_VERSION,
  type ProgressState
} from '$lib/persistence.js';
import {
  applyResult,
  applyQuiz,
  mergeStars,
  mergeQuiz,
  computeUnlockedWorlds,
  starsEarned
} from '$lib/progress-logic.js';

// AC-9: progress persists across reload and corrupt/missing storage degrades to a clean state.
// vitest runs in node, so we stub localStorage with a simple in-memory implementation.
const STORAGE_KEY = 'agent-forge.progress';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

function stars(passed: boolean, minimalSet: boolean, withinBudget: boolean): Stars {
  return { passed, minimalSet, withinBudget };
}

beforeEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = new MemoryStorage() as unknown as Storage;
});

describe('persistence — save/load round-trip', () => {
  it('round-trips a state through localStorage', () => {
    const state: ProgressState = {
      schemaVersion: SCHEMA_VERSION,
      stars: { '1-1-greet': { passed: true, minimalSet: true, withinBudget: true } },
      quizzes: { 'world-1': { scorePct: 80, passed: true } },
      unlockedWorlds: ['world-1', 'world-2']
    };
    saveProgress(state);
    expect(loadProgress()).toEqual(state);
  });

  it('returns a clean new-game state when storage is empty', () => {
    expect(loadProgress()).toEqual(newProgress());
  });
});

describe('persistence — corrupt storage degrades cleanly (AC-9)', () => {
  it('returns a clean state for malformed JSON, without throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{ this is not valid json ::::');
    let result: ProgressState | undefined;
    expect(() => {
      result = loadProgress();
    }).not.toThrow();
    expect(result).toEqual(newProgress());
  });

  it('returns a clean state when schemaVersion mismatches', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: 999, stars: {}, unlockedWorlds: ['world-1'] })
    );
    expect(loadProgress()).toEqual(newProgress());
  });

  it('returns a clean state for structurally invalid (but valid JSON) data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, foo: 1 }));
    expect(loadProgress()).toEqual(newProgress());
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: SCHEMA_VERSION, stars: { x: { passed: 'yes' } }, unlockedWorlds: [] })
    );
    expect(loadProgress()).toEqual(newProgress());
  });

  it('degrades an old v1 save (no quizzes field) to a clean state, without throwing', () => {
    // A pre-Phase-F save: schemaVersion 1 and no quizzes record. It must NOT load as-is — it
    // fails the current-version check and degrades to a fresh game.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        stars: { '1-1-greet': { passed: true, minimalSet: true, withinBudget: true } },
        unlockedWorlds: ['world-1', 'world-2']
      })
    );
    let result: ProgressState | undefined;
    expect(() => {
      result = loadProgress();
    }).not.toThrow();
    expect(result).toEqual(newProgress());
  });

  it('returns a clean state when the quizzes record is structurally invalid', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        stars: {},
        quizzes: { 'world-1': { scorePct: 'lots', passed: true } },
        unlockedWorlds: ['world-1']
      })
    );
    expect(loadProgress()).toEqual(newProgress());
  });
});

describe('progress logic — best-star merge (never downgrade)', () => {
  it('keeps a previously-earned star when a later run loses it', () => {
    const prev = { passed: true, minimalSet: true, withinBudget: true };
    const next = { passed: true, minimalSet: false, withinBudget: false };
    expect(mergeStars(prev, next)).toEqual({
      passed: true,
      minimalSet: true,
      withinBudget: true
    });
  });

  it('adds newly-earned stars on top of old ones', () => {
    const prev = { passed: true, minimalSet: false, withinBudget: false };
    const next = { passed: true, minimalSet: true, withinBudget: false };
    expect(mergeStars(prev, next)).toEqual({
      passed: true,
      minimalSet: true,
      withinBudget: false
    });
  });

  it('takes the new stars when there is no prior record', () => {
    const next = { passed: true, minimalSet: false, withinBudget: true };
    expect(mergeStars(undefined, next)).toEqual(next);
  });

  it('applyResult does not downgrade a 3-star mission to a 1-star re-run', () => {
    let state = applyResult(newProgress(), '1-1-greet', stars(true, true, true));
    expect(starsEarned(state.stars['1-1-greet'])).toBe(3);
    state = applyResult(state, '1-1-greet', stars(true, false, false));
    expect(starsEarned(state.stars['1-1-greet'])).toBe(3);
  });
});

// Helper: pass every World-1 mission (3 stars each) on a fresh state.
function passAllWorld1(): ProgressState {
  let state = newProgress();
  for (const id of ['1-1-greet', '1-2-complaint', '1-3-concise', '1-4-persona']) {
    state = applyResult(state, id, stars(true, true, true));
  }
  return state;
}

describe('progress logic — unlock recompute (quiz-gated)', () => {
  it('World 2 stays LOCKED when all World-1 missions pass but the quiz is NOT passed', () => {
    let state = newProgress();
    expect(state.unlockedWorlds).toContain('world-1');
    expect(state.unlockedWorlds).not.toContain('world-2');

    // Pass three of four World-1 missions — World 2 still locked.
    state = applyResult(state, '1-1-greet', stars(true, true, true));
    state = applyResult(state, '1-2-complaint', stars(true, true, true));
    state = applyResult(state, '1-3-concise', stars(true, true, true));
    expect(state.unlockedWorlds).not.toContain('world-2');

    // Pass the fourth — missions are all done, but with no quiz pass World 2 is STILL locked.
    state = applyResult(state, '1-4-persona', stars(true, true, true));
    expect(state.unlockedWorlds).not.toContain('world-2');
  });

  it('World 2 unlocks once the World-1 quiz is passed (recordQuiz 80%)', () => {
    let state = passAllWorld1();
    expect(state.unlockedWorlds).not.toContain('world-2');

    state = applyQuiz(state, 'world-1', 80);
    expect(state.unlockedWorlds).toContain('world-2');
  });

  it('a passing quiz with no missions passed does NOT unlock the next world', () => {
    let state = newProgress();
    state = applyQuiz(state, 'world-1', 100);
    expect(state.unlockedWorlds).not.toContain('world-2');
  });

  it('a failing quiz score (<70%) does not unlock the next world', () => {
    let state = passAllWorld1();
    state = applyQuiz(state, 'world-1', 60);
    expect(state.unlockedWorlds).not.toContain('world-2');
  });

  it('a failing mission run (passed=false) does not contribute to unlocking', () => {
    let state = newProgress();
    state = applyResult(state, '1-1-greet', stars(true, true, true));
    state = applyResult(state, '1-2-complaint', stars(true, true, true));
    state = applyResult(state, '1-3-concise', stars(true, true, true));
    state = applyResult(state, '1-4-persona', stars(false, false, false));
    state = applyQuiz(state, 'world-1', 100);
    expect(state.unlockedWorlds).not.toContain('world-2');
  });

  it('computeUnlockedWorlds keeps World 1 unlocked from a clean slate', () => {
    expect(computeUnlockedWorlds({}, {})).toEqual(['world-1']);
  });

  it('persists the unlock state across a save/load reload', () => {
    let state = passAllWorld1();
    state = applyQuiz(state, 'world-1', 80);
    saveProgress(state);
    expect(loadProgress().unlockedWorlds).toContain('world-2');
  });
});

describe('progress logic — quiz best-score merge (never downgrade)', () => {
  it('mergeQuiz keeps the higher score', () => {
    const prev = { scorePct: 80, passed: true };
    const next = { scorePct: 60, passed: false };
    expect(mergeQuiz(prev, next)).toEqual({ scorePct: 80, passed: true });
  });

  it('mergeQuiz keeps passed=true even if a later retake fails', () => {
    const prev = { scorePct: 100, passed: true };
    const next = { scorePct: 40, passed: false };
    expect(mergeQuiz(prev, next).passed).toBe(true);
  });

  it('mergeQuiz takes the new result when there is no prior record', () => {
    const next = { scorePct: 80, passed: true };
    expect(mergeQuiz(undefined, next)).toEqual(next);
  });

  it('applyQuiz never downgrades a passed quiz on a worse retake', () => {
    let state = passAllWorld1();
    state = applyQuiz(state, 'world-1', 80);
    expect(state.quizzes['world-1']).toEqual({ scorePct: 80, passed: true });
    expect(state.unlockedWorlds).toContain('world-2');

    // A worse retake (60%) must NOT drop the score or revoke the pass/unlock.
    state = applyQuiz(state, 'world-1', 60);
    expect(state.quizzes['world-1']).toEqual({ scorePct: 80, passed: true });
    expect(state.unlockedWorlds).toContain('world-2');
  });

  it('applyQuiz sets passed=true at exactly 70% (boundary)', () => {
    const state = applyQuiz(passAllWorld1(), 'world-1', 70);
    expect(state.quizzes['world-1']?.passed).toBe(true);
    expect(state.unlockedWorlds).toContain('world-2');
  });
});
