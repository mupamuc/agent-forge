import { describe, it, expect } from 'vitest';
import { buildPrompt } from '$lib/llm/prompt.js';
import { CARDS } from '$content/cards.js';
import { getMissionById } from '$content/missions.js';
import ru from '../../src/i18n/locales/ru.json';

// Resolve a dotted key against the parsed RU JSON so the fake translator returns the SAME office
// text the UI would. Falls back to the key itself only if a key is genuinely missing (which would
// then show up in the leak assertions and fail loudly).
function resolve(dict: Record<string, unknown>, dotted: string): string | undefined {
  let node: unknown = dict;
  for (const part of dotted.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

const t = (key: string): string => resolve(ru as Record<string, unknown>, key) ?? key;

describe('buildPrompt — pure office-language prompt', () => {
  it('includes the placed role meaning, tool/memory description, and the mission goal', () => {
    const mission = getMissionById('2-1-currency')!;
    const cards = [CARDS.rolePersona, CARDS.webSearch];

    const { system, user } = buildPrompt(cards, mission, t);

    // Role meaning (the role card's plain label) is present.
    expect(system).toContain(t('card.role-persona.label'));
    // The given tool is described in plain words.
    expect(system).toContain(t('card.tool-web-search.label'));
    // The honest "tools aren't really run" note is present.
    expect(system).toContain(t('byok.prompt.toolsNote'));
    // The user message is exactly the mission goal text.
    expect(user).toBe(t('mission.2-1.goal'));
  });

  it('describes memory cards as well as tools', () => {
    const mission = getMissionById('3-1-name')!;
    const cards = [CARDS.roleGreeter, CARDS.memWorking];

    const { system } = buildPrompt(cards, mission, t);
    expect(system).toContain(t('card.mem-working.label'));
  });

  it('falls back to a plain "no role" / "no kit" line when nothing relevant is placed', () => {
    const mission = getMissionById('1-1-greet')!;
    const { system } = buildPrompt([], mission, t);

    expect(system).toContain(t('byok.prompt.noRole'));
    expect(system).toContain(t('byok.prompt.noKit'));
  });

  it('is pure — same inputs produce identical output across calls', () => {
    const mission = getMissionById('2-1-currency')!;
    const cards = [CARDS.rolePersona, CARDS.webSearch];
    const a = buildPrompt(cards, mission, t);
    const b = buildPrompt(cards, mission, t);
    expect(a).toEqual(b);
  });

  it('leaks no card ids, raw i18n keys, or JSON braces into the prompt', () => {
    const mission = getMissionById('2-1-currency')!;
    const cards = [CARDS.rolePersona, CARDS.webSearch, CARDS.calculator];
    const { system, user } = buildPrompt(cards, mission, t);
    const blob = `${system}\n${user}`;

    // No card ids.
    expect(blob).not.toContain('role-persona');
    expect(blob).not.toContain('tool-web-search');
    expect(blob).not.toContain('tool-calculator');
    // No raw i18n key namespaces.
    expect(blob).not.toContain('card.');
    expect(blob).not.toContain('byok.prompt');
    expect(blob).not.toContain('mission.');
    // No JSON structure.
    expect(blob).not.toContain('{');
    expect(blob).not.toContain('}');
  });
});
