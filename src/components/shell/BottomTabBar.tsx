import { Menu } from "lucide-react";
import {
  ADMIN_NAV_ITEM,
  ASSISTANT_NAV_ICON,
  ASSISTANT_NAV_LABEL,
  KNOWLEDGE_NAV_ITEMS,
} from "./navItems";
import type { ShellNavKey } from "./navItems";

interface BottomTabBarProps {
  activeNavKey: ShellNavKey;
  onNavigate: (key: ShellNavKey) => void;
  isAdmin: boolean;
  isAskAiOpen: boolean;
  onToggleAskAi: () => void;
  onOpenMobileNav: () => void;
}

function TabButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: (typeof KNOWLEDGE_NAV_ITEMS)[number]["icon"];
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] ${
        isActive ? "text-accent" : "text-ink-muted"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// Fixed bottom tab bar (60px), mobile only (< sm / 640px): Documents,
// Ask AI, Admin (role-dependent), Menu — the same primary destinations
// as the rail/sidebar, condensed for thumb reach.
export function BottomTabBar({
  activeNavKey,
  onNavigate,
  isAdmin,
  isAskAiOpen,
  onToggleAskAi,
  onOpenMobileNav,
}: BottomTabBarProps) {
  const documentsItem = KNOWLEDGE_NAV_ITEMS[0];

  return (
    <nav className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 flex h-15 items-stretch border-t sm:hidden">
      <TabButton
        icon={documentsItem.icon}
        label={documentsItem.label}
        isActive={activeNavKey === documentsItem.key}
        onClick={() => onNavigate(documentsItem.key)}
      />
      <TabButton
        icon={ASSISTANT_NAV_ICON}
        label={ASSISTANT_NAV_LABEL}
        isActive={isAskAiOpen}
        onClick={onToggleAskAi}
      />
      {isAdmin && (
        <TabButton
          icon={ADMIN_NAV_ITEM.icon}
          label="Admin"
          isActive={activeNavKey === ADMIN_NAV_ITEM.key}
          onClick={() => onNavigate(ADMIN_NAV_ITEM.key)}
        />
      )}
      <TabButton
        icon={Menu}
        label="Menu"
        isActive={false}
        onClick={onOpenMobileNav}
      />
    </nav>
  );
}
