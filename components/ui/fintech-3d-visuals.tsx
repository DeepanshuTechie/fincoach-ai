import React from "react";

/**
 * 1. 3D Isometric Banking Vault & Document Visual (Used in Upload & Landing)
 */
export function Visual3DVault({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={`relative inline-block select-none ${className}`}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl animate-float-3d"
      >
        <defs>
          <linearGradient id="vaultBase" x1="20" y1="40" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#175624" />
            <stop offset="50%" stopColor="#12441d" />
            <stop offset="100%" stopColor="#0a2610" />
          </linearGradient>
          <linearGradient id="vaultDoor" x1="40" y1="40" x2="160" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f5f7fa" />
            <stop offset="70%" stopColor="#E5E6F9" />
            <stop offset="100%" stopColor="#c5c8e8" />
          </linearGradient>
          <linearGradient id="goldRim" x1="60" y1="60" x2="140" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dfb962" />
            <stop offset="40%" stopColor="#A4873E" />
            <stop offset="100%" stopColor="#7a6228" />
          </linearGradient>
          <linearGradient id="glowG" x1="100" y1="30" x2="100" y2="170" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#175624" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Depth Glow */}
        <circle cx="100" cy="110" r="70" fill="url(#glowG)" opacity="0.3" filter="blur(16px)" />

        {/* Outer Isometric Safe Chassis */}
        <rect x="30" y="35" width="140" height="135" rx="28" fill="url(#vaultBase)" />
        <rect x="32" y="37" width="136" height="131" rx="26" stroke="#A4873E" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Front Chamber Plate */}
        <rect x="42" y="47" width="116" height="111" rx="20" fill="url(#vaultDoor)" />

        {/* Heavy Circular Gear Lock Wheel */}
        <circle cx="100" cy="102" r="38" fill="url(#vaultBase)" stroke="url(#goldRim)" strokeWidth="4" />
        <circle cx="100" cy="102" r="28" fill="url(#goldRim)" />
        <circle cx="100" cy="102" r="16" fill="#175624" />

        {/* 3D Wheel Spokes */}
        <line x1="100" y1="74" x2="100" y2="130" stroke="#f5eedf" strokeWidth="3" strokeLinecap="round" />
        <line x1="72" y1="102" x2="128" y2="102" stroke="#f5eedf" strokeWidth="3" strokeLinecap="round" />
        <line x1="80" y1="82" x2="120" y2="122" stroke="#f5eedf" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="120" y1="82" x2="80" y2="122" stroke="#f5eedf" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center Golden Dial Indicator */}
        <circle cx="100" cy="102" r="7" fill="#ffffff" />
        <circle cx="100" cy="102" r="3" fill="#A4873E" />

        {/* Floating 3D Coin Behind Top Right */}
        <g className="animate-float-3d-delayed" opacity="0.95">
          <ellipse cx="152" cy="40" rx="18" ry="12" fill="url(#goldRim)" />
          <ellipse cx="152" cy="38" rx="16" ry="10" fill="#dfb962" />
          <text x="148" y="42" fontSize="11" fontWeight="bold" fill="#7a6228">₹</text>
        </g>
      </svg>
    </div>
  );
}

/**
 * 2. 3D Floating Holographic Shield (Used in FinScore & Security)
 */
