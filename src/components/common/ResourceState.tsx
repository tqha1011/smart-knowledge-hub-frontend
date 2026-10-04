import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "./Button";

export function LoadError({
  message,
  onRetry,
  isLoading = false,
}: {
  message: string;
  onRetry: () => void;
  isLoading?: boolean;
}) {
  return (
    <div
      role="alert"
      className="bg-warn-bg text-warn-fg flex flex-wrap items-center justify-between gap-3 rounded-sm px-4 py-3 text-sm"
    >
      <span className="min-w-0 break-words">{message}</span>
      <Button
        onClick={onRetry}
        disabled={isLoading}
        className="border-warn-fg/30 flex shrink-0 items-center gap-2 rounded-sm border px-3 py-2 font-semibold"
      >
        <RotateCw size={14} aria-hidden="true" /> Retry
      </Button>
    </div>
  );
}

export function Skeleton({
  kind = "table",
}: {
  kind?: "table" | "cards" | "detail";
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={
        kind === "cards"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "border-border space-y-4 rounded-lg border p-4"
      }
    >
      <span className="sr-only">Loading…</span>
      {Array.from({ length: kind === "detail" ? 4 : 6 }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={
            kind === "cards"
              ? "border-border bg-surface space-y-4 rounded-lg border p-5"
              : "flex items-center gap-4 py-2"
          }
        >
          <span className="skeleton-block block h-8 w-8 shrink-0 rounded-sm" />
          <div className="w-full space-y-2">
            <span className="skeleton-block block h-3 w-3/4 rounded-sm" />
            <span className="skeleton-block block h-3 w-1/2 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResourceState({
  isLoading,
  hasData,
  error,
  onRetry,
  kind,
  children,
}: {
  isLoading: boolean;
  hasData: boolean;
  error: string | null;
  onRetry: () => void;
  kind?: "table" | "cards" | "detail";
  children: ReactNode;
}) {
  return (
    <div aria-busy={isLoading} className="space-y-3">
      {error && (
        <LoadError message={error} onRetry={onRetry} isLoading={isLoading} />
      )}
      {hasData ? (
        <>
          {isLoading && (
            <p role="status" className="text-ink-muted text-xs">
              Updating…
            </p>
          )}
          {children}
        </>
      ) : isLoading ? (
        <Skeleton kind={kind} />
      ) : null}
    </div>
  );
}
