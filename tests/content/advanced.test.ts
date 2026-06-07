import { describe, it, expect } from 'vitest';
import ru from '../../src/i18n/locales/ru.json';
import en from '../../src/i18n/locales/en.json';
import { run } from '$engine/index.js';
import { cardById } from '$content/cards.js';
import {
  ADVANCED_LEVELS,
  getAdvancedMissionById,
  advancedInventoryFor
} from '$content/advanced.js';

function agentOf(...cardIds: string[]) {
  return {
    cards: cardIds
      .map((id) => cardById(id))
      .filter((c): c is NonNullable<ReturnType<typeof cardById>> => c !== undefined)
  };
}

function hasKey(dict: Record<string, unknown>, dotted: string): boolean {
  let node: unknown = dict;
  for (const part of dotted.split('.')) {
    if (typeof node !== 'object' || node === null) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string';
}

describe('advanced — Combo "returning client" is solvable and discriminating', () => {
  const mission = getAdvancedMissionById('adv-combo-client')!;

  it('three stars with exactly the right two cards (episodic memory + doc reader)', () => {
    const v = run(agentOf('mem-episodic', 'tool-doc-reader'), mission);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });

  it('fails with only memory — it cannot look up the real policy', () => {
    const v = run(agentOf('mem-episodic'), mission);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe('missing-tool');
  });

  it('fails with only the doc reader — it does not know which order', () => {
    const v = run(agentOf('tool-doc-reader'), mission);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe('no-memory');
  });

  it('the same-slot distractors are wrong: working memory + web search both fail', () => {
    expect(run(agentOf('mem-working', 'tool-doc-reader'), mission).passed).toBe(false);
    expect(run(agentOf('mem-episodic', 'tool-web-search'), mission).passed).toBe(false);
  });

  it('over-provisioning still passes but loses the minimal-set star', () => {
    const v = run(agentOf('mem-episodic', 'tool-doc-reader', 'tool-web-search'), mission);
    expect(v.passed).toBe(true);
    expect(v.stars.minimalSet).toBe(false);
  });
});

describe('advanced — Chain "order invoice" needs all three links in three families', () => {
  const mission = getAdvancedMissionById('adv-chain-invoice')!;

  it('three stars with the full chain: episodic memory + calculator + critic', () => {
    const v = run(agentOf('mem-episodic', 'tool-calculator', 'critic-review'), mission);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });

  it('breaks at the review link when the critic is missing', () => {
    const v = run(agentOf('mem-episodic', 'tool-calculator'), mission);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe('no-critic');
  });

  it('breaks at the calculate link when the calculator is missing', () => {
    const v = run(agentOf('mem-episodic', 'critic-review'), mission);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe('missing-tool');
  });

  it('breaks at the first link with the wrong memory card', () => {
    const v = run(agentOf('mem-working', 'tool-calculator', 'critic-review'), mission);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe('no-memory');
  });

  it('over-provisioning still passes but loses the minimal-set star', () => {
    const v = run(
      agentOf('mem-episodic', 'tool-calculator', 'critic-review', 'tool-web-search'),
      mission
    );
    expect(v.passed).toBe(true);
    expect(v.stars.minimalSet).toBe(false);
  });
});

describe('advanced — every inventory card actually fits an open slot', () => {
  for (const level of ADVANCED_LEVELS) {
    it(`"${level.id}" inventory resolves and the minimal set is all present`, () => {
      const inv = advancedInventoryFor(level.id);
      expect(inv.length).toBe(level.inventory.length);
      for (const id of level.mission.minimalCardSet) {
        expect(inv.some((c) => c.id === id), `minimal card ${id} not in inventory`).toBe(true);
      }
    });
  }
});

describe('advanced — i18n keys exist in both locales', () => {
  function collectKeys(): string[] {
    const keys = new Set<string>();
    keys.add('ui.home.advanced');
    keys.add('ui.home.advancedHint');
    keys.add('adv.title');
    keys.add('adv.subtitle');
    keys.add('adv.lockedHint');
    keys.add('adv.backToList');
    for (const level of ADVANCED_LEVELS) {
      keys.add(level.titleKey);
      keys.add(level.descKey);
      keys.add(level.mission.goalKey);
      for (const ck of level.mission.constraintKeys) keys.add(ck);
      for (const step of level.mission.solutionPath) {
        keys.add(step.textKey);
        if (step.onMissingCap) keys.add(step.onMissingCap.textKey);
      }
    }
    return [...keys];
  }

  for (const key of collectKeys()) {
    it(`"${key}" exists in RU and EN`, () => {
      expect(hasKey(ru as Record<string, unknown>, key), `missing in ru.json: ${key}`).toBe(true);
      expect(hasKey(en as Record<string, unknown>, key), `missing in en.json: ${key}`).toBe(true);
    });
  }
});
