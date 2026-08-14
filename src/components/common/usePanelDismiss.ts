import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Escape-to-close + a Tab focus trap + return-focus-on-close for a floating
// slide-over panel. Attach the returned ref to the panel's outer
// (bordered/animated) element — the one that should also carry
// role="dialog" aria-modal="true" aria-label="...".
//
// `isOpen` drives an effect that engages on the false→true transition and
// disengages on true→false (cleanup also always runs on unmount
// regardless of dependency changes, so a component that mounts already
// "open" and later unmounts — rather than toggling isOpen to false first —
// still restores focus correctly).
//
// `onClose` is read through a ref rather than being a dependency, so a new
// function identity on every parent re-render (e.g. an inline arrow
// function passed as a prop) doesn't retrigger the effect and re-steal
// focus to the panel's first focusable element on every keystroke.
//
// `disabled` suspends key handling while a nested dialog is on top (e.g.
// CreateSpacePanel's type modal) so Escape closes the topmost dialog
// rather than this panel underneath it, discarding the user's input. It's
// read through a ref, not a dependency, so toggling it doesn't tear the
// listener down and back up — which would re-run the focus-engage and
// clobber the focus-restore target.
export function usePanelDismiss(
  isOpen: boolean,
  onClose: () => void,
  disabled = false,
): RefObject<HTMLDivElement | null> {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const getFocusable = () =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : [];

    getFocusable()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (disabledRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Containment check before the first/last comparison: clicking a
      // non-interactive spot inside the panel (a heading, a label, empty
      // padding) leaves activeElement as document.body, which matches
      // neither branch below and would let the next Tab escape the trap.
      if (!panel?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Only restore if nothing else has claimed focus meanwhile. On a
      // plain close, the focused element leaves the DOM and the browser
      // falls back to document.body. On a chained handoff (detail panel
      // closes and opens the edit form in the same handler), AnimatePresence
      // keeps the old panel mounted through its exit animation, so this
      // cleanup runs ~220ms AFTER the new panel took focus — restoring then
      // would yank focus to a control now sitting behind the new backdrop.
      if (document.activeElement === document.body) {
        previouslyFocused?.focus();
      }
    };
  }, [isOpen]);

  return panelRef;
}
