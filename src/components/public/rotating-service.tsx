"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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

const TYPE_SPEED = 70;
const DELETE_SPEED = 40;
const PAUSE_AFTER_TYPE = 2200;
const PAUSE_AFTER_DELETE = 300;

export function RotatingService({ className }: { className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const typeWord = useCallback((word: string, charIndex: number) => {
    if (charIndex <= word.length) {
      setDisplayed(word.slice(0, charIndex));
      timeoutRef.current = setTimeout(
        () => typeWord(word, charIndex + 1),
        TYPE_SPEED,
      );
    } else {
      timeoutRef.current = setTimeout(() => deleteWord(word, word.length), PAUSE_AFTER_TYPE);
    }
  }, []);

  const deleteWord = useCallback((word: string, charIndex: number) => {
    if (charIndex >= 0) {
      setDisplayed(word.slice(0, charIndex));
      timeoutRef.current = setTimeout(
        () => deleteWord(word, charIndex - 1),
        DELETE_SPEED,
      );
    } else {
      indexRef.current = (indexRef.current + 1) % SERVICES.length;
      timeoutRef.current = setTimeout(
        () => typeWord(SERVICES[indexRef.current], 0),
        PAUSE_AFTER_DELETE,
      );
    }
  }, [typeWord]);

  useEffect(() => {
    typeWord(SERVICES[0], 0);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [typeWord]);

  // Blinking cursor
  useEffect(() => {
    const id = setInterval(() => setShowCursor((prev) => !prev), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className ?? ""}>
      {displayed}
      <span
        className={`ml-[2px] inline-block h-[0.75em] w-[3px] translate-y-[0.05em] rounded-full bg-current ${
          showCursor ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
