"use client"

import { useEffect, useState } from "react"
import { animate, useMotionValue, motion } from "framer-motion"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/ThemeContext"


// Theme-aware color configurations
const themes = {
  dark: {
    bg: "#111113",
    containerBg: "#141416",
    underLayerBg: "#101012",
    borderFrom: "#0a0a0b",
    borderVia: "#1a1a1c",
    borderTo: "#252527",
    wellBg: "#0a0a0b",
    innerRingBg: "#0c0c0d",
    buttonBg: "#111113",
    textActive: "text-white",
    textInactive: "text-[#6b6b6d] hover:text-zinc-400",
    iconColor: "text-white hover:text-zinc-300",
  },
  light: {
    bg: "#f5f5f7",
    containerBg: "#ffffff",
    underLayerBg: "#e8e8ea",
    borderFrom: "#d0d0d5",
    borderVia: "#e5e5e8",
    borderTo: "#f0f0f2",
    wellBg: "#e0e0e3",
    innerRingBg: "#d8d8db",
    buttonBg: "#f0f0f2",
    textActive: "text-zinc-900",
    textInactive: "text-zinc-400 hover:text-zinc-600",
    iconColor: "text-zinc-700 hover:text-zinc-900",
  },
}

interface NavItem {
  id: string
  icon: React.ReactNode
  label: string
  url: string
}

function InnerButtonOverlay({
  isOverlayActive,
  isDarkMode,
}: {
  isOverlayActive: boolean
  isDarkMode: boolean
}) {
  const overlayProgress = useMotionValue(isOverlayActive ? 1 : 0)

  useEffect(() => {
    const controls = animate(overlayProgress, isOverlayActive ? 1 : 0, {
      delay: isOverlayActive ? 0.02 : 0,
      duration: isOverlayActive ? 0.18 : 0.14,
      ease: "easeOut",
    })

    return () => controls.stop()
  }, [isOverlayActive, overlayProgress])

  return (
    <motion.span
      initial={false}
      className="absolute inset-0 rounded-[10px]"
      animate={
        isOverlayActive
          ? {
              borderWidth: 1,
              borderColor: isDarkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)",
            }
          : {
              borderWidth: 0,
              borderColor: "transparent",
              boxShadow: "none",
            }
      }
      transition={{
        borderColor: {
          duration: 0.16,
          ease: "easeOut",
        },
      }}
      style={{
        borderStyle: "solid",
      }}
    />
  )
}

