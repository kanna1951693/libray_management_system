"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeContext";


/* ─── Types ─── */
type Book = {
  id: string; title: string; author: string;
  category: string; year: number;
  availableCopies: number; coverImage: string | null;
};

/* ─── Animated number counter ─── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 60;
    const step = () => {
      frame++;
      setVal(Math.round((to * frame) / total));
      if (frame < total) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to]);
  return <>{val.toLocaleString()}{suffix}</>;
}

/* ─── Book cover card (small, horizontal scroll) ─── */
function BookThumb({ book }: { book: Book }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Link
      href={`/book/${book.id}`}
      className="flex-shrink-0 w-28 group block"
    >
      <div
        className="w-28 h-40 rounded-xl overflow-hidden mb-2 transition-all duration-300 group-hover:-translate-y-1"
        style={{
          background: isDark
            ? "linear-gradient(145deg,#1a1a1a,#111)"
            : "linear-gradient(145deg,#EDE0CF,#D4B896)",
          boxShadow: isDark
            ? "2px 4px 12px rgba(0,0,0,0.6)"
            : "2px 4px 12px rgba(28,15,8,0.15)",
          border: `1px solid ${isDark ? "#1E1E1E" : "rgba(180,140,90,0.2)"}`,
        }}
      >
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke={isDark ? "#F0C04060" : "#7A3B1E60"} strokeWidth="1.5">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span
              className="text-[9px] font-semibold uppercase tracking-wider mt-1.5 leading-tight line-clamp-3"
              style={{ color: isDark ? "#F0C04070" : "#7A3B1E80" }}
            >
              {book.title}
            </span>
          </div>
        )}
      </div>
      <p
        className="text-[11px] font-semibold leading-tight line-clamp-2"
        style={{ color: "var(--text)" }}
      >
        {book.title}
      </p>
      <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
        {book.author}
      </p>
    </Link>
  );
}

const CATEGORIES = [
  { name: "Science & Tech",  icon: "⚗️", emoji: false, svg: true, q: "science" },
  { name: "Literature",      icon: "📖", q: "literature" },
  { name: "Engineering",     icon: "🔧", q: "engineering" },
  { name: "History",         icon: "🏛️", q: "history" },
  { name: "Mathematics",     icon: "∑",  q: "mathematics" },
  { name: "Arts",            icon: "🎨", q: "arts" },
];

const STEPS = [
  { n: "01", title: "Apply Online", desc: "Fill out the short membership form with your student or staff ID." },
  { n: "02", title: "Get Approved", desc: "An admin reviews your request — usually within 24 hours." },
  { n: "03", title: "Start Borrowing", desc: "Receive your credentials and check out up to 5 books at a time." },
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  };
}

