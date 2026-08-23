"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  return (
    <main className="relative flex flex-col items-center overflow-hidden bg-[var(--ink)]">
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 text-center"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--gold)]/10 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[var(--jade)]/10 blur-3xl"
          />
          {[
            { top: "15%", left: "12%", size: 5, duration: 7, color: "#c9a24b" },
            { top: "70%", left: "20%", size: 4, duration: 9, color: "#5fa88f" },
            { top: "25%", left: "80%", size: 5, duration: 8, color: "#c9a24b" },
            { top: "60%", left: "85%", size: 4, duration: 10, color: "#5fa88f" },
            { top: "45%", left: "50%", size: 4, duration: 6.5, color: "#c9a24b" },
            { top: "85%", left: "55%", size: 5, duration: 9.5, color: "#5fa88f" },
            { top: "10%", left: "45%", size: 4, duration: 8.5, color: "#c9a24b" },
            { top: "35%", left: "8%", size: 4, duration: 7.5, color: "#5fa88f" },
          ].map((dot, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -20, 0], opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: dot.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
              className="absolute rounded-full"
              style={{
                top: dot.top,
                left: dot.left,
                width: dot.size,
                height: dot.size,
                backgroundColor: dot.color,
                boxShadow: `0 0 8px 2px ${dot.color}`,
              }}
            />
          ))}
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative flex flex-col items-center"
        >
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-1 text-sm font-medium text-[var(--gold)]"
          >
            FinCoach AI
          </motion.span>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 h-px w-12 bg-[var(--gold)]/40"
          />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ivory)] sm:text-6xl"
          >
            Understand your money.
            <br />
            <span className="text-[var(--gold)]">Ask it anything.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-md text-[var(--slate)]"
          >
            Upload your bank statement. Get instant categorization, spending
            insights, and an AI that answers questions about your own
            finances.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex gap-3"
          >
            <Button
              size="lg"
              className="bg-[var(--gold)] text-[var(--ink)] shadow-lg shadow-[var(--gold)]/20 transition-transform hover:scale-105 hover:bg-[var(--gold)]/90"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="border-[var(--hairline)] bg-transparent text-[var(--ivory)] transition-transform hover:scale-105 hover:bg-[var(--surface)]"
            >
              Learn More
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative w-full border-t border-[var(--hairline)] bg-[#141b34]"
      >
        <div className="mx-auto max-w-5xl px-4 py-24">
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-4 h-px w-10 bg-[#5b7fa6]/50"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-2 text-center text-xs uppercase tracking-widest text-[#5b7fa6]"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 text-center font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ivory)] sm:text-4xl"
          >
            From statement to clarity, in three steps
          </motion.h2>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
            className="mb-14 h-px w-full bg-gradient-to-r from-[#c9a24b] via-[#5fa88f] to-[#5b7fa6]"
          />

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload your statement",
                desc: "Drop in a CSV of your bank statement — no manual entry, no typing every expense by hand.",
                color: "#c9a24b",
              },
              {
                step: "02",
                title: "AI reads every line",
                desc: "Each transaction is automatically sorted into a category, and remembered for next time.",
                color: "#5fa88f",
              },
              {
                step: "03",
                title: "Ask, and understand",
                desc: "See your spending laid out clearly, or just ask FinCoach a question in plain English.",
                color: "#5b7fa6",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.15 + 0.3,
                      type: "spring",
                      stiffness: 300,
                    }}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span
                    className="font-[family-name:var(--font-mono)] text-sm"
                    style={{ color: item.color }}
                  >
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ivory)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--slate)]">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative w-full max-w-5xl border-t border-[var(--hairline)] px-4 py-24">
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-4 h-px w-10 bg-[var(--gold)]/40"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-2 text-center text-xs uppercase tracking-widest text-[var(--slate)]"
        >
          What you get
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-14 text-center font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ivory)] sm:text-4xl"
        >
          Built to actually be used
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[
            {
              title: "Automatic categorization",
              desc: "Every transaction is sorted by AI — and corrections you make are remembered permanently.",
              color: "#c9a24b",
            },
            {
              title: "A dashboard that speaks plainly",
              desc: "Category breakdowns, trends, and a written summary of your month — not just raw numbers.",
              color: "#5fa88f",
            },
            {
              title: "Chat with your own data",
              desc: 'Ask questions like "what did I spend on food last week?" and get answers grounded in your real statement.',
              color: "#5b7fa6",
            },
            {
              title: "Private by design",
              desc: "Row-level security means your data is scoped to your account alone, end to end.",
              color: "#b5495b",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{
                y: -6,
                scale: 1.02,
                borderColor: f.color,
                boxShadow: `0 12px 30px -14px ${f.color}66`,
              }}
              style={{ borderColor: "var(--hairline)" }}
              className="group rounded-lg border bg-[var(--surface)]/60 p-6"
            >
              <span
                className="mb-4 block h-1.5 w-8 rounded-full transition-all duration-300 group-hover:w-14"
                style={{ backgroundColor: f.color }}
              />
              <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--ivory)]">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--slate)]">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FINAL CTA + FOOTER */}
      <section className="relative w-full max-w-5xl border-t border-[var(--hairline)] px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-6 h-px w-10 bg-[var(--gold)]/40"
        />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ivory)] sm:text-4xl"
        >
          Your statement is already telling a story.
          <br />
          <span className="text-[var(--gold)]">Let&apos;s read it together.</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative inline-block"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 -z-10 rounded-full bg-[var(--gold)] blur-2xl"
          />
          <Button
            size="lg"
            className="relative bg-[var(--gold)] text-[var(--ink)] shadow-lg shadow-[var(--gold)]/20 transition-transform hover:scale-105 hover:bg-[var(--gold)]/90"
          >
            Get Started — it&apos;s free
          </Button>
        </motion.div>

        <p className="mt-20 text-xs text-[var(--slate)]">
          FinCoach AI — built as a full-stack + AI portfolio project.
        </p>
      </section>
    </main>
  );
}