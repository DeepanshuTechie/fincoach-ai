"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-400/30 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-amber-300/30 blur-3xl"
        />
      </div>

      <motion.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-sm font-medium text-emerald-700"
      >
        FinCoach AI
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative mt-6 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl"
      >
        Understand your money.
        <br />
        <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
          Ask it anything.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative mt-6 max-w-md text-slate-600"
      >
        Upload your bank statement. Get instant categorization, spending
        insights, and an AI that answers questions about your own finances.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative mt-8 flex gap-3"
      >
        <Button
          size="lg"
          className="bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-105 hover:bg-emerald-700"
        >
          Get Started
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-slate-300 transition-transform hover:scale-105"
        >
          Learn More
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative mt-12 w-full max-w-md"
      >
        <Card className="border-slate-200 bg-white/70 p-6 text-left text-sm text-slate-500 backdrop-blur">
          📊 Dashboard preview will go here (Week 4)
        </Card>
      </motion.div>
    </main>
  );
}