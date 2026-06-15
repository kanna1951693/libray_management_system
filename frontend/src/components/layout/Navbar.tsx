"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useTheme } from "@/components/ThemeContext";
import { usePathname } from "next/navigation";
import { GradientButtonGroup } from "@/components/ui/gradient-button-group";

const NAV_LINKS = [
  { label: "Home",        href: "/" },
  { label: "Search",      href: "/search" },
  { label: "Rules",       href: "/membership/rules" },
];

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const user = session?.user as any;

  const navText  = isDark ? "#F5F5F0" : "#1C0F08";
  const navMuted = isDark ? "#888880" : "#7A5C3F";
  const accent   = isDark ? "#F0C040" : "#7A3B1E";
  const border   = isDark ? "rgba(255,255,255,0.08)" : "rgba(180,140,90,0.18)";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pointer-events-none">
        <nav
          className="max-w-7xl mx-auto rounded-full border shadow-xl backdrop-blur-md transition-colors duration-300 py-1.5 px-6 flex items-center justify-between pointer-events-auto"
          style={{
            backgroundColor: isDark ? "rgba(10,10,12,0.85)" : "rgba(253,252,248,0.85)",
            borderColor: border,
          }}
        >
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-transform duration-300 hover:rotate-12"
              style={{
                backgroundColor: accent,
                color: isDark ? "#080808" : "#FDFCF8",
                boxShadow: isDark ? "0 2px 10px rgba(240,192,64,0.2)" : "0 2px 10px rgba(122,59,30,0.15)",
              }}
            >
              L
            </div>
            <div className="leading-none hidden sm:block">
              <p className="text-sm font-black tracking-tight" style={{ color: navText, fontFamily: "Georgia, serif" }}>
                City Library
              </p>
            </div>
          </Link>

          {/* ── Centered Gradient Navigation Dock (Desktop) ── */}
          <div className="hidden md:block flex-1 max-w-lg mx-auto">
            <GradientButtonGroup />
          </div>

          {/* ── Right Actions ── */}
          <div className="flex items-center gap-4 shrink-0">
            {session ? (
              /* User Menu */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                  style={{
                    color: navText,
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${border}`,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: accent,
                      color: isDark ? "#080808" : "#FDFCF8",
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                  <span className="hidden sm:inline">{user?.name?.split(" ")[0]}</span>
                  <ChevronDown />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden shadow-xl border backdrop-blur-lg"
                    style={{
                      backgroundColor: isDark ? "rgba(17,17,19,0.95)" : "rgba(255,248,240,0.95)",
                      borderColor: border,
                    }}
                  >
                    <Link
                      href={user?.role === "ADMIN" ? "/admin" : "/dashboard"}
                      className="flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: navText }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      My Portal
                    </Link>
                    <hr style={{ borderColor: border }} />
                    <button
                      onClick={() => { signOut({ callbackUrl: "/" }); setUserMenuOpen(false); }}
                      className="flex items-center gap-2 px-4 py-3 text-xs font-semibold w-full text-left transition-colors text-red-500 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Sign In Button */
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: accent,
                  color: isDark ? "#080808" : "#FDFCF8",
                  boxShadow: isDark ? "0 2px 10px rgba(240,192,64,0.2)" : "0 2px 10px rgba(122,59,30,0.15)",
                }}
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Open menu"
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-full border transition-all"
              style={{
                color: navText,
                borderColor: border,
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
              }}
            >
              <span className={`block w-4 h-0.5 rounded-full bg-current transition-transform duration-300 ${mobileOpen ? "rotate-45 translate-y-1" : ""}`} />
              <span className={`block w-4 h-0.5 rounded-full bg-current transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block w-4 h-0.5 rounded-full bg-current transition-transform duration-300 ${mobileOpen ? "-rotate-45 -translate-y-1" : ""}`} />
            </button>
          </div>
        </nav>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed top-[76px] left-4 right-4 z-50 rounded-3xl border shadow-2xl backdrop-blur-xl p-5 flex flex-col gap-2 transition-all duration-300"
          style={{
            borderColor: border,
            backgroundColor: isDark ? "rgba(15,15,18,0.96)" : "rgba(253,252,248,0.96)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: isActive(link.href) ? accent : navMuted }}
            >
              {link.label}
            </Link>
          ))}
          {!session && (
            <Link
              href="/membership/apply"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: navMuted }}
            >
              Join Library
            </Link>
          )}
          {session && (
            <Link
              href={user?.role === "ADMIN" ? "/admin" : "/dashboard"}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: navMuted }}
            >
              {user?.role === "ADMIN" ? "Admin Portal" : "My Portal"}
            </Link>
          )}
          {session && (
            <button
              onClick={() => {
                signOut({ callbackUrl: "/" });
                setMobileOpen(false);
              }}
              className="px-4 py-3 text-left rounded-xl text-sm font-semibold text-red-500 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              Sign Out
            </button>
          )}
        </div>
      )}

      {/* Click-outside to close user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  );
}
