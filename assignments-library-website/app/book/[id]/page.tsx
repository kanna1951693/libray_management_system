"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BookCard } from "@/components/search/BookCard";
import { motion } from "framer-motion";

type BookCopy = {
  id: string;
  bookId: string;
  barcode: string;
  status: "AVAILABLE" | "CHECKED_OUT" | "ON_HOLD" | "LOST";
  location: string | null;
};

type Book = {
  id: string; title: string; author: string; isbn: string;
  category: string; publisher: string; year: number; language: string;
  pages: number | null; location: string | null; description: string | null;
  coverImage: string | null; totalCopies: number; availableCopies: number;
  copies: BookCopy[];
};

export default function BookDetailPage() {
  const { id }           = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [book,    setBook]    = useState<Book | null>(null);
  const [related, setRelated] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track holds owned by current user
  const [myHoldCopies, setMyHoldCopies] = useState<Set<string>>(new Set());
  const [placingCopyId, setPlacingCopyId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((r) => r.json())
      .then(({ book, related }) => {
        setBook(book);
        setRelated(related);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (session) {
      fetch("/api/holds")
        .then((r) => r.json())
        .then((holdsList) => {
          const copyIds = new Set<string>(
            holdsList.map((h: any) => h.copyId).filter(Boolean)
          );
          setMyHoldCopies(copyIds);
        })
        .catch(console.error);
    }
  }, [session, id]);

  async function placeHold(copyId: string) {
    if (!session) { window.location.href = "/login"; return; }
    setPlacingCopyId(copyId);
    try {
      const res = await fetch("/api/holds", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookId: id, copyId }),
      });
      if (res.ok) {
        setMyHoldCopies(prev => {
          const next = new Set(prev);
          next.add(copyId);
          return next;
        });
        // Optimistically update status to ON_HOLD
        if (book) {
          setBook({
            ...book,
            copies: book.copies.map(c => 
              c.id === copyId ? { ...c, status: "ON_HOLD" } : c
            ),
            availableCopies: Math.max(0, book.availableCopies - 1)
          });
        }
      } else {
        const err = await res.json();
        alert(err.error || "Failed to place hold");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPlacingCopyId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen pt-24 text-center text-gray-400">
        <p className="text-xl mb-4 font-medium">Book not found</p>
        <Link href="/search" className="text-blue-400 mt-4 inline-block">← Back to search</Link>
      </div>
    );
  }

  const available = book.availableCopies > 0;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-5xl mx-auto">
      <Link href="/search" className="text-gray-400 hover:text-white text-sm mb-8 inline-block transition-colors">
        ← Back to search
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-3 gap-10"
      >
        {/* Cover */}
        <div className="md:col-span-1">
          <div className="glass rounded-2xl overflow-hidden aspect-[3/4] flex items-center justify-center bg-gradient-to-br from-blue-900/40 to-purple-900/40">
            {book.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">No Cover Image</div>
                <p className="text-gray-400 text-sm">{book.title}</p>
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="mt-4 glass rounded-xl p-4">
            <div className={`flex items-center gap-2 mb-2 ${available ? "text-green-400" : "text-red-400"}`}>
              <div className={`w-2 h-2 rounded-full ${available ? "bg-green-400" : "bg-red-400"}`} />
              <span className="font-medium text-sm">{available ? "Available" : "All copies checked out"}</span>
            </div>
            <p className="text-gray-400 text-xs">{book.availableCopies} of {book.totalCopies} copies available</p>
            {book.location && (
              <p className="text-gray-400 text-xs mt-1">Location: {book.location}</p>
            )}
          </div>

          {/* Action */}
          <a
            href="#copies-section"
            className="w-full mt-3 py-3 rounded-xl font-medium text-sm transition-all bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer text-center hover:scale-[1.02] active:scale-[0.98]"
          >
            Select Copy to Hold
          </a>
          {!session && (
            <p className="text-gray-500 text-xs text-center mt-2">
              <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link> to place a hold
            </p>
          )}
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 mb-3 inline-block">
            {book.category}
          </span>
          <h1 className="font-serif text-3xl font-bold mb-2 leading-tight">{book.title}</h1>
          <p className="text-gray-400 text-lg mb-6">by {book.author}</p>

          {book.description && (
            <div className="mb-8">
              <h2 className="font-semibold mb-2 text-sm uppercase tracking-widest text-gray-400">Description</h2>
              <p className="text-gray-300 leading-relaxed text-sm">{book.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              ["Publisher",  book.publisher],
              ["Year",       String(book.year)],
              ["ISBN",       book.isbn],
              ["Language",   book.language],
              ...(book.pages ? [["Pages", String(book.pages)]] : []),
            ].map(([label, value]) => (
              <div key={label} className="glass rounded-xl px-4 py-3">
                <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                <p className="text-white text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Copies Section */}
      <motion.div
        id="copies-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-16 glass rounded-2xl p-6"
      >
        <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-3">
          <span>Library Copies & Availability</span>
          <span className="text-sm font-sans font-normal text-gray-400">
            ({book.copies?.length || 0} copies total)
          </span>
        </h2>

        {!book.copies || book.copies.length === 0 ? (
          <p className="text-gray-400 text-sm">No copies cataloged for this book.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Barcode / Copy ID</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30 text-sm">
                {book.copies.map((copy) => {
                  const isMyHold = myHoldCopies.has(copy.id);
                  const isPlacing = placingCopyId === copy.id;
                  
                  let statusColor = "text-gray-400 bg-gray-500/10";
                  let statusText: string = copy.status;
                  
                  if (copy.status === "AVAILABLE") {
                    statusColor = "text-green-400 bg-green-500/10";
                    statusText = "Available";
                  } else if (copy.status === "CHECKED_OUT") {
                    statusColor = "text-red-400 bg-red-500/10";
                    statusText = "Checked Out";
                  } else if (copy.status === "ON_HOLD") {
                    statusColor = "text-yellow-400 bg-yellow-500/10";
                    statusText = "On Hold";
                  } else if (copy.status === "LOST") {
                    statusColor = "text-red-500 bg-red-900/20";
                    statusText = "Lost";
                  }

                  return (
                    <tr key={copy.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 font-mono text-xs font-semibold text-gray-300">
                        {copy.barcode}
                      </td>
                      <td className="py-4 px-4 text-gray-400">
                        {copy.location || book.location || "General Stacks"}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            copy.status === "AVAILABLE" ? "bg-green-400" :
                            copy.status === "CHECKED_OUT" ? "bg-red-400" :
                            copy.status === "ON_HOLD" ? "bg-yellow-400" : "bg-red-500"
                          }`} />
                          {statusText}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {isMyHold ? (
                          <span className="text-xs font-semibold text-green-400 bg-green-950/30 border border-green-500/30 px-3 py-1.5 rounded-lg inline-block">
                            ✓ Your Hold
                          </span>
                        ) : (
                          <button
                            onClick={() => placeHold(copy.id)}
                            disabled={copy.status !== "AVAILABLE" || isPlacing}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              copy.status === "AVAILABLE"
                                ? "bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-[0.98]"
                                : "bg-gray-800 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            {isPlacing ? "Placing..." : copy.status === "AVAILABLE" ? "Place Hold" : "Unavailable"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold mb-6">More in {book.category}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((r) => <BookCard key={r.id} book={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}
