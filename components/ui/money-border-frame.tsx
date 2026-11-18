"use client";

import React, { useEffect, useState } from "react";
import { MONEY_BORDER_URI } from "./money-border-asset";
import { useTheme } from "@/components/theme-provider";

interface MoneyBorderFrameProps {
  className?: string;
}

/**
 * MoneyBorderFrame:
 * Fully responsive financial money-icon border frame based on user's reference image.
 * Uses crisp transparent money icons (dollar coins, banknote stacks, money bags, cash bills).
 * In night/dark mode, this component is 100% hidden and removed.
 */
export function MoneyBorderFrame({ className = "" }: MoneyBorderFrameProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Strict Night Mode Protection: Completely do NOT render in dark mode
  if (mounted && theme === "dark") {
    return null;
  }

  return (
    <div
      className={`money-border-frame pointer-events-none fixed inset-1.5 sm:inset-4 md:inset-6 z-0 select-none transition-all duration-300 dark:hidden ${className}`}
      style={{
        display: mounted && theme === "dark" ? "none" : undefined,
        borderStyle: "solid",
        borderWidth: "clamp(18px, 2.6vw, 38px)",
        borderColor: "transparent",
        borderImageSource: `url('${MONEY_BORDER_URI}')`,
        borderImageSlice: "34 40 36 32",
        borderImageRepeat: "round",
        filter: "drop-shadow(0 2px 8px rgba(118, 160, 88, 0.25))",
      }}
      aria-hidden="true"
    />
  );
}
