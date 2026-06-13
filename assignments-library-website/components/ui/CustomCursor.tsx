"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useTheme } from "@/components/ThemeContext";

export function CustomCursor() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const accent = isDark ? "#F0C040" : "#7A3B1E";

  const [mounted, setMounted] = useState(false);
  const [isPointerDevice, setIsPointerDevice] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  const cx = useMotionValue(-200);
  const cy = useMotionValue(-200);

  // Precise dot — very fast spring
  const dotX = useSpring(cx, { stiffness: 900, damping: 38 });
  const dotY = useSpring(cy, { stiffness: 900, damping: 38 });

  // Outer ring — laggy spring for trailing feel
  const ringX = useSpring(cx, { stiffness: 100, damping: 18 });
  const ringY = useSpring(cy, { stiffness: 100, damping: 18 });

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    setIsPointerDevice(isFinePointer);
    setMounted(true);

    if (isFinePointer) {
      document.documentElement.classList.add("custom-cursor-active");
    }

    const onMove = (e: MouseEvent) => {
      cx.set(e.clientX);
      cy.set(e.clientY);
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (el) setHovering(window.getComputedStyle(el).cursor === "pointer");
    };
    const onDown = () => setClicking(true);
    const onUp   = () => setClicking(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [cx, cy]);

  if (!mounted || !isPointerDevice) return null;

  return (
    <>
      {/* Trailing ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none rounded-full z-[9999]"
        style={{
          x: ringX, y: ringY,
          translateX: "-50%", translateY: "-50%",
          width:  hovering ? 46 : clicking ? 22 : 32,
          height: hovering ? 46 : clicking ? 22 : 32,
          border: `1.5px solid ${accent}`,
          backgroundColor: hovering ? `${accent}14` : "transparent",
          transition: "width 0.22s ease, height 0.22s ease, background-color 0.22s ease",
          mixBlendMode: "normal",
        }}
      />
      {/* Sharp inner dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none rounded-full z-[9999]"
        style={{
          x: dotX, y: dotY,
          translateX: "-50%", translateY: "-50%",
          width:  clicking ? 3 : 5,
          height: clicking ? 3 : 5,
          backgroundColor: accent,
          transition: "width 0.1s ease, height 0.1s ease",
        }}
      />
    </>
  );
}
