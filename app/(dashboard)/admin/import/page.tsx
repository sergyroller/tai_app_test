"use client";

import { useState, useTransition } from "react";
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
} from "lucide-react";
import Papa from "papaparse";
import { bulkImportQuestions } from "@/lib/actions/questions";
import type { BulkImportRow } from "@/lib/types/database";

type Step = "upload" | "preview" | "result";

export default function AdminImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const parsed = results.data.map(mapRowToImport);
            setRows(parsed);
            setStep("preview");
          } catch (err) {
            setParseError(
              err instanceof Error ? err.message : "Error al parsear CSV"
            );
          }
        },
        error: (err) => setParseError(err.message),
      });
    } else if (ext === "json") {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          const arr = Array.isArray(data) ? data : [data];
          const parsed = arr.map(mapRowToImport);
          setRows(parsed);
          setStep("preview");
        } catch (err) {
          setParseError(
            err instanceof Error ? err.message : "Error al parsear JSON"
          );
        }
      };
      reader.readAsText(file);
    } else {
      setParseError("Solo se aceptan archivos .csv o .json");
    }
  }

  function mapRowToImport(row: Record<string, string>): BulkImportRow {
    return {
      statement: row.statement || row.enunciado || "",
      code_snippet: row.code_snippet || row.codigo || undefined,
      code_language: row.code_language || row.lenguaje || undefined,
      image_url: row.image_url || row.imagen || undefined,
      explanation: row.explanation || row.explicacion || undefined,
      topic_name: row.topic_name || row.tema || "",
      block_name: row.block_name || row.bloque || "",
      tags: row.tags || row.etiquetas || undefined,
      answer_1: row.answer_1 || row.respuesta_1 || "",
      answer_2: row.answer_2 || row.respuesta_2 || "",
      answer_3: row.answer_3 || row.respuesta_3 || "",
      answer_4: row.answer_4 || row.respuesta_4 || "",
      correct_answer: parseInt(
        row.correct_answer || row.respuesta_correcta || "1"
      ),
    };
  }

  function handleImport() {
    startTransition(async () => {
      const result = await bulkImportQuestions(rows);
      setImportResult(result);
      setStep("result");
    });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Importación Masiva
        </h1>
        <p className="mt-1 text-muted-foreground">
          Importa preguntas desde archivos CSV o JSON
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        {(["upload", "preview", "result"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <ArrowRight className="h-3 w-3 text-muted" />}
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                step === s
                  ? "bg-primary text-white"
                  : "bg-surface-alt text-muted-foreground"
              }`}
            >
              {s === "upload" ? "1. Subir" : s === "preview" ? "2. Revisar" : "3. Resultado"}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-soft">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <FileJson className="h-7 w-7 text-primary" />
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                <FileSpreadsheet className="h-7 w-7 text-secondary" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Sube tu archivo
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Formatos aceptados: CSV o JSON
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
              <Upload className="h-4 w-4" />
              Seleccionar archivo
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {parseError && (
              <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}

            {/* Expected format */}
            <div className="w-full max-w-md text-left">
              <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Columnas esperadas
              </h4>
              <div className="rounded-lg bg-surface-alt p-3 font-mono text-xs text-muted-foreground">
                statement, topic_name, block_name, answer_1, answer_2,
                answer_3, answer_4, correct_answer, tags, code_snippet,
                code_language, explanation, image_url
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {rows.length} preguntas detectadas en{" "}
                <span className="font-mono text-primary">{fileName}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("upload")}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-alt"
              >
                <ArrowLeft className="h-3 w-3" />
                Volver
              </button>
              <button
                onClick={handleImport}
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                Importar {rows.length} preguntas
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-alt text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Enunciado</th>
                    <th className="px-4 py-2">Tema</th>
                    <th className="px-4 py-2">Correcta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="hover:bg-surface-alt/50">
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="max-w-xs truncate px-4 py-2 text-xs text-foreground">
                        {row.statement}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {row.topic_name}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        Opción {row.correct_answer}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && (
              <div className="border-t border-border px-4 py-2 text-center text-xs text-muted-foreground">
                Mostrando 50 de {rows.length} filas
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && importResult && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Importación completada
                </h3>
                <p className="text-sm text-muted-foreground">
                  {importResult.imported} de {rows.length} preguntas importadas
                  correctamente
                </p>
              </div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="rounded-2xl border border-error/30 bg-error/5 p-5">
              <h4 className="mb-2 text-sm font-semibold text-error">
                Errores ({importResult.errors.length})
              </h4>
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {importResult.errors.map((err, i) => (
                  <li key={i} className="text-xs text-error/80">
                    • {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setStep("upload");
              setRows([]);
              setImportResult(null);
            }}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Importar más
          </button>
        </div>
      )}
    </div>
  );
}
