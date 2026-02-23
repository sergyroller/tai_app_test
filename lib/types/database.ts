/**
 * Database types for the TAI App.
 * These mirror the PostgreSQL schema defined in the implementation plan.
 */

export type UserRole = "admin" | "user";
export type TestMode = "study" | "exam";

// ============================================
// Database Row Types
// ============================================

export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
}

export interface Block {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Topic {
  id: string;
  block_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface Question {
  id: string;
  topic_id: string;
  statement: string;
  code_snippet: string | null;
  code_language: string | null;
  image_url: string | null;
  explanation: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  image_url: string | null;
  sort_order: number;
}

export interface QuestionTag {
  question_id: string;
  tag_id: string;
}

export interface TestHistory {
  id: string;
  user_id: string;
  mode: TestMode;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  blank_answers: number;
  final_score: number | null;
  created_at: string;
}

export interface UserMistake {
  user_id: string;
  question_id: string;
  fail_count: number;
  last_failed_at: string;
}

// ============================================
// Extended / Joined Types (for UI usage)
// ============================================

/** Question with its answers and optional topic/block/tags */
export interface QuestionWithAnswers extends Question {
  answers: Answer[];
  topic?: Topic & { block?: Block };
  tags?: Tag[];
}

/** Test configuration before starting */
export interface TestConfig {
  mode: TestMode;
  questionCount: number;
  timerMinutes?: number; // Only for exam mode
  blockIds?: string[];
  topicIds?: string[];
  tagIds?: string[];
  failedOnly?: boolean;
  unseenOnly?: boolean;
}

/** Individual question state during test execution */
export interface TestQuestionState {
  question: QuestionWithAnswers;
  selectedAnswerId: string | null;
  isLocked: boolean;
  shuffledAnswerIds: string[];
}

/** Full test state during execution */
export interface TestState {
  id: string;
  config: TestConfig;
  questions: TestQuestionState[];
  currentIndex: number;
  startedAt: string;
  finishedAt: string | null;
}

/** Test results after completion */
export interface TestResults {
  mode: TestMode;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  blankAnswers: number;
  finalScore: number | null;
  grade: number | null; // Over 10, only for exam mode
}

// ============================================
// Form / Insert Types
// ============================================

export type QuestionInsert = Omit<Question, "id" | "created_at">;
export type AnswerInsert = Omit<Answer, "id">;
export type BlockInsert = Omit<Block, "id" | "created_at">;
export type TopicInsert = Omit<Topic, "id" | "created_at">;
export type TagInsert = Omit<Tag, "id" | "created_at">;

/** Bulk import row from CSV/JSON */
export interface BulkImportRow {
  statement: string;
  code_snippet?: string;
  code_language?: string;
  image_url?: string;
  explanation?: string;
  topic_name: string;
  block_name: string;
  tags?: string; // Comma-separated
  answer_1: string;
  answer_2: string;
  answer_3: string;
  answer_4: string;
  correct_answer: number; // 1-4
}
