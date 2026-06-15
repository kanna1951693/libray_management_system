"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BookCard } from "@/components/search/BookCard";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeContext";

type Book = {
  id: string; title: string; author: string; category: string;
  year: number; availableCopies: number; totalCopies: number;
  coverImage: string | null; publisher: string;
};

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Search() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { theme }    = useTheme();
  const isDark       = theme === "dark";
  const inputRef     = useRef<HTMLInputElement>(null);

  // Initialise state from URL params
  const [query,      setQuery]      = useState(searchParams.get("q") ?? "");
  const [category,   setCategory]   = useState(searchParams.get("category") ?? "");
  const [available,  setAvailable]  = useState(searchParams.get("available") === "true");
  const [sort,       setSort]       = useState(searchParams.get("sort") ?? "relevance");
  const [books,      setBooks]      = useState<Book[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 350);

  const text    = isDark ? "#F5F5F0" : "#1C0F08";
  const muted   = isDark ? "#888880" : "#7A5C3F";
  const accent  = isDark ? "#F0C040" : "#7A3B1E";
  const border  = isDark ? "rgba(255,255,255,0.08)" : "rgba(180,140,90,0.20)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)";
  const cardBg  = isDark ? "rgba(17,17,17,0.90)"   : "rgba(255,248,240,0.9)";

  useEffect(() => {
    fetch("/api/books/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  // ── Keyboard shortcut: ⌘K / Ctrl+K or "/" focuses search ──
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // ── Sync filters to URL ──
  const syncUrl = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const q = overrides.q ?? debouncedQuery;
    const c = overrides.category ?? category;
    const s = overrides.sort ?? sort;
    const a = overrides.available ?? String(available);

    if (q)            params.set("q", q);
    if (c)            params.set("category", c);
    if (s !== "relevance") params.set("sort", s);
    if (a === "true") params.set("available", "true");

    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedQuery, category, sort, available, router]);

  const fetchBooks = useCallback(async (p = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      q:         debouncedQuery,
      category,
      available: String(available),
      sort,
      page:      String(p),
    });
    try {
      const res  = await fetch(`/api/books?${params}`);
      const data = await res.json();
      setBooks(data.books);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(p);
      setHasSearched(true);
    } catch {
      // Network error — keep previous results
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, category, available, sort]);

  // ── Trigger search on debounced query or filter changes ──
  useEffect(() => {
    fetchBooks(1);
    syncUrl();
  }, [debouncedQuery, category, available, sort]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    // Immediate search on Enter (bypasses debounce)
    fetchBooks(1);
  }

  function clearQuery() {
    setQuery("");
    inputRef.current?.focus();
  }

  const categoryIcons: Record<string, string> = {
    "Mathematics": "∑",
    "Physics": "⚛",
    "Economics": "$",
    "Children": "★",
    "Computer Science & Engineering": "⌨",
    "Fiction": "✦",
    "Non-Fiction": "◈",
    "History": "⏳",
    "Biology": "⬡",
    "Chemistry": "⬢",
    "Management": "◉",
  };

  // ── Active filter chips ──
  const activeFilters: { label: string; onClear: () => void }[] = [];
  if (category) activeFilters.push({ label: `Category: ${category}`, onClear: () => setCategory("") });
  if (available) activeFilters.push({ label: "Available only", onClear: () => setAvailable(false) });
  if (sort !== "relevance") {
    const sortLabels: Record<string, string> = { title: "Title A–Z", author: "Author", year: "Newest first" };
    activeFilters.push({ label: `Sort: ${sortLabels[sort] ?? sort}`, onClear: () => setSort("relevance") });
  }

  return (
    <div
      className="min-h-screen pt-28 pb-20 px-4"
      style={{ background: isDark ? "#080808" : "#FDFCF8" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* ── Page Header ── */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: accent }}>
            Library Catalog
          </p>
          <h1
            className="font-serif text-4xl sm:text-5xl font-bold mb-3"
            style={{ color: text }}
          >
            Search Books
          </h1>
          <p className="text-sm" style={{ color: muted }}>
            Discover from thousands of titles across all categories.{" "}
            <span className="opacity-60">Press <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border: `1px solid ${border}` }}>⌘K</kbd> to search.</span>
          </p>
        </div>

        {/* ── Search Bar ── */}
        <form onSubmit={handleSearch} className="mb-6">
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-lg transition-all"
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              backdropFilter: "blur(12px)",
            }}
          >
            <span style={{ color: muted }}><SearchIcon /></span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, ISBN, category, or description…"
              className="flex-1 bg-transparent outline-none text-sm font-medium"
              style={{ color: text }}
              id="search-input"
            />

            {/* Clear button */}
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                className="p-1.5 rounded-lg transition-all hover:opacity-70"
                style={{ color: muted }}
                title="Clear search"
              >
                <ClearIcon />
              </button>
            )}

            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 shrink-0"
              style={{
                backgroundColor: accent,
                color: isDark ? "#080808" : "#FDFCF8",
              }}
            >
              Search
            </button>
          </div>

          {/* Live search indicator */}
          {loading && (
            <div className="mt-2 flex items-center gap-2 px-2">
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent, borderTopColor: "transparent" }} />
              <span className="text-xs" style={{ color: muted }}>Searching…</span>
            </div>
          )}
        </form>

        {/* ── Filter Bar ── */}
        <div
          className="flex flex-wrap items-center gap-3 mb-4 p-4 rounded-2xl"
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            backdropFilter: "blur(12px)",
          }}
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mr-1" style={{ color: muted }}>
            <FilterIcon /> Filters
          </span>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 rounded-xl text-xs font-semibold outline-none cursor-pointer transition-all"
            style={{
              background: inputBg,
              color: text,
              border: `1px solid ${border}`,
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{categoryIcons[c] ?? "◆"} {c}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 rounded-xl text-xs font-semibold outline-none cursor-pointer transition-all"
            style={{
              background: inputBg,
              color: text,
              border: `1px solid ${border}`,
            }}
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="title">Sort: Title A–Z</option>
            <option value="author">Sort: Author</option>
            <option value="year">Sort: Newest</option>
          </select>

          {/* Available toggle */}
          <label
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer select-none transition-all"
            style={{
              background: available
                ? isDark ? "rgba(240,192,64,0.15)" : "rgba(122,59,30,0.10)"
                : inputBg,
              color: available ? accent : muted,
              border: `1px solid ${available ? accent + "40" : border}`,
            }}
          >
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="sr-only"
            />
            <span
              className="w-3.5 h-3.5 rounded border flex items-center justify-center transition-all"
              style={{
                background: available ? accent : "transparent",
                borderColor: available ? accent : muted,
              }}
            >
              {available && (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke={isDark ? "#080808" : "#FDFCF8"} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </span>
            Available only
          </label>

          {/* Result count */}
          <span className="ml-auto text-xs font-medium" style={{ color: muted }}>
            {loading ? "Searching…" : `${total} result${total !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── Active Filter Chips ── */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.map((f) => (
              <button
                key={f.label}
                onClick={f.onClear}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 group"
                style={{
                  background: isDark ? "rgba(240,192,64,0.12)" : "rgba(122,59,30,0.08)",
                  color: accent,
                  border: `1px solid ${accent}30`,
                }}
              >
                {f.label}
                <span className="opacity-50 group-hover:opacity-100 transition-opacity">×</span>
              </button>
            ))}
            <button
              onClick={() => { setCategory(""); setAvailable(false); setSort("relevance"); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
              style={{ color: muted }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Book Grid ── */}
        <AnimatePresence mode="wait">
          {loading && !hasSearched ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden animate-pulse"
                  style={{ height: 300, background: cardBg, border: `1px solid ${border}` }}
                />
              ))}
            </motion.div>
          ) : books.length === 0 && hasSearched ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-black"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: muted }}
              >
                ?
              </div>
              <p className="text-lg font-bold mb-2" style={{ color: text }}>No books found</p>
              <p className="text-sm mb-4" style={{ color: muted }}>Try a different search term or clear the filters.</p>
              {(query || category || available) && (
                <button
                  onClick={() => { setQuery(""); setCategory(""); setAvailable(false); setSort("relevance"); }}
                  className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: accent, color: isDark ? "#080808" : "#FDFCF8" }}
                >
                  Reset all filters
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
            >
              {books.map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <BookCard book={book} highlight={debouncedQuery} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => fetchBooks(page - 1)}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
              style={{
                background: cardBg,
                color: text,
                border: `1px solid ${border}`,
              }}
            >
              ‹
            </button>

            {/* Smart pagination: show first, last, current, and neighbors */}
            {(() => {
              const pages: (number | "...")[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (page > 3) pages.push("...");
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                  pages.push(i);
                }
                if (page < totalPages - 2) pages.push("...");
                pages.push(totalPages);
              }
              return pages.map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-xs" style={{ color: muted }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => fetchBooks(p)}
                    className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: p === page ? accent : cardBg,
                      color: p === page ? (isDark ? "#080808" : "#FDFCF8") : muted,
                      border: `1px solid ${p === page ? accent : border}`,
                      fontWeight: p === page ? 700 : 400,
                    }}
                  >
                    {p}
                  </button>
                )
              );
            })()}

            <button
              onClick={() => fetchBooks(page + 1)}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
              style={{
                background: cardBg,
                color: text,
                border: `1px solid ${border}`,
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F0C040", borderTopColor: "transparent" }} />
      </div>
    }>
      <Search />
    </Suspense>
  );
}
