"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  BookOpen,
  Timer,
  Layers,
  Tag,
  AlertTriangle,
  Eye,
  Loader2,
  Play,
  Filter,
} from "lucide-react";
import { getBlocks, getTopics, getTags } from "@/lib/actions/admin";
import { generateTest } from "@/lib/actions/tests";
import type { Block, Topic, Tag as TagType, TestConfig, QuestionWithAnswers } from "@/lib/types/database";

export default function TestConfigPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMode = searchParams.get("mode") === "exam" ? "exam" : "study";

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);

  // Config state
  const [mode, setMode] = useState<"study" | "exam">(defaultMode);
  const [questionCount, setQuestionCount] = useState(20);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [failedOnly, setFailedOnly] = useState(false);
  const [unseenOnly, setUnseenOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const [bRes, tRes, taRes] = await Promise.all([
        getBlocks(),
        getTopics(),
        getTags(),
      ]);
      setBlocks((bRes.data as Block[]) ?? []);
      setTopics((tRes.data as Topic[]) ?? []);
      setTags((taRes.data as TagType[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function toggleSelection(id: string, list: string[], setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const filteredTopics = selectedBlockIds.length > 0
    ? topics.filter((t) => selectedBlockIds.includes(t.block_id))
    : topics;

  function handleStart() {
    setError(null);

    const config: TestConfig = {
      mode,
      questionCount,
      timerMinutes: mode === "exam" ? timerMinutes : undefined,
      blockIds: selectedBlockIds.length > 0 ? selectedBlockIds : undefined,
      topicIds: selectedTopicIds.length > 0 ? selectedTopicIds : undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      failedOnly,
      unseenOnly,
    };

    startTransition(async () => {
      const result = await generateTest(config);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Store test data in sessionStorage and navigate
      const testData = {
        config,
        questions: result.data as QuestionWithAnswers[],
        startedAt: new Date().toISOString(),
      };

      sessionStorage.setItem("tai_current_test", JSON.stringify(testData));
      router.push("/test/active");
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configurar Test
        </h1>
        <p className="mt-1 text-muted-foreground">
          Selecciona la modalidad, filtros y número de preguntas.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Mode Selection */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("study")}
          className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
            mode === "study"
              ? "border-primary bg-primary/5 shadow-card"
              : "border-border bg-surface hover:border-primary/30"
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${mode === "study" ? "bg-primary/10" : "bg-surface-alt"}`}>
            <BookOpen className={`h-6 w-6 ${mode === "study" ? "text-primary" : "text-muted"}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Modo Estudio</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Feedback inmediato, sin tiempo límite. Obligatorio responder.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode("exam")}
          className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
            mode === "exam"
              ? "border-secondary bg-secondary/5 shadow-card"
              : "border-border bg-surface hover:border-secondary/30"
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${mode === "exam" ? "bg-secondary/10" : "bg-surface-alt"}`}>
            <ClipboardList className={`h-6 w-6 ${mode === "exam" ? "text-secondary" : "text-muted"}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Modo Examen</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Con temporizador, penalización por fallos, se puede dejar en blanco.
            </p>
          </div>
        </button>
      </div>

      {/* Settings */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ClipboardList className="h-4 w-4 text-primary" />
            Número de preguntas
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value) || 20)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {mode === "exam" && (
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Timer className="h-4 w-4 text-secondary" />
              Tiempo (minutos)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 30)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Filtros (opcional)
          </h3>
        </div>

        {/* Blocks */}
        <div className="mb-4">
          <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            Bloques
          </label>
          <div className="flex flex-wrap gap-2">
            {blocks.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleSelection(b.id, selectedBlockIds, setSelectedBlockIds)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedBlockIds.includes(b.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {b.name}
              </button>
            ))}
            {blocks.length === 0 && (
              <span className="text-xs text-muted-foreground">No hay bloques creados</span>
            )}
          </div>
        </div>

        {/* Topics */}
        {filteredTopics.length > 0 && (
          <div className="mb-4">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Temas
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredTopics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleSelection(t.id, selectedTopicIds, setSelectedTopicIds)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedTopicIds.includes(t.id)
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-border text-muted-foreground hover:border-secondary/30"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-4">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleSelection(t.id, selectedTagIds, setSelectedTagIds)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedTagIds.includes(t.id)
                      ? "border-accent-dark bg-accent/10 text-accent-dark"
                      : "border-border text-muted-foreground hover:border-accent-dark/30"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Special filters */}
        <div className="flex flex-wrap gap-4 border-t border-border pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={failedOnly}
              onChange={(e) => setFailedOnly(e.target.checked)}
              className="h-4 w-4 rounded accent-error"
            />
            <AlertTriangle className="h-3.5 w-3.5 text-error" />
            Solo preguntas falladas
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={unseenOnly}
              onChange={(e) => setUnseenOnly(e.target.checked)}
              className="h-4 w-4 rounded accent-info"
            />
            <Eye className="h-3.5 w-3.5 text-info" />
            Solo preguntas nunca vistas
          </label>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-white shadow-card transition-all hover:bg-primary-dark hover:shadow-elevated active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generando test...
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            Comenzar Test
          </>
        )}
      </button>
    </div>
  );
}