export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dbStats, setDbStats] = useState({ books: 0, members: 0, categories: 0, years: 1 });

  useEffect(() => {
    fetch("/api/books?sort=year&page=1")
      .then((r) => r.json())
      .then((d) => { setBooks(d.books ?? []); setLoaded(true); })
      .catch(() => setLoaded(true));

    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setDbStats(data);
        }
      })
      .catch(() => {});
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  }

  const accent     = isDark ? "#F0C040" : "#7A3B1E";
  const accentFg   = isDark ? "#080808" : "#FDFCF8";
  const heroBg     = isDark ? "#080808" : "#1C0F08";
  const heroText   = isDark ? "#F5F5F0" : "#F5E6D4";
  const heroMuted  = isDark ? "#88887E" : "#C4A882";
  const sectionBg  = isDark ? "#0D0D0D" : "#F5EDE0";
  const cardBg     = isDark ? "#111111" : "#FFF8F0";
  const cardBorder = isDark ? "#1E1E1E" : "rgba(180,140,90,0.22)";

  return (
    <>
      {/* ═══════════════════════════════════
          HERO — Espresso / Midnight
          ═══════════════════════════════════ */}
      <section
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-16"
        style={{ backgroundColor: heroBg }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(240,192,64,0.06) 0%, transparent 70%)"
              : "radial-gradient(ellipse 70% 55% at 50% 45%, rgba(201,168,76,0.15) 0%, transparent 70%)",
          }}
        />
        {/* Subtle dotted pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            color: isDark ? "#F0C040" : "#C9A84C",
          }}
        />



        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest"
            style={{
              backgroundColor: `${accent}18`,
              border: `1px solid ${accent}35`,
              color: accent,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
            Open to all students, faculty &amp; staff
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.96] tracking-[-0.04em]"
            style={{ color: heroText, fontFamily: "Georgia, serif" }}
          >
            Where Every
            <br />
            <span style={{ color: accent }}>Story</span>{" "}Begins.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="max-w-xl text-base sm:text-lg leading-relaxed"
            style={{ color: heroMuted }}
          >
            Explore our collection of {dbStats.books.toLocaleString()} books across {dbStats.categories} categories — free to borrow for all enrolled students, faculty, and staff.
          </motion.p>

          {/* Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="w-full max-w-lg flex gap-2"
          >
            <div
              className="flex-1 flex rounded-2xl transition-all duration-300"
              style={{
                backgroundColor: isDark ? "rgba(17,17,19,0.85)" : "rgba(255,255,255,0.12)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(201,168,76,0.30)"}`,
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(28,15,8,0.1)",
              }}
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, ISBN…"
                className="flex-1 px-5 py-4 bg-transparent text-sm outline-none rounded-2xl"
                style={{
                  color: isDark ? "#F5F5F0" : "#F5E6D4",
                }}
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-2 shrink-0 transition-colors duration-200"
              style={{ backgroundColor: accent, color: accentFg, boxShadow: `0 4px 16px ${accent}30` }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              Search
            </motion.button>
          </motion.form>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium"
            style={{ color: heroMuted }}
          >
            <Link href="/search" className="hover:opacity-80 transition-opacity" style={{ color: accent }}>
              Browse all books →
            </Link>
            <span className="opacity-30">|</span>
            <Link href="/membership/apply" className="hover:opacity-80 transition-opacity">
              Free membership
            </Link>
            <span className="opacity-30">|</span>
            <Link href="/membership/rules" className="hover:opacity-80 transition-opacity">
              Library rules
            </Link>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div
            className="w-5 h-8 rounded-full border flex justify-center pt-1.5"
            style={{ borderColor: `${accent}40` }}
          >
            <div className="w-0.5 h-2 rounded-full" style={{ backgroundColor: `${accent}80` }} />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════
          STATS BAR
          ═══════════════════════════════════ */}
      <section
        className="py-12 border-y"
        style={{ backgroundColor: sectionBg, borderColor: `${accent}18` }}
      >
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: dbStats.books, suffix: "", label: "Books in Catalog" },
            { value: dbStats.members, suffix: "", label: "Active Members" },
            { value: dbStats.categories, suffix: "", label: "Categories" },
            { value: dbStats.years, suffix: "", label: "Years of Service" },
          ].map((s, i) => (
            <motion.div key={s.label} {...fadeUp(i * 0.07)}>
              <p
                className="text-3xl sm:text-4xl font-black leading-none tracking-tight"
                style={{ color: accent, fontFamily: "Georgia, serif" }}
              >
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest mt-2" style={{ color: "var(--text-muted)" }}>
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════
          NEW ARRIVALS
          ═══════════════════════════════════ */}
      <section className="py-20 px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp()} className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>
                Just Added
              </p>
              <h2
                className="text-2xl sm:text-3xl font-black"
                style={{ color: "var(--text)", fontFamily: "Georgia, serif" }}
              >
                New Arrivals
              </h2>
            </div>
            <Link
              href="/search?sort=year"
              className="text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-70"
              style={{ color: accent }}
            >
              View all →
            </Link>
          </motion.div>

          {!loaded ? (
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="w-28 h-40 rounded-xl flex-shrink-0 animate-pulse"
                  style={{ backgroundColor: cardBg }}
                />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
              <p className="font-medium">No books in the catalog yet.</p>
              <p className="text-sm mt-1">Ask the admin to add some!</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin"
              style={{ scrollbarWidth: "thin" }}
            >
              {books.map((book) => (
                <BookThumb key={book.id} book={book} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════
          BROWSE CATEGORIES
          ═══════════════════════════════════ */}
      <section className="py-20 px-4" style={{ backgroundColor: sectionBg }}>
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>
              Explore
            </p>
            <h2
              className="text-2xl sm:text-3xl font-black"
              style={{ color: "var(--text)", fontFamily: "Georgia, serif" }}
            >
              Browse by Category
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.name} {...fadeUp(i * 0.06)}>
                <Link
                  href={`/search?q=${encodeURIComponent(cat.q)}`}
                  className="flex flex-col items-center gap-3 py-7 px-3 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md group h-full block"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-bold leading-tight" style={{ color: "var(--text)" }}>
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          HOW TO JOIN
          ═══════════════════════════════════ */}
      <section className="py-24 px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>
              Get Started
            </p>
            <h2
              className="text-2xl sm:text-3xl font-black mb-3"
              style={{ color: "var(--text)", fontFamily: "Georgia, serif" }}
            >
              Get Your Free Membership
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Takes less than 2 minutes. Approved within one working day.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fadeUp(i * 0.12)} className="relative">
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden sm:block absolute top-8 left-full w-full h-px -translate-y-1/2 z-0"
                    style={{
                      background: `linear-gradient(to right, ${accent}40, transparent)`,
                    }}
                  />
                )}
                <div
                  className="relative z-10 rounded-2xl p-8 h-full flex flex-col border transition-all duration-300 hover:shadow-md"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  }}
                >
                  <span
                    className="text-4xl font-black mb-4 leading-none"
                    style={{ color: `${accent}40`, fontFamily: "Georgia, serif" }}
                  >
                    {s.n}
                  </span>
                  <h3
                    className="font-bold text-base mb-2"
                    style={{ color: "var(--text)" }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.4)} className="text-center mt-12">
            <motion.button
              onClick={() => router.push("/membership/apply")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold transition-colors duration-200"
              style={{ backgroundColor: accent, color: accentFg, boxShadow: `0 8px 32px ${accent}30` }}
            >
              Apply for Free Membership
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          QUICK RULES STRIP
          ═══════════════════════════════════ */}
      <section
        className="py-16 px-4"
        style={{ backgroundColor: sectionBg, borderTop: `1px solid ${accent}15` }}
      >
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "5", label: "Books per member at a time" },
            { icon: "14", label: "Day loan period" },
            { icon: "₹2", label: "Per day overdue fine" },
            { icon: "1", label: "Renewal allowed per loan" },
          ].map((r, i) => (
            <motion.div
              key={r.label}
              {...fadeUp(i * 0.08)}
              className="flex items-center gap-4 p-5 rounded-2xl"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
                style={{ backgroundColor: `${accent}18`, color: accent }}
              >
                {r.icon}
              </div>
              <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text)" }}>
                {r.label}
              </p>
            </motion.div>
          ))}
        </div>
        <motion.div {...fadeUp(0.3)} className="text-center mt-8">
          <Link
            href="/membership/rules"
            className="text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-70"
            style={{ color: accent }}
          >
            Read full rules &amp; policies →
          </Link>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════
          HOURS FOOTER STRIP
          ═══════════════════════════════════ */}
      <section
        className="py-14 px-4"
        style={{
          backgroundColor: isDark ? "#080808" : "#1C0F08",
          borderTop: `1px solid ${isDark ? "#141414" : "#2C1A0E"}`,
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h3
            className="text-xl font-bold mb-8"
            style={{ color: isDark ? "#F5F5F0" : "#F5E6D4", fontFamily: "Georgia, serif" }}
          >
            Opening Hours
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { day: "Monday – Friday",  time: "09:00 AM – 11:00 PM" },
              { day: "Saturday",         time: "09:00 AM – 06:30 PM" },
              { day: "Sunday",           time: "10:00 AM – 05:00 PM" },
            ].map((h) => (
              <div
                key={h.day}
                className="rounded-xl p-4 text-center"
                style={{
                  backgroundColor: isDark ? "#111" : "rgba(255,248,240,0.07)",
                  border: `1px solid ${isDark ? "#1E1E1E" : "rgba(201,168,76,0.15)"}`,
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: isDark ? "#888" : "#C4A882" }}>
                  {h.day}
                </p>
                <p className="text-sm font-bold" style={{ color: accent }}>
                  {h.time}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs mt-6 font-medium" style={{ color: isDark ? "#555" : "#9A7A5A" }}>
            Closed on Public Holidays
          </p>
        </div>
      </section>
    </>
  );
}
