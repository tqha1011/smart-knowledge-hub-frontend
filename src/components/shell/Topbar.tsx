import { Menu, Search, X } from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";
import { UserMenu } from "./UserMenu";
import type { CurrentUser } from "../../types";

interface TopbarProps {
  currentUser: CurrentUser;
  spaceName: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: (query: string) => void;
  onOpenMobileNav: () => void;
}

// Topbar: current Space, document search, theme toggle, avatar — plus a hamburger that only shows
// below the sm (640px) breakpoint, once the icon rail itself has hidden.
export function Topbar({
  currentUser,
  spaceName,
  searchValue,
  onSearchChange,
  onSearch,
  onOpenMobileNav,
}: TopbarProps) {
  return (
    <header className="border-border bg-surface flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="text-ink-muted hover:bg-surface-sunken flex size-9 shrink-0 items-center justify-center rounded-md sm:hidden"
      >
        <Menu size={18} />
      </button>

      <p
        title={spaceName}
        className="text-ink min-w-0 flex-1 truncate text-sm font-semibold sm:max-w-40"
      >
        {spaceName}
      </p>

      <form
        role="search"
        aria-label="Search documents in this space"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(searchValue.trim());
        }}
        className="border-border bg-bg order-last flex min-w-0 basis-full items-center rounded-md border sm:order-none sm:flex-1 sm:basis-auto"
      >
        <label htmlFor="document-search" className="sr-only">
          Search documents by name
        </label>
        <input
          id="document-search"
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search documents by name…"
          className="text-ink placeholder:text-ink-muted min-w-0 flex-1 rounded-md bg-transparent px-3 py-2 text-sm [&::-webkit-search-cancel-button]:appearance-none"
        />
        {searchValue && (
          <button
            type="button"
            aria-label="Clear document search"
            onClick={() => onSearch("")}
            className="text-ink-muted hover:text-ink flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          aria-label="Search documents"
          className="text-accent hover:bg-accent-soft flex size-9 shrink-0 items-center justify-center rounded-md"
        >
          <Search size={18} aria-hidden="true" />
        </button>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <UserMenu currentUser={currentUser} />
      </div>
    </header>
  );
}
