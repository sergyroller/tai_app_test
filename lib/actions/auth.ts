"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Sign in with email and password.
 */
export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Create a new user (admin only).
 * Uses the admin client (service role) to bypass RLS.
 */
export async function createUser(formData: FormData) {
  const supabase = await createClient();

  // Verify current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "No autorizado: se requiere rol de administrador" };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "user";

  const adminClient = createAdminClient();

  // Create user with admin API
  const { data: newUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError) {
    return { error: createError.message };
  }

  // Update the profile role if admin
  if (role === "admin" && newUser.user) {
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", newUser.user.id);

    if (updateError) {
      return { error: `Usuario creado pero error al asignar rol: ${updateError.message}` };
    }
  }

  revalidatePath("/admin/users");
  return { success: true };
}

/**
 * Delete a user (admin only).
 */
export async function deleteUser(userId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "No autorizado" };
  }

  // Don't allow deleting yourself
  if (userId === user.id) {
    return { error: "No puedes eliminar tu propia cuenta" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
