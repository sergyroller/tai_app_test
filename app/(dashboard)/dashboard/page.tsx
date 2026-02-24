import {
  BookOpen,
  ClipboardList,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    title: "Nuevo Test",
    description: "Configura y comienza un nuevo test de práctica",
    href: "/test/config",
    icon: ClipboardList,
    color: "bg-primary/10 text-primary",
    borderColor: "border-t-primary",
  },
  {
    title: "Modo Examen",
    description: "Simula un examen real con temporizador",
    href: "/test/config?mode=exam",
    icon: BookOpen,
    color: "bg-secondary/10 text-secondary",
    borderColor: "border-t-secondary",
  },
  {
    title: "Estadísticas",
    description: "Revisa tu progreso y áreas de mejora",
    href: "/stats",
    icon: BarChart3,
    color: "bg-accent/10 text-accent-dark",
    borderColor: "border-t-accent-dark",
  },
];

export default function DashboardPage() {
  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenido de vuelta. ¿Qué quieres practicar hoy?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`group flex flex-col gap-4 rounded-2xl border border-border border-t-2 ${action.borderColor} bg-surface p-6 shadow-soft transition-all hover:border-primary/30 hover:shadow-card`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}
            >
              <action.icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{action.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Empezar <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-foreground">
          Actividad reciente
        </h2>
        <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
          <BarChart3 className="h-8 w-8 text-muted" />
          <p className="text-sm text-muted-foreground">
            Aquí aparecerán tus últimos tests realizados.
          </p>
        </div>
      </div>
    </div>
  );
}
