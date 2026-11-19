"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  blur?: boolean;
  scale?: boolean;
  className?: string;
  once?: boolean;
}

/**
 * ScrollReveal:
 * High-performance, hardware-accelerated scroll manifestation ("prakat ho rha hai").
 * Uses native IntersectionObserver with generous lead margin + 600ms safety fallback
 * so that content NEVER gets stuck or invisible.
 */
export function ScrollReveal({
  children,
  delay = 0,
  duration = 0.65,
  direction = "up",
  distance = 28,
  blur = true,
  scale = false,
  className = "",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.02,
        rootMargin: "80px 0px 40px 0px", // Generous lead-in so it reveals as user approaches
      }
    );

    observer.observe(el);

    // Safety fallback: guarantees content appears even if browser skips observer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [once]);

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1)";
    const x = direction === "left" ? distance : direction === "right" ? -distance : 0;
    const y = direction === "up" ? distance : direction === "down" ? -distance : 0;
    const s = scale ? 0.96 : 1;
    return `translate3d(${x}px, ${y}px, 0) scale(${s})`;
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        filter: blur ? (isVisible ? "blur(0px)" : "blur(8px)") : undefined,
        transitionProperty: "opacity, transform, filter",
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

// Stagger Context for cascading card lists
const StaggerContext = createContext<{ isVisible: boolean; staggerDelay: number }>({
  isVisible: false,
  staggerDelay: 0.1,
});

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = "",
  once = true,
}: {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold: 0.02,
        rootMargin: "80px 0px 40px 0px",
      }
    );

    observer.observe(el);

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [once]);

  return (
    <StaggerContext.Provider value={{ isVisible, staggerDelay }}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </StaggerContext.Provider>
  );
}

export function StaggerItem({
  children,
  className = "",
  direction = "up",
  distance = 24,
  duration = 0.6,
  blur = true,
  scale = false,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  blur?: boolean;
  scale?: boolean;
  index?: number;
}) {
  const context = useContext(StaggerContext);
  const isVisible = context ? context.isVisible : true;
  const delay = (index || 0) * (context?.staggerDelay || 0.1);

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1)";
    const x = direction === "left" ? distance : direction === "right" ? -distance : 0;
    const y = direction === "up" ? distance : direction === "down" ? -distance : 0;
    const s = scale ? 0.96 : 1;
    return `translate3d(${x}px, ${y}px, 0) scale(${s})`;
  };

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        filter: blur ? (isVisible ? "blur(0px)" : "blur(6px)") : undefined,
        transitionProperty: "opacity, transform, filter",
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