export function GradientButtonGroup() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [activeId, setActiveId] = useState("home")
  const [overlayReadyId, setOverlayReadyId] = useState<string | null>("home")
  const { theme: globalTheme, toggleTheme } = useTheme()
  const isDarkMode = globalTheme === "dark"

  const theme = isDarkMode ? themes.dark : themes.light

  // Dynamically resolve account page url
  const accountUrl = session
    ? (session.user as any).role === "ADMIN"
      ? "/admin"
      : "/dashboard"
    : "/membership/apply"

  const navItems: NavItem[] = [
    {
      id: "home",
      label: "Home",
      url: "/",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          focusable="false"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      id: "search",
      label: "Search Books",
      url: "/search",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      ),
    },
    {
      id: "rules",
      label: "Rules",
      url: "/membership/rules",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          focusable="false"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      id: "account",
      label: session ? "My Account" : "Join Library",
      url: accountUrl,
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          focusable="false"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  ]

  // Synchronize state with current URL pathname
  useEffect(() => {
    const matched = navItems.find((item) => {
      if (item.url === "/") return pathname === "/"
      return pathname.startsWith(item.url)
    })
    if (matched) {
      setActiveId(matched.id)
      setOverlayReadyId(matched.id)
    }
  }, [pathname, session])

  return (
    <div className="flex w-full justify-center py-1">
      <div className="inline-flex min-w-max origin-center scale-[0.85] items-center sm:scale-[0.9] md:scale-[0.95] lg:scale-100">
        <div className="relative inline-flex items-center">
          {/* Background tray layer (recessed) - spans full width including theme toggle */}
          <div
            className="absolute inset-0 z-0 rounded-[28px] transition-colors duration-300"
            style={{
              background: isDarkMode
                ? "linear-gradient(180deg, #141416 0%, #111113 50%, #0e0e10 100%)"
                : "linear-gradient(180deg, #d1d1d6 0%, #cacad0 50%, #c3c3c9 100%)",
              boxShadow: isDarkMode
                ? "inset 0 2px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04)"
                : "inset 0 2px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.55)",
            }}
          />

          {/* Foreground nav layer (raised) - sits on the left */}
          <div className="relative flex z-10">
            {/* Outer rim/bezel */}
            <div
              className="absolute -inset-[4px] rounded-[28px] border-[1px] bg-neutral-900 transition-colors duration-300"
              style={{
                borderColor: isDarkMode
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.08)",
              }}
            />

            {/* Inner container */}
            <nav
              className="relative inline-flex items-center gap-3 rounded-[24px] p-1.5 transition-colors duration-300"
              style={{
                background: isDarkMode
                  ? "linear-gradient(180deg, #1c1c1f 0%, #17171a 52%, #131316 100%)"
                  : "linear-gradient(180deg, #ffffff 0%, #fefeff 52%, #fcfcfe 100%)",
                borderTop: isDarkMode
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(255,255,255,1)",
                boxShadow: isDarkMode
                  ? "none"
                  : "0 1px 2px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,1)",
              }}
            >
              {navItems.map((item) => {
                const isActive = activeId === item.id
                const isOverlayActive = isActive && overlayReadyId === item.id

                const wellStyle = isDarkMode
                  ? {
                      background:
                        "linear-gradient(180deg, #0a0a0c 0%, #0e0e10 50%, #0c0c0e 100%)",
                      boxShadow:
                        "inset 0 2px 6px rgba(0,0,0,0.9), inset 0 0 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)",
                    }
                  : {
                      background: "#e0e0e3",
                      boxShadow:
                        "inset 0 2px 6px rgba(0,0,0,0.12), inset 0 0 4px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.9)",
                    }

                const innerGapStyle = isDarkMode
                  ? {
                      background: "#0a0a0d",
                      boxShadow:
                        "inset 0 1px 3px rgba(0,0,0,0.9), inset 0 0 2px rgba(0,0,0,0.6)",
                    }
                  : {
                      background: "#d8d8db",
                      boxShadow:
                        "inset 0 1px 3px rgba(0,0,0,0.18), inset 0 0 2px rgba(0,0,0,0.1)",
                    }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === activeId) {
                        return
                      }
                      setOverlayReadyId(null)
                      setActiveId(item.id)
                      router.push(item.url)
                    }}
                    className={cn(
                      "group/nav relative flex h-[64px] w-[64px] items-center justify-center rounded-[18px] transition-all duration-300",
                      isActive ? theme.textActive : theme.textInactive
                    )}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* Layered inset effect for active state - animated with layoutId */}
                    {isActive && (
                      <>
                        {/* Inset well/channel - creates the recessed groove */}
                        <motion.span
                          layoutId="active-well"
                          className="absolute inset-0 rounded-[18px] transition-colors duration-300"
                          style={wellStyle}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />

                        {/* Spinning ring container */}
                        <motion.span
                          layoutId="active-gold-ring"
                          className="absolute inset-[3px] overflow-hidden rounded-[15px]"
                          onLayoutAnimationComplete={() =>
                            setOverlayReadyId(item.id)
                          }
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        >
                          {/* Spinning gradient ring */}
                          <span
                            className="absolute inset-[-60%] origin-center will-change-transform animate-gold-spin"
                            style={{
                              background:
                                "conic-gradient(from 220deg, #6FF7CC 0%, #44EBCF 16%, #ADFA1F 33%, #C8FF5A 50%, #89F5A0 66%, #37D8C5 82%, #6FF7CC 100%)",
                            }}
                          />
                        </motion.span>

                        {/* Inner gap - thin channel between gold and button */}
                        <motion.span
                          layoutId="active-inner-ring"
                          className="absolute inset-[6px] rounded-[12px] transition-colors duration-300"
                          style={innerGapStyle}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      </>
                    )}

                    {/* Inner button background */}
                    <motion.span
                      initial={false}
                      className={cn(
                        "relative z-10 flex items-center justify-center rounded-[10px]",
                        isActive
                          ? "h-[calc(100%-14px)] w-[calc(100%-14px)]"
                          : "h-full w-full"
                      )}
                      animate={
                        isActive
                          ? {
                              scale: 1,
                              opacity: 1,
                            }
                          : {
                              scale: 0.985,
                              opacity: 0.96,
                            }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                        delay: isActive ? 0.12 : 0,
                      }}
                    >
                      <InnerButtonOverlay
                        isOverlayActive={isOverlayActive}
                        isDarkMode={isDarkMode}
                      />
                      <span className="relative z-10">{item.icon}</span>
                    </motion.span>
                  </button>
                )
              })}
            </nav>
            {/* Theme toggle - sits in the recessed tray on the right */}
            <div className="relative z-[1] flex items-center px-4">
              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  "relative flex h-[48px] w-[48px] items-center justify-center rounded-[16px] transition-colors",
                  theme.iconColor
                )}
                aria-label={
                  isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDarkMode ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="M4.93 4.93l1.41 1.41" />
                    <path d="M17.66 17.66l1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="M6.34 17.66l-1.41 1.41" />
                    <path d="M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-0 lg:hidden" />
    </div>
  )
}
