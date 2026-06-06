import { describe, it, expect } from 'vitest';
import ru from '../../src/i18n/locales/ru.json';
import en from '../../src/i18n/locales/en.json';

// Phase G — the optional "(?)" term-reveal system. Every `term.<id>` entry must expose the real
// technical term plus a one-sentence plain explanation, in BOTH locales, with full parity and no
// empty strings. The office-language label stays primary; this is the opt-in reveal content.

type TermEntry = { term: string; explain: string };

function termsOf(dict: Record<string, unknown>): Record<string, unknown> {
  const term = dict.term;
  expect(term, 'locale is missing the "term" namespace').toBeTypeOf('object');
  return term as Record<string, unknown>;
}

const ruTerms = termsOf(ru as Record<string, unknown>);
const enTerms = termsOf(en as Record<string, unknown>);

// The complete set of concepts the (?) system must cover (office word -> real agent concept).
const REQUIRED_IDS = [
  'role', // -> system prompt
  'tools', // -> function calling / tool use
  'memory', // -> episodic memory
  'mem-working', // -> working memory / context window
  'mem-semantic', // -> semantic memory / knowledge base
  'planner', // -> task decomposition
  'stopping', // -> stopping criteria
  'guardrails', // -> guardrails / human-in-the-loop
  'react-loop', // -> ReAct loop (Thought -> Action -> Observation)
  'web-search', // -> retrieval / RAG idea
  'calculator', // -> tool
  'doc-reader', // -> tool
  'hallucination', // -> hallucination (made-up answer)
  'prompt-injection' // -> prompt injection (hidden command in a file)
] as const;

function isFilledEntry(value: unknown): value is TermEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.term === 'string' &&
    entry.term.trim().length > 0 &&
    typeof entry.explain === 'string' &&
    entry.explain.trim().length > 0
  );
}

describe('i18n term-reveal — completeness (Phase G)', () => {
  for (const id of REQUIRED_IDS) {
    it(`term.${id} has non-empty term + explain in RU`, () => {
      expect(isFilledEntry(ruTerms[id]), `ru.json term.${id} malformed or empty`).toBe(true);
    });

    it(`term.${id} has non-empty term + explain in EN`, () => {
      expect(isFilledEntry(enTerms[id]), `en.json term.${id} malformed or empty`).toBe(true);
    });
  }
});

describe('i18n term-reveal — parity (Phase G)', () => {
  it('RU and EN expose exactly the same set of term ids', () => {
    expect(Object.keys(ruTerms).sort()).toEqual(Object.keys(enTerms).sort());
  });

  it('every present term entry is a filled { term, explain } object in both locales', () => {
    for (const id of Object.keys(ruTerms)) {
      expect(isFilledEntry(ruTerms[id]), `ru.json term.${id} malformed or empty`).toBe(true);
      expect(isFilledEntry(enTerms[id]), `en.json term.${id} malformed or empty`).toBe(true);
    }
  });

  it('covers every required concept id (no gaps)', () => {
    for (const id of REQUIRED_IDS) {
      expect(Object.keys(ruTerms), `ru.json missing term.${id}`).toContain(id);
      expect(Object.keys(enTerms), `en.json missing term.${id}`).toContain(id);
    }
  });
});
