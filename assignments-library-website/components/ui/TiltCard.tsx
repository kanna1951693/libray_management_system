"use client";

import { useRef, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  intensity?: number;   // max rotation in degrees
  glare?: boolean;      // shine overlay
  scale?: number;       // hover scale
}

export function TiltCard({
  children,
  className = "",
  style,
  intensity = 12,
  glare = true,
  scale = 1.03,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0); // -0.5 … 0.5 normalized
  const rawY = useMotionValue(0);

  // Smooth the rotation with spring
  const rotateY = useSpring(
    useTransform(rawX, [-0.5, 0.5], [-intensity, intensity]),
    { stiffness: 320, damping: 28 }
  );
  const rotateX = useSpring(
    useTransform(rawY, [-0.5, 0.5], [intensity, -intensity]),
    { stiffness: 320, damping: 28 }
  );

  // Dynamic glare spotlight
  const glareX  = useTransform(rawX, [-0.5, 0.5], ["5%", "95%"]);
  const glareY  = useTransform(rawY, [-0.5, 0.5], ["5%", "95%"]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15), transparent 62%)`;

  // Reactive shadow that moves opposite to tilt
  const shadowX  = useTransform(rawX, [-0.5, 0.5], [16, -16]);
  const shadowY  = useTransform(rawY, [-0.5, 0.5], [-16, 16]);
  const shadowSm = useMotionTemplate`${shadowX}px ${shadowY}px 40px rgba(0,0,0,0.28)`;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      rawX.set((e.clientX - left) / width - 0.5);
      rawY.set((e.clientY - top) / height - 0.5);
    },
    [rawX, rawY]
  );

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return (
    /* Perspective wrapper — must be on the parent for proper 3D math */
    <div style={{ perspective: "1100px", perspectiveOrigin: "50% 50%" }}>
      <motion.div
        ref={ref}
        className={`relative ${className}`}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          boxShadow: shadowSm,
          ...style,
        }}
        whileHover={{ scale }}
        transition={{ scale: { type: "spring", stiffness: 260, damping: 22 } }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}

        {/* Glare overlay (z-10 so it sits above card content) */}
        {glare && (
          <motion.div
            className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
            style={{ background: glareBg }}
          />
        )}
      </motion.div>
    </div>
  );
}
