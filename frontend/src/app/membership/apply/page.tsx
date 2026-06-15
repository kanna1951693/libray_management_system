"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

export default function ApplyPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({
    name: "", email: "", aadharNumber: "", phone: "", otpCode: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  function change(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSendOtp() {
    if (!form.phone.trim()) {
      setOtpError("Please enter your phone number first.");
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const res = await fetch("/api/membership/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone.trim() }),
      });
      const data = await res.json();
      setOtpLoading(false);

      if (res.ok) {
        setOtpSent(true);
        setOtpSuccess("Verification OTP sent via WhatsApp! Check your logs/messages.");
        setCountdown(60);
      } else {
        setOtpError(data.error ?? "Failed to send verification code. Please check your number.");
      }
    } catch (err) {
      setOtpLoading(false);
      setOtpError("An error occurred. Please try again.");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please agree to the library rules before submitting."); return; }
    if (!otpSent) { setError("Please verify your phone number first by sending and entering the OTP."); return; }
    if (form.otpCode.length !== 6) { setError("Verification code must be exactly 6 digits."); return; }
    
    setLoading(true);
    setError(null);

    const res = await fetch("/api/membership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess(`Application submitted! Your membership ID is ${data.membershipId}. You will receive login credentials by email once approved.`);
    } else {
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  if (session) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 max-w-lg mx-auto flex flex-col items-center justify-center text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Already Registered</h1>
        <p className="text-gray-300 leading-relaxed mb-8">
          You are currently signed in as <strong>{session.user?.name}</strong>. Active members or administrators do not need to apply for membership.
        </p>
        <Link 
          href={(session.user as any).role === "ADMIN" ? "/admin" : "/dashboard"} 
          className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-medium transition-colors"
        >
          Go to {(session.user as any).role === "ADMIN" ? "Admin Panel" : "My Account"}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 max-w-lg mx-auto flex flex-col items-center justify-center text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Application Submitted!</h1>
        <p className="text-gray-300 leading-relaxed mb-8">{success}</p>
        <Link href="/" className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 font-medium transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 max-w-xl mx-auto">
      <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Home</Link>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6"
      >
        <h1 className="font-serif text-4xl font-bold mb-2">Apply for Membership</h1>
        <p className="text-gray-400 mb-8">
          Fill in the form below. A librarian will review your application and send you login
          credentials within one working day.
        </p>

        <form onSubmit={submit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name *</label>
            <input
              name="name" value={form.name} onChange={change} required
              placeholder="As on your government ID"
              className="w-full glass px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email Address *</label>
            <input
              name="email" type="email" value={form.email} onChange={change} required
              placeholder="you@example.com"
              className="w-full glass px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Aadhar Number */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Aadhar Number *</label>
            <input
              name="aadharNumber" value={form.aadharNumber} onChange={change} required
              placeholder="12-digit UID (e.g. 123456789012)"
              pattern="\d{12}"
              maxLength={12}
              className="w-full glass px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Phone with Verification */}
          <div className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Phone Number (WhatsApp) *</label>
                <input
                  name="phone" type="tel" value={form.phone} onChange={change} required
                  placeholder="e.g. +919876543210"
                  className="w-full glass px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <button
                type="button"
                disabled={otpLoading || countdown > 0 || !form.phone}
                onClick={handleSendOtp}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold transition-all whitespace-nowrap h-[46px] flex items-center justify-center min-w-[100px]"
              >
                {otpLoading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : countdown > 0 ? (
                  `Resend (${countdown}s)`
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>

            {otpSuccess && (
              <p className="text-xs text-green-400">{otpSuccess}</p>
            )}
            {otpError && (
              <p className="text-xs text-red-400">{otpError}</p>
            )}
          </div>

          {/* OTP Input Field */}
          <AnimatePresence>
            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <label className="block text-sm text-gray-400 mb-1">Verification OTP Code *</label>
                <input
                  name="otpCode" value={form.otpCode} onChange={change} required
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  pattern="\d{6}"
                  className="w-full glass px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono tracking-[0.25em] text-center"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rules agreement */}
          <div className="glass rounded-xl p-4">
            <label className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 accent-blue-500 shrink-0"
              />
              <span className="text-sm text-gray-300">
                I have read and agree to the{" "}
                <Link href="/membership/rules" className="text-blue-400 hover:underline" target="_blank">
                  library rules and policies
                </Link>
                . I understand the borrowing limits, fine policy, and my responsibilities as a member.
              </span>
            </label>
          </div>

          {error && (
            <div className="glass border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !otpSent}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? "Submitting…" : "Submit Application"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
