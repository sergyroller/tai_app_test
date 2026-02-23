"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Layers,
  BookOpen,
  Tag,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  Filter,
} from "lucide-react";
import {
  getBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from "@/lib/actions/admin";
import type { Block, Topic, Tag as TagType } from "@/lib/types/database";

// ============================================
// Inline Edit Row component
// ============================================
function InlineEditRow({
  initialName,
  initialSortOrder,
  onSave,
  onCancel,
}: {
  initialName: string;
  initialSortOrder?: number;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form
      action={onSave}
      className="flex items-center gap-2"
    >
      <input
        name="name"
        defaultValue={initialName}
        required
        autoFocus
        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {initialSortOrder !== undefined && (
        <input
          name="sort_order"
          type="number"
          defaultValue={initialSortOrder}
          className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}
      <button
        type="submit"
        className="rounded-lg bg-success/10 p-1.5 text-success hover:bg-success/20"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg bg-error/10 p-1.5 text-error hover:bg-error/20"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}

// ============================================
// Generic CRUD Section
// ============================================
function CrudSection<T extends { id: string; name: string }>({
  title,
  icon: Icon,
  items,
  loading,
  onAdd,
  onUpdate,
  onDelete,
  hasSortOrder,
  renderExtra,
}: {
  title: string;
  icon: React.ElementType;
  items: T[];
  loading: boolean;
  onAdd: (formData: FormData) => Promise<void>;
  onUpdate: (id: string, formData: FormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  hasSortOrder?: boolean;
  renderExtra?: (item: T) => React.ReactNode;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">{title}</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir
        </button>
      </div>

      <div className="divide-y divide-border">
        {adding && (
          <div className="px-5 py-3">
            <InlineEditRow
              initialName=""
              initialSortOrder={hasSortOrder ? 0 : undefined}
              onSave={(fd) => {
                startTransition(async () => {
                  await onAdd(fd);
                  setAdding(false);
                });
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No hay elementos. Pulsa &quot;Añadir&quot; para crear uno.
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3">
              {editingId === item.id ? (
                <div className="flex-1">
                  <InlineEditRow
                    initialName={item.name}
                    initialSortOrder={
                      hasSortOrder
                        ? (item as unknown as { sort_order: number })
                            .sort_order
                        : undefined
                    }
                    onSave={(fd) => {
                      startTransition(async () => {
                        await onUpdate(item.id, fd);
                        setEditingId(null);
                      });
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-foreground">
                    {item.name}
                  </span>
                  {renderExtra && renderExtra(item)}
                  {hasSortOrder && (
                    <span className="rounded bg-surface-alt px-2 py-0.5 text-xs text-muted-foreground">
                      #{(item as unknown as { sort_order: number }).sort_order}
                    </span>
                  )}
                  <button
                    onClick={() => setEditingId(item.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("¿Estás seguro de eliminar este elemento?")) {
                        startTransition(() => onDelete(item.id));
                      }
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {isPending && (
        <div className="border-t border-border px-5 py-2 text-center text-xs text-muted-foreground">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
          Guardando...
        </div>
      )}
    </div>
  );
}

// ============================================
// Topics section — grouped by block with filter
// ============================================
function TopicsSection({
  blocks,
  topics,
  loading,
}: {
  blocks: Block[];
  topics: (Topic & { blocks?: { name: string } })[];
  loading: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [filterBlockId, setFilterBlockId] = useState<string>("all");
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Sort blocks by sort_order
  const sortedBlocks = [...blocks].sort((a, b) => a.sort_order - b.sort_order);

  // Filter and group topics by block
  const blocksToShow = filterBlockId === "all"
    ? sortedBlocks
    : sortedBlocks.filter((b) => b.id === filterBlockId);

  function getTopicsForBlock(blockId: string) {
    return topics
      .filter((t) => t.block_id === blockId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function toggleCollapse(blockId: string) {
    setCollapsedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }

  const filteredTopicCount = filterBlockId === "all"
    ? topics.length
    : topics.filter((t) => t.block_id === filterBlockId).length;

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-secondary" />
          <h2 className="font-semibold text-foreground">Temas</h2>
          <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
            {filteredTopicCount}
          </span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-secondary-dark"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir tema
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border px-5 py-3">
        <Filter className="h-3.5 w-3.5 shrink-0 text-muted" />
        <button
          onClick={() => setFilterBlockId("all")}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filterBlockId === "all"
              ? "bg-secondary text-white"
              : "bg-surface-alt text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos
        </button>
        {sortedBlocks.map((b) => {
          const count = topics.filter((t) => t.block_id === b.id).length;
          return (
            <button
              key={b.id}
              onClick={() => setFilterBlockId(b.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterBlockId === b.id
                  ? "bg-secondary text-white"
                  : "bg-surface-alt text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.name}
              <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Add topic form */}
      {adding && (
        <form
          action={(fd) => {
            startTransition(async () => {
              await createTopic(fd);
              setAdding(false);
            });
          }}
          className="flex items-center gap-2 border-b border-border px-5 py-3"
        >
          <select
            name="block_id"
            required
            defaultValue={filterBlockId !== "all" ? filterBlockId : ""}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">Bloque...</option>
            {sortedBlocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            name="name"
            placeholder="Nombre del tema"
            required
            autoFocus
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            name="sort_order"
            type="number"
            defaultValue={0}
            className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-success/10 p-1.5 text-success hover:bg-success/20"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="rounded-lg bg-error/10 p-1.5 text-error hover:bg-error/20"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Content: grouped by block */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted" />
        </div>
      ) : blocksToShow.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No hay bloques creados. Crea un bloque primero.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {blocksToShow.map((block) => {
            const blockTopics = getTopicsForBlock(block.id);
            const isCollapsed = collapsedBlocks.has(block.id);

            return (
              <div key={block.id}>
                {/* Block header */}
                <button
                  type="button"
                  onClick={() => toggleCollapse(block.id)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-alt/50"
                >
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                  <Layers className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 text-sm font-semibold text-foreground">
                    {block.name}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {blockTopics.length} {blockTopics.length === 1 ? "tema" : "temas"}
                  </span>
                </button>

                {/* Topics within block */}
                {!isCollapsed && (
                  <div className="border-t border-border/50">
                    {blockTopics.length === 0 ? (
                      <p className="py-4 pl-14 text-xs text-muted-foreground">
                        Sin temas en este bloque. Pulsa &quot;Añadir tema&quot; para crear uno.
                      </p>
                    ) : (
                      blockTopics.map((topic) => (
                        <div
                          key={topic.id}
                          className="flex items-center gap-3 py-2.5 pl-14 pr-5 transition-colors hover:bg-surface-alt/30"
                        >
                          {editingId === topic.id ? (
                            <form
                              action={(fd) => {
                                startTransition(async () => {
                                  await updateTopic(topic.id, fd);
                                  setEditingId(null);
                                });
                              }}
                              className="flex flex-1 items-center gap-2"
                            >
                              <select
                                name="block_id"
                                defaultValue={topic.block_id}
                                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                              >
                                {sortedBlocks.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                              <input
                                name="name"
                                defaultValue={topic.name}
                                required
                                autoFocus
                                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <input
                                name="sort_order"
                                type="number"
                                defaultValue={topic.sort_order}
                                className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="rounded-lg bg-success/10 p-1.5 text-success hover:bg-success/20"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="rounded-lg bg-error/10 p-1.5 text-error hover:bg-error/20"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </form>
                          ) : (
                            <>
                              <span className="flex-1 text-sm text-foreground">
                                {topic.name}
                              </span>
                              <span className="rounded bg-surface-alt px-2 py-0.5 text-xs text-muted-foreground">
                                #{topic.sort_order}
                              </span>
                              <button
                                onClick={() => setEditingId(topic.id)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-alt hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("¿Eliminar este tema y sus preguntas asociadas?")) {
                                    startTransition(async () => {
                                      await deleteTopic(topic.id);
                                    });
                                  }
                                }}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isPending && (
        <div className="border-t border-border px-5 py-2 text-center text-xs text-muted-foreground">
          <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
          Guardando...
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function AdminStructurePage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [topics, setTopics] = useState<(Topic & { blocks?: { name: string } })[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [blocksRes, topicsRes, tagsRes] = await Promise.all([
        getBlocks(),
        getTopics(),
        getTags(),
      ]);

      if (blocksRes.error || topicsRes.error || tagsRes.error) {
        setError(blocksRes.error || topicsRes.error || tagsRes.error);
      }

      setBlocks((blocksRes.data as Block[]) ?? []);
      setTopics((topicsRes.data as (Topic & { blocks?: { name: string } })[]) ?? []);
      setTags((tagsRes.data as TagType[]) ?? []);
      setLoading(false);
    }
    loadData();
  }, []);

  const refreshData = async () => {
    const [blocksRes, topicsRes, tagsRes] = await Promise.all([
      getBlocks(),
      getTopics(),
      getTags(),
    ]);
    setBlocks((blocksRes.data as Block[]) ?? []);
    setTopics((topicsRes.data as (Topic & { blocks?: { name: string } })[]) ?? []);
    setTags((tagsRes.data as TagType[]) ?? []);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Estructura
        </h1>
        <p className="mt-1 text-muted-foreground">
          Gestiona los Bloques, Temas y Tags que organizan las preguntas.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Blocks */}
        <CrudSection<Block>
          title="Bloques"
          icon={Layers}
          items={blocks}
          loading={loading}
          hasSortOrder
          onAdd={async (fd) => {
            await createBlock(fd);
            await refreshData();
          }}
          onUpdate={async (id, fd) => {
            await updateBlock(id, fd);
            await refreshData();
          }}
          onDelete={async (id) => {
            await deleteBlock(id);
            await refreshData();
          }}
        />

        {/* Tags */}
        <CrudSection<TagType>
          title="Tags"
          icon={Tag}
          items={tags}
          loading={loading}
          onAdd={async (fd) => {
            await createTag(fd);
            await refreshData();
          }}
          onUpdate={async (id, fd) => {
            await updateTag(id, fd);
            await refreshData();
          }}
          onDelete={async (id) => {
            await deleteTag(id);
            await refreshData();
          }}
        />
      </div>

      {/* Topics (full width, needs block selector) */}
      <TopicsSection blocks={blocks} topics={topics} loading={loading} />
    </div>
  );
}
