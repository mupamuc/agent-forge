import { describe, it, expect } from 'vitest';
import {
  QUIZZES,
  QUIZ_PASS_RATIO,
  getQuizForWorld,
  quizPassed
} from '$content/quizzes.js';
import { WORLDS } from '$content/worlds.js';

// Quiz content integrity: each world has a 5-question checkpoint, every correctIndex points at a
// real option, and the ≥70% pass logic behaves at the 3/5 (fail) and 4/5 (pass) boundaries.

describe('quiz content — structure', () => {
  it('has one quiz per world', () => {
    expect(QUIZZES.length).toBe(WORLDS.length);
    for (const world of WORLDS) {
      expect(getQuizForWorld(world.id), `no quiz for ${world.id}`).toBeDefined();
    }
  });

  it('getQuizForWorld resolves all three worlds and rejects unknown ids', () => {
    expect(getQuizForWorld('world-1')?.id).toBe('quiz-1');
    expect(getQuizForWorld('world-2')?.id).toBe('quiz-2');
    expect(getQuizForWorld('world-3')?.id).toBe('quiz-3');
    expect(getQuizForWorld('world-404')).toBeUndefined();
  });

  it('every quiz has exactly 5 questions', () => {
    for (const quiz of QUIZZES) {
      expect(quiz.questionKeys.length, `${quiz.id} should have 5 questions`).toBe(5);
    }
  });

  it('every correctIndex is within range and every option key is unique per question', () => {
    for (const quiz of QUIZZES) {
      for (const q of quiz.questionKeys) {
        expect(q.optionKeys.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.optionKeys.length);
        expect(new Set(q.optionKeys).size).toBe(q.optionKeys.length);
      }
    }
  });

  it('stem and option keys are all distinct across a quiz', () => {
    for (const quiz of QUIZZES) {
      const keys: string[] = [];
      for (const q of quiz.questionKeys) {
        keys.push(q.stemKey, ...q.optionKeys);
      }
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe('quiz pass logic — ≥70% threshold', () => {
  it('pins the threshold at 0.7', () => {
    expect(QUIZ_PASS_RATIO).toBe(0.7);
  });

  it('3 of 5 correct (60%) fails', () => {
    expect(quizPassed(3, 5)).toBe(false);
  });

  it('4 of 5 correct (80%) passes', () => {
    expect(quizPassed(4, 5)).toBe(true);
  });

  it('5 of 5 correct passes; 0 of 5 fails', () => {
    expect(quizPassed(5, 5)).toBe(true);
    expect(quizPassed(0, 5)).toBe(false);
  });

  it('treats a zero-length quiz as not passed', () => {
    expect(quizPassed(0, 0)).toBe(false);
  });
});
