import { Menu, Search } from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";
import { UserMenu } from "./UserMenu";
import type { CurrentUser } from "../../types";

interface TopbarProps {
  currentUser: CurrentUser;
  onOpenMobileNav: () => void;
}

// Topbar: search, theme toggle, avatar — plus a hamburger that only shows
// below the sm (640px) breakpoint, once the icon rail itself has hidden.
export function Topbar({ currentUser, onOpenMobileNav }: TopbarProps) {
  return (
    <header className="border-border bg-surface flex h-16 shrink-0 items-center gap-3 border-b px-4">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md sm:hidden"
      >
        <Menu size={18} />
      </button>

      {/* MOCK: search does not query anything yet — no search service exists */}
      <label className="relative max-w-md flex-1">
        <Search
          size={15}
          className="text-ink-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        />
        <input
          type="search"
          placeholder="Search documents..."
          className="border-border bg-surface-sunken text-ink placeholder:text-ink-muted focus:border-accent w-full rounded-md border py-2 pr-3 pl-9 text-sm focus:outline-none"
        />
      </label>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <UserMenu currentUser={currentUser} />
      </div>
    </header>
  );
}
