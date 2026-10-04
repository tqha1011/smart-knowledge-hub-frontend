import type { MotionProps, Transition } from "framer-motion";

export const indicatorTransition = (reduced: boolean | null): Transition =>
  reduced ? { duration: 0 } : { type: "spring", duration: 0.2, bounce: 0 };

export const pressMotion = (reduced: boolean | null): MotionProps => ({
  whileTap: reduced ? undefined : { scale: 0.98 },
  transition: { duration: reduced ? 0 : 0.12 },
});

export const fadeMotion = (
  reduced: boolean | null,
  duration = 0.14,
): MotionProps => ({
  initial: { opacity: reduced ? 1 : 0 },
  animate: { opacity: 1 },
  exit: { opacity: reduced ? 1 : 0 },
  transition: { duration: reduced ? 0 : duration },
});

export const backdropMotion = (reduced: boolean | null): MotionProps =>
  fadeMotion(reduced, 0.12);

export const panelMotion = (
  reduced: boolean | null,
  side: "left" | "right" = "right",
): MotionProps => ({
  initial: { x: reduced ? 0 : side === "right" ? "100%" : "-100%" },
  animate: {
    x: 0,
    transition: reduced
      ? { duration: 0 }
      : { type: "spring", duration: 0.28, bounce: 0 },
  },
  exit: {
    x: reduced ? 0 : side === "right" ? "100%" : "-100%",
    transition: { type: "tween", duration: reduced ? 0 : 0.18, ease: "easeIn" },
  },
});

export const popupMotion = (reduced: boolean | null): MotionProps => ({
  initial: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 },
  transition: { duration: reduced ? 0 : 0.14, ease: "easeOut" },
});
