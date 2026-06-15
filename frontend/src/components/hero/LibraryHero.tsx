"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

const contentContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.15,
      staggerChildren: 0.1,
      delay: 0.1,
    },
  },
};

const contentItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.72, bounce: 0 },
  },
};

const defaultAvatars = [
  { src: "https://assets.watermelon.sh/wm_ben.png",    alt: "Member" },
  { src: "https://assets.watermelon.sh/wm_alex.png",   alt: "Member" },
  { src: "https://assets.watermelon.sh/wm_olivia.png", alt: "Member" },
];

export function LibraryHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    else router.push("/search");
  }

  return (
    <section className="relative isolate w-full overflow-hidden bg-[#0a0a1a] font-sans antialiased min-h-screen flex flex-col justify-center">
      {/* Premium dark gradient and radial glow effects (no background image) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2e] to-[#0f0f1a]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_rgba(59,130,246,0.15)_0%,_transparent_70%)]" />

      {/* Content — pt-24 accounts for floating top navbar space */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <motion.div
          variants={contentContainer}
          initial="hidden"
          animate="visible"
          className="flex w-full max-w-[760px] flex-col items-center"
        >
          {/* Eyebrow pill */}
          <motion.div
            variants={contentItem}
            className="inline-flex min-h-7 items-center gap-2 rounded-full bg-white/10 px-1 pr-5 text-xs leading-none font-semibold text-white/75 shadow-[0_1px_1px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md border border-white/10"
          >
            <span className="flex -space-x-2">
              {defaultAvatars.map((avatar) => (
                <img
                  key={avatar.src}
                  src={avatar.src}
                  alt={avatar.alt}
                  className="size-5 rounded-full object-cover outline outline-1 -outline-offset-1 outline-white/20"
                />
              ))}
              <span className="grid size-5 -rotate-45 place-items-center rounded-full bg-blue-500 text-white">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </span>
            <span>2,400+ active members</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={contentItem}
            className="mt-5 max-w-[700px] text-[clamp(2.6rem,5.8vw,4.4rem)] leading-[0.93] font-bold tracking-[-0.05em] text-balance text-white"
          >
            Discover{" "}
            <span className="text-gradient">Knowledge</span>
            <br />
            Without Limits
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={contentItem}
            className="mt-5 max-w-[500px] text-[clamp(0.95rem,1.4vw,1.1rem)] leading-[1.42] text-pretty text-white/55"
          >
            Over 10,000 books across 80+ categories. Search, borrow, and
            reserve from anywhere — available for all enrolled students,
            faculty, and staff.
          </motion.p>

          {/* Search form — hero-9 pill style */}
          <motion.form
            variants={contentItem}
            onSubmit={handleSearch}
            className="mt-7 flex w-full max-w-md flex-col gap-1.5 rounded-[28px] bg-white/10 p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_18px_50px_rgba(59,130,246,0.12),inset_0_1px_0_rgba(255,255,255,0.10)] outline outline-1 outline-white/15 backdrop-blur-sm min-[430px]:flex-row min-[430px]:rounded-full"
          >
            <label htmlFor="hero-search" className="sr-only">Search books</label>
            <input
              id="hero-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, ISBN..."
              className="min-h-10 w-full min-w-0 flex-1 bg-transparent px-5 text-center text-sm font-medium text-white outline-none placeholder:text-white/40 min-[430px]:text-left"
            />
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              className="group inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-5 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-all hover:bg-blue-500 min-[430px]:w-auto"
            >
              <span>Search</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.form>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}

