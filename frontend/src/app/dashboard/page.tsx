"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatDate, daysUntil } from "@/lib/utils";

type Loan = {
  id: string;
  dueDate: string;
  status: "ACTIVE" | "OVERDUE";
  fine: number;
  book: { id: string; title: string; author: string; coverImage: string | null };
};

type Hold = {
  id: string;
  position: number;
  status: "WAITING" | "READY" | "EXPIRED";
  expiresAt: string | null;
  requestedAt: string;
  book: { id: string; title: string; author: string };
  copy: { id: string; barcode: string } | null;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [holds, setHolds] = useState<Hold[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingMap, setCancellingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/dashboard/loans").then((r) => r.json()),
      fetch("/api/holds").then((r) => r.json()),
    ]).then(([loansData, holdsData]) => {
      setLoans(loansData);
      setHolds(holdsData);
      setLoading(false);
    });
  }, [status]);

  async function handleCancelHold(holdId: string) {
    if (!confirm("Are you sure you want to cancel this hold?")) return;

    setCancellingMap((prev) => ({ ...prev, [holdId]: true }));
    try {
      const res = await fetch("/api/holds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdId }),
      });
      if (res.ok) {
        setHolds((prev) => prev.filter((h) => h.id !== holdId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel hold.");
      }
    } catch {
      alert("Failed to cancel hold due to network error.");
    } finally {
      setCancellingMap((prev) => ({ ...prev, [holdId]: false }));
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 max-w-4xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-2">
            <div className="h-8 w-40 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="h-4 w-32 rounded-lg bg-white/5 animate-pulse" />
        </div>
        {/* Loans skeleton */}
        <section className="mb-10">
          <div className="h-5 w-32 rounded-lg bg-white/5 animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-14 rounded-lg bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-white/5" />
                  <div className="h-3 w-32 rounded bg-white/5" />
                </div>
                <div className="space-y-2 text-right shrink-0">
                  <div className="h-4 w-20 rounded bg-white/5" />
                  <div className="h-3 w-24 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Holds skeleton */}
        <section>
          <div className="h-5 w-24 rounded-lg bg-white/5 animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-white/5" />
                  <div className="h-3 w-32 rounded bg-white/5" />
                </div>
                <div className="h-3 w-24 rounded bg-white/5 shrink-0" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }


  const overdue    = loans.filter((l) => l.status === "OVERDUE");
  const totalFines = overdue.reduce((s, l) => s + l.fine, 0);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-3xl font-bold">My Account</h1>
          <p className="text-gray-400 text-sm mt-1">
            {(session?.user as any)?.membershipId} · {session?.user?.name}
          </p>
        </div>
        <Link
          href="/dashboard/history"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Borrowing History →
        </Link>
      </div>

      {/* Fine banner */}
      {totalFines > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 glass border border-red-500/30 rounded-2xl p-4 flex items-center gap-4"
        >
          <div>
            <p className="font-semibold text-red-400">Outstanding Fine: ₹{totalFines}</p>
            <p className="text-gray-400 text-sm">Please clear your fines at the library counter to continue borrowing.</p>
          </div>
        </motion.div>
      )}

      {/* Active Loans */}
      <section className="mb-10">
        <h2 className="font-semibold text-lg mb-4">
          Active Loans
          <span className="ml-2 text-xs text-gray-400 font-normal">{loans.length} of 5 slots used</span>
        </h2>

        {loans.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-gray-400">
            <p>No active loans. <Link href="/search" className="text-blue-400 hover:underline">Browse the catalog →</Link></p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => {
              const days = daysUntil(loan.dueDate);
              const urgent = days <= 2 && loan.status === "ACTIVE";
              return (
                <div
                  key={loan.id}
                  className={`glass rounded-xl p-4 flex items-center gap-4 ${
                    loan.status === "OVERDUE" ? "border border-red-500/30" : urgent ? "border border-yellow-500/30" : ""
                  }`}
                >
                  <div className="w-10 h-14 glass rounded-lg flex items-center justify-center text-[9px] font-mono text-gray-500 uppercase tracking-wider shrink-0">Book</div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/book/${loan.book.id}`} className="font-medium text-sm hover:text-blue-400 transition-colors line-clamp-1">
                      {loan.book.title}
                    </Link>
                    <p className="text-gray-400 text-xs">{loan.book.author}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium ${
                      loan.status === "OVERDUE" ? "text-red-400"
                      : urgent ? "text-yellow-400"
                      : "text-gray-300"
                    }`}>
                      {loan.status === "OVERDUE"
                        ? `Overdue · ₹${loan.fine} fine`
                        : days === 0 ? "Due today"
                        : days < 0  ? `${Math.abs(days)}d overdue`
                        : `${days}d left`}
                    </p>
                    <p className="text-gray-500 text-xs">Due {formatDate(loan.dueDate)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Holds */}
      <section>
        <h2 className="font-semibold text-lg mb-4">
          My Holds
          <span className="ml-2 text-xs text-gray-400 font-normal">{holds.length} in queue</span>
        </h2>

        {holds.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-gray-400">
            <p>No holds placed. <Link href="/search" className="text-blue-400 hover:underline">Search for books →</Link></p>
          </div>
        ) : (
          <div className="space-y-3">
            {holds.map((hold) => (
              <div key={hold.id} className={`glass rounded-xl p-4 flex items-center gap-4 border transition-all ${
                hold.status === "READY" ? "border-green-500/25" : "border-transparent"
              }`}>
                {hold.status === "READY" ? (
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-400 shrink-0 animate-pulse">
                    ✓
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-sm font-bold text-blue-400 shrink-0">
                    #{hold.position}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/book/${hold.book.id}`} className="font-medium text-sm hover:text-blue-400 transition-colors line-clamp-1">
                    {hold.book.title}
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="text-gray-400 text-xs">{hold.book.author}</p>
                    {hold.copy && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-400 font-mono">
                        Copy: {hold.copy.barcode}
                      </span>
                    )}
                    {hold.status === "READY" ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 font-semibold animate-pulse">
                        Ready for Pickup
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                        In Queue
                      </span>
                    )}
                  </div>
                  {hold.status === "READY" && hold.expiresAt && (
                    <p className="text-[10px] text-green-400/80 mt-1">
                      Pick up by {formatDate(hold.expiresAt)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block mr-1">
                    <p className="text-gray-400 text-[10px]">Requested</p>
                    <p className="text-gray-500 text-[10px] font-medium">{formatDate(hold.requestedAt)}</p>
                  </div>
                  <button
                    onClick={() => handleCancelHold(hold.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                    style={{
                      borderColor: "rgba(239, 68, 68, 0.2)",
                      background: "rgba(239, 68, 68, 0.05)",
                      color: "#EF4444",
                    }}
                    disabled={cancellingMap[hold.id]}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
                    }}
                  >
                    {cancellingMap[hold.id] ? "Cancelling…" : "Cancel"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