export function Visual3DShield({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <div className={`relative inline-block select-none ${className}`}>
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-lg animate-float-3d"
      >
        <defs>
          <linearGradient id="shieldPlate" x1="20" y1="10" x2="140" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#175624" />
            <stop offset="60%" stopColor="#12441d" />
            <stop offset="100%" stopColor="#0e3010" />
          </linearGradient>
          <linearGradient id="shieldGold" x1="40" y1="20" x2="120" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dfb962" />
            <stop offset="50%" stopColor="#A4873E" />
            <stop offset="100%" stopColor="#7a6228" />
          </linearGradient>
          <linearGradient id="shieldInnerGlow" x1="80" y1="30" x2="80" y2="130" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#175624" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Outer Bevel */}
        <path
          d="M80 18L132 40V82C132 114 108 138 80 148C52 138 28 114 28 82V40L80 18Z"
          fill="url(#shieldPlate)"
          stroke="url(#shieldGold)"
          strokeWidth="3.5"
        />

        {/* Inner Facet */}
        <path
          d="M80 28L122 47V80C122 107 102 128 80 136C58 128 38 107 38 80V47L80 28Z"
          fill="url(#shieldInnerGlow)"
          opacity="0.9"
        />

        {/* 3D Check Emblem */}
        <path
          d="M62 82L74 94L102 66"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M62 82L74 94L102 66"
          stroke="url(#shieldGold)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * 3. 3D Holographic AI Coach / Brain Visual (Used in Coach Hub)
 */
export function Visual3DAIBrain({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <div className={`relative inline-block select-none ${className}`}>
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl animate-float-3d"
      >
        <defs>
          <linearGradient id="orbGlow" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dfb962" />
            <stop offset="45%" stopColor="#175624" />
            <stop offset="100%" stopColor="#080e0a" />
          </linearGradient>
          <linearGradient id="coreLight" x1="40" y1="40" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#175624" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Orbit Rings */}
        <ellipse cx="80" cy="80" rx="66" ry="24" stroke="#dfb962" strokeWidth="1.5" strokeDasharray="6 4" transform="rotate(-25 80 80)" opacity="0.6" />
        <ellipse cx="80" cy="80" rx="66" ry="24" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 4" transform="rotate(35 80 80)" opacity="0.5" />

        {/* Central 3D Sphere */}
        <circle cx="80" cy="80" r="42" fill="url(#orbGlow)" />
        <circle cx="70" cy="68" r="30" fill="url(#coreLight)" />

        {/* Neural Synapse Nodes */}
        <circle cx="65" cy="72" r="3" fill="#ffffff" />
        <circle cx="95" cy="65" r="3" fill="#dfb962" />
        <circle cx="82" cy="94" r="3" fill="#34d399" />
        <line x1="65" y1="72" x2="95" y2="65" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.7" />
        <line x1="95" y1="65" x2="82" y2="94" stroke="#dfb962" strokeWidth="1" strokeOpacity="0.7" />
        <line x1="65" y1="72" x2="82" y2="94" stroke="#34d399" strokeWidth="1" strokeOpacity="0.7" />

        {/* Satellite Node Orbiting */}
        <circle cx="132" cy="58" r="5" fill="#dfb962" className="animate-float-3d-delayed" />
      </svg>
    </div>
  );
}

/**
 * 4. 3D Floating Product Icons for "Can I Afford This?" What-If Simulator
 */
export function Visual3DProductIcon({
  name,
  className = "w-10 h-10",
}: {
  name: string;
  className?: string;
}) {
  const lower = name.toLowerCase();

  if (lower.includes("phone")) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#175624]/20 via-[#A4873E]/20 to-white/40 p-2 shadow-xs dark:from-white/10 dark:to-white/5 ${className}`}>
        <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm">
          <rect x="12" y="4" width="24" height="40" rx="6" fill="#333333" stroke="#A4873E" strokeWidth="1.5" />
          <rect x="15" y="8" width="18" height="30" rx="3" fill="#175624" fillOpacity="0.4" />
          <circle cx="24" cy="40" r="1.5" fill="#dfb962" />
          <rect x="21" y="6" width="6" height="1.5" rx="0.75" fill="#666666" />
        </svg>
      </div>
    );
  }

  if (lower.includes("macbook") || lower.includes("laptop")) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#175624]/20 via-[#A4873E]/20 to-white/40 p-2 shadow-xs dark:from-white/10 dark:to-white/5 ${className}`}>
        <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm">
          <rect x="8" y="10" width="32" height="22" rx="3" fill="#333333" stroke="#dfb962" strokeWidth="1.5" />
          <rect x="11" y="13" width="26" height="16" rx="1.5" fill="#175624" fillOpacity="0.5" />
          <path d="M4 34H44L41 38H7L4 34Z" fill="#A4873E" />
          <rect x="20" y="34.5" width="8" height="1" rx="0.5" fill="#f5f7fa" />
        </svg>
      </div>
    );
  }

  if (lower.includes("vacation") || lower.includes("trip") || lower.includes("goa")) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#175624]/20 via-[#A4873E]/20 to-white/40 p-2 shadow-xs dark:from-white/10 dark:to-white/5 ${className}`}>
        <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm">
          <path d="M24 6L28 18L40 22L29 27L32 40L24 33L16 40L19 27L8 22L20 18L24 6Z" fill="#A4873E" stroke="#dfb962" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="5" fill="#175624" />
        </svg>
      </div>
    );
  }

  if (lower.includes("headphone") || lower.includes("sony")) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#175624]/20 via-[#A4873E]/20 to-white/40 p-2 shadow-xs dark:from-white/10 dark:to-white/5 ${className}`}>
        <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm">
          <path d="M12 24C12 16 17 10 24 10C31 10 36 16 36 24V32C36 34.2 34.2 36 32 36H30V26H34V24C34 18.5 29.5 14 24 14C18.5 14 14 18.5 14 24V26H18V36H16C13.8 36 12 34.2 12 32V24Z" fill="#175624" stroke="#A4873E" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // Default / Scooter / Gadget
  return (
    <div className={`flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#175624]/20 via-[#A4873E]/20 to-white/40 p-2 shadow-xs dark:from-white/10 dark:to-white/5 ${className}`}>
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full drop-shadow-sm">
        <circle cx="16" cy="34" r="6" stroke="#175624" strokeWidth="3" />
        <circle cx="34" cy="34" r="6" stroke="#175624" strokeWidth="3" />
        <path d="M16 34H26L31 18H37" stroke="#A4873E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M31 18L26 26" stroke="#dfb962" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

