"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import {
  Loader2,
  ArrowRight,
  Mail,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { Visual3DShield } from "@/components/ui/fintech-3d-visuals";

function BackArrowIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const supabase = createClient();

  // Handle Google OAuth Sign Up
  async function handleGoogleSignUp() {
    setLoading(true);
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch {
      setError("Failed to initialize Google authentication.");
      setLoading(false);
    }
  }

  // Handle Email & Password Signup
  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create account via Supabase auth
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      // 2. Immediately sign in now that Confirm Email is disabled
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInErr) {
        router.replace("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main className="auth-page-main relative flex min-h-screen items-center justify-center bg-[#f8f9fd] px-4 py-12 text-[#333333] transition-colors duration-200 dark:bg-black dark:text-[#f5f7fa] overflow-hidden">
      {/* SEAMLESS FINANCE DOODLE PATTERN BACKGROUND */}
      {/* Light Mode: Green financial doodle line-art figures */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30 dark:hidden transition-opacity duration-300"
        style={{
          backgroundImage: "url('/finance-doodle-green.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "clamp(280px, 35vw, 440px) auto",
        }}
        aria-hidden="true"
      />

      {/* Dark Mode: Pure WHITE financial doodle line-art figures on solid black */}
      <div
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block dark:opacity-25 transition-opacity duration-300"
        style={{
          backgroundImage: "url('/finance-doodle-white.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "clamp(280px, 35vw, 440px) auto",
        }}
        aria-hidden="true"
      />

      {/* Subtle ambient luxury emerald glow centered behind card (Light mode only) */}
      <div className="auth-emerald-glow pointer-events-none absolute h-96 w-96 rounded-full bg-[#175624]/10 blur-3xl z-0 dark:hidden" />

      {/* Back to Home navigation */}
      <div className="absolute top-5 left-5 z-20">
        <Link
          href="/"
          className="group flex items-center gap-1.5 rounded-full border border-[#E5E6F9] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#333333] backdrop-blur-xs transition-all duration-200 hover:border-[#175624]/40 hover:text-[#175624] hover:shadow-xs dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:text-[#dfb962]"
        >
          <BackArrowIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Home</span>
        </Link>
      </div>

      {/* Theme Toggle in top corner */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <Card className="auth-page-card animate-fade-in-up relative z-10 w-full max-w-sm p-6 sm:p-7 border border-[#E5E6F9] bg-white/95 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-[#175624]/40 hover:shadow-[0_12px_40px_rgba(23,86,36,0.12)] dark:border-white/10 dark:bg-[#0d0d0d]/95 dark:shadow-[0_16px_50px_rgba(0,0,0,0.8)] dark:hover:border-white/20">
        {/* Logo Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="mb-2 inline-block transition-transform duration-200 hover:scale-105">
            <Visual3DShield className="h-14 w-14" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-[#175624] dark:text-white">
            Create your account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Get started with autonomous financial intelligence
          </p>
        </div>

        {/* GOOGLE SIGN UP BUTTON */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-[#E5E6F9] bg-white py-2.5 px-4 text-xs font-bold text-[#333333] transition-all hover:bg-slate-50 hover:border-[#A4873E]/50 shadow-xs dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08] cursor-pointer disabled:opacity-60 mb-5"
        >
          <GoogleIcon className="h-4 w-4 shrink-0" />
          <span>Sign up with Google</span>
        </button>

        {/* DIVIDER */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-full border-t border-[#E5E6F9] dark:border-white/[0.08]" />
          <span className="absolute bg-white px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:bg-[#11141d]">
            or register with email
          </span>
        </div>

        {/* EMAIL & PASSWORD SIGNUP FORM */}
        <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email" className="text-xs font-semibold text-[#333333] dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#175624] dark:text-[#dfb962]" />
              <span>Email Address</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 border-[#E5E6F9] dark:border-white/10 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-xs font-semibold text-[#333333] dark:text-slate-300 flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-[#175624] dark:text-[#dfb962]" />
              <span>Password (min 6 characters)</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="mt-1.5 border-[#E5E6F9] dark:border-white/10 text-xs"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 font-semibold bg-[#175624] text-white hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e] shadow-xs cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{" "}
          <Link
            href="/login"
            replace
            className="font-bold text-[#175624] hover:underline dark:text-[#dfb962]"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
