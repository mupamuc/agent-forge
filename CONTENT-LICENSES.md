# Content licenses & attribution

## Quiz topics — conceptual inspiration

The world-checkpoint quizzes in `src/content/quizzes.ts` (with their text in
`src/i18n/locales/ru.json` and `src/i18n/locales/en.json`, namespace `quiz`) draw
**conceptual inspiration** from the question bank in:

- **Project:** [`FlorianBruniaux/claude-code-ultimate-guide`](https://github.com/FlorianBruniaux/claude-code-ultimate-guide)
- **Used as:** topic / theme inspiration only.

### What we actually did

The questions in this game are **original, plain-language adaptations** written for a
**non-technical office audience** (PMs and office workers who use claude.ai, never a
terminal). They are **not** copied from the source bank, and they deliberately avoid the
technical Claude-Code framing of the original.

Each quiz reinforces the lesson of its world in everyday office terms:

- **World 1 — "Give a clear instruction":** why an assistant answers in the wrong tone,
  and how a clear role/instruction fixes it.
- **World 2 — "Give access":** when an assistant needs a tool or fresh data (internet,
  calculator, document reading) to answer correctly.
- **World 3 — "Give memory and context":** why an assistant forgets a name or a past
  conversation, and what memory adds.

No verbatim text, code, or JSON from the source bank appears on screen. Any real technical
term in the game surfaces only behind the in-app "(?)" term-explanation tooltip.

We thank the maintainers of `claude-code-ultimate-guide` for assembling a useful reference
that helped us choose which concepts a beginner-friendly checkpoint should cover.
