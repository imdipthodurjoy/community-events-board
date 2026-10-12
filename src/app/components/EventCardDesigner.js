"use client";

import { useEffect, useState } from "react";

const THEMES = [
  {
    id: "default",
    name: "Classic",
    description: "Elegant purple gradient",
    preview:
      "linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)",
    textColor: "#ffffff",
  },
  {
    id: "dark",
    name: "Midnight",
    description: "Dark premium look",
    preview:
      "linear-gradient(135deg, #111827 0%, #312e81 100%)",
    textColor: "#ffffff",
  },
  {
    id: "colorful",
    name: "Festival",
    description: "Bright and energetic",
    preview:
      "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)",
    textColor: "#ffffff",
  },
];

const STICKERS = [
  { emoji: "🎉", name: "Party" },
  { emoji: "🎵", name: "Music" },
  { emoji: "🍔", name: "Food" },
  { emoji: "⚽", name: "Sports" },
  { emoji: "⭐", name: "Star" },
];

export default function EventCardDesigner({ event, onClose }) {
  const [theme, setTheme] = useState("default");
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedTheme =
    THEMES.find((item) => item.id === theme) || THEMES[0];

  const eventDate = event?.date
    ? new Date(event.date)
    : null;

  const formattedDate =
    eventDate && !Number.isNaN(eventDate.getTime())
      ? eventDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Date to be announced";

  const eventPrice =
    event?.price === null || event?.price === undefined
      ? "Price unavailable"
      : Number(event.price) === 0
        ? "Free Entry"
        : Number(event.price).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          });

  // Load the saved design from the database.
  useEffect(() => {
    let cancelled = false;

    async function loadDesign() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const response = await fetch(
          `/api/card-designs?eventId=${encodeURIComponent(event.id)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Could not load your saved design."
          );
        }

        if (cancelled) return;

        const savedTheme = data.design?.theme;
        const savedStickers = data.design?.stickers;

        setTheme(
          THEMES.some((item) => item.id === savedTheme)
            ? savedTheme
            : "default"
        );

        setStickers(
          Array.isArray(savedStickers)
            ? savedStickers
                .filter((item) =>
                  STICKERS.some((sticker) => sticker.emoji === item)
                )
                .slice(0, 3)
            : []
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Could not load your design. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (event?.id) {
      loadDesign();
    } else {
      setLoading(false);
      setError("Event information is missing.");
    }

    return () => {
      cancelled = true;
    };
  }, [event?.id]);

  function toggleSticker(emoji) {
    setError("");
    setSuccess("");

    setStickers((current) => {
      if (current.includes(emoji)) {
        return current.filter((item) => item !== emoji);
      }

      if (current.length >= 3) {
        setError("You can select a maximum of 3 stickers.");
        return current;
      }

      return [...current, emoji];
    });
  }

  async function saveDesign() {
    if (!event?.id) {
      setError("Event information is missing.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/card-designs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: Number(event.id),
          theme,
          stickers,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save your card design."
        );
      }

      setSuccess("Your event card design has been saved!");
    } catch (err) {
      setError(
        err.message || "Failed to save your design. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose?.();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="designer-title"
        className="my-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#100d1b] text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-purple-400">
              Gather Studio
            </p>

            <h2
              id="designer-title"
              className="text-2xl font-black sm:text-3xl"
            >
              Event Card Designer
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Personalize your event card with a theme and stickers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            disabled={saving}
            aria-label="Close event card designer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Main content */}
        <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_1.05fr]">
          {/* Settings */}
          <div className="space-y-7">
            {/* Theme selector */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold">Choose a theme</h3>
                <span className="text-xs text-gray-500">3 themes</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {THEMES.map((item) => {
                  const active = theme === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTheme(item.id);
                        setError("");
                        setSuccess("");
                      }}
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        active
                          ? "border-purple-400 ring-2 ring-purple-500/30"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div
                        className="h-16"
                        style={{ background: item.preview }}
                      />

                      <div className="bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold">
                            {item.name}
                          </span>

                          {active && (
                            <span className="text-sm text-purple-300">
                              ✓
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Sticker selector */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">Add stickers</h3>

                <span
                  className={`text-xs font-semibold ${
                    stickers.length === 3
                      ? "text-amber-300"
                      : "text-gray-400"
                  }`}
                >
                  {stickers.length}/3 selected
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {STICKERS.map((item) => {
                  const active = stickers.includes(item.emoji);

                  return (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => toggleSticker(item.emoji)}
                      aria-pressed={active}
                      title={item.name}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-2 transition sm:p-3 ${
                        active
                          ? "border-purple-400 bg-purple-500/20"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>

                      <span className="text-[10px] text-gray-300 sm:text-xs">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-500">
                Choose up to 3 unique stickers. Click a selected sticker
                again to remove it.
              </p>
            </section>
          </div>

          {/* Live preview */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Live preview</h3>

              <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                {selectedTheme.name}
              </span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#080611] p-3 sm:p-5">
              <div
                className="relative min-h-[330px] overflow-hidden rounded-2xl p-6 sm:p-7"
                style={{
                  background: selectedTheme.preview,
                  color: selectedTheme.textColor,
                }}
              >
                {/* Decorative circles */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/20" />
                <div className="pointer-events-none absolute -right-5 -top-5 h-24 w-24 rounded-full border border-white/20" />
                <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

                <div className="relative z-10 flex min-h-[280px] flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-white/30 bg-black/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
                      Gather Event
                    </span>

                    <span className="text-2xl">
                      {stickers.length > 0 ? stickers.join(" ") : "✨"}
                    </span>
                  </div>

                  <div className="mt-8 flex-1">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                      You are invited
                    </p>

                    <h4 className="break-words text-3xl font-black leading-tight sm:text-4xl">
                      {event.title || "Your Event Title"}
                    </h4>

                    <p className="mt-3 line-clamp-3 max-w-md text-sm leading-6 opacity-90">
                      {event.description ||
                        "An exciting event is waiting for you. Join us and make memorable moments."}
                    </p>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-white/25 pt-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span>📅</span>
                      <span>{formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span>📍</span>
                      <span className="break-words">
                        {event.city || "Location to be announced"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span>🎟️</span>
                      <span>{eventPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-gray-500">
                Your preview updates automatically as you customize it.
              </p>
            </div>

            {/* Feedback */}
            {loading && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-gray-300">
                Loading your saved design...
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-4 rounded-xl border border-green-400/20 bg-green-500/10 p-3 text-sm text-green-300"
              >
                ✓ {success}
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => onClose?.()}
                disabled={saving}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5 disabled:opacity-50 sm:flex-1"
              >
                Close
              </button>

              <button
                type="button"
                onClick={saveDesign}
                disabled={loading || saving}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
              >
                {saving
                  ? "Saving..."
                  : loading
                    ? "Loading..."
                    : "💾 Save Design"}
              </button>
            </div>
          </section>
        </div>

        <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-gray-500 sm:px-7">
          Your design is saved to your account and can be loaded again later.
        </div>
      </div>
    </div>
  );
}