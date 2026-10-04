import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { popupMotion } from "../../shared/motion";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!isOpen) return;
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    menuRef.current?.addEventListener("keydown", closeEscape);
    const menu = menuRef.current;
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      menu?.removeEventListener("keydown", closeEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Switch space: ${selectedSpace.name}`}
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

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            {...popupMotion(reduced)}
            role="menu"
            aria-label="Spaces"
            className="border-border bg-surface absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-md border py-1 shadow-lg"
          >
            {memberships.map(({ space, role }) => (
              <li key={space.id} role="none">
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    onSelectSpace(space);
                    setIsOpen(false);
                    triggerRef.current?.focus();
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
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
