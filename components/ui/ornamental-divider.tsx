"use client";

import React from "react";

interface OrnamentalDividerProps {
  className?: string;
}

/**
 * OrnamentalDivider: Elegant responsive botanical vine & flourish horizontal rule.
 * Symmetrically separates content sections with delicate leaves, curls,
 * and fluid extending lines with terminal dots.
 */
export function OrnamentalDivider({ className = "" }: OrnamentalDividerProps) {
  return (
    <div
      className={`relative w-full max-w-5xl mx-auto flex items-center justify-center px-4 my-6 sm:my-10 select-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Left fluid extending line with outer and inner terminal dots */}
      <div className="flex-1 flex items-center min-w-[24px]">
        {/* Outer terminal dot */}
        <div className="h-2 w-2 rounded-full bg-[#175624] dark:bg-[#34d399] shrink-0" />
        {/* Horizontal rule line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#175624] via-[#175624] to-[#175624] dark:from-[#34d399] dark:via-[#dfb962] dark:to-[#34d399] opacity-80" />
        {/* Inner flourish anchor dot */}
        <div className="h-1.5 w-1.5 rounded-full bg-[#175624] dark:bg-[#34d399] shrink-0 -mr-[1px]" />
      </div>

      {/* Center Symmetrical Botanical Flourish */}
      <svg
        viewBox="0 0 260 52"
        className="w-48 sm:w-64 md:w-72 h-auto shrink-0 mx-2 text-[#175624] dark:text-[#34d399] transition-colors"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <g id="botanical-half">
            {/* Base undulating vine */}
            <path
              d="M 130,32 C 137,38 147,40 156,36 C 166,32 176,29 188,29"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Central spiraling loop */}
            <path
              d="M 143,36 C 140,24 148,13 162,13 C 174,13 182,22 178,32 C 175,39 164,38 162,31 C 160,24 165,19 171,22"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />

            {/* Secondary upper-outer curling vine */}
            <path
              d="M 164,17 C 174,10 186,10 193,15 C 200,21 198,29 191,28 C 185,27 185,20 190,19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Lower decorative tendril */}
            <path
              d="M 156,36 C 161,42 168,44 172,40 C 175,37 173,33 169,34"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Botanical Leaf 1 (Top curl leaf) */}
            <path
              d="M 158,12 C 155,5 161,1 164,1 C 167,5 163,10 158,12 Z"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="currentColor"
              fillOpacity="0.25"
            />

            {/* Botanical Leaf 2 (Upper-outer leaf) */}
            <path
              d="M 190,11 C 197,5 203,8 205,11 C 201,15 194,14 190,11 Z"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="currentColor"
              fillOpacity="0.25"
            />

            {/* Botanical Leaf 3 (Outer branch leaf) */}
            <path
              d="M 199,24 C 206,24 210,29 209,32 C 204,33 200,29 199,24 Z"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="currentColor"
              fillOpacity="0.25"
            />

            {/* Botanical Leaf 4 (Lower base leaf) */}
            <path
              d="M 148,37 C 151,43 157,44 159,42 C 158,38 152,36 148,37 Z"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="currentColor"
              fillOpacity="0.25"
            />
          </g>
        </defs>

        {/* Right Half */}
        <use href="#botanical-half" />

        {/* Left Half (Mirrored for perfect 100% mathematical symmetry) */}
        <use href="#botanical-half" transform="translate(260, 0) scale(-1, 1)" />
      </svg>

      {/* Right fluid extending line with inner and outer terminal dots */}
      <div className="flex-1 flex items-center min-w-[24px]">
        {/* Inner flourish anchor dot */}
        <div className="h-1.5 w-1.5 rounded-full bg-[#175624] dark:bg-[#34d399] shrink-0 -ml-[1px]" />
        {/* Horizontal rule line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#175624] via-[#175624] to-[#175624] dark:from-[#34d399] dark:via-[#dfb962] dark:to-[#34d399] opacity-80" />
        {/* Outer terminal dot */}
        <div className="h-2 w-2 rounded-full bg-[#175624] dark:bg-[#34d399] shrink-0" />
      </div>
    </div>
  );
}
