"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      window.location.href = "/admin/dashboard";
    } catch {
      setMessage("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080710] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
        <a
          href="/"
          className="mb-10 text-center text-3xl font-bold tracking-tight"
        >
          gather<span className="text-violet-400">.</span>
        </a>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl sm:p-10">
          <div className="mb-8">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-violet-400">
              Administration
            </p>

            <h1 className="text-3xl font-bold">Welcome back</h1>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              Sign in to manage events and keep your community connected.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-gray-300"
              >
                Admin email
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 outline-none transition placeholder:text-gray-600 focus:border-violet-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-gray-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your admin password"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 outline-none transition placeholder:text-gray-600 focus:border-violet-400"
              />
            </div>

            {message && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 px-5 py-4 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to Admin"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Authorized administrators only.
          </p>
        </div>

        <a
          href="/"
          className="mt-6 text-center text-sm text-gray-400 transition hover:text-white"
        >
          ← Back to events
        </a>
      </div>
    </main>
  );
}