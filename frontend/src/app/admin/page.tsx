"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDate, daysUntil } from "@/lib/utils";
import { useTheme } from "@/components/ThemeContext";

type Member = {
  id: string; name: string; email: string; aadharNumber: string;
  department: string | null; membershipId: string; status: string;
  joinedAt: string; expiresAt: string; phone?: string | null;
};

type AdminLoan = {
  id: string; dueDate: string; status: string; issuedAt: string;
  book:   { id: string; title: string; author: string; coverImage: string | null };
  member: { id: string; name: string; email: string; membershipId: string };
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<"members" | "loans" | "add-book">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [loans,   setLoans]   = useState<AdminLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");

  const [bookForm, setBookForm] = useState({
    title: "", author: "", isbn: "", category: "", publisher: "",
    year: new Date().getFullYear(), totalCopies: 1,
    location: "", description: "", language: "English", pages: "", coverImage: "",
  });
  const [bookLoading, setBookLoading] = useState(false);
  const [bookSuccess, setBookSuccess] = useState<string | null>(null);
  const [bookError,   setBookError]   = useState<string | null>(null);
  const [uploading,   setUploading]   = useState(false);

  const [issueForm, setIssueForm] = useState({ membershipId: "", barcode: "" });
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  const CATEGORIES = [
    "Computer Science & Engineering","Electrical Engineering","Mechanical Engineering",
    "Civil Engineering","Physics","Chemistry","Mathematics","Biology",
    "Humanities & Social Sciences","Economics","Management","Fiction","Non-Fiction","History",
    "Children","Other",
  ];

  // ── Colours ───────────────────────────────────────────────────────────────
  const bg     = isDark ? "#080808" : "#FDFCF8";
  const text   = isDark ? "#F5F5F0" : "#1C0F08";
  const muted  = isDark ? "#888880" : "#7A5C3F";
  const accent = isDark ? "#F0C040" : "#7A3B1E";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(180,140,90,0.20)";
  const cardBg = isDark ? "rgba(17,17,17,0.95)"   : "rgba(255,248,240,0.95)";
  const inputBg= isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)";
  const tableTh= isDark ? "rgba(255,255,255,0.04)" : "rgba(122,59,30,0.06)";

  const STATUS_PILL: Record<string, { bg: string; color: string }> = {
    PENDING:   { bg: isDark ? "rgba(251,191,36,0.15)" : "rgba(180,130,0,0.10)",  color: isDark ? "#FBB724" : "#92650A" },
    ACTIVE:    { bg: isDark ? "rgba(34,197,94,0.15)"  : "rgba(22,163,74,0.10)",  color: isDark ? "#22C55E" : "#166534" },
    EXPIRED:   { bg: isDark ? "rgba(156,163,175,0.15)": "rgba(107,114,128,0.10)",color: isDark ? "#9CA3AF" : "#4B5563" },
    SUSPENDED: { bg: isDark ? "rgba(239,68,68,0.15)"  : "rgba(220,38,38,0.10)",  color: isDark ? "#EF4444" : "#B91C1C" },
    OVERDUE:   { bg: isDark ? "rgba(239,68,68,0.15)"  : "rgba(220,38,38,0.10)",  color: isDark ? "#EF4444" : "#B91C1C" },
    RETURNED:  { bg: isDark ? "rgba(34,197,94,0.15)"  : "rgba(22,163,74,0.10)",  color: isDark ? "#22C55E" : "#166534" },
  };

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role !== "ADMIN" && role !== "LIBRARIAN") {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/admin/members").then((r) => r.json()),
      fetch("/api/admin/loans").then((r) => r.json()),
    ]).then(([membersData, loansData]) => {
      setMembers(Array.isArray(membersData) ? membersData : []);
      setLoans(Array.isArray(loansData) ? loansData : []);
      setLoading(false);
    });
  }, [status]);

  async function updateStatus(memberId: string, newStatus: string) {
    await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, status: newStatus }),
    });
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m)));
  }

  async function markReturned(loanId: string) {
    const res = await fetch("/api/admin/loans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loanId }),
    });
    if (res.ok) {
      setLoans((prev) => prev.filter((l) => l.id !== loanId));
    }
  }

  async function handleIssueBook(e: React.FormEvent) {
    e.preventDefault();
    setIssueLoading(true); setIssueSuccess(null); setIssueError(null);

    try {
      const res = await fetch("/api/admin/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: issueForm.membershipId.trim(),
          barcode:      issueForm.barcode.trim(),
        }),
      });

      const data = await res.json();
      setIssueLoading(false);

      if (res.ok) {
        setIssueSuccess(`Book issued successfully! Due date: ${formatDate(data.dueDate)}`);
        setIssueForm({ membershipId: "", barcode: "" });
        
        // Refresh loans
        const loansRes = await fetch("/api/admin/loans");
        const loansData = await loansRes.json();
        setLoans(Array.isArray(loansData) ? loansData : []);
      } else {
        setIssueError(data.error || "Failed to issue book.");
      }
    } catch {
      setIssueLoading(false);
      setIssueError("An unexpected network error occurred.");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setBookError(null);
    setBookSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setBookForm((prev) => ({ ...prev, coverImage: data.url }));
      } else {
        setBookError(data.error || "Failed to upload image.");
      }
    } catch {
      setBookError("Failed to upload image due to network or server error.");
    } finally {
      setUploading(false);
    }
  }

  function handleBookChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setBookForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    setBookLoading(true); setBookSuccess(null); setBookError(null);

    if (bookForm.coverImage.trim()) {
      try { new URL(bookForm.coverImage.trim()); }
      catch {
        setBookError("Cover Image must be a valid URL (e.g. https://covers.openlibrary.org/...)");
        setBookLoading(false); return;
      }
    }

    const payload = {
      title: bookForm.title.trim(), author: bookForm.author.trim(),
      isbn: bookForm.isbn.trim(), category: bookForm.category,
      publisher: bookForm.publisher.trim(), year: Number(bookForm.year),
      totalCopies: Number(bookForm.totalCopies),
      pages: bookForm.pages ? Number(bookForm.pages) : undefined,
      coverImage: bookForm.coverImage.trim() || undefined,
      description: bookForm.description.trim() || undefined,
      location: bookForm.location.trim() || undefined,
      language: bookForm.language.trim() || undefined,
    };

    try {
      const res  = await fetch("/api/admin/books", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setBookLoading(false);
      if (res.ok) {
        setBookSuccess(data.updated
          ? `Inventory updated — added ${bookForm.totalCopies} copies to "${data.title}".`
          : `Book added: "${data.title}" (${data.isbn}).`
        );
        setBookForm({ title:"", author:"", isbn:"", category:"", publisher:"",
          year: new Date().getFullYear(), totalCopies:1, location:"",
          description:"", language:"English", pages:"", coverImage:"" });
      } else {
        setBookError(Array.isArray(data.error)
          ? data.error.map((err: any) => `${err.path.join(".")}: ${err.message}`).join(", ")
          : (data.error ?? "Failed to add book.")
        );
      }
    } catch {
      setBookLoading(false);
      setBookError("An unexpected server error occurred.");
    }
  }

  const filtered = filter === "ALL" ? members : members.filter((m) => m.status === filter);
  const counts   = {
    ALL:       members.length,
    PENDING:   members.filter((m) => m.status === "PENDING").length,
    ACTIVE:    members.filter((m) => m.status === "ACTIVE").length,
    SUSPENDED: members.filter((m) => m.status === "SUSPENDED").length,
  };
  const overdueCount = loans.filter((l) => l.status === "OVERDUE").length;

  const inputClass = "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2";
  const inputStyle = { background: inputBg, color: text, border: `1px solid ${border}` };

  // ── Skeleton loader ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4" style={{ background: bg }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <div className="h-4 w-24 rounded-full mb-3 animate-pulse" style={{ background: border }} />
            <div className="h-12 w-72 rounded-xl animate-pulse" style={{ background: border }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <div className="h-8 w-16 rounded-lg mb-2" style={{ background: border }} />
                <div className="h-3 w-24 rounded-full" style={{ background: border }} />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <div className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-full" style={{ background: border }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded" style={{ background: border }} />
                    <div className="h-3 w-32 rounded" style={{ background: border }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4" style={{ background: bg }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        {(() => {
          const role = (session?.user as any)?.role;
          const isLibrarian = role === "LIBRARIAN";
          return (
            <div className="flex items-start justify-between mb-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: accent }}>
                  {isLibrarian ? "Librarian Panel" : "Admin Panel"}
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl font-bold" style={{ color: text }}>
                  {isLibrarian ? "Librarian Dashboard" : "Admin Dashboard"}
                </h1>
              </div>
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full mt-2"
                style={{ background: isDark ? "rgba(240,192,64,0.12)" : "rgba(122,59,30,0.08)", color: accent, border: `1px solid ${accent}30` }}
              >
                {isLibrarian ? "Librarian Mode" : "Admin Mode"}
              </span>
            </div>
          );
        })()}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Total Members",    value: members.length,  color: accent },
            { label: "Pending Approval", value: counts.PENDING,  color: isDark ? "#FBB724" : "#92650A" },
            { label: "Active Members",   value: counts.ACTIVE,   color: isDark ? "#22C55E" : "#166534" },
            { label: "Suspended",        value: counts.SUSPENDED,color: isDark ? "#EF4444" : "#B91C1C" },
            { label: "Overdue Loans",    value: overdueCount,    color: isDark ? "#EF4444" : "#B91C1C" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <p className="text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs font-medium" style={{ color: muted }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Bar ── */}
        {(() => {
          const role = (session?.user as any)?.role;
          const isLibrarian = role === "LIBRARIAN";
          const allTabs = [
            { key: "members",  label: "Manage Members" },
            { key: "loans",    label: `Loans & Returns${overdueCount > 0 ? ` (${overdueCount} overdue)` : ""}` },
            { key: "add-book", label: "Add Book" },
          ];
          const visibleTabs = isLibrarian
            ? allTabs.filter((t) => t.key !== "add-book")
            : allTabs;
          return (
            <div
              className="flex gap-1 p-1 rounded-2xl mb-8 w-fit"
              style={{ background: cardBg, border: `1px solid ${border}` }}
            >
              {visibleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: activeTab === tab.key ? accent : "transparent",
                    color: activeTab === tab.key ? (isDark ? "#080808" : "#FDFCF8") : muted,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          );
        })()}

        {/* ══ TAB: MANAGE MEMBERS ══ */}
        {activeTab === "members" && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {(["ALL", "PENDING", "ACTIVE", "SUSPENDED"] as const).map((s) => {
                const pill = STATUS_PILL[s] ?? { bg: "transparent", color: muted };
                const isSelected = filter === s;
                return (
                  <button
                    key={s} onClick={() => setFilter(s)}
                    className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: isSelected ? accent : cardBg,
                      color: isSelected ? (isDark ? "#080808" : "#FDFCF8") : muted,
                      border: `1px solid ${isSelected ? accent : border}`,
                    }}
                  >
                    {s} <span className="opacity-70 ml-0.5">({counts[s] ?? members.length})</span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: tableTh, borderBottom: `1px solid ${border}` }}>
                      {["Member", "Aadhar Number", "Phone Number", "Membership ID", "Status", "Joined", "Actions"].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: accent }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16" style={{ color: muted }}>
                          No members in this category.
                        </td>
                      </tr>
                    ) : filtered.map((m, i) => (
                      <tr
                        key={m.id}
                        className="transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(122,59,30,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-sm" style={{ color: text }}>{m.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: muted }}>{m.email}</p>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono" style={{ color: muted }}>{m.aadharNumber}</td>
                        <td className="px-5 py-4 text-xs" style={{ color: muted }}>{m.phone || "—"}</td>
                        <td className="px-5 py-4 text-xs font-mono" style={{ color: muted }}>{m.membershipId}</td>
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: (STATUS_PILL[m.status] ?? STATUS_PILL.EXPIRED).bg, color: (STATUS_PILL[m.status] ?? STATUS_PILL.EXPIRED).color }}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: muted }}>{formatDate(m.joinedAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {m.status !== "ACTIVE" && (
                              <button onClick={() => updateStatus(m.id, "ACTIVE")}
                                className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                                style={{ background: "rgba(34,197,94,0.15)", color: isDark ? "#22C55E" : "#166534" }}>
                                Approve
                              </button>
                            )}
                            {m.status !== "SUSPENDED" && (
                              <button onClick={() => updateStatus(m.id, "SUSPENDED")}
                                className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                                style={{ background: "rgba(239,68,68,0.15)", color: isDark ? "#EF4444" : "#B91C1C" }}>
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB: LOANS & RETURNS ══ */}
        {activeTab === "loans" && (
          <>
            {/* ── Issue Book Form (Librarian only) ── */}
            {(session?.user as any)?.role === "LIBRARIAN" && (
            <div className="rounded-2xl p-6 mb-8" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <h2 className="font-serif text-xl font-bold mb-1" style={{ color: text }}>Issue a Book</h2>
              <p className="text-xs mb-5" style={{ color: muted }}>
                Enter the member's Membership ID and the book's physical barcode to check it out.
              </p>
              <form onSubmit={handleIssueBook} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Membership ID</label>
                  <input
                    required
                    placeholder="e.g. LIB-000001"
                    value={issueForm.membershipId}
                    onChange={(e) => setIssueForm((p) => ({ ...p, membershipId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{ background: inputBg, color: text, border: `1px solid ${border}` }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Book Barcode / Copy ID</label>
                  <input
                    required
                    placeholder="e.g. COPY-00001"
                    value={issueForm.barcode}
                    onChange={(e) => setIssueForm((p) => ({ ...p, barcode: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2"
                    style={{ background: inputBg, color: text, border: `1px solid ${border}` }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={issueLoading}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
                  style={{ background: accent, color: isDark ? "#080808" : "#FDFCF8" }}
                >
                  {issueLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Issuing…
                    </span>
                  ) : "Issue Book"}
                </button>
              </form>

              {issueSuccess && (
                <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(34,197,94,0.10)", color: isDark ? "#22C55E" : "#166534", border: "1px solid rgba(34,197,94,0.25)" }}>
                  ✓ {issueSuccess}
                </div>
              )}
              {issueError && (
                <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(239,68,68,0.10)", color: isDark ? "#EF4444" : "#B91C1C", border: "1px solid rgba(239,68,68,0.25)" }}>
                  ✗ {issueError}
                </div>
              )}
            </div>
            )}

            <p className="text-sm mb-6" style={{ color: muted }}>
              All currently active and overdue loans. Use &quot;Mark Returned&quot; to process a physical book return.
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: tableTh, borderBottom: `1px solid ${border}` }}>
                      {["Book", "Member", "Issued", "Due Date", "Status", "Action"].map((h) => (
                        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: accent }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16" style={{ color: muted }}>
                          No active loans.
                        </td>
                      </tr>
                    ) : loans.map((loan, i) => {
                      const days   = daysUntil(loan.dueDate);
                      const urgent = loan.status === "OVERDUE" || (loan.status === "ACTIVE" && days <= 2);
                      return (
                        <tr
                          key={loan.id}
                          className="transition-colors"
                          style={{ borderBottom: i < loans.length - 1 ? `1px solid ${border}` : "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(122,59,30,0.03)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-sm line-clamp-1" style={{ color: text }}>{loan.book.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: muted }}>{loan.book.author}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium" style={{ color: text }}>{loan.member.name}</p>
                            <p className="text-xs font-mono" style={{ color: muted }}>{loan.member.membershipId}</p>
                          </td>
                          <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: muted }}>{formatDate(loan.issuedAt)}</td>
                          <td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: urgent ? (isDark ? "#EF4444" : "#B91C1C") : muted }}>
                            {formatDate(loan.dueDate)}
                            {loan.status === "OVERDUE" && <span className="ml-1">({Math.abs(days)}d overdue)</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: (STATUS_PILL[loan.status] ?? STATUS_PILL.ACTIVE).bg, color: (STATUS_PILL[loan.status] ?? STATUS_PILL.ACTIVE).color }}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => markReturned(loan.id)}
                              className="px-3 py-1 rounded-lg text-xs font-bold transition-all hover:opacity-80"
                              style={{ background: "rgba(34,197,94,0.15)", color: isDark ? "#22C55E" : "#166534" }}
                            >
                              Mark Returned
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══ TAB: ADD BOOK ══ */}
        {activeTab === "add-book" && (
          <div className="max-w-2xl">
            <div className="rounded-2xl p-6 sm:p-8" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <h2 className="font-serif text-2xl font-bold mb-1" style={{ color: text }}>Add or Update Books</h2>
              <p className="text-sm mb-8" style={{ color: muted }}>
                If a book with the same ISBN already exists, its copy count will be incremented.
              </p>

              <form onSubmit={handleAddBook} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Book Title *</label>
                    <input name="title" value={bookForm.title} onChange={handleBookChange} required placeholder="e.g. Clean Code" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Author *</label>
                    <input name="author" value={bookForm.author} onChange={handleBookChange} required placeholder="e.g. Robert C. Martin" className={inputClass} style={inputStyle} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>ISBN (Unique Code) *</label>
                    <input name="isbn" value={bookForm.isbn} onChange={handleBookChange} required placeholder="e.g. 9780132350884" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Category *</label>
                    <select name="category" value={bookForm.category} onChange={handleBookChange} required className={inputClass} style={inputStyle}>
                      <option value="">Select category…</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Publisher *</label>
                    <input name="publisher" value={bookForm.publisher} onChange={handleBookChange} required placeholder="e.g. O'Reilly" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Year *</label>
                    <input name="year" type="number" min="1000" max={new Date().getFullYear() + 2} value={bookForm.year} onChange={handleBookChange} required className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Copies to Add *</label>
                    <input name="totalCopies" type="number" min="1" value={bookForm.totalCopies} onChange={handleBookChange} required className={inputClass} style={inputStyle} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Shelf Location</label>
                    <input name="location" value={bookForm.location} onChange={handleBookChange} placeholder="e.g. Shelf M-01" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Language</label>
                    <input name="language" value={bookForm.language} onChange={handleBookChange} placeholder="English" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Pages</label>
                    <input name="pages" type="number" min="1" value={bookForm.pages} onChange={handleBookChange} placeholder="e.g. 450" className={inputClass} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>
                    Cover Image
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        name="coverImage"
                        value={bookForm.coverImage}
                        onChange={handleBookChange}
                        placeholder="Paste image URL or use the upload button →"
                        className={inputClass}
                        style={inputStyle}
                        disabled={uploading}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="cover-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <label
                        htmlFor="cover-upload"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all border whitespace-nowrap"
                        style={{
                          background: isDark ? "rgba(240,192,64,0.08)" : "rgba(122,59,30,0.05)",
                          color: accent,
                          borderColor: isDark ? "rgba(240,192,64,0.2)" : "rgba(122,59,30,0.2)",
                          opacity: uploading ? 0.6 : 1,
                          pointerEvents: uploading ? "none" : "auto",
                        }}
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Uploading…</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Upload File</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  
                  {bookForm.coverImage && (
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-12 h-16 relative rounded-xl overflow-hidden border" style={{ borderColor: border }}>
                        <Image
                          src={bookForm.coverImage}
                          alt="Cover preview"
                          fill
                          className="object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold" style={{ color: text }}>Cover Preview</span>
                        <span className="text-[10px] font-mono opacity-60 truncate max-w-[200px] sm:max-w-md" style={{ color: muted }}>
                          {bookForm.coverImage}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: muted }}>Description</label>
                  <textarea name="description" value={bookForm.description} onChange={handleBookChange} placeholder="A brief overview of the book…" rows={3} className={`${inputClass} resize-none`} style={inputStyle} />
                </div>

                {bookSuccess && (
                  <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(34,197,94,0.10)", color: isDark ? "#22C55E" : "#166534", border: "1px solid rgba(34,197,94,0.25)" }}>
                    {bookSuccess}
                  </div>
                )}
                {bookError && (
                  <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(239,68,68,0.10)", color: isDark ? "#EF4444" : "#B91C1C", border: "1px solid rgba(239,68,68,0.25)" }}>
                    {bookError}
                  </div>
                )}

                <button type="submit" disabled={bookLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: accent, color: isDark ? "#080808" : "#FDFCF8" }}>
                  {bookLoading ? "Processing…" : "Upload Book"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
