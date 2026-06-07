// Quiz registry — one short "checkpoint" per world that gates the next world. Like every other
// piece of content, all human text is an i18n KEY, never prose: a question is a `stemKey` plus
// `optionKeys`, and the engine of truth for "which option is right" is `correctIndex`.
//
// AUDIENCE: questions are deliberately SIMPLE and office-flavoured — they reinforce each world's
// one lesson (clear instruction / give access / give memory), not technical Claude-Code trivia.
// A real technical term only ever appears behind the (?) TermTooltip, never in a quiz stem here.

/** A single multiple-choice question. `correctIndex` points into `optionKeys` (0-based). */
export interface QuizQuestion {
  stemKey: string;
  optionKeys: string[];
  correctIndex: number;
}

/** A world's checkpoint: an ordered list of questions reinforcing that world's lesson. */
export interface Quiz {
  id: string;
  worldId: string;
  questionKeys: QuizQuestion[];
}

// Pass threshold: a player must get at least 70% right. With 5 questions that means ≥4 correct
// (4/5 = 80% passes; 3/5 = 60% fails). Kept as one constant so the gate is computed in one place.
export const QUIZ_PASS_RATIO = 0.7;

/** Whether a raw score (correct out of total) clears the pass threshold. */
export function quizPassed(correct: number, total: number): boolean {
  if (total <= 0) return false;
  return correct / total >= QUIZ_PASS_RATIO;
}

// Each quiz has five questions. Stems/options are keyed `quiz.<id>.q<n>.stem` and
// `quiz.<id>.q<n>.opt.<i>` — deterministic and mechanically checkable by key-parity tests.
function mkQuestion(quizId: string, n: number, optionCount: number, correctIndex: number): QuizQuestion {
  return {
    stemKey: `quiz.${quizId}.q${n}.stem`,
    optionKeys: Array.from({ length: optionCount }, (_, i) => `quiz.${quizId}.q${n}.opt.${i}`),
    correctIndex
  };
}

// World 1 checkpoint — "give a clear instruction / role". Office scenarios about tone and role.
export const QUIZ_WORLD_1: Quiz = {
  id: 'quiz-1',
  worldId: 'world-1',
  questionKeys: [
    mkQuestion('quiz-1', 0, 3, 1),
    mkQuestion('quiz-1', 1, 3, 2),
    mkQuestion('quiz-1', 2, 3, 0),
    mkQuestion('quiz-1', 3, 3, 1),
    mkQuestion('quiz-1', 4, 3, 2)
  ]
};

// World 2 checkpoint — "give access / tools". Office scenarios about when the assistant needs a skill.
export const QUIZ_WORLD_2: Quiz = {
  id: 'quiz-2',
  worldId: 'world-2',
  questionKeys: [
    mkQuestion('quiz-2', 0, 3, 0),
    mkQuestion('quiz-2', 1, 3, 2),
    mkQuestion('quiz-2', 2, 3, 1),
    mkQuestion('quiz-2', 3, 3, 0),
    mkQuestion('quiz-2', 4, 3, 1)
  ]
};

// World 3 checkpoint — "give memory and context". Office scenarios about remembering.
export const QUIZ_WORLD_3: Quiz = {
  id: 'quiz-3',
  worldId: 'world-3',
  questionKeys: [
    mkQuestion('quiz-3', 0, 3, 2),
    mkQuestion('quiz-3', 1, 3, 0),
    mkQuestion('quiz-3', 2, 3, 1),
    mkQuestion('quiz-3', 3, 3, 2),
    mkQuestion('quiz-3', 4, 3, 0)
  ]
};

// World 4 checkpoint — "give a plan". Office scenarios about breaking big tasks into steps.
export const QUIZ_WORLD_4: Quiz = {
  id: 'quiz-4',
  worldId: 'world-4',
  questionKeys: [
    mkQuestion('quiz-4', 0, 3, 1),
    mkQuestion('quiz-4', 1, 3, 0),
    mkQuestion('quiz-4', 2, 3, 2),
    mkQuestion('quiz-4', 3, 3, 1),
    mkQuestion('quiz-4', 4, 3, 0)
  ]
};

// World 5 checkpoint — "give a review". Office scenarios about a second pair of eyes catching errors.
export const QUIZ_WORLD_5: Quiz = {
  id: 'quiz-5',
  worldId: 'world-5',
  questionKeys: [
    mkQuestion('quiz-5', 0, 3, 2),
    mkQuestion('quiz-5', 1, 3, 1),
    mkQuestion('quiz-5', 2, 3, 0),
    mkQuestion('quiz-5', 3, 3, 2),
    mkQuestion('quiz-5', 4, 3, 1)
  ]
};

// World 6 checkpoint — "know when to stop". Office scenarios about limits and not looping forever.
export const QUIZ_WORLD_6: Quiz = {
  id: 'quiz-6',
  worldId: 'world-6',
  questionKeys: [
    mkQuestion('quiz-6', 0, 3, 0),
    mkQuestion('quiz-6', 1, 3, 2),
    mkQuestion('quiz-6', 2, 3, 1),
    mkQuestion('quiz-6', 3, 3, 0),
    mkQuestion('quiz-6', 4, 3, 2)
  ]
};

// World 7 checkpoint — "guard against tricks". Office scenarios about hidden commands and asking a human.
export const QUIZ_WORLD_7: Quiz = {
  id: 'quiz-7',
  worldId: 'world-7',
  questionKeys: [
    mkQuestion('quiz-7', 0, 3, 1),
    mkQuestion('quiz-7', 1, 3, 0),
    mkQuestion('quiz-7', 2, 3, 2),
    mkQuestion('quiz-7', 3, 3, 1),
    mkQuestion('quiz-7', 4, 3, 0)
  ]
};

export const QUIZZES: ReadonlyArray<Quiz> = [
  QUIZ_WORLD_1,
  QUIZ_WORLD_2,
  QUIZ_WORLD_3,
  QUIZ_WORLD_4,
  QUIZ_WORLD_5,
  QUIZ_WORLD_6,
  QUIZ_WORLD_7
];

/** The quiz that gates the world with this id, or undefined if the world has no checkpoint. */
export function getQuizForWorld(worldId: string): Quiz | undefined {
  return QUIZZES.find((q) => q.worldId === worldId);
}
