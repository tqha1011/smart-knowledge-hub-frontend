import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { pressMotion } from "../../shared/motion";

export function Button({
  className = "",
  type = "button",
  ...props
}: HTMLMotionProps<"button">) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      {...pressMotion(reduced)}
      {...props}
      type={type}
      className={`control-button ${className}`}
    />
  );
}
