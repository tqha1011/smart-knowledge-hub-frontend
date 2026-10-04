import type { ReactNode } from "react";
import { fadeMotion } from "../../shared/motion";
import { motion, useReducedMotion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

// Shared fade for routed page content, driven by App.tsx's
// AnimatePresence — keeps route changes animating consistently in one place.
export function PageTransition({ children }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div {...fadeMotion(prefersReducedMotion)}>{children}</motion.div>
  );
}
