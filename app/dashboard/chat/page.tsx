"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardNav } from "@/components/dashboard-nav";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  User,
  Bot,
  Loader2,
  HelpCircle,
} from "lucide-react";

type Message = { role: "user" | "model"; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    "How much did I spend on Food & Dining this month?",
    "What is my highest single expense recorded?",
    "Are any of my categories exceeding budget limits?",
    "List all recurring subscriptions detected.",
  ];

  async function handleSend(textToSend?: string) {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMessage: Message = { role: "user", text: query };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, history: messages }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: "Sorry, I couldn't process that query. Please make sure statement transactions are uploaded and try again.",
          },
        ]);
      }
    } catch {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "An error occurred while connecting to FinCoach AI.",
        },
      ]);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fd] text-[#333333] transition-colors duration-200 dark:bg-[#080e0a] dark:text-[#f5f7fa] flex flex-col">
      <DashboardNav />

      <main className="mx-auto flex-1 flex w-full max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#175624] hover:text-[#12441d] dark:text-[#dfb962] dark:hover:text-[#f0cf7e] transition mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5E6F9] text-[#175624] dark:bg-[#dfb962]/15 dark:text-[#dfb962]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#175624] dark:text-white">
                Financial Advisor Console
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Direct natural-language queries grounded exclusively in your personal transaction ledger
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Prompts */}
        {messages.length === 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              <HelpCircle className="h-3.5 w-3.5 text-[#175624] dark:text-[#dfb962]" />
              <span>Suggested query starters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="rounded-lg border border-[#E5E6F9] bg-white px-3 py-1.5 text-xs font-medium text-[#333333] shadow-2xs transition hover:border-[#A4873E]/40 hover:bg-[#E5E6F9]/30 dark:border-white/[0.08] dark:bg-[#11141d] dark:text-slate-300 dark:hover:border-[#dfb962]/40 dark:hover:text-white"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Window Card */}
        <Card className="flex flex-1 flex-col p-4 sm:p-6 border-[#E5E6F9] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#11141d] min-h-[460px]">
          {/* Messages Area */}
          <div className="mb-4 flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="h-10 w-10 rounded-xl bg-[#E5E6F9] flex items-center justify-center mb-3 text-[#175624] dark:bg-white/[0.06] dark:text-[#dfb962]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[#333333] dark:text-slate-200 text-sm">
                  How can FinCoach assist your review today?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Ask about specific transactions, category percentages, month-over-month shifts, or budget balances.
                </p>
              </div>
            ) : (
              messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isUser
                          ? "bg-[#175624] text-white dark:bg-[#dfb962] dark:text-[#080e0a]"
                          : "bg-[#E5E6F9] text-[#175624] dark:bg-white/[0.08] dark:text-[#dfb962]"
                      }`}
                    >
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? "bg-[#175624] text-white rounded-tr-xs dark:bg-[#dfb962] dark:text-[#080e0a] dark:font-semibold"
                          : "bg-[#f8f9fd] text-[#333333] border border-[#E5E6F9] rounded-tl-xs dark:bg-white/[0.04] dark:border dark:border-white/[0.08] dark:text-slate-100"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E5E6F9] text-[#175624] dark:bg-white/[0.08] dark:text-[#dfb962]">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-[#f8f9fd] border border-[#E5E6F9] px-3.5 py-2 text-xs text-[#333333] flex items-center gap-2 dark:bg-white/[0.04] dark:border dark:border-white/[0.08] dark:text-slate-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A4873E] dark:text-[#dfb962]" />
                  <span>Synthesizing transaction history...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Dock */}
          <div className="flex items-center gap-2 border-t border-[#E5E6F9] dark:border-white/[0.06] pt-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Inquire about spending trends, merchants, or budget variances..."
              className="text-xs sm:text-sm border-[#E5E6F9] dark:border-white/10"
            />
            <Button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="gap-1.5 px-4 text-xs font-medium bg-[#175624] text-white hover:bg-[#12441d] dark:bg-[#dfb962] dark:text-[#080e0a] dark:hover:bg-[#eac36e]"
            >
              <span>Submit</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
