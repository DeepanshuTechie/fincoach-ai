"use client";

import React, { useState, useRef } from "react";
import { Wifi, Sparkles, ShieldCheck } from "lucide-react";

interface WealthCard3DProps {
  cardHolder?: string;
  finScore?: number;
  className?: string;
}

export function WealthCard3D({
  cardHolder = "DIPANSHU SHARMA",
  finScore = 845,
  className = "",
}: WealthCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isFlipped, setIsFlipped] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -14;
    const rotY = ((x - centerX) / centerX) * 16;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.55,
    });
  }

  function handleMouseLeave() {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  }

  return (
    <div
      style={{ perspective: "1000px" }}
      className={`relative w-[340px] h-[215px] sm:w-[410px] sm:h-[250px] shrink-0 select-none ${className}`}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped((prev) => !prev)}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${
            rotateY + (isFlipped ? 180 : 0)
          }deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="group relative cursor-pointer w-full h-full rounded-2xl shadow-2xl transition-shadow duration-300 hover:shadow-[0_25px_60px_-15px_rgba(23,86,36,0.45)]"
      >
        {/* ==============================================================
            FRONT OF THE CARD
           ============================================================== */}
        <div
          style={{ backfaceVisibility: "hidden" }}
          className="absolute inset-0 w-full h-full rounded-2xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden border border-[#A4873E]/50 bg-gradient-to-br from-[#0a1e0f] via-[#14471f] to-[#06140a] text-white shadow-xl"
        >
          {/* Subtle Metallic Grain Pattern */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#dfb962 0.75px, transparent 0.75px), radial-gradient(#175624 0.75px, transparent 0.75px)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 8px 8px",
            }}
          />

          {/* Dynamic Glare Foil Effect */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-200"
            style={{
              opacity: glarePos.opacity,
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(223, 185, 98, 0.5) 0%, rgba(255, 255, 255, 0.2) 30%, transparent 65%)`,
            }}
          />

          {/* Card Top: Brand & Contactless */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#dfb962] flex items-center justify-center text-[#0a1e0f] font-black text-base shadow-sm">
                ₹
              </div>
              <div>
                <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-white via-[#f5eedf] to-[#dfb962] bg-clip-text text-transparent block">
                  FinCoach Obsidian
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#dfb962]/80 font-bold block">
                  Titanium Wealth Tier
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 rotate-90 text-[#dfb962]" />
              <span className="rounded-full border border-[#dfb962]/50 bg-[#dfb962]/15 px-2.5 py-0.5 text-[10px] font-black text-[#dfb962]">
                Score {finScore}
              </span>
            </div>
          </div>

          {/* Card Middle: 3D Gold EMV Microchip */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="relative h-9 w-12 rounded-md border border-[#c29d47] bg-gradient-to-br from-[#dfb962] via-[#e8cb7e] to-[#a4873e] p-1 shadow-md">
              {/* EMV Microchip Contact Lines */}
              <div className="h-full w-full rounded border border-[#8f6d23] grid grid-cols-2 grid-rows-3 gap-0.5 opacity-75">
                <div className="border-b border-r border-[#8f6d23]" />
                <div className="border-b border-[#8f6d23]" />
                <div className="border-b border-r border-[#8f6d23]" />
                <div className="border-b border-[#8f6d23]" />
                <div className="border-r border-[#8f6d23]" />
                <div />
              </div>
            </div>
            <span className="font-mono text-sm sm:text-base tracking-widest text-[#dfb962] font-bold drop-shadow-sm">
              •••• •••• •••• 8450
            </span>
          </div>

          {/* Card Bottom: Cardholder & Expiry */}
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-slate-300/80 block font-semibold">
                Autonomous Member
              </span>
              <span className="font-mono text-xs sm:text-sm font-extrabold tracking-wider text-white">
                {cardHolder}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-slate-300/80 block font-semibold">
                Valid Thru
              </span>
              <span className="font-mono text-xs sm:text-sm font-extrabold tracking-wider text-[#dfb962]">
                12 / 30
              </span>
            </div>
          </div>
        </div>

        {/* ==============================================================
            BACK OF THE CARD (Flipped)
           ============================================================== */}
        <div
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          className="absolute inset-0 w-full h-full rounded-2xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden border border-[#A4873E]/50 bg-gradient-to-br from-[#06140a] via-[#0f2e15] to-[#040c06] text-white shadow-xl"
        >
          {/* Black Magnetic Stripe */}
          <div className="absolute top-6 left-0 w-full h-11 bg-black/90 border-y border-white/10" />

          <div className="pt-14">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>AUTHORIZED SIGNATURE</span>
              <span>SECURITY CODE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-8 bg-white/95 rounded text-slate-900 font-mono italic text-xs px-3 flex items-center tracking-widest font-semibold">
                {cardHolder.toLowerCase()}
              </div>
              <div className="h-8 w-14 bg-[#dfb962] rounded text-[#0a1e0f] font-mono font-black text-sm flex items-center justify-center shadow-xs">
                845
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-tight">
            Encrypted with PostgreSQL Row-Level Security. Verified by FinCoach Autonomous Engine.
            Click anywhere to flip back.
          </div>
        </div>
      </div>
    </div>
  );
}
