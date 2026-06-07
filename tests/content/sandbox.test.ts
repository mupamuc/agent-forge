import { describe, it, expect } from 'vitest';
import ru from '../../src/i18n/locales/ru.json';
import en from '../../src/i18n/locales/en.json';
import { ALL_CARDS } from '$content/cards.js';
import { WORLDS } from '$content/worlds.js';
import { getMissionById, sandboxScenarios } from '$content/missions.js';

// Phase H: the Sandbox is free play. Its scenario list must offer every campaign mission, grouped
// by world, and its inventory is the FULL card set (so "wrong" picks are possible on purpose) —
// never the per-mission inventory from cardsForMission.

const ALL_MISSION_IDS = WORLDS.flatMap((w) => w.missionIds);

function hasKey(dict: Record<string, unknown>, dotted: string): boolean {
  let node: unknown = dict;
  for (const part of dotted.split('.')) {
    if (typeof node !== 'object' || node === null) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string';
}

describe('sandbox — scenario picker covers all twelve missions', () => {
  const groups = sandboxScenarios();

  it('groups scenarios by world, in WORLDS order, reusing each world title key', () => {
    expect(groups.map((g) => g.worldId)).toEqual(WORLDS.map((w) => w.id));
    expect(groups.map((g) => g.titleKey)).toEqual(WORLDS.map((w) => w.titleKey));
  });

  it('lists exactly the twelve campaign mission ids, in author order', () => {
    const ids = groups.flatMap((g) => g.missions.map((m) => m.id));
    expect(ids).toEqual(ALL_MISSION_IDS);
    expect(ids.length).toBe(12);
  });

  it('every scenario reuses its mission goal key (resolvable office goal text)', () => {
    for (const group of groups) {
      for (const scenario of group.missions) {
        const mission = getMissionById(scenario.id)!;
        expect(scenario.goalKey).toBe(mission.goalKey);
        // The goal key must resolve in both locales so the picker never shows a raw key.
        expect(hasKey(ru as Record<string, unknown>, scenario.goalKey)).toBe(true);
        expect(hasKey(en as Record<string, unknown>, scenario.goalKey)).toBe(true);
      }
    }
  });
});

describe('sandbox — inventory is the full card set, not a per-mission subset', () => {
  it('ALL_CARDS has the expected 14 cards (4 roles, 3 tools, 3 memory, 4 control)', () => {
    expect(ALL_CARDS.length).toBe(14);
    const byType = (type: string) => ALL_CARDS.filter((c) => c.type === type).length;
    expect(byType('role')).toBe(4);
    expect(byType('tools')).toBe(3);
    expect(byType('memory')).toBe(3);
    // Worlds 4–7 control cards: one per slot (planner, review, stopping, guardrails).
    expect(byType('planner')).toBe(1);
    expect(byType('review')).toBe(1);
    expect(byType('stopping')).toBe(1);
    expect(byType('guardrails')).toBe(1);
  });

  it('covers every placeable slot type so any pick is possible', () => {
    const types = new Set(ALL_CARDS.map((c) => c.type));
    expect(types.has('role')).toBe(true);
    expect(types.has('tools')).toBe(true);
    expect(types.has('memory')).toBe(true);
    expect(types.has('planner')).toBe(true);
    expect(types.has('review')).toBe(true);
    expect(types.has('stopping')).toBe(true);
    expect(types.has('guardrails')).toBe(true);
  });
});

describe('sandbox — i18n keys exist in both locales (parity)', () => {
  const keys = [
    'ui.sandbox.title',
    'ui.sandbox.subtitle',
    'ui.sandbox.pickerLabel',
    'ui.sandbox.pickerHint'
  ];

  for (const key of keys) {
    it(`"${key}" exists in RU and EN`, () => {
      expect(hasKey(ru as Record<string, unknown>, key), `missing in ru.json: ${key}`).toBe(true);
      expect(hasKey(en as Record<string, unknown>, key), `missing in en.json: ${key}`).toBe(true);
    });
  }
});
