"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getQuestions,
  toggleQuestion,
  deleteQuestion,
} from "@/lib/actions/questions";
import { getBlocks, getTopics } from "@/lib/actions/admin";
import Link from "next/link";

interface QuestionRow {
  id: string;
  statement: string;
  is_active: boolean;
  created_at: string;
  topics?: { name: string; blocks?: { name: string } } | null;
  answers?: { id: string; text: string; is_correct: boolean }[];
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pageSize = 15;

  async function loadQuestions() {
    setLoading(true);
    const res = await getQuestions({
      page,
      pageSize,
      search: search || undefined,
    });

    if (res.error) {
      setError(res.error);
    } else {
      setQuestions((res.data as QuestionRow[]) ?? []);
      setTotalCount(res.count);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadQuestions();
  }, [page]);

  function handleSearch() {
    setPage(1);
    loadQuestions();
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestión de Preguntas
          </h1>
          <p className="mt-1 text-muted-foreground">
            {totalCount} preguntas en el banco
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Nueva Pregunta
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar por enunciado..."
            className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={handleSearch}
          className="rounded-xl bg-surface-alt px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border"
        >
          Buscar
        </button>
      </div>

      {/* Questions List */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        {/* Mobile: Card layout */}
        <div className="divide-y divide-border sm:hidden">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" />
            </div>
          ) : questions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No hay preguntas.
            </p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="px-4 py-3">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-medium text-foreground">
                    {q.statement}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`/admin/questions/${q.id}`}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => {
                        if (
                          confirm("¿Eliminar esta pregunta y sus respuestas?")
                        ) {
                          startTransition(async () => {
                            await deleteQuestion(q.id);
                            await loadQuestions();
                          });
                        }
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      startTransition(async () => {
                        await toggleQuestion(q.id, !q.is_active);
                        await loadQuestions();
                      });
                    }}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.is_active
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error"
                    }`}
                  >
                    {q.is_active ? (
                      <>
                        <Eye className="h-3 w-3" /> Activa
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" /> Inactiva
                      </>
                    )}
                  </button>
                  {q.topics && (
                    <span className="truncate text-xs text-muted-foreground">
                      {q.topics.blocks?.name} / {q.topics.name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: Table layout */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-alt text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Enunciado</th>
                <th className="hidden px-5 py-3 md:table-cell">Bloque / Tema</th>
                <th className="px-5 py-3 text-center">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted" />
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No hay preguntas.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-surface-alt/50">
                    <td className="max-w-xs truncate px-5 py-3 text-sm text-foreground">
                      {q.statement}
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-primary">
                          {q.topics?.blocks?.name ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {q.topics?.name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => {
                          startTransition(async () => {
                            await toggleQuestion(q.id, !q.is_active);
                            await loadQuestions();
                          });
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          q.is_active
                            ? "bg-success/10 text-success"
                            : "bg-error/10 text-error"
                        }`}
                      >
                        {q.is_active ? (
                          <>
                            <Eye className="h-3 w-3" /> Activa
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> Inactiva
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/questions/${q.id}`}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            if (
                              confirm("¿Eliminar esta pregunta y sus respuestas?")
                            ) {
                              startTransition(async () => {
                                await deleteQuestion(q.id);
                                await loadQuestions();
                              });
                            }
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <span className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isPending && (
        <div className="text-center text-xs text-muted-foreground">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
          Procesando...
        </div>
      )}
    </div>
  );
}
