import {
  ADMIN_NAV_ITEM,
  ASSISTANT_NAV_ICON,
  ASSISTANT_NAV_LABEL,
  KNOWLEDGE_NAV_ITEMS,
} from "./navItems";
import type { ShellNavKey } from "./navItems";
import { SpaceSwitcher } from "./SpaceSwitcher";
import type { CurrentUser, Space } from "../../types";

interface SidebarProps {
  currentUser: CurrentUser;
  selectedSpace: Space;
  onSelectSpace: (space: Space) => void;
  activeNavKey: ShellNavKey;
  onNavigate: (key: ShellNavKey) => void;
  needsAttentionCount: number;
  isAskAiOpen: boolean;
  onToggleAskAi: () => void;
  /** Drops the sticky/width styling meant for the desktop column so this
   *  same content can be reused verbatim inside the mobile nav drawer. */
  variant?: "desktop" | "drawer";
}

function NavRow({
  icon: Icon,
  label,
  isActive,
  onClick,
  trailing,
}: {
  icon: (typeof KNOWLEDGE_NAV_ITEMS)[number]["icon"];
  label: string;
  isActive: boolean;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${
        isActive
          ? "bg-accent-soft text-accent font-semibold"
          : "text-ink hover:bg-surface-sunken"
      }`}
    >
      <Icon size={16} className={isActive ? "text-accent" : "text-ink-muted"} />
      <span className="flex-1 truncate text-left">{label}</span>
      {trailing}
    </button>
  );
}

// Expandable labeled sidebar (~200px). Shows the full Admin nav (the spec is
// designed against the Admin view); Employee/Editor get the same structure
// minus the Admin-only section, gated on the global `isAdmin` flag rather
// than any single Space's role since "manage users" is a global action.
export function Sidebar({
  currentUser,
  selectedSpace,
  onSelectSpace,
  activeNavKey,
  onNavigate,
  needsAttentionCount,
  isAskAiOpen,
  onToggleAskAi,
  variant = "desktop",
}: SidebarProps) {
  return (
    <div
      className={
        variant === "desktop"
          ? "border-border bg-surface shell:flex hidden w-52 shrink-0 flex-col gap-1 border-r px-3 py-4"
          : "flex w-full flex-col gap-1"
      }
    >
      {/* Space switcher — memberships assembled from the real Space list, GET /users/me only supplies identity fields */}
      <div className="mb-4">
        <SpaceSwitcher
          memberships={currentUser.memberships}
          selectedSpace={selectedSpace}
          onSelectSpace={onSelectSpace}
        />
      </div>

      {/* "Knowledge" eyebrow — Documents, Needs attention (badge = mock knowledge-gap count) */}
      <p className="text-ink-muted mb-1 px-2.5 font-mono text-[11px] tracking-wide uppercase">
        Knowledge
      </p>
      {KNOWLEDGE_NAV_ITEMS.map(({ key, label, icon }) => (
        <NavRow
          key={key}
          icon={icon}
          label={label}
          isActive={activeNavKey === key}
          onClick={() => onNavigate(key)}
          trailing={
            key === "needs-attention" && needsAttentionCount > 0 ? (
              <span className="bg-warn-bg text-warn-fg rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium">
                {needsAttentionCount}
              </span>
            ) : undefined
          }
        />
      ))}

      {/* "Assistant" eyebrow — Ask AI opens the floating panel, it never navigates */}
      <p className="text-ink-muted mt-4 mb-1 px-2.5 font-mono text-[11px] tracking-wide uppercase">
        Assistant
      </p>
      <button
        type="button"
        onClick={onToggleAskAi}
        aria-pressed={isAskAiOpen}
        className={`text-accent flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-semibold ${
          isAskAiOpen ? "bg-accent-soft" : "hover:bg-accent-soft"
        }`}
      >
        <ASSISTANT_NAV_ICON size={16} />
        <span className="flex-1 truncate text-left">{ASSISTANT_NAV_LABEL}</span>
        <span
          aria-hidden
          className="bg-accent size-1.5 rounded-full motion-safe:animate-pulse"
        />
      </button>

      {/* "Admin" eyebrow — Admin only, hidden entirely otherwise */}
      {currentUser.isAdmin && (
        <>
          <p className="text-ink-muted mt-4 mb-1 px-2.5 font-mono text-[11px] tracking-wide uppercase">
            Admin
          </p>
          <NavRow
            icon={ADMIN_NAV_ITEM.icon}
            label={ADMIN_NAV_ITEM.label}
            isActive={activeNavKey === ADMIN_NAV_ITEM.key}
            onClick={() => onNavigate(ADMIN_NAV_ITEM.key)}
          />
        </>
      )}
    </div>
  );
}
