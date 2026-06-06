import type { Step, Verdict } from '$engine/index.js';

/** A translate function shaped like svelte-i18n's `$_` (key + optional options). */
export type Translate = (key: string, options?: { default?: string }) => string;

export interface RenderedLine {
  marker: Step['marker'];
  text: string;
  ok: boolean;
}

/**
 * Map engine Step[] -> renderable lines using the CURRENT-locale translate fn.
 * Pure: pass `$_` from a `$derived` so toggling RU/EN re-renders WITHOUT re-running the engine.
 */
export function renderTrace(steps: ReadonlyArray<Step>, t: Translate): RenderedLine[] {
  return steps.map((step) => ({
    marker: step.marker,
    text: t(step.textKey),
    ok: step.ok
  }));
}

/** The one-line failure diagnosis for the current locale, or '' when the run passed. */
export function diagnosisText(verdict: Verdict | null, t: Translate): string {
  if (!verdict || !verdict.diagnosisKey) return '';
  return t(verdict.diagnosisKey);
}
