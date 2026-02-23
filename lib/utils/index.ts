/**
 * Utility functions for the TAI App.
 */

import type { QuestionWithAnswers } from "@/lib/types/database";

/**
 * Fisher-Yates shuffle algorithm. Returns a new shuffled array.
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface AnswerState {
  selectedAnswerId: string | null;
  locked: boolean;
}

interface CalcResult {
  totalQuestions: number;
  correct: number;
  incorrect: number;
  blank: number;
  score: number | null;
}

/**
 * Calculate test results from questions and user answers.
 *
 * Exam mode:
 *  - +1 per correct answer
 *  - -0.33 per incorrect answer
 *  - 0 for blank answers
 *  - Grade scaled to 10
 *
 * Study mode:
 *  - Simple correct/incorrect count, no numeric score
 */
export function calculateResults(
  questions: QuestionWithAnswers[],
  answers: Map<string, AnswerState>,
  mode: "study" | "exam"
): CalcResult {
  let correct = 0;
  let incorrect = 0;
  let blank = 0;

  for (const question of questions) {
    const answer = answers.get(question.id);

    if (!answer || !answer.selectedAnswerId) {
      blank++;
      continue;
    }

    const selectedAnswer = question.answers?.find(
      (a) => a.id === answer.selectedAnswerId
    );

    if (selectedAnswer?.is_correct) {
      correct++;
    } else {
      incorrect++;
    }
  }

  const totalQuestions = questions.length;

  if (mode === "exam") {
    const rawScore = correct - incorrect * (1 / 3);
    const clampedScore = Math.max(0, rawScore);
    const grade =
      totalQuestions > 0
        ? Math.round((clampedScore / totalQuestions) * 10 * 100) / 100
        : 0;

    return { totalQuestions, correct, incorrect, blank, score: grade };
  }

  return { totalQuestions, correct, incorrect, blank, score: null };
}

/**
 * Format a timer value (seconds) to MM:SS string.
 */
export function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Generate a simple unique ID for local state management.
 */
export function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Clamp a number between min and max values.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
