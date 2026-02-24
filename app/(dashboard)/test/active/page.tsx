"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Send,
  Loader2,
  AlertTriangle,
  Lightbulb,
  Code2,
} from "lucide-react";
import { submitTestResults } from "@/lib/actions/tests";
import { formatTimer, calculateResults } from "@/lib/utils";
import type { QuestionWithAnswers, TestConfig } from "@/lib/types/database";

interface TestData {
  config: TestConfig;
  questions: QuestionWithAnswers[];
  startedAt: string;
}

interface AnswerState {
  selectedAnswerId: string | null;
  locked: boolean;
}

export default function ActiveTestPage() {
  const router = useRouter();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, AnswerState>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load test data from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("tai_current_test");
    if (!raw) {
      router.replace("/test/config");
      return;
    }

    const data: TestData = JSON.parse(raw);
    setTestData(data);

    // Initialize timer for exam mode
    if (data.config.mode === "exam" && data.config.timerMinutes) {
      setTimeRemaining(data.config.timerMinutes * 60);
    }

    // Initialize empty answer states
    const initial = new Map<string, AnswerState>();
    data.questions.forEach((q) => {
      initial.set(q.id, { selectedAnswerId: null, locked: false });
    });
    setAnswers(initial);
  }, [router]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || finished) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Time's up
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, finished]);

  const question = testData?.questions[currentIndex];
  const questionAnswer = question ? answers.get(question.id) : undefined;
  const totalQuestions = testData?.questions.length ?? 0;
  const isStudyMode = testData?.config.mode === "study";

  const selectAnswer = useCallback(
    (answerId: string) => {
      if (!question || questionAnswer?.locked) return;

      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(question.id, {
          selectedAnswerId: answerId,
          locked: isStudyMode, // Auto-lock in study mode
        });
        return next;
      });
      setShowExplanation(isStudyMode);
    },
    [question, questionAnswer, isStudyMode]
  );

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setShowExplanation(false);
    }
  }, [currentIndex, totalQuestions]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setShowExplanation(false);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key >= "1" && e.key <= "4" && question) {
        const sortedAnswers = [...(question.answers || [])].sort(
          (a, b) => a.sort_order - b.sort_order
        );
        const answerIndex = parseInt(e.key) - 1;
        if (sortedAnswers[answerIndex]) {
          selectAnswer(sortedAnswers[answerIndex].id);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, question, selectAnswer]);

  function handleFinishTest() {
    if (!testData) return;

    if (
      !isStudyMode &&
      !confirm("¿Estás seguro de entregar el test? No podrás modificar las respuestas.")
    ) {
      return;
    }

    setFinished(true);

    const results = calculateResults(
      testData.questions,
      answers,
      testData.config.mode
    );

    // Get failed question IDs
    const failedQuestionIds: string[] = [];
    testData.questions.forEach((q) => {
      const ans = answers.get(q.id);
      if (ans?.selectedAnswerId) {
        const selected = q.answers?.find(
          (a) => a.id === ans.selectedAnswerId
        );
        if (selected && !selected.is_correct) {
          failedQuestionIds.push(q.id);
        }
      }
    });

    startTransition(async () => {
      await submitTestResults({
        mode: testData.config.mode,
        totalQuestions: results.totalQuestions,
        correctAnswers: results.correct,
        incorrectAnswers: results.incorrect,
        blankAnswers: results.blank,
        finalScore: results.score,
        failedQuestionIds,
      });

      // Store results for the results page
      sessionStorage.setItem(
        "tai_test_results",
        JSON.stringify({
          ...results,
          mode: testData.config.mode,
          questions: testData.questions,
          answers: Object.fromEntries(answers),
        })
      );

      router.push("/test/results");
    });
  }

  if (!testData || !question) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const sortedAnswers = [...(question.answers || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const correctAnswer = sortedAnswers.find((a) => a.is_correct);

  // Count answered
  const answeredCount = Array.from(answers.values()).filter(
    (a) => a.selectedAnswerId !== null
  ).length;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface px-4 py-3 shadow-soft sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isStudyMode
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
            }`}
          >
            {isStudyMode ? "ESTUDIO" : "EXAMEN"}
          </span>
          <span className="text-sm text-muted-foreground">
            {answeredCount}/{totalQuestions} respondidas
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {timeRemaining !== null && (
            <span
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-mono font-bold ${
                timeRemaining < 60
                  ? "bg-error/10 text-error animate-pulse"
                  : timeRemaining < 300
                    ? "bg-warning/10 text-warning"
                    : "text-foreground"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {formatTimer(timeRemaining)}
            </span>
          )}

          <button
            onClick={handleFinishTest}
            disabled={isPending || finished}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Entregar
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      {/* Question Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface p-5 pt-6 shadow-card sm:p-6 sm:pt-7">
        {/* Question Header */}
        <div className="mb-4 flex items-start justify-between">
          <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            Pregunta {currentIndex + 1} / {totalQuestions}
          </span>
          {question.topic && (
            <span className="text-xs text-muted-foreground">
              {question.topic.block?.name} / {question.topic.name}
            </span>
          )}
        </div>

        {/* Statement */}
        <p className="mb-5 text-base font-medium leading-relaxed text-foreground sm:text-lg">
          {question.statement}
        </p>

        {/* Code Snippet */}
        {question.code_snippet && (
          <div className="mb-5 min-w-0 overflow-x-auto rounded-xl bg-gray-900 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
              <Code2 className="h-3 w-3" />
              {question.code_language || "código"}
            </div>
            <pre className="text-sm text-gray-100">
              <code>{question.code_snippet}</code>
            </pre>
          </div>
        )}

        {/* Image */}
        {question.image_url && (
          <div className="mb-5">
            <img
              src={question.image_url}
              alt="Imagen de la pregunta"
              className="max-h-64 rounded-xl object-contain"
            />
          </div>
        )}

        {/* Answer Options */}
        <div className="space-y-2.5">
          {sortedAnswers.map((answer, idx) => {
            const isSelected =
              questionAnswer?.selectedAnswerId === answer.id;
            const isLocked = questionAnswer?.locked;
            const letter = ["A", "B", "C", "D"][idx];

            let bgClass =
              "border-border bg-background hover:border-primary/30 hover:bg-primary/5";
            if (isSelected && !isLocked) {
              bgClass = "border-primary bg-primary/10";
            }
            if (isLocked) {
              if (answer.is_correct) {
                bgClass = "border-success bg-success/10";
              } else if (isSelected && !answer.is_correct) {
                bgClass = "border-error bg-error/10";
              } else {
                bgClass = "border-border bg-background opacity-60";
              }
            }

            return (
              <button
                key={answer.id}
                onClick={() => selectAnswer(answer.id)}
                disabled={isLocked || finished}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all sm:p-4 ${bgClass} disabled:cursor-not-allowed`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isSelected
                      ? isLocked
                        ? answer.is_correct
                          ? "bg-success text-white"
                          : "bg-error text-white"
                        : "bg-primary text-white"
                      : "bg-surface-alt text-muted-foreground"
                  }`}
                >
                  {isLocked ? (
                    answer.is_correct ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isSelected ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      letter
                    )
                  ) : (
                    letter
                  )}
                </span>
                <span className="text-sm text-foreground">{answer.text}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation (study mode) */}
        {showExplanation && question.explanation && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-info/10 p-4">
            <Lightbulb className="h-4 w-4 shrink-0 text-info" />
            <p className="text-sm text-foreground">{question.explanation}</p>
          </div>
        )}

        {/* Study mode: show result indicator after locking */}
        {isStudyMode && questionAnswer?.locked && (
          <div className="mt-3 text-center text-sm font-medium">
            {questionAnswer.selectedAnswerId ===
            correctAnswer?.id ? (
              <span className="text-success">
                ✓ ¡Correcto!
              </span>
            ) : (
              <span className="text-error">
                ✗ Incorrecto — La respuesta era: {correctAnswer?.text}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-alt disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        {/* Question indicator: compact on mobile, dots on desktop */}
        <span className="text-sm font-medium text-muted-foreground sm:hidden">
          {currentIndex + 1} / {totalQuestions}
        </span>
        <div className="hidden max-w-none gap-1 sm:flex">
          {testData.questions.map((q, i) => {
            const a = answers.get(q.id);
            let dotClass = "bg-surface-alt";
            if (i === currentIndex) dotClass = "bg-primary";
            else if (a?.selectedAnswerId) dotClass = "bg-primary/40";
            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIndex(i);
                  setShowExplanation(false);
                }}
                className={`h-2 w-2 shrink-0 rounded-full transition-all ${dotClass}`}
              />
            );
          })}
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex === totalQuestions - 1}
          className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-alt disabled:opacity-40"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
