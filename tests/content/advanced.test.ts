import { describe, it, expect } from 'vitest';
import ru from '../../src/i18n/locales/ru.json';
import en from '../../src/i18n/locales/en.json';
import { run } from '$engine/index.js';
import { cardById } from '$content/cards.js';
import {
  ADVANCED_LEVELS,
  getAdvancedLevelById,
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

describe('advanced — Trade-off: match the model to the task (no single right card)', () => {
  const simple = getAdvancedMissionById('adv-tradeoff-mailout')!;
  const hard = getAdvancedMissionById('adv-tradeoff-contract')!;

  it('simple task: the cheap model is the smart pick — three stars', () => {
    const v = run(agentOf('model-cheap'), simple);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });

  it('simple task: the strong model still passes but overpays (loses minimal-set + budget)', () => {
    const v = run(agentOf('model-strong'), simple);
    expect(v.passed).toBe(true);
    expect(v.stars.minimalSet).toBe(false);
    expect(v.stars.withinBudget).toBe(false);
  });

  it('hard task: the strong model is required — three stars', () => {
    const v = run(agentOf('model-strong'), hard);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });

  it('hard task: the cheap model is not good enough', () => {
    const v = run(agentOf('model-cheap'), hard);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe('weak-model');
  });

  it('either task with no model fails with no-model', () => {
    expect(run(agentOf(), simple).failureModeId).toBe('no-model');
    expect(run(agentOf(), hard).failureModeId).toBe('no-model');
  });
});

describe('advanced — Diagnose: a broken preset the player repairs by reading the trace', () => {
  const level = getAdvancedLevelById('adv-diagnose-support')!;
  const mission = level.mission;

  it('starts from a broken preset (wrong memory + wrong tool)', () => {
    expect(level.preset).toEqual(['mem-working', 'tool-web-search']);
  });

  it('the preset build fails at the first wrong card (memory)', () => {
    const v = run(agentOf(...level.preset!), mission);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe('no-memory');
  });

  it('fixing only the memory surfaces the next symptom (the tool)', () => {
    const v = run(agentOf('mem-episodic', 'tool-web-search'), mission);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe('missing-tool');
  });

  it('swapping both wrong cards for the right ones repairs it — three stars', () => {
    const v = run(agentOf('mem-episodic', 'tool-doc-reader'), mission);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });
});

describe('advanced — Red-team bosses: spot the injection, gate the irreversible action', () => {
  const inject = getAdvancedMissionById('adv-redteam-inject')!;
  const transfer = getAdvancedMissionById('adv-redteam-transfer')!;

  it('boss 1: the guardrail spots the hidden command — three stars', () => {
    const v = run(agentOf('guard-check'), inject);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });

  it('boss 1: without a guardrail the agent obeys the injection', () => {
    expect(run(agentOf('tool-web-search'), inject).failureModeId).toBe('no-guardrail-injection');
    // Human approval alone does not catch the trick.
    expect(run(agentOf('human-approval'), inject).failureModeId).toBe('no-guardrail-injection');
  });

  it('boss 2 (finale): guardrail + human approval — three stars', () => {
    const v = run(agentOf('guard-check', 'human-approval'), transfer);
    expect(v.passed).toBe(true);
    expect(v.stars).toEqual({ passed: true, minimalSet: true, withinBudget: true });
  });

  it('boss 2: spotting the trick but skipping human sign-off fails on the transfer', () => {
    const v = run(agentOf('guard-check'), transfer);
    expect(v.passed).toBe(false);
    expect(v.failureModeId).toBe('no-approval');
  });

  it('boss 2: no guardrail fails first, at detection', () => {
    expect(run(agentOf('human-approval'), transfer).failureModeId).toBe('no-guardrail-injection');
    expect(run(agentOf(), transfer).failureModeId).toBe('no-guardrail-injection');
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
      // Pre-walk model gates emit step.<id>.<mode>.fail beats (no-model / weak-model).
      if (level.mission.requiresModel) keys.add(`step.${level.mission.id}.no-model.fail`);
      if (level.mission.needsStrongModel) keys.add(`step.${level.mission.id}.weak-model.fail`);
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
