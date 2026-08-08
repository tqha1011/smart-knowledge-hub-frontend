import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Space, SpaceMembership } from "../../types";

interface SpaceSwitcherProps {
  memberships: SpaceMembership[];
  selectedSpace: Space;
  onSelectSpace: (space: Space) => void;
}

// Pill button (colored dot + Space name + chevron) at the top of the sidebar.
// A user can belong to multiple Spaces with different roles in each, so
// switching Spaces can also change what nav/actions the rest of the shell shows.
export function SpaceSwitcher({
  memberships,
  selectedSpace,
  onSelectSpace,
}: SpaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="border-border bg-surface text-ink hover:border-accent flex w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-sm font-semibold"
      >
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: selectedSpace.colorDot }}
        />
        <span className="flex-1 truncate">{selectedSpace.name}</span>
        <ChevronDown size={14} className="text-ink-muted shrink-0" />
      </button>

      {isOpen && (
        <>
          {/* Click-outside backdrop, kept invisible on purpose */}
          <button
            type="button"
            aria-label="Close Space switcher"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <ul className="border-border bg-surface absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border py-1 shadow-lg">
            {memberships.map(({ space, role }) => (
              <li key={space.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectSpace(space);
                    setIsOpen(false);
                  }}
                  className="hover:bg-surface-sunken flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                >
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: space.colorDot }}
                  />
                  <span className="text-ink flex-1 truncate">{space.name}</span>
                  <span className="text-ink-muted text-xs">{role}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
