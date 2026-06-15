"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";

type Book = {
  id:             string;
  title:          string;
  author:         string;
  category:       string;
  year:           number;
  availableCopies: number;
  totalCopies:    number;
  coverImage:     string | null;
  publisher:      string;
};

const CATEGORY_COLORS: Record<string, { from: string; to: string }> = {
  "Mathematics":                   { from: "#1a237e", to: "#3949ab" },
  "Physics":                       { from: "#006064", to: "#00838f" },
  "Economics":                     { from: "#1b5e20", to: "#2e7d32" },
  "Children":                      { from: "#e65100", to: "#ef6c00" },
  "Computer Science & Engineering":{ from: "#1a237e", to: "#283593" },
  "Fiction":                       { from: "#4a148c", to: "#6a1b9a" },
  "Non-Fiction":                   { from: "#37474f", to: "#546e7a" },
  "History":                       { from: "#3e2723", to: "#4e342e" },
  "Biology":                       { from: "#194d33", to: "#2e7d32" },
  "Chemistry":                     { from: "#7b1fa2", to: "#8e24aa" },
  "Management":                    { from: "#bf360c", to: "#d84315" },
};

function HighlightText({ text, highlight, color }: { text: string; highlight?: string; color: string }) {
  if (!highlight || !highlight.trim()) {
    return <span style={{ color }}>{text}</span>;
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <span style={{ color }}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              background: "rgba(240,192,64,0.3)",
              color: "inherit",
              borderRadius: "2px",
              padding: "0 1px",
              fontWeight: 700,
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export function BookCard({ book, highlight }: { book: Book; highlight?: string }) {
  const { theme }            = useTheme();
  const isDark               = theme === "dark";

  const text   = isDark ? "#F5F5F0" : "#1C0F08";
  const muted  = isDark ? "#888880" : "#7A5C3F";
  const accent = isDark ? "#F0C040" : "#7A3B1E";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(180,140,90,0.20)";
  const cardBg = isDark ? "rgba(17,17,17,0.95)"   : "rgba(255,248,240,0.95)";

  const colors = CATEGORY_COLORS[book.category] ?? { from: "#263238", to: "#37474f" };
  const available = book.availableCopies > 0;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1"
      style={{
        background: cardBg,
        border: `1px solid ${border}`,
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.4)"
          : "0 2px 16px rgba(28,15,8,0.08)",
      }}
    >
      {/* Cover */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 200,
          background: `linear-gradient(160deg, ${colors.from}, ${colors.to})`,
        }}
      >
        {book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <span className="text-white/30 text-5xl font-black mb-2">
              {book.title.charAt(0)}
            </span>
            <p className="text-white/60 text-xs line-clamp-2 font-medium">{book.title}</p>
          </div>
        )}

        {/* Availability badge */}
        <span
          className="absolute top-2.5 right-2.5 text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-sm"
          style={{
            background: available
              ? "rgba(22,163,74,0.85)"
              : "rgba(239,68,68,0.85)",
            color: "#fff",
          }}
        >
          {available ? `${book.availableCopies}/${book.totalCopies}` : "Unavailable"}
        </span>

        {/* Category badge */}
        <span
          className="absolute bottom-2.5 left-2.5 text-[10px] px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)" }}
        >
          {book.category}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/book/${book.id}`}>
          <h3
            className="font-bold text-sm leading-snug line-clamp-2 mb-1 transition-colors"
          >
            <HighlightText text={book.title} highlight={highlight} color={text} />
          </h3>
        </Link>
        <p className="text-xs mb-0.5 line-clamp-1">
          <HighlightText text={book.author} highlight={highlight} color={muted} />
        </p>
        <p className="text-xs mb-4" style={{ color: isDark ? "#555" : "#C4A882" }}>{book.year}</p>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Link
            href={`/book/${book.id}`}
            className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{
              border: `1px solid ${border}`,
              color: muted,
            }}
          >
            Details
          </Link>
          <Link
            href={`/book/${book.id}#copies-section`}
            className="flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center"
            style={{
              background: !available
                ? isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"
                : accent,
              color: !available
                ? muted
                : isDark ? "#080808" : "#FDFCF8",
              pointerEvents: !available ? "none" : "auto",
            }}
          >
            {available ? "Hold" : "None left"}
          </Link>
        </div>
      </div>
    </div>
  );
}
