"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Trophy,
  ArrowRight,
  BarChart3,
  RotateCcw,
  Loader2,
} from "lucide-react";

interface TestResultsData {
  totalQuestions: number;
  correct: number;
  incorrect: number;
  blank: number;
  score: number | null;
  mode: "study" | "exam";
}

export default function TestResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<TestResultsData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("tai_test_results");
    if (!raw) {
      router.replace("/dashboard");
      return;
    }
    setResults(JSON.parse(raw));
  }, [router]);

  if (!results) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const percentage =
    results.totalQuestions > 0
      ? Math.round((results.correct / results.totalQuestions) * 100)
      : 0;

  const scoreColor =
    results.score !== null
      ? results.score >= 5
        ? "text-success"
        : "text-error"
      : percentage >= 70
        ? "text-success"
        : percentage >= 50
          ? "text-warning"
          : "text-error";

  return (
    <div className="mx-auto max-w-lg animate-fade-in space-y-6">
      {/* Score Card */}
      <div className="rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 animate-scale-in">
          <Trophy className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          Test Completado
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modo {results.mode === "study" ? "Estudio" : "Examen"}
        </p>

        {/* Score */}
        {results.score !== null && (
          <div className="mt-6">
            <span className={`text-5xl font-black ${scoreColor}`}>
              {results.score.toFixed(2)}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              Puntuación sobre 10
            </p>
          </div>
        )}

        {/* Percentage Circle */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="relative h-24 w-24">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-surface-alt"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${percentage * 2.51} 251`}
                className={`${scoreColor} animate-fill-progress`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-4 shadow-soft">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="text-2xl font-bold text-success">
            {results.correct}
          </span>
          <span className="text-xs text-muted-foreground">Correctas</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-4 shadow-soft">
          <XCircle className="h-5 w-5 text-error" />
          <span className="text-2xl font-bold text-error">
            {results.incorrect}
          </span>
          <span className="text-xs text-muted-foreground">Incorrectas</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-4 shadow-soft">
          <MinusCircle className="h-5 w-5 text-muted" />
          <span className="text-2xl font-bold text-muted-foreground">
            {results.blank}
          </span>
          <span className="text-xs text-muted-foreground">En blanco</span>
        </div>
      </div>

      {/* Exam scoring details */}
      {results.mode === "exam" && results.score !== null && (
        <div className="rounded-xl border border-border bg-surface-alt p-4 text-center text-xs text-muted-foreground">
          <p>
            Fórmula: (Correctas × 1) − (Incorrectas × 0.33)
          </p>
          <p className="mt-1 font-mono">
            {results.correct} − {(results.incorrect * 0.33).toFixed(2)} ={" "}
            {(results.correct - results.incorrect * 0.33).toFixed(2)} →{" "}
            {results.score.toFixed(2)} sobre 10
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => {
            sessionStorage.removeItem("tai_current_test");
            sessionStorage.removeItem("tai_test_results");
            router.push("/test/config");
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-medium text-foreground hover:bg-surface-alt"
        >
          <RotateCcw className="h-4 w-4" />
          Nuevo Test
        </button>
        <button
          onClick={() => {
            sessionStorage.removeItem("tai_current_test");
            sessionStorage.removeItem("tai_test_results");
            router.push("/stats");
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          <BarChart3 className="h-4 w-4" />
          Ver Estadísticas
        </button>
      </div>

      {/* Back to Dashboard */}
      <button
        onClick={() => {
          sessionStorage.removeItem("tai_current_test");
          sessionStorage.removeItem("tai_test_results");
          router.push("/dashboard");
        }}
        className="flex w-full items-center justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground"
      >
        Volver al Dashboard
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
