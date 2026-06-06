import { describe, it, expect } from 'vitest';
import ru from '../../src/i18n/locales/ru.json';
import en from '../../src/i18n/locales/en.json';
import { ALL_CARDS } from '$content/cards.js';
import { WORLDS } from '$content/worlds.js';
import { getMissionById } from '$content/missions.js';
import { QUIZZES } from '$content/quizzes.js';
import { FAILURE_MODES } from '$engine/index.js';

// AC-12 (subset): every i18n key referenced by cards + missions + worlds exists in BOTH locales,
// so RU/EN stay at full parity by construction. We resolve dotted keys against the parsed JSON.

function hasKey(dict: Record<string, unknown>, dotted: string): boolean {
  let node: unknown = dict;
  for (const part of dotted.split('.')) {
    if (typeof node !== 'object' || node === null) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string';
}

// Collect every content-referenced key. Worlds, cards, missions, plus the wrong-role fail beat
// and diagnosis keys the engine emits for these missions.
function collectKeys(): string[] {
  const keys = new Set<string>();

  for (const world of WORLDS) keys.add(world.titleKey);

  for (const card of ALL_CARDS) {
    keys.add(card.labelKey);
    if (card.termKey) keys.add(card.termKey);
  }

  for (const world of WORLDS) {
    for (const missionId of world.missionIds) {
      const mission = getMissionById(missionId)!;
      keys.add(mission.goalKey);
      for (const ck of mission.constraintKeys) keys.add(ck);
      for (const step of mission.solutionPath) {
        keys.add(step.textKey);
        if (step.onMissingCap) keys.add(step.onMissingCap.textKey);
      }
      // Pre-walk wrong-role beat the engine emits as step.<mission.id>.wrong-role.fail.
      if (mission.requiredRole) {
        keys.add(`step.${missionId}.wrong-role.fail`);
      }
    }
  }

  // Diagnosis keys for every failure mode (the engine surfaces these on a failed run).
  for (const fm of FAILURE_MODES) keys.add(fm.diagnosisKey);

  // Quiz stem + option keys (Phase F): every question's text is keyed and must exist in both locales.
  for (const quiz of QUIZZES) {
    for (const question of quiz.questionKeys) {
      keys.add(question.stemKey);
      for (const optKey of question.optionKeys) keys.add(optKey);
    }
  }

  return [...keys];
}

describe('i18n — content keys exist in both locales (AC-12)', () => {
  const keys = collectKeys();

  it('has at least the World-1 + currency content keys', () => {
    expect(keys.length).toBeGreaterThan(20);
  });

  for (const key of collectKeys()) {
    it(`"${key}" exists in RU and EN`, () => {
      expect(hasKey(ru as Record<string, unknown>, key), `missing in ru.json: ${key}`).toBe(true);
      expect(hasKey(en as Record<string, unknown>, key), `missing in en.json: ${key}`).toBe(true);
    });
  }
});
