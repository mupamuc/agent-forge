import type { Stars } from '$engine/index.js';
import {
  loadProgress,
  saveProgress,
  newProgress,
  exportProgress,
  importProgress,
  type ProgressState
} from '$lib/persistence.js';
import {
  applyResult,
  applyQuiz,
  starsEarned,
  campaignStarTotals,
  nextUnsolvedMission
} from '$lib/progress-logic.js';

// Svelte 5 runes store: progress that any component can read reactively. Loads from localStorage
// on construction and saves on every change. All non-reactive logic (best-star merge, unlock
// recompute) lives in the pure $lib/progress-logic module so it stays unit-testable.
class ProgressStore {
  state = $state<ProgressState>(newProgress());

  constructor() {
    this.state = loadProgress();
  }

  /** Record a run's stars (best-star merge + unlock recompute), then persist. */
  recordResult(missionId: string, stars: Stars): void {
    this.state = applyResult(this.state, missionId, stars);
    saveProgress(this.state);
  }

  /**
   * Record a world's quiz score (0–100): best-score merge (never downgrades a passed quiz),
   * unlock recompute, then persist. passed = scorePct >= 70.
   */
  recordQuiz(worldId: string, scorePct: number): void {
    this.state = applyQuiz(this.state, worldId, scorePct);
    saveProgress(this.state);
  }

  /** Whether a world's quiz checkpoint has been passed. */
  quizPassed(worldId: string): boolean {
    return this.state.quizzes[worldId]?.passed === true;
  }

  /** A world's best quiz score (0–100), or 0 if never taken. */
  quizScore(worldId: string): number {
    return this.state.quizzes[worldId]?.scorePct ?? 0;
  }

  /** Earned star count (0–3) for a mission. */
  starCount(missionId: string): number {
    return starsEarned(this.state.stars[missionId]);
  }

  /** Whether a mission has been passed at least once. */
  isPassed(missionId: string): boolean {
    return this.state.stars[missionId]?.passed === true;
  }

  /** Whether a world is currently unlocked. */
  isWorldUnlocked(worldId: string): boolean {
    return this.state.unlockedWorlds.includes(worldId);
  }

  /** Total stars earned across the campaign and the max possible (for the home progress strip). */
  campaignTotals(): { earned: number; max: number } {
    return campaignStarTotals(this.state.stars);
  }

  /** First campaign mission not yet passed — the "Continue" target. Null when all are passed. */
  nextMissionId(): string | null {
    return nextUnsolvedMission(this.state.stars);
  }

  /** A portable code of the current progress (for export). */
  exportCode(): string {
    return exportProgress(this.state);
  }

  /** Load progress from a code. Returns false (and changes nothing) when the code is invalid. */
  importCode(code: string): boolean {
    const next = importProgress(code);
    if (!next) return false;
    this.state = next;
    saveProgress(this.state);
    return true;
  }

  /** Full reset to a clean new game (and persist it). */
  reset(): void {
    this.state = newProgress();
    saveProgress(this.state);
  }
}

export const progress = new ProgressStore();
