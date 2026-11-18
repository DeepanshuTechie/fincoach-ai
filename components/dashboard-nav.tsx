"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  WalletCards,
  RefreshCw,
  MessageSquare,
  UploadCloud,
  LogOut,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./theme-toggle";

interface DashboardNavProps {
  userEmail?: string;
}

export function DashboardNav({ userEmail }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 15);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/budgets",
      label: "Budgets",
      icon: WalletCards,
      active: pathname === "/dashboard/budgets",
    },
    {
      href: "/dashboard/subscriptions",
      label: "Recurring",
      icon: RefreshCw,
      active: pathname === "/dashboard/subscriptions",
    },
    {
      href: "/dashboard/coach",
      label: "AI Coach",
      icon: Sparkles,
      active: pathname === "/dashboard/coach",
      badge: "LIVE",
    },
    {
      href: "/dashboard/chat",
      label: "AI Advisor",
      icon: MessageSquare,
      active: pathname === "/dashboard/chat",
    },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayEmail = userEmail || "Account";
  const userInitial = displayEmail.charAt(0).toUpperCase();

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-[#E5E6F9]/80 bg-white/80 shadow-[0_4px_25px_-5px_rgba(23,86,36,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#080e0a]/80 dark:shadow-[0_4px_25px_-5px_rgba(0,0,0,0.6)]"
          : "border-b border-[#E5E6F9]/80 bg-white/90 backdrop-blur-md dark:border-white/[0.06] dark:bg-[#080e0a]/90"
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
          isScrolled ? "h-14" : "h-16"
        }`}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-7">
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#175624] to-[#0c3114] text-[#dfb962] shadow-xs ring-1 ring-[#175624]/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md dark:from-[#dfb962] dark:to-[#b8953d] dark:text-[#080e0a]">
              <TrendingUp className="h-4.5 w-4.5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-[#175624] dark:text-white leading-none">
                FinCoach <span className="text-[#A4873E] dark:text-[#dfb962]">AI</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-[#A4873E] dark:text-[#dfb962]/80 mt-0.5">
                Wealth OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    item.active
                      ? "bg-[#175624] text-white shadow-xs dark:bg-[#dfb962] dark:text-[#080e0a] font-bold scale-[1.02]"
                      : "text-[#333333] hover:bg-[#E5E6F9]/60 hover:text-[#175624] dark:text-[#9ca3af] dark:hover:bg-white/[0.05] dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      item.active
                        ? "text-white dark:text-[#080e0a]"
                        : "text-[#666666] dark:text-[#9ca3af]"
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-[#dfb962] px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider text-[#080e0a] shadow-xs animate-pulse dark:bg-[#080e0a] dark:text-[#dfb962]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Upload Button, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#175624] to-[#14471f] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:from-[#dfb962] dark:to-[#c8a249] dark:text-[#080e0a]"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Upload Statement</span>
            <span className="sm:hidden">Upload</span>
          </Link>

          {/* Dark / Light Mode Switcher */}
          <ThemeToggle />

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#e2e4f0] dark:border-white/[0.08]">
            <div className="flex items-center gap-2 rounded-xl border border-[#E5E6F9] bg-[#f8f9fd] py-1 px-2.5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#175624] text-[10px] font-black text-[#dfb962] ring-1 ring-[#A4873E]/30 dark:bg-[#dfb962] dark:text-[#080e0a]">
                {userInitial}
              </div>
              <span className="hidden text-xs font-bold text-[#175624] dark:text-[#dfb962] xl:inline max-w-[130px] truncate">
                {displayEmail.split("@")[0]}
              </span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Scrollbar */}
      <div className="flex overflow-x-auto border-t border-[#E5E6F9] bg-white px-4 py-2 gap-1 md:hidden dark:border-white/[0.06] dark:bg-[#080e0a]">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                item.active
                  ? "bg-[#E5E6F9] text-[#175624] font-bold dark:bg-[#17241b] dark:text-[#dfb962]"
                  : "text-[#333333] dark:text-[#9ca3af]"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
