"use client";

import { useState, useEffect, useCallback } from "react";

const SERVICES = [
  "Retwist",
  "Fade",
  "Silk Press",
  "Knotless Braids",
  "Sew-In",
  "Loc Style",
  "Two-Strand Twists",
  "Cornrows",
  "Box Braids",
  "Wash & Style",
  "Shape-Up",
  "Crown Refresh",
];

const INTERVAL = 3000;

export function RotatingService({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  const cycle = useCallback(() => {
    setPhase("out");
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % SERVICES.length);
      setPhase("in");
    }, 400);
  }, []);

  useEffect(() => {
    const id = setInterval(cycle, INTERVAL);
    return () => clearInterval(id);
  }, [cycle]);

  return (
    <span
      className={`inline-block transition-all duration-400 ${
        phase === "in"
          ? "opacity-100 translate-y-0 blur-0"
          : "opacity-0 translate-y-3 blur-[2px]"
      } ${className ?? ""}`}
    >
      {SERVICES[index]}.
    </span>
  );
}
