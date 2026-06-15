"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeContext";

const QUICK_LINKS = [
  { href: "/search",            label: "Search Catalog" },
  { href: "/membership/apply",  label: "Apply for Membership" },
  { href: "/membership/rules",  label: "Library Rules" },
  { href: "/login",             label: "Member Login" },
];

const HOURS = [
  { day: "Mon – Fri",  time: "09:00 AM – 11:00 PM" },
  { day: "Saturday",  time: "09:00 AM – 06:30 PM" },
  { day: "Sunday",    time: "10:00 AM – 05:00 PM" },
];

export function Footer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const footerBg  = isDark ? "#080808" : "#1C0F08";
  const footerBd  = isDark ? "#141414" : "#2C1A0E";
  const text      = isDark ? "#F5F5F0" : "#F5E6D4";
  const muted     = isDark ? "#888880" : "#C4A882";
  const accent    = isDark ? "#F0C040" : "#C9A84C";

  return (
    <footer style={{ backgroundColor: footerBg, borderTop: `1px solid ${footerBd}` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">

        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: accent, color: isDark ? "#080808" : "#1C0F08" }}
            >
              L
            </div>
            <h3 className="font-bold text-sm" style={{ color: text, fontFamily: "Georgia, serif" }}>
              City Library
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: muted }}>
            Your local community library. Discover thousands of books, apply for
            membership, and start borrowing today. Open to all students, faculty, and staff.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: muted }}>
            Quick Links
          </h3>
          <ul className="space-y-2">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm transition-colors duration-150"
                  style={{ color: muted }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = accent)}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = muted)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: muted }}>
            Opening Hours
          </h3>
          <ul className="space-y-2">
            {HOURS.map((h) => (
              <li key={h.day} className="flex justify-between text-sm" style={{ color: muted }}>
                <span>{h.day}</span>
                <span style={{ color: text }}>{h.time}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs mt-3" style={{ color: `${muted}80` }}>Closed on public holidays</p>
        </div>

      </div>

      <div
        className="text-center text-xs py-4"
        style={{ borderTop: `1px solid ${footerBd}`, color: `${muted}70` }}
      >
        © {new Date().getFullYear()} City Library. All rights reserved.
      </div>
    </footer>
  );
}
