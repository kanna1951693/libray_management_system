"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function SidebarLogin() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === "CredentialsSignin"
          ? "Invalid credentials."
          : result.error
      );
    } else {
      window.location.reload();
    }
  }

  if (status === "loading") {
    return (
      <div className="glass rounded-2xl p-6 border border-white/10 shadow-lg text-center">
        <p className="text-gray-400 text-sm">Checking session...</p>
      </div>
    );
  }

  if (session) {
    const user = session.user as any;
    return (
      <div className="glass rounded-2xl p-6 border border-white/10 shadow-lg flex flex-col gap-4">
        <div className="border-b border-white/5 pb-3">
          <p className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-1">Signed In</p>
          <h4 className="font-semibold text-white truncate text-base">{user.name}</h4>
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
        </div>
        
        <div className="flex flex-col gap-2 text-sm">
          <Link
            href={user.role === "ADMIN" ? "/admin" : "/dashboard"}
            className="w-full text-center py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium text-white transition-colors"
          >
            Go to Portal
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-center py-2 rounded-xl border border-white/10 hover:border-red-500/50 hover:text-red-400 text-xs text-gray-300 transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 shadow-lg flex flex-col gap-4">
      <div>
        <h4 className="font-serif font-bold text-white text-base">Sign In</h4>
        <p className="text-xs text-gray-400">Access your library account</p>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] text-gray-400 font-medium uppercase mb-1">Email / ID</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="member@library.local"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500 text-xs transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] text-gray-400 font-medium uppercase mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500 text-xs transition-all"
          />
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg py-1.5 px-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-medium text-xs text-white transition-colors mt-2"
        >
          {loading ? "Signing in..." : "Log In"}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-white/5 flex flex-col gap-1 text-[11px] text-gray-400">
        <Link href="/membership/apply" className="text-blue-400 hover:underline">
          Apply for Membership
        </Link>
      </div>
    </div>
  );
}
