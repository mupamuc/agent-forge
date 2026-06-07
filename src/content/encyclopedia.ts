// The world encyclopedia — the "book" half of the trainer. Each campaign world gets a short set of
// plain-language theses drawn from the guide (Agentic AI: A Complete Learning Guide), matched to
// that world's theme. The player can read the idea, then practise it in the world's missions.
//
// Like all content, every visible string is an i18n KEY (never prose) so RU/EN stay at parity.
// `icon` is a presentational emoji only. Theses are authored for a non-technical reader; the real
// term (ReAct, RAG, system prompt…) is woven into the body text rather than shown as jargon.

export interface Thesis {
  id: string;
  icon: string;
  titleKey: string;
  bodyKey: string;
}

export interface WorldGuide {
  worldId: string;
  titleKey: string;
  introKey: string;
  /** Short "where this comes from in the book" line, for the book feel. */
  refKey: string;
  theses: ReadonlyArray<Thesis>;
}

function mk(worldId: string, icons: ReadonlyArray<string>): WorldGuide {
  return {
    worldId,
    titleKey: `world.${worldId}.title`,
    introKey: `enc.${worldId}.intro`,
    refKey: `enc.${worldId}.ref`,
    theses: icons.map((icon, i) => ({
      id: `${worldId}-t${i + 1}`,
      icon,
      titleKey: `enc.${worldId}.t.${i + 1}.title`,
      bodyKey: `enc.${worldId}.t.${i + 1}.body`
    }))
  };
}

// Four theses per world, themed to the world's lesson:
//  1 instruction/prompting · 2 tools · 3 memory · 4 planning · 5 review/team · 6 stopping/cost ·
//  7 safety. (Mirrors the guide's Phases 3–6.)
export const ENCYCLOPEDIA: ReadonlyArray<WorldGuide> = [
  mk('world-1', ['🎭', '📋', '✍️', '🪜']),
  mk('world-2', ['🧰', '📞', '🗂️', '🔗']),
  mk('world-3', ['💬', '🧠', '📚', '🔎']),
  mk('world-4', ['🪜', '🏗️', '🔁', '📝']),
  mk('world-5', ['👥', '🧑‍💼', '🔍', '♻️']),
  mk('world-6', ['🛑', '💸', '⚡', '🪙']),
  mk('world-7', ['🛡️', '🕵️', '✋', '📒'])
];

export function getWorldGuide(worldId: string): WorldGuide | undefined {
  return ENCYCLOPEDIA.find((g) => g.worldId === worldId);
}
