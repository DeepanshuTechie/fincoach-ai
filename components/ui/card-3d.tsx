"use client";

import React, { useRef, useState, useCallback } from "react";

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareEffect?: boolean;
}

/**
 * Card3D: Lightweight, ultra-smooth 60fps 3D Perspective Tilt Card
 * Uses pure CSS 3D transforms with dynamic cursor sheen
 */
export function Card3D({
  children,
  className = "",
  maxTilt = 8,
  glareEffect = true,
  ...props
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotX = ((y - centerY) / centerY) * -maxTilt;
      const rotY = ((x - centerX) / centerX) * maxTilt;

      setRotateX(rotX);
      setRotateY(rotY);

      if (glareEffect) {
        setGlarePosition({
          x: (x / rect.width) * 100,
          y: (y / rect.height) * 100,
        });
      }
    },
    [maxTilt, glareEffect]
  );

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
      }}
      className="inline-block w-full"
      {...props}
    >
      <div
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
          transformStyle: "preserve-3d",
        }}
        className={`relative ${className}`}
      >
        {children}

        {/* Dynamic 3D Glare Lighting Overlay */}
        {glareEffect && isHovered && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-40 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 280px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.25), transparent 80%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
