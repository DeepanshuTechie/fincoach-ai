"use client";

import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-8 w-8 rounded-lg border border-transparent ${className || ""}`} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E6F9] bg-white text-[#333333] transition-all hover:bg-[#E5E6F9]/60 hover:text-[#175624] active:scale-95 dark:border-white/[0.1] dark:bg-[#111a13] dark:text-[#E5E6F9] dark:hover:bg-white/[0.08] dark:hover:text-[#dfb962] ${
        className || ""
      }`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-[#dfb962] transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-[#175624] transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
