"use client";

import { useState, useEffect, useTransition } from "react";
import {
  UserPlus,
  Loader2,
  AlertCircle,
  Trash2,
  Mail,
  Shield,
  User,
  Check,
} from "lucide-react";
import { getUsers } from "@/lib/actions/admin";
import { createUser, deleteUser } from "@/lib/actions/auth";

interface UserRow {
  id: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function loadUsers() {
    setLoading(true);
    const res = await getUsers();
    if (res.error) setError(res.error);
    setUsers((res.data as UserRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function handleCreateUser(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createUser(formData);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setSuccess("Usuario creado correctamente");
        setShowForm(false);
        await loadUsers();
      }
    });
  }

  function handleDeleteUser(userId: string) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        await loadUsers();
      }
    });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="mt-1 text-muted-foreground">
            {users.length} usuarios registrados
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <form
          action={handleCreateUser}
          className="rounded-2xl border border-border bg-surface p-5 shadow-soft"
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Crear nuevo usuario
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Email *
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="usuario@email.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Contraseña *
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Rol
              </label>
              <select
                name="role"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Crear
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-alt"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Usuario</th>
              <th className="px-5 py-3">Rol</th>
              <th className="hidden px-5 py-3 sm:table-cell">Registro</th>
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
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  No hay usuarios.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-alt/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {u.id.slice(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-alt text-muted-foreground"
                      }`}
                    >
                      {u.role === "admin" ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {u.role}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3 text-sm text-muted-foreground sm:table-cell">
                    {new Date(u.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-error/10 hover:text-error disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
