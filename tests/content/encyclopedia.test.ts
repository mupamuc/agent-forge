import { describe, it, expect } from 'vitest';
import ru from '../../src/i18n/locales/ru.json';
import en from '../../src/i18n/locales/en.json';
import { WORLDS } from '$content/worlds.js';
import { ENCYCLOPEDIA, getWorldGuide } from '$content/encyclopedia.js';

function hasKey(dict: Record<string, unknown>, dotted: string): boolean {
  let node: unknown = dict;
  for (const part of dotted.split('.')) {
    if (typeof node !== 'object' || node === null) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string';
}

describe('encyclopedia — one guide per campaign world, themed theses', () => {
  it('covers exactly the seven campaign worlds, in order', () => {
    expect(ENCYCLOPEDIA.map((g) => g.worldId)).toEqual(WORLDS.map((w) => w.id));
  });

  it('every world has at least three theses', () => {
    for (const guide of ENCYCLOPEDIA) {
      expect(guide.theses.length, guide.worldId).toBeGreaterThanOrEqual(3);
    }
  });

  it('resolves a guide by world id', () => {
    expect(getWorldGuide('world-3')?.worldId).toBe('world-3');
    expect(getWorldGuide('nope')).toBeUndefined();
  });
});

describe('encyclopedia — every key exists in both locales', () => {
  function collectKeys(): string[] {
    const keys = new Set<string>([
      'enc.title',
      'enc.subtitle',
      'enc.backToList',
      'enc.open',
      'enc.sourceLabel',
      'ui.home.encyclopedia',
      'ui.home.encyclopediaHint'
    ]);
    for (const guide of ENCYCLOPEDIA) {
      keys.add(guide.titleKey);
      keys.add(guide.introKey);
      keys.add(guide.refKey);
      for (const th of guide.theses) {
        keys.add(th.titleKey);
        keys.add(th.bodyKey);
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
