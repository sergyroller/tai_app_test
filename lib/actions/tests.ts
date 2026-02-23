"use server";

import { createClient } from "@/lib/supabase/server";
import type { TestConfig, QuestionWithAnswers } from "@/lib/types/database";

// ============================================
// TEST GENERATION
// ============================================

/**
 * Generate a test by fetching questions based on the provided config.
 * Uses the server client (with RLS) so users only see active questions.
 */
export async function generateTest(config: TestConfig) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado", data: null };

  // Start building the query
  let query = supabase
    .from("questions")
    .select("*, answers(*), topics(id, name, block_id, blocks(id, name)), question_tags(tag_id, tags(id, name))")
    .eq("is_active", true);

  // Filter by topics (which implicitly filters by blocks)
  if (config.topicIds && config.topicIds.length > 0) {
    query = query.in("topic_id", config.topicIds);
  } else if (config.blockIds && config.blockIds.length > 0) {
    // Get topics for these blocks first
    const { data: topicsInBlocks } = await supabase
      .from("topics")
      .select("id")
      .in("block_id", config.blockIds);

    if (topicsInBlocks && topicsInBlocks.length > 0) {
      query = query.in(
        "topic_id",
        topicsInBlocks.map((t) => t.id)
      );
    } else {
      return { error: "No hay preguntas para los bloques seleccionados", data: null };
    }
  }

  // Tag filter requires a different approach — fetch matching question IDs
  if (config.tagIds && config.tagIds.length > 0) {
    const { data: taggedQuestions } = await supabase
      .from("question_tags")
      .select("question_id")
      .in("tag_id", config.tagIds);

    if (taggedQuestions && taggedQuestions.length > 0) {
      query = query.in(
        "id",
        taggedQuestions.map((qt) => qt.question_id)
      );
    } else {
      return { error: "No hay preguntas con los tags seleccionados", data: null };
    }
  }

  // Failed-only filter
  if (config.failedOnly) {
    const { data: mistakes } = await supabase
      .from("user_mistakes")
      .select("question_id")
      .eq("user_id", user.id);

    if (mistakes && mistakes.length > 0) {
      query = query.in(
        "id",
        mistakes.map((m) => m.question_id)
      );
    } else {
      return {
        error: "No tienes preguntas falladas registradas",
        data: null,
      };
    }
  }

  // Unseen-only filter: exclude questions the user has already seen
  if (config.unseenOnly) {
    const { data: history } = await supabase
      .from("test_history")
      .select("id")
      .eq("user_id", user.id);

    // We need a way to track which questions were in which test.
    // For now, we'll use user_mistakes as a proxy for "seen" questions
    const { data: seenQuestions } = await supabase
      .from("user_mistakes")
      .select("question_id")
      .eq("user_id", user.id);

    if (seenQuestions && seenQuestions.length > 0 && history && history.length > 0) {
      // Exclude questions that have been answered (we use not.in for this)
      const seenIds = seenQuestions.map((s) => s.question_id);
      for (const seenId of seenIds) {
        query = query.neq("id", seenId);
      }
    }
  }

  // Execute query
  const { data: allQuestions, error } = await query;

  if (error) return { error: error.message, data: null };

  if (!allQuestions || allQuestions.length === 0) {
    return { error: "No hay preguntas disponibles con los filtros seleccionados", data: null };
  }

  // Shuffle and limit to requested count
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  const questions = shuffled.slice(0, config.questionCount);

  // Transform to QuestionWithAnswers format
  const formattedQuestions: QuestionWithAnswers[] = questions.map((q) => ({
    id: q.id,
    topic_id: q.topic_id,
    statement: q.statement,
    code_snippet: q.code_snippet,
    code_language: q.code_language,
    image_url: q.image_url,
    explanation: q.explanation,
    is_active: q.is_active,
    created_at: q.created_at,
    answers: q.answers || [],
    topic: q.topics
      ? {
          ...q.topics,
          block: q.topics.blocks || undefined,
        }
      : undefined,
    tags: q.question_tags
      ? q.question_tags
          .map((qt: { tags: { id: string; name: string } | null }) => qt.tags)
          .filter(Boolean)
      : [],
  }));

  return { data: formattedQuestions, error: null };
}

// ============================================
// TEST RESULTS
// ============================================

/**
 * Save test results to the database.
 */
export async function submitTestResults(params: {
  mode: "study" | "exam";
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  blankAnswers: number;
  finalScore: number | null;
  failedQuestionIds: string[];
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  // Insert test history
  const { data: testRecord, error: historyError } = await supabase
    .from("test_history")
    .insert({
      user_id: user.id,
      mode: params.mode,
      total_questions: params.totalQuestions,
      correct_answers: params.correctAnswers,
      incorrect_answers: params.incorrectAnswers,
      blank_answers: params.blankAnswers,
      final_score: params.finalScore,
    })
    .select("id")
    .single();

  if (historyError) return { error: historyError.message };

  // Record/update mistakes for failed questions
  if (params.failedQuestionIds.length > 0) {
    for (const questionId of params.failedQuestionIds) {
      // Check if mistake already exists
      const { data: existing } = await supabase
        .from("user_mistakes")
        .select("fail_count")
        .eq("user_id", user.id)
        .eq("question_id", questionId)
        .single();

      if (existing) {
        // Increment fail count
        await supabase
          .from("user_mistakes")
          .update({
            fail_count: existing.fail_count + 1,
            last_failed_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("question_id", questionId);
      } else {
        // Insert new mistake
        await supabase.from("user_mistakes").insert({
          user_id: user.id,
          question_id: questionId,
          fail_count: 1,
          last_failed_at: new Date().toISOString(),
        });
      }
    }
  }

  return { success: true, testId: testRecord.id };
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get test history for the current user.
 */
export async function getTestHistory(limit = 20) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado", data: null };

  const { data, error } = await supabase
    .from("test_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { error: error.message, data: null };
  return { data, error: null };
}

/**
 * Get performance stats grouped by block.
 */
export async function getStatsByBlock() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado", data: null };

  // Get user mistakes with topic and block info
  const { data: mistakes, error } = await supabase
    .from("user_mistakes")
    .select("question_id, fail_count, questions(topic_id, topics(name, block_id, blocks(name)))")
    .eq("user_id", user.id);

  if (error) return { error: error.message, data: null };

  // Aggregate by block
  const blockStats: Record<
    string,
    { blockName: string; totalMistakes: number; questionCount: number }
  > = {};

  for (const mistake of mistakes || []) {
    const block = (mistake as Record<string, unknown>).questions as {
      topics: { blocks: { name: string } };
    } | null;

    if (block?.topics?.blocks) {
      const blockName = block.topics.blocks.name;
      if (!blockStats[blockName]) {
        blockStats[blockName] = {
          blockName,
          totalMistakes: 0,
          questionCount: 0,
        };
      }
      blockStats[blockName].totalMistakes += mistake.fail_count;
      blockStats[blockName].questionCount++;
    }
  }

  return { data: Object.values(blockStats), error: null };
}
