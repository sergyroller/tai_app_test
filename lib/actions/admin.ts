"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
// BLOCKS
// ============================================

export async function getBlocks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return { error: error.message, data: null };
  return { data, error: null };
}

export async function createBlock(formData: FormData) {
  const supabase = await requireAdmin();
  const name = formData.get("name") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0;

  const { error } = await supabase
    .from("blocks")
    .insert({ name, sort_order: sortOrder });

  if (error) return { error: error.message };

  revalidatePath("/admin/structure");
  return { success: true };
}

export async function updateBlock(id: string, formData: FormData) {
  const supabase = await requireAdmin();
  const name = formData.get("name") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0;

  const { error } = await supabase
    .from("blocks")
    .update({ name, sort_order: sortOrder })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/structure");
  return { success: true };
}

export async function deleteBlock(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("blocks").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/structure");
  return { success: true };
}

// ============================================
// TOPICS
// ============================================

export async function getTopics(blockId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("topics")
    .select("*, blocks(name)")
    .order("sort_order", { ascending: true });

  if (blockId) {
    query = query.eq("block_id", blockId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message, data: null };
  return { data, error: null };
}

export async function createTopic(formData: FormData) {
  const supabase = await requireAdmin();
  const name = formData.get("name") as string;
  const blockId = formData.get("block_id") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0;

  const { error } = await supabase
    .from("topics")
    .insert({ name, block_id: blockId, sort_order: sortOrder });

  if (error) return { error: error.message };

  revalidatePath("/admin/structure");
  return { success: true };
}

export async function updateTopic(id: string, formData: FormData) {
  const supabase = await requireAdmin();
  const name = formData.get("name") as string;
  const blockId = formData.get("block_id") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string) || 0;

  const { error } = await supabase
    .from("topics")
    .update({ name, block_id: blockId, sort_order: sortOrder })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/structure");
  return { success: true };
}

export async function deleteTopic(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("topics").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/structure");
  return { success: true };
}

// ============================================
// TAGS
// ============================================

export async function getTags() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) return { error: error.message, data: null };
  return { data, error: null };
}

export async function createTag(formData: FormData) {
  const supabase = await requireAdmin();
  const name = formData.get("name") as string;

  const { error } = await supabase.from("tags").insert({ name });

  if (error) return { error: error.message };

  revalidatePath("/admin/structure");
  return { success: true };
}

export async function updateTag(id: string, formData: FormData) {
  const supabase = await requireAdmin();
  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("tags")
    .update({ name })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/structure");
  return { success: true };
}

export async function deleteTag(id: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/structure");
  return { success: true };
}

// ============================================
// USER MANAGEMENT (admin views)
// ============================================

export async function getUsers() {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, created_at")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: null };
  return { data, error: null };
}
