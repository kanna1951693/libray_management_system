"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Book = {
  id:              string;
  title:           string;
  author:          string;
  category:       string;
  year:           number;
  availableCopies: number;
  totalCopies:    number;
  coverImage:     string | null;
};

export function BookCarousel({ title, sortBy }: { title: string; sortBy: string }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await fetch(`/api/books?sort=${sortBy}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setBooks(data.books || []);
        }
      } catch (err) {
        console.error("Failed to load books for carousel", err);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, [sortBy]);

  const nextSlide = () => {
    if (books.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % books.length);
  };

  const prevSlide = () => {
    if (books.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + books.length) % books.length);
  };

  // Auto-scroll highlight book name
  const activeBook = books[currentIndex];

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 h-80 flex flex-col justify-center items-center animate-pulse">
        <p className="text-gray-400 text-sm">Loading arrivals...</p>
      </div>
    );
  }

  if (books.length === 0) {
    return null;
  }

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col mb-8 relative border border-white/10 shadow-xl">
      {/* Title Header bar */}
      <div className="bg-gradient-to-r from-blue-600/30 via-purple-600/10 to-transparent px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-white tracking-wide italic">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={prevSlide}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-600/50 flex items-center justify-center text-white border border-white/10 transition-colors"
            aria-label="Previous book"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button
            onClick={nextSlide}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-blue-600/50 flex items-center justify-center text-white border border-white/10 transition-colors"
            aria-label="Next book"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Main carousel display */}
      <div className="p-6 flex flex-col items-center justify-center min-h-[280px]">
        {/* Cover row centered around currentIndex */}
        <div className="flex items-center gap-6 justify-center w-full max-w-lg overflow-hidden py-4 relative">
          <div className="flex items-center gap-4 transition-all duration-500 ease-out">
            {/* Show left, center, right covers if available */}
            {[-1, 0, 1].map((offset) => {
              const bookIndex = (currentIndex + offset + books.length) % books.length;
              const book = books[bookIndex];
              const isCenter = offset === 0;

              return (
                <motion.div
                  key={book.id}
                  animate={{
                    scale: isCenter ? 1.05 : 0.82,
                    opacity: isCenter ? 1 : 0.45,
                    zIndex: isCenter ? 10 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`w-32 sm:w-36 aspect-[2/3] rounded-xl overflow-hidden glass border cursor-pointer relative shadow-lg flex-shrink-0 select-none ${
                    isCenter ? "border-blue-500/50 shadow-blue-500/10" : "border-white/10"
                  }`}
                  onClick={() => {
                    if (isCenter) {
                      // Click center to go to details
                      window.location.href = `/book/${book.id}`;
                    } else {
                      setCurrentIndex(bookIndex);
                    }
                  }}
                >
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-950/50 to-purple-950/50 flex flex-col items-center justify-center text-center p-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 mb-2"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
                      <span className="text-[10px] text-gray-500 uppercase font-semibold">No Cover</span>
                      <span className="text-[10px] text-gray-400 font-medium line-clamp-2 mt-1">{book.title}</span>
                    </div>
                  )}
                  {isCenter && (
                    <div className="absolute inset-0 bg-blue-500/5 hover:bg-transparent transition-colors" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected book strip */}
      <AnimatePresence mode="wait">
        {activeBook && (
          <motion.div
            key={activeBook.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="w-full bg-blue-600/90 text-white font-medium text-sm py-2 px-6 text-center select-none cursor-pointer hover:bg-blue-600 transition-colors"
            onClick={() => window.location.href = `/book/${activeBook.id}`}
          >
            {activeBook.title} <span className="text-white/60 font-normal">by {activeBook.author}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
