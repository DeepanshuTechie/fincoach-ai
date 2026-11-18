import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "FinCoach — Personal Wealth & Spending Intelligence",
  description: "Bank-grade transaction categorization, automated budget envelopes, and AI financial analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 text-slate-900 transition-colors duration-200 antialiased selection:bg-emerald-500/20 selection:text-emerald-900 dark:bg-[#090b10] dark:text-slate-100 dark:selection:bg-emerald-500/30 dark:selection:text-emerald-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
