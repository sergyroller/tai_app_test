"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Code2,
  ImageIcon,
  MessageSquare,
} from "lucide-react";
import { createQuestion } from "@/lib/actions/questions";
import { getBlocks, getTopics, getTags } from "@/lib/actions/admin";
import type { Block, Topic, Tag } from "@/lib/types/database";

export default function NewQuestionPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState("");
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
      setTags((taRes.data as Tag[]) ?? []);
    }
    load();
  }, []);

  const filteredTopics = selectedBlockId
    ? topics.filter((t) => t.block_id === selectedBlockId)
    : topics;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createQuestion(formData);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.push("/admin/questions");
      }
    });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nueva Pregunta
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Rellena todos los campos y las 4 opciones de respuesta.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        {/* Topic Selection */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Clasificación
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Bloque
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Todos los bloques</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Tema *
              </label>
              <select
                name="topic_id"
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecciona un tema</option>
                {filteredTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary"
                >
                  <input
                    type="checkbox"
                    name="tag_ids"
                    value={tag.id}
                    className="sr-only"
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Statement */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Enunciado</h3>
          </div>
          <textarea
            name="statement"
            required
            rows={4}
            placeholder="Escribe el enunciado de la pregunta..."
            className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Code Snippet */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-secondary" />
            <h3 className="text-sm font-semibold text-foreground">
              Código (opcional)
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <textarea
              name="code_snippet"
              rows={5}
              placeholder="Pega aquí el fragmento de código..."
              className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                Lenguaje
              </label>
              <select
                name="code_language"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Ninguno</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="sql">SQL</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="bash">Bash</option>
                <option value="xml">XML</option>
                <option value="json">JSON</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>
        </div>

        {/* Image URL */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-accent-dark" />
            <h3 className="text-sm font-semibold text-foreground">
              Imagen (opcional)
            </h3>
          </div>
          <input
            name="image_url"
            type="url"
            placeholder="URL de la imagen (Storage de Supabase)"
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Answers */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Respuestas (4 opciones) *
          </h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_answer"
                    value={String(i)}
                    required
                    className="h-4 w-4 accent-success"
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {i === 1 ? "A" : i === 2 ? "B" : i === 3 ? "C" : "D"}
                  </span>
                </label>
                <input
                  name={`answer_${i}`}
                  required
                  placeholder={`Respuesta ${i === 1 ? "A" : i === 2 ? "B" : i === 3 ? "C" : "D"}`}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Selecciona el radio button de la respuesta correcta.
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Explicación / Feedback (opcional)
          </h3>
          <textarea
            name="explanation"
            rows={3}
            placeholder="Explica por qué la respuesta correcta es correcta..."
            className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Pregunta
            </>
          )}
        </button>
      </form>
    </div>
  );
}
