"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { role: "user" | "model"; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: currentInput, history: messages }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.reply) {
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Sorry, I couldn't process that. Try again." },
      ]);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">
        Ask FinCoach AI
      </h1>
      <Card className="flex flex-1 flex-col p-4">
        <div
          className="mb-4 flex-1 space-y-3 overflow-y-auto"
          style={{ maxHeight: "60vh" }}
        >
          {messages.length === 0 && (
            <p className="text-sm text-slate-400">
              Try asking: &quot;How much did I spend on Food this
              month?&quot; or &quot;What&apos;s my biggest expense?&quot;
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[80%] rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
                  : "mr-auto max-w-[80%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800"
              }
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="mr-auto max-w-[80%] rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-400">
              Thinking...
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about your spending..."
          />
          <Button
            onClick={sendMessage}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Send
          </Button>
        </div>
      </Card>
    </main>
  );
}