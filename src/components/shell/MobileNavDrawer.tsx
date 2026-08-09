import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { ShellNavKey } from "./navItems";
import type { CurrentUser, Space } from "../../types";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  selectedSpace: Space;
  onSelectSpace: (space: Space) => void;
  activeNavKey: ShellNavKey;
  onNavigate: (key: ShellNavKey) => void;
  needsAttentionCount: number;
  isAskAiOpen: boolean;
  onToggleAskAi: () => void;
}

// < 640px replacement for the rail + sidebar: a fixed-position overlay
// drawer with a backdrop, opened from the topbar hamburger or the bottom
// tab bar's "Menu" tab. Reuses Sidebar's content so the nav itself isn't duplicated.
export function MobileNavDrawer({
  isOpen,
  onClose,
  currentUser,
  selectedSpace,
  onSelectSpace,
  activeNavKey,
  onNavigate,
  needsAttentionCount,
  isAskAiOpen,
  onToggleAskAi,
}: MobileNavDrawerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <motion.button
            type="button"
            aria-label="Close navigation menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="bg-ink/40 absolute inset-0 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.22,
              ease: "easeOut",
            }}
            className="bg-surface absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col p-4 shadow-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              {/* Product mark — also doubles as "back to all spaces" */}
              <Link
                to="/spaces"
                onClick={onClose}
                aria-label="All spaces"
                className="bg-accent-soft font-display text-accent flex size-8 items-center justify-center rounded-md text-sm font-semibold"
              >
                K
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="text-ink-muted hover:bg-surface-sunken flex size-9 items-center justify-center rounded-md"
              >
                <X size={18} />
              </button>
            </div>

            <Sidebar
              variant="drawer"
              currentUser={currentUser}
              selectedSpace={selectedSpace}
              onSelectSpace={onSelectSpace}
              activeNavKey={activeNavKey}
              onNavigate={(key) => {
                onNavigate(key);
                onClose();
              }}
              needsAttentionCount={needsAttentionCount}
              isAskAiOpen={isAskAiOpen}
              onToggleAskAi={() => {
                onToggleAskAi();
                onClose();
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
