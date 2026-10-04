import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useIsPresent } from "framer-motion";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const openPanels: HTMLDivElement[] = [];

// Only the top overlay owns focus and dismissal, including during a
// detail → edit handoff or a nested modal's entrance/exit animation.
export function usePanelDismiss(
  isOpen: boolean,
  onClose: () => void,
  disabled = false,
  fallbackFocus?: () => HTMLElement | null,
): RefObject<HTMLDivElement | null> {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const disabledRef = useRef(disabled);
  const fallbackFocusRef = useRef(fallbackFocus);
  const isPresent = useIsPresent();
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);
  useEffect(() => {
    fallbackFocusRef.current = fallbackFocus;
  }, [fallbackFocus]);

  useEffect(() => {
    if (!isOpen || !isPresent) return;
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          element.getClientRects().length > 0 && !element.closest("[inert]"),
      );
    panel.tabIndex = -1;
    openPanels.push(panel);
    const previousPanel = openPanels.at(-2);
    if (previousPanel) previousPanel.inert = true;
    panel.inert = false;
    (getFocusable()[0] ?? panel).focus();

    function isTop() {
      return openPanels.at(-1) === panel && !disabledRef.current;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (!isTop()) return;
      if (event.key === "Escape") {
        if (
          event.target instanceof Element &&
          event.target.closest('[role="menu"]')
        )
          return;
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      const first = focusable[0] ?? panel;
      const last = focusable.at(-1) ?? panel;
      if (!panel?.contains(document.activeElement)) {
        event.preventDefault();
        first?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    function handleFocus(event: FocusEvent) {
      if (isTop() && !panel?.contains(event.target as Node))
        (getFocusable()[0] ?? panel)?.focus();
    }
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocus);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("focusin", handleFocus);
      const index = openPanels.indexOf(panel);
      if (index !== -1) openPanels.splice(index, 1);
      const nextPanel = openPanels.at(-1);
      if (nextPanel) nextPanel.inert = false;
      if (
        document.activeElement === document.body ||
        panel.contains(document.activeElement)
      ) {
        if (
          previouslyFocused?.isConnected &&
          !previouslyFocused.closest("[inert]")
        )
          previouslyFocused.focus();
        else (nextPanel ?? fallbackFocusRef.current?.())?.focus();
      }
    };
  }, [isOpen, isPresent]);

  useEffect(() => {
    const root = panelRef.current?.closest<HTMLElement>(".fixed");
    if (!root) return;
    root.inert = !isPresent || !isOpen;
    root.style.pointerEvents = isPresent && isOpen ? "" : "none";
  }, [isPresent, isOpen]);

  return panelRef;
}
