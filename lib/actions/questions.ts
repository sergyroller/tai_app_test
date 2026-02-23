"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { BulkImportRow } from "@/lib/types/database";

// ============================================
// Helper: Verify admin role
// ============================================
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("No autorizado");

  return supabase;
}

// ============================================
// QUESTIONS
// ============================================

export async function getQuestions(options?: {
  topicId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("questions")
    .select(
      "*, topics(name, block_id, blocks(name)), answers(*), question_tags(tag_id, tags(name))",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.topicId) {
    query = query.eq("topic_id", options.topicId);
  }

  if (options?.isActive !== undefined) {
    query = query.eq("is_active", options.isActive);
  }

  if (options?.search) {
    query = query.ilike("statement", `%${options.search}%`);
  }

  const { data, error, count } = await query;
  if (error) return { error: error.message, data: null, count: 0 };
  return { data, error: null, count: count ?? 0 };
}

export async function getQuestionById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("questions")
    .select(
      "*, topics(name, block_id, blocks(name)), answers(*), question_tags(tag_id, tags(name))"
    )
    .eq("id", id)
    .single();

  if (error) return { error: error.message, data: null };
  return { data, error: null };
}

export async function createQuestion(formData: FormData) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const topicId = formData.get("topic_id") as string;
  const statement = formData.get("statement") as string;
  const codeSnippet = (formData.get("code_snippet") as string) || null;
  const codeLanguage = (formData.get("code_language") as string) || null;
  const imageUrl = (formData.get("image_url") as string) || null;
  const explanation = (formData.get("explanation") as string) || null;
  const tagIds = formData.getAll("tag_ids") as string[];

  // Insert question
  const { data: question, error: questionError } = await adminClient
    .from("questions")
    .insert({
      topic_id: topicId,
      statement,
      code_snippet: codeSnippet,
      code_language: codeLanguage,
      image_url: imageUrl,
      explanation,
    })
    .select("id")
    .single();

  if (questionError) return { error: questionError.message };

  // Insert 4 answers
  const answers = [];
  for (let i = 1; i <= 4; i++) {
    answers.push({
      question_id: question.id,
      text: formData.get(`answer_${i}`) as string,
      is_correct: formData.get("correct_answer") === String(i),
      sort_order: i,
    });
  }

  const { error: answersError } = await adminClient
    .from("answers")
    .insert(answers);

  if (answersError) return { error: answersError.message };

  // Insert tags
  if (tagIds.length > 0) {
    const questionTags = tagIds.map((tagId) => ({
      question_id: question.id,
      tag_id: tagId,
    }));

    const { error: tagsError } = await adminClient
      .from("question_tags")
      .insert(questionTags);

    if (tagsError) return { error: tagsError.message };
  }

  revalidatePath("/admin/questions");
  return { success: true, questionId: question.id };
}

export async function updateQuestion(id: string, formData: FormData) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const topicId = formData.get("topic_id") as string;
  const statement = formData.get("statement") as string;
  const codeSnippet = (formData.get("code_snippet") as string) || null;
  const codeLanguage = (formData.get("code_language") as string) || null;
  const imageUrl = (formData.get("image_url") as string) || null;
  const explanation = (formData.get("explanation") as string) || null;
  const tagIds = formData.getAll("tag_ids") as string[];

  // Update question
  const { error: questionError } = await adminClient
    .from("questions")
    .update({
      topic_id: topicId,
      statement,
      code_snippet: codeSnippet,
      code_language: codeLanguage,
      image_url: imageUrl,
      explanation,
    })
    .eq("id", id);

  if (questionError) return { error: questionError.message };

  // Update answers (delete and re-insert)
  await adminClient.from("answers").delete().eq("question_id", id);

  const answers = [];
  for (let i = 1; i <= 4; i++) {
    answers.push({
      question_id: id,
      text: formData.get(`answer_${i}`) as string,
      is_correct: formData.get("correct_answer") === String(i),
      sort_order: i,
    });
  }

  const { error: answersError } = await adminClient
    .from("answers")
    .insert(answers);

  if (answersError) return { error: answersError.message };

  // Update tags (delete and re-insert)
  await adminClient.from("question_tags").delete().eq("question_id", id);

  if (tagIds.length > 0) {
    const questionTags = tagIds.map((tagId) => ({
      question_id: id,
      tag_id: tagId,
    }));

    await adminClient.from("question_tags").insert(questionTags);
  }

  revalidatePath("/admin/questions");
  return { success: true };
}

export async function toggleQuestion(id: string, isActive: boolean) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("questions")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/questions");
  return { success: true };
}

export async function deleteQuestion(id: string) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("questions").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/questions");
  return { success: true };
}

// ============================================
// BULK IMPORT
// ============================================

export async function bulkImportQuestions(rows: BulkImportRow[]) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const results = { imported: 0, errors: [] as string[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Find or validate the topic
      const { data: topic, error: topicError } = await adminClient
        .from("topics")
        .select("id, blocks(name)")
        .eq("name", row.topic_name)
        .single();

      if (topicError || !topic) {
        results.errors.push(
          `Fila ${i + 1}: Tema "${row.topic_name}" no encontrado`
        );
        continue;
      }

      // Insert question
      const { data: question, error: questionError } = await adminClient
        .from("questions")
        .insert({
          topic_id: topic.id,
          statement: row.statement,
          code_snippet: row.code_snippet || null,
          code_language: row.code_language || null,
          image_url: row.image_url || null,
          explanation: row.explanation || null,
        })
        .select("id")
        .single();

      if (questionError) {
        results.errors.push(`Fila ${i + 1}: ${questionError.message}`);
        continue;
      }

      // Insert 4 answers
      const answers = [
        {
          question_id: question.id,
          text: row.answer_1,
          is_correct: row.correct_answer === 1,
          sort_order: 1,
        },
        {
          question_id: question.id,
          text: row.answer_2,
          is_correct: row.correct_answer === 2,
          sort_order: 2,
        },
        {
          question_id: question.id,
          text: row.answer_3,
          is_correct: row.correct_answer === 3,
          sort_order: 3,
        },
        {
          question_id: question.id,
          text: row.answer_4,
          is_correct: row.correct_answer === 4,
          sort_order: 4,
        },
      ];

      await adminClient.from("answers").insert(answers);

      // Insert tags if present
      if (row.tags) {
        const tagNames = row.tags.split(",").map((t) => t.trim());
        for (const tagName of tagNames) {
          // Find or create tag
          let { data: tag } = await adminClient
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .single();

          if (!tag) {
            const { data: newTag } = await adminClient
              .from("tags")
              .insert({ name: tagName })
              .select("id")
              .single();
            tag = newTag;
          }

          if (tag) {
            await adminClient
              .from("question_tags")
              .insert({ question_id: question.id, tag_id: tag.id });
          }
        }
      }

      results.imported++;
    } catch (err) {
      results.errors.push(
        `Fila ${i + 1}: ${err instanceof Error ? err.message : "Error desconocido"}`
      );
    }
  }

  revalidatePath("/admin/questions");
  return results;
}
