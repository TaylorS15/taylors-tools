import { clsx, type ClassValue } from "clsx";
import { Variants } from "motion/react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const containerVariants: Variants = {
  enter: {
    x: "100%",
    transition: {
      type: "tween",
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  center: {
    x: 0,
    transition: {
      type: "tween",
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  exit: {
    x: "-100%",
    transition: {
      type: "tween",
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};
