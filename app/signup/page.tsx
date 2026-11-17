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
  TrendingUp,
  Loader2,
  ArrowRight,
  MailCheck,
  Mail,
  Smartphone,
  KeyRound,
  AlertCircle,
  RotateCw,
  ExternalLink,
} from "lucide-react";

export default function SignupPage() {
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone form state
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  const router = useRouter();
  const supabase = createClient();

  // Handle Email Signup
  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Try zero-email admin signup route (creates user with email_confirm: true and sends ZERO emails)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const resData = await res.json();

      if (res.ok && resData.success) {
        // User created and auto-confirmed with zero emails sent! Now sign in directly
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          setError(signInErr.message);
          setLoading(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }
    } catch (_) { }

    // 2. Fallback to standard Supabase sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If already confirmed, log in immediately
    if (data?.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // Try signing in immediately in case auto-confirmation is active
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  // Handle Resend Email
  async function handleResendEmail() {
    setResending(true);
    setResendStatus("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setResending(false);
    if (error) {
      setResendStatus(`Failed to resend: ${error.message}`);
    } else {
      setResendStatus("New confirmation email dispatched. Check your inbox and spam folder.");
    }
  }

  // Handle Send Mobile OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const cleanNumber = phone.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");

    const fullPhone = `${countryCode}${cleanNumber}`;
    const { error } = await supabase.auth.signInWithOtp({
      phone: fullPhone,
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("provider") ||
        error.message.toLowerCase().includes("not configured")
      ) {
        setError(
          "Supabase SMS Gateway (Twilio) is not configured in your Supabase project. To use Mobile OTP, add an SMS provider under Supabase Dashboard > Authentication > Providers > Phone. In the meantime, use Email signup!"
        );
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    setOtpSent(true);
    setLoading(false);
  }

  // Handle Verify Mobile OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim().length < 6) {
      setError("Please enter the complete 6-digit OTP code");
      return;
    }
    setLoading(true);
    setError("");

    const cleanNumber = phone.replace(/\D/g, "");
    const fullPhone = `${countryCode}${cleanNumber}`;

    const { data, error } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: otp.trim(),
      type: "sms",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
  }

  // SUCCESS / EMAIL CONFIRMATION SCREEN
  if (success) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[#f8f9fd] px-4 text-[#333333] transition-colors duration-200 dark:bg-[#080e0a] dark:text-[#f5f7fa]">
        <div className="absolute top-5 right-5 z-20">
          <ThemeToggle />
        </div>

        <Card className="animate-fade-in-up w-full max-w-md p-7 text-center border-[#E5E6F9] bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#11141d]">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E5E6F9] text-[#175624] dark:bg-[#dfb962]/15 dark:text-[#dfb962]">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="mb-1 text-lg font-bold text-[#175624] dark:text-white">
            Account Created Successfully
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            A confirmation email was dispatched to <strong className="text-[#333333] dark:text-white">{email}</strong>.
          </p>

          {/* Quick Resend */}
          <div className="mb-5 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={resending}
              className="w-full text-xs border-[#E5E6F9] text-[#175624] hover:bg-[#E5E6F9]/50 dark:border-white/10 dark:text-[#dfb962] dark:hover:bg-white/[0.06]"
            >
              {resending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Resend Confirmation Email
            </Button>
            {resendStatus && (
              <p className="text-[11px] font-medium text-[#175624] dark:text-[#34d399]">
                {resendStatus}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/login">
              <Button className="w-full font-semibold bg-[#175624] text-white hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]">
                Proceed to Sign In
              </Button>
            </Link>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              Use a different email or phone
            </button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f8f9fd] px-4 py-12 text-[#333333] transition-colors duration-200 dark:bg-[#080e0a] dark:text-[#f5f7fa]">
      {/* Theme Toggle in top corner */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <Card className="animate-fade-in-up relative z-10 w-full max-w-sm p-7 border-[#E5E6F9] bg-white shadow-xl transition-all duration-300 dark:border-white/[0.08] dark:bg-[#11141d]">
        {/* Logo */}
        <div className="mb-5 flex flex-col items-center text-center">
          <Link
            href="/"
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#175624] text-[#A4873E] shadow-xs transition-transform duration-200 hover:scale-105 dark:bg-[#162419] dark:text-[#dfb962] dark:border dark:border-[#dfb962]/30"
          >
            <TrendingUp className="h-5 w-5 stroke-[2.5]" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-[#175624] dark:text-white">
            Create your account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose your preferred sign-up method
          </p>
        </div>

        {/* Auth Method Switcher (Email vs Mobile OTP) */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-[#E5E6F9] bg-[#E5E6F9]/50 p-1 text-xs font-semibold dark:border-white/[0.08] dark:bg-white/[0.04]">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("email");
              setError("");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              authMethod === "email"
                ? "bg-white text-[#175624] shadow-2xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                : "text-[#333333]/70 hover:text-[#333333] dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("phone");
              setError("");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              authMethod === "phone"
                ? "bg-white text-[#175624] shadow-2xs dark:bg-[#dfb962] dark:text-[#080e0a]"
                : "text-[#333333]/70 hover:text-[#333333] dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile OTP</span>
          </button>
        </div>

        {/* METHOD 1: EMAIL & PASSWORD */}
        {authMethod === "email" && (
          <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email" className="text-xs font-semibold text-[#333333] dark:text-slate-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 border-[#E5E6F9] dark:border-white/10"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-semibold text-[#333333] dark:text-slate-300">
                Password (min 6 characters)
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="mt-1 border-[#E5E6F9] dark:border-white/10"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 font-semibold bg-[#175624] text-white hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]"
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
        )}

        {/* METHOD 2: MOBILE PHONE OTP */}
        {authMethod === "phone" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold text-[#333333] dark:text-slate-300">
                    Mobile Phone Number
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="rounded-lg border border-[#E5E6F9] bg-white px-2.5 text-xs font-medium text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#A4873E] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:focus:ring-[#dfb962]"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="flex-1 border-[#E5E6F9] dark:border-white/10"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    A 6-digit verification code will be sent to your mobile phone.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 font-semibold bg-[#175624] text-white hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending OTP SMS...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4" />
                      <span>Send OTP Code</span>
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp" className="text-xs font-semibold text-[#333333] dark:text-slate-300">
                      Enter 6-Digit OTP
                    </Label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-[#175624] hover:underline dark:text-[#dfb962]"
                    >
                      Change number
                    </button>
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="mt-1 text-center font-mono text-lg tracking-widest border-[#E5E6F9] dark:border-white/10"
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Sent to {countryCode} {phone}
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 font-semibold bg-[#175624] text-white hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="h-4 w-4" />
                      <span>Verify & Continue</span>
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>
        )}

        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#175624] hover:underline dark:text-[#dfb962]"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
