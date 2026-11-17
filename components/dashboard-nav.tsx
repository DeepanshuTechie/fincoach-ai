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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

interface DashboardNavProps {
  userEmail?: string;
}

export function DashboardNav({ userEmail }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E6F9] bg-white/90 backdrop-blur-md transition-colors duration-200 dark:border-white/[0.08] dark:bg-[#080e0a]/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-7">
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#175624] text-[#A4873E] shadow-xs transition-transform duration-200 group-hover:scale-105 dark:bg-[#dfb962] dark:text-[#080e0a]">
              <TrendingUp className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#175624] dark:text-white">
                FinCoach <span className="text-[#A4873E] dark:text-[#dfb962]">AI</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#A4873E] dark:text-[#dfb962]/80">
                Wealth OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    item.active
                      ? "bg-[#E5E6F9] text-[#175624] font-bold border border-[#d0d3f2] shadow-2xs dark:bg-[#17241b] dark:text-[#dfb962] dark:border-[#dfb962]/30"
                      : "text-[#333333] hover:bg-[#E5E6F9]/60 hover:text-[#175624] dark:text-[#9ca3af] dark:hover:bg-white/[0.05] dark:hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      item.active
                        ? "text-[#175624] dark:text-[#dfb962]"
                        : "text-[#666666] dark:text-[#9ca3af]"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Upload Button, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/upload"
            className="flex items-center gap-1.5 rounded-lg bg-[#175624] px-3 py-1.5 text-xs font-semibold text-[#E5E6F9] shadow-xs transition-all hover:bg-[#12441d] active:scale-[0.98] dark:bg-[#dfb962] dark:text-[#080e0a] dark:font-bold dark:hover:bg-[#eac36e]"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Upload Statement</span>
            <span className="sm:hidden">Upload</span>
          </Link>

          {/* Dark / Light Mode Switcher */}
          <ThemeToggle />

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#e2e4f0] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5E6F9] text-xs font-bold text-[#175624] ring-1 ring-[#A4873E]/30 dark:bg-[#17241b] dark:text-[#dfb962] dark:ring-[#dfb962]/30">
                {userInitial}
              </div>
              <span className="hidden text-xs font-medium text-[#333333] dark:text-slate-300 xl:inline max-w-[130px] truncate">
                {displayEmail}
              </span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Sign Out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
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
