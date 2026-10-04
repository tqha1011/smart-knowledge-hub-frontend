import { useEffect, useRef, useState } from "react";
import { ChevronDown, KeyRound } from "lucide-react";
import { ChangePasswordModal } from "./ChangePasswordModal";
import type { CurrentUser } from "../../types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { popupMotion } from "../../shared/motion";

interface UserMenuProps {
  currentUser: CurrentUser;
}

// Avatar chip + small dropdown (click-outside/Escape to close) — a plain
// local listener rather than usePanelDismiss, since a dropdown menu doesn't
// need that hook's focus trap.
export function UserMenu({ currentUser }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${currentUser.name} account menu`}
        className="hover:bg-surface-sunken flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-1"
      >
        <span
          title={currentUser.name}
          className="bg-avatar-bg text-avatar-fg flex size-9 items-center justify-center rounded-full font-sans text-xs font-semibold"
        >
          {currentUser.avatarInitials}
        </span>
        <ChevronDown size={14} className="text-ink-muted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...popupMotion(reduced)}
            role="menu"
            aria-label="Account menu"
            className="border-border bg-surface absolute top-full right-0 z-30 mt-2 w-56 rounded-md border py-1 shadow-lg"
          >
            <div className="border-border mb-1 border-b px-3 py-2">
              <p className="text-ink text-sm font-medium">{currentUser.name}</p>
              <p className="text-ink-muted truncate text-xs">
                {currentUser.email}
              </p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
                setIsChangePasswordOpen(true);
              }}
              className="text-ink hover:bg-surface-sunken flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
            >
              <KeyRound size={15} />
              Change password
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChangePasswordOpen && (
          <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
