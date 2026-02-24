"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Loader2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { getTestHistory, getStatsByBlock } from "@/lib/actions/tests";

interface HistoryRow {
  id: string;
  mode: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  blank_answers: number;
  final_score: number | null;
  created_at: string;
}

interface BlockStat {
  blockName: string;
  totalMistakes: number;
  questionCount: number;
}

export default function StatsPage() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [blockStats, setBlockStats] = useState<BlockStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [histRes, statsRes] = await Promise.all([
        getTestHistory(50),
        getStatsByBlock(),
      ]);

      if (histRes.error) setError(histRes.error);
      if (statsRes.error) setError(statsRes.error);

      setHistory((histRes.data as HistoryRow[]) ?? []);
      setBlockStats((statsRes.data as BlockStat[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Stats calculations
  const totalTests = history.length;
  const avgScore =
    history.filter((h) => h.final_score !== null).length > 0
      ? history.reduce((sum, h) => sum + (h.final_score ?? 0), 0) /
        history.filter((h) => h.final_score !== null).length
      : null;
  const totalCorrect = history.reduce((s, h) => s + h.correct_answers, 0);
  const totalIncorrect = history.reduce((s, h) => s + h.incorrect_answers, 0);
  const totalQuestions = history.reduce((s, h) => s + h.total_questions, 0);
  const overallAccuracy =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  const maxMistakes = Math.max(
    ...blockStats.map((b) => b.totalMistakes),
    1
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Estadísticas
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tu rendimiento y progreso en los tests.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border border-l-4 border-l-primary/30 bg-surface p-5 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            Tests Realizados
          </div>
          <p className="text-3xl font-black text-foreground">{totalTests}</p>
        </div>

        <div className="rounded-2xl border border-border border-l-4 border-l-secondary/30 bg-surface p-5 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-secondary" />
            Nota Media
          </div>
          <p className="text-3xl font-black text-foreground">
            {avgScore !== null ? avgScore.toFixed(2) : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-border border-l-4 border-l-success/30 bg-surface p-5 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Precisión
          </div>
          <p className="text-3xl font-black text-foreground">
            {overallAccuracy}%
          </p>
        </div>

        <div className="rounded-2xl border border-border border-l-4 border-l-error/30 bg-surface p-5 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <XCircle className="h-4 w-4 text-error" />
            Total Fallos
          </div>
          <p className="text-3xl font-black text-foreground">
            {totalIncorrect}
          </p>
        </div>
      </div>

      {/* Mistakes by Block */}
      {blockStats.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Fallos por Bloque
          </h2>
          <div className="space-y-3">
            {blockStats
              .sort((a, b) => b.totalMistakes - a.totalMistakes)
              .map((block) => (
                <div key={block.blockName}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{block.blockName}</span>
                    <span className="text-xs text-muted-foreground">
                      {block.totalMistakes} fallos en {block.questionCount}{" "}
                      preguntas
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full bg-error/70 transition-all duration-500"
                      style={{
                        width: `${(block.totalMistakes / maxMistakes) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent History */}
      <div className="rounded-2xl border border-border bg-surface shadow-soft">
        <div className="border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Historial de Tests
          </h2>
        </div>

        {history.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aún no has realizado ningún test. ¡Empieza ahora!
          </p>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="divide-y divide-border sm:hidden">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Score circle */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                      h.final_score !== null
                        ? h.final_score >= 5
                          ? "bg-success"
                          : "bg-error"
                        : "bg-muted"
                    }`}
                  >
                    {h.final_score !== null
                      ? h.final_score.toFixed(1)
                      : "—"}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          h.mode === "exam"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {h.mode === "exam" ? "Examen" : "Estudio"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {h.total_questions} preg.
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(h.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                      <span className="text-success">✓ {h.correct_answers}</span>
                      <span className="text-error">✗ {h.incorrect_answers}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Modo</th>
                    <th className="px-5 py-3 text-center">Preguntas</th>
                    <th className="px-5 py-3 text-center">Correctas</th>
                    <th className="px-5 py-3 text-center">Incorrectas</th>
                    <th className="px-5 py-3 text-right">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-surface-alt/50">
                      <td className="px-5 py-3 text-sm text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted" />
                          {new Date(h.created_at).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            h.mode === "exam"
                              ? "bg-secondary/10 text-secondary"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {h.mode === "exam" ? "Examen" : "Estudio"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-sm text-muted-foreground">
                        {h.total_questions}
                      </td>
                      <td className="px-5 py-3 text-center text-sm text-success">
                        {h.correct_answers}
                      </td>
                      <td className="px-5 py-3 text-center text-sm text-error">
                        {h.incorrect_answers}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`text-sm font-bold ${
                            h.final_score !== null
                              ? h.final_score >= 5
                                ? "text-success"
                                : "text-error"
                              : "text-muted-foreground"
                          }`}
                        >
                          {h.final_score !== null
                            ? h.final_score.toFixed(2)
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
