import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

// Centered, minimal card — the spec explicitly rejected a split-screen brand
// panel for Login/Set-password, so this is the only shell those screens get.
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="bg-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      {/* Static ambient glow — keeps the plain-background rule from the spec
          (no illustration panel) while breaking up the flat fill. */}
      <div
        aria-hidden
        className="bg-accent absolute -top-40 -left-32 -z-10 size-96 rounded-full opacity-20 blur-3xl"
      />
      <div
        aria-hidden
        className="bg-citation-fg absolute -right-32 -bottom-40 -z-10 size-96 rounded-full opacity-15 blur-3xl"
      />
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="bg-accent-soft font-display text-accent mb-4 flex size-11 items-center justify-center rounded-md text-lg font-semibold">
            K
          </span>
          <h1 className="font-display text-ink text-2xl font-semibold">
            {title}
          </h1>
          {subtitle && (
            <p className="text-ink-muted mt-1 text-sm">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="border-border bg-surface rounded-lg border p-6 shadow-sm">
            {children}
          </div>
        )}
        {footer && (
          <div className="text-ink-muted mt-4 text-center text-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
