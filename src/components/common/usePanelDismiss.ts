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
export function usePanelDismiss(
  isOpen: boolean,
  onClose: () => void,
): RefObject<HTMLDivElement | null> {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  // eslint-disable-next-line react-hooks/refs
  onCloseRef.current = onClose;

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
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return panelRef;
}
