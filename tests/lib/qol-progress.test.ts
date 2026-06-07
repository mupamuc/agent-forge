import { describe, it, expect } from 'vitest';
import { newProgress, exportProgress, importProgress } from '$lib/persistence.js';
import {
  applyResult,
  campaignStarTotals,
  nextUnsolvedMission
} from '$lib/progress-logic.js';
import { WORLDS } from '$content/worlds.js';

const FULL = { passed: true, minimalSet: true, withinBudget: true };
const PASS_ONLY = { passed: true, minimalSet: false, withinBudget: false };

describe('campaignStarTotals — overall campaign stars + max', () => {
  it('a fresh game has zero of the full campaign maximum (3 per mission)', () => {
    const missions = WORLDS.flatMap((w) => w.missionIds).length;
    const totals = campaignStarTotals(newProgress().stars);
    expect(totals).toEqual({ earned: 0, max: missions * 3 });
  });

  it('sums earned stars across missions', () => {
    let state = newProgress();
    state = applyResult(state, '1-1-greet', FULL);
    state = applyResult(state, '1-2-complaint', PASS_ONLY);
    expect(campaignStarTotals(state.stars).earned).toBe(4);
  });
});

describe('nextUnsolvedMission — the Continue target', () => {
  it('points at the very first mission on a fresh game', () => {
    expect(nextUnsolvedMission(newProgress().stars)).toBe('1-1-greet');
  });

  it('skips passed missions to the first unsolved one', () => {
    let state = newProgress();
    state = applyResult(state, '1-1-greet', FULL);
    state = applyResult(state, '1-2-complaint', PASS_ONLY);
    expect(nextUnsolvedMission(state.stars)).toBe('1-3-concise');
  });

  it('returns null when every campaign mission is passed', () => {
    let state = newProgress();
    for (const id of WORLDS.flatMap((w) => w.missionIds)) {
      state = applyResult(state, id, FULL);
    }
    expect(nextUnsolvedMission(state.stars)).toBeNull();
  });
});

describe('export / import progress code', () => {
  it('round-trips a state through a portable code', () => {
    let state = newProgress();
    state = applyResult(state, '1-1-greet', FULL);
    const code = exportProgress(state);
    expect(code.startsWith('AF1:')).toBe(true);
    expect(importProgress(code)).toEqual(state);
  });

  it('rejects a wrong prefix, garbage, and a structurally invalid payload', () => {
    expect(importProgress('hello')).toBeNull();
    expect(importProgress('AF1:not-base64!!')).toBeNull();
    expect(importProgress('AF1:' + btoa('{"foo":1}'))).toBeNull();
    expect(importProgress('')).toBeNull();
  });
});
