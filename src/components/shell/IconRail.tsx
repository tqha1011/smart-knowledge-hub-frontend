import {
  ADMIN_NAV_ITEM,
  ASSISTANT_NAV_ICON,
  ASSISTANT_NAV_LABEL,
  KNOWLEDGE_NAV_ITEMS,
} from "./navItems";
import type { ShellNavKey } from "./navItems";

interface IconRailProps {
  activeNavKey: ShellNavKey;
  onNavigate: (key: ShellNavKey) => void;
  isAdmin: boolean;
  needsAttentionCount: number;
  isAskAiOpen: boolean;
  onToggleAskAi: () => void;
}

// Persistent 56px icon-only column — stays visible through the tablet
// breakpoint (< shell / 980px) even after the labeled Sidebar hides,
// so core navigation never fully disappears until the mobile bottom tab bar takes over.
export function IconRail({
  activeNavKey,
  onNavigate,
  isAdmin,
  needsAttentionCount,
  isAskAiOpen,
  onToggleAskAi,
}: IconRailProps) {
  return (
    <div className="border-border bg-surface hidden w-14 shrink-0 flex-col items-center gap-1 border-r py-4 sm:flex">
      {/* Product mark */}
      <span className="bg-accent-soft font-display text-accent mb-3 flex size-8 items-center justify-center rounded-md text-sm font-semibold">
        K
      </span>

      {/* Knowledge section icons: Documents, Needs attention */}
      {KNOWLEDGE_NAV_ITEMS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onNavigate(key)}
          aria-label={label}
          aria-current={activeNavKey === key ? "page" : undefined}
          className={`relative flex size-10 items-center justify-center rounded-md ${
            activeNavKey === key
              ? "bg-accent-soft text-accent"
              : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
          }`}
        >
          <Icon size={18} />
          {key === "needs-attention" && needsAttentionCount > 0 && (
            <span className="bg-warn-bg text-warn-fg absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-medium">
              {needsAttentionCount}
            </span>
          )}
        </button>
      ))}

      <div className="bg-border my-1 h-px w-6" />

      {/* Assistant icon: opens the Ask AI panel, never navigates */}
      <button
        type="button"
        onClick={onToggleAskAi}
        aria-label={ASSISTANT_NAV_LABEL}
        aria-pressed={isAskAiOpen}
        className={`text-accent relative flex size-10 items-center justify-center rounded-md ${
          isAskAiOpen ? "bg-accent-soft" : "hover:bg-accent-soft"
        }`}
      >
        <ASSISTANT_NAV_ICON size={18} />
        <span
          aria-hidden
          className="bg-accent absolute top-1.5 right-1.5 size-1.5 rounded-full motion-safe:animate-pulse"
        />
      </button>

      {/* Admin section icon: Users & Roles, Admin only */}
      {isAdmin && (
        <>
          <div className="bg-border my-1 h-px w-6" />
          <button
            type="button"
            onClick={() => onNavigate(ADMIN_NAV_ITEM.key)}
            aria-label={ADMIN_NAV_ITEM.label}
            aria-current={
              activeNavKey === ADMIN_NAV_ITEM.key ? "page" : undefined
            }
            className={`flex size-10 items-center justify-center rounded-md ${
              activeNavKey === ADMIN_NAV_ITEM.key
                ? "bg-accent-soft text-accent"
                : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
            }`}
          >
            <ADMIN_NAV_ITEM.icon size={18} />
          </button>
        </>
      )}
    </div>
  );
}
