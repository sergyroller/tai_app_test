export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary-dark via-background to-primary/10 px-4">
      <div className="w-full max-w-md animate-fade-in">{children}</div>
    </div>
  );
}
