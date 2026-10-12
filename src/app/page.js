"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import EventCardDesigner from "./components/EventCardDesigner";

const CATEGORIES = ["All", "Music", "Workshop", "Food", "Sports", "Kids"];
const FAVOURITE_CATEGORIES = CATEGORIES.filter((item) => item !== "All");
const PAGE_SIZE = 6;

function formatPrice(price) {
  const amount = Number(price || 0);

  if (!Number.isFinite(amount) || amount === 0) return "Free";

  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getCategoryIcon(category) {
  const icons = {
    Music: "♫",
    Workshop: "✳",
    Food: "♨",
    Sports: "⚡",
    Kids: "✦",
  };

  return icons[category] || "✦";
}

function readLocalArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [page, setPage] = useState(1);

  const [reminders, setReminders] = useState([]);
  const [reminderBusy, setReminderBusy] = useState([]);
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [favouriteCategories, setFavouriteCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [favouritesLoading, setFavouritesLoading] = useState(false);
  const [savingFavourites, setSavingFavourites] = useState(false);
  const [favouritesMessage, setFavouritesMessage] = useState("");
  const [showMyFeed, setShowMyFeed] = useState(false);

  // Event Card Designer
  const [designingEvent, setDesigningEvent] = useState(null);

  // Load saved events from browser storage.
  useEffect(() => {
    setSaved(readLocalArray("gather-saved").map(Number));
  }, []);

  // Check login status.
  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to check login status.");
        }

        if (active) {
          setCurrentUser(data.authenticated ? data.user : null);
        }
      } catch (err) {
        console.error("Login status check failed:", err);
        if (active) setCurrentUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  // Load reminders from database.
  useEffect(() => {
    if (authLoading) return;

    let active = true;

    async function loadReminders() {
      if (!currentUser) {
        setReminders([]);
        return;
      }

      try {
        const response = await fetch("/api/reminders", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load reminders.");
        }

        if (active) {
          setReminders(
            Array.isArray(data.reminders)
              ? data.reminders.map(Number).filter(Number.isInteger)
              : []
          );
        }
      } catch (err) {
        console.error("Load reminders failed:", err);
      }
    }

    loadReminders();

    return () => {
      active = false;
    };
  }, [currentUser, authLoading]);

  // Load favourite categories.
  useEffect(() => {
    let active = true;

    async function loadFavourites() {
      if (!currentUser) {
        setFavouriteCategories([]);
        setSelectedCategories([]);
        setShowMyFeed(false);
        setFavouritesLoading(false);
        return;
      }

      setFavouritesLoading(true);
      setFavouritesMessage("");

      try {
        const response = await fetch("/api/favourites", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load favourite categories."
          );
        }

        if (active) {
          const categories = Array.isArray(data.categories)
            ? data.categories.filter((item) =>
                FAVOURITE_CATEGORIES.includes(item)
              )
            : [];

          setFavouriteCategories(categories);
          setSelectedCategories(categories);
        }
      } catch (err) {
        if (active) {
          setFavouritesMessage(err.message || "Unable to load favourites.");
        }
      } finally {
        if (active) setFavouritesLoading(false);
      }
    }

    if (!authLoading) loadFavourites();

    return () => {
      active = false;
    };
  }, [currentUser, authLoading]);

  // Load public events.
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load events.");
      }

      setEvents(
        (data.events || []).map((event) => ({
          ...event,
          id: Number(event.id),
          image: event.imageUrl || "",
          tag: event.category,
        }))
      );
    } catch (err) {
      console.error("Failed to load events:", err);
      setError(
        "We couldn't load events right now. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Available cities.
  const cities = useMemo(
    () => [
      "All",
      ...new Set(events.map((event) => event.city).filter(Boolean)),
    ],
    [events]
  );

  // Apply filters.
  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events
      .filter((event) => {
        const matchesCategory =
          category === "All" || event.category === category;

        const matchesMyFeed =
          !showMyFeed || favouriteCategories.includes(event.category);

        const matchesCity = city === "All" || event.city === city;

        const matchesSearch =
          !query ||
          event.title?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.city?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query);

        const matchesSaved = !showSaved || saved.includes(event.id);

        return (
          matchesCategory &&
          matchesMyFeed &&
          matchesCity &&
          matchesSearch &&
          matchesSaved
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [
    events,
    category,
    city,
    search,
    showSaved,
    saved,
    showMyFeed,
    favouriteCategories,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / PAGE_SIZE)
  );

  const paginatedEvents = filteredEvents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [
    category,
    city,
    search,
    showSaved,
    showMyFeed,
    favouriteCategories,
  ]);

  function toggleFavouriteCategory(categoryName) {
    setSelectedCategories((current) =>
      current.includes(categoryName)
        ? current.filter((item) => item !== categoryName)
        : [...current, categoryName]
    );

    setFavouritesMessage("");
  }

  async function saveFavouriteCategories() {
    if (!currentUser) {
      window.location.assign("/login");
      return;
    }

    if (savingFavourites) return;

    setSavingFavourites(true);
    setFavouritesMessage("");

    try {
      const response = await fetch("/api/favourites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: selectedCategories }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save favourites.");
      }

      const categories = Array.isArray(data.categories)
        ? data.categories.filter((item) =>
            FAVOURITE_CATEGORIES.includes(item)
          )
        : [];

      setFavouriteCategories(categories);
      setSelectedCategories(categories);
      setFavouritesMessage("✓ Your preferences have been saved!");
    } catch (err) {
      setFavouritesMessage(
        err.message || "Failed to save preferences. Please try again."
      );
    } finally {
      setSavingFavourites(false);
    }
  }

  // Save or unsave an event in browser storage.
  function toggleSaved(eventId) {
    setSaved((current) => {
      const updated = current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId];

      try {
        localStorage.setItem("gather-saved", JSON.stringify(updated));
      } catch (err) {
        console.warn("Unable to save event preference:", err);
      }

      return updated;
    });
  }

  // Add or remove a database reminder.
  async function toggleReminder(eventId) {
    if (!currentUser) {
      window.location.assign("/login");
      return;
    }

    if (reminderBusy.includes(eventId)) return;

    setReminderBusy((current) => [...current, eventId]);

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update reminder.");
      }

      setReminders((current) => {
        if (data.active) {
          return current.includes(eventId)
            ? current
            : [...current, eventId];
        }

        return current.filter((id) => id !== eventId);
      });
    } catch (err) {
      setError(err.message || "Unable to update reminder.");
    } finally {
      setReminderBusy((current) =>
        current.filter((id) => id !== eventId)
      );
    }
  }

  // Logout.
  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Logout failed.");
      }

      setCurrentUser(null);
      setReminders([]);
      setFavouriteCategories([]);
      setSelectedCategories([]);
      setShowMyFeed(false);

      window.location.assign("/");
    } catch (err) {
      setError(err.message || "Logout failed.");
      setLoggingOut(false);
    }
  }

  function resetFilters() {
    setCategory("All");
    setCity("All");
    setSearch("");
    setShowSaved(false);
    setShowMyFeed(false);
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-[#09090d] text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#09090d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <a href="/" className="shrink-0 text-2xl font-extrabold tracking-tight">
            gather<span className="text-violet-400">.</span>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-gray-400 md:flex">
            <a href="#discover" className="transition hover:text-white">
              Discover
            </a>

            <a href="#categories" className="transition hover:text-white">
              Categories
            </a>

            <button
              type="button"
              onClick={() => setShowSaved((value) => !value)}
              className={showSaved ? "text-violet-300" : ""}
            >
              Saved events
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => setShowMyFeed((value) => !value)}
                className={showMyFeed ? "text-violet-300" : ""}
              >
                My Feed
              </button>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {authLoading ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : currentUser ? (
              <>
                <span className="hidden max-w-40 truncate text-sm text-gray-300 sm:block">
                  Hi, {currentUser.name || currentUser.email}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
                >
                  Login
                </a>

                <a
                  href="/signup"
                  className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-violet-200 sm:px-5"
                >
                  Sign up
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-violet-700/20 blur-[130px]" />
        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-fuchsia-700/15 blur-[130px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-semibold text-violet-200">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              YOUR CITY. YOUR PEOPLE. YOUR MOMENTS.
            </div>

            <h1 className="max-w-xl text-5xl font-black leading-[1.08] tracking-tight md:text-7xl">
              Find your
              <br />
              next <span className="text-violet-400">favorite</span>
              <br />
              moment.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-gray-400 md:text-lg">
              Discover music nights, creative workshops, food experiences
              and unforgettable events happening around you.
            </p>

            <a
              href="#discover"
              className="mt-9 inline-flex items-center gap-3 rounded-full bg-violet-500 px-7 py-4 font-bold hover:bg-violet-400"
            >
              Discover events <span>↗</span>
            </a>

            <div className="mt-10 flex flex-wrap gap-8 border-t border-white/10 pt-7">
              <div>
                <p className="text-2xl font-bold">
                  {loading ? "—" : events.length}
                </p>
                <p className="mt-1 text-sm text-gray-500">Upcoming events</p>
              </div>

              <div>
                <p className="text-2xl font-bold">
                  {loading ? "—" : Math.max(cities.length - 1, 0)}
                </p>
                <p className="mt-1 text-sm text-gray-500">Cities to explore</p>
              </div>

              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="mt-1 text-sm text-gray-500">Event categories</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#15141c] p-3 shadow-2xl">
              <div className="relative h-[300px] overflow-hidden rounded-2xl md:h-[420px]">
                <img
                  src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200"
                  alt="Live music event"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <span className="rounded-full bg-violet-500 px-3 py-1.5 text-xs font-bold">
                    LIVE EXPERIENCES
                  </span>

                  <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">
                    Make it a moment.
                  </h2>

                  <p className="mt-2 text-sm text-gray-300">
                    Good people. Great places. Better memories.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-2 rounded-2xl border border-white/10 bg-[#1a1823] px-5 py-4 shadow-xl md:-left-8">
              <p className="text-xs text-gray-400">Find something</p>
              <p className="mt-1 font-bold">Worth going out for ✨</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            Browse your way
          </p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            What are you in the mood for?
          </h2>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3">
          {CATEGORIES.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setCategory(item)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition ${
                category === item
                  ? "border-violet-400 bg-violet-500 text-white"
                  : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/25 hover:text-white"
              }`}
            >
              {item !== "All" && <span>{getCategoryIcon(item)}</span>}
              {item === "All" ? "✦ " : ""}
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* Favourite Categories */}
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 p-6 md:p-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
                Personalize your experience
              </p>
              <h2 className="mt-2 text-2xl font-extrabold">
                Choose your favourites ❤️
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Select the types of events you love to personalize your feed.
              </p>
            </div>

            {currentUser && (
              <span className="text-sm text-gray-400">
                {favouritesLoading
                  ? "Loading preferences..."
                  : `${favouriteCategories.length} saved`}
              </span>
            )}
          </div>

          {!currentUser && !authLoading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-gray-300">
                Login to save your favourite categories across sessions.
              </p>
              <a
                href="/login"
                className="mt-4 inline-flex rounded-full bg-violet-500 px-5 py-3 text-sm font-bold hover:bg-violet-400"
              >
                Login to continue →
              </a>
            </div>
          ) : (
            <>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {FAVOURITE_CATEGORIES.map((item) => {
                  const selected = selectedCategories.includes(item);

                  return (
                    <button
                      type="button"
                      key={item}
                      disabled={favouritesLoading || savingFavourites}
                      onClick={() => toggleFavouriteCategory(item)}
                      aria-pressed={selected}
                      className={`rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
                        selected
                          ? "border-violet-400 bg-violet-500/15 text-white"
                          : "border-white/10 bg-black/20 text-gray-400 hover:border-violet-400/40 hover:text-white"
                      }`}
                    >
                      <span className="text-2xl">{getCategoryIcon(item)}</span>
                      <span className="mt-3 flex items-center justify-between gap-2 text-sm font-bold">
                        {item}
                        <span>{selected ? "✓" : "+"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p
                  role="status"
                  className={`text-sm ${
                    favouritesMessage.startsWith("✓")
                      ? "text-green-400"
                      : "text-gray-400"
                  }`}
                >
                  {favouritesMessage ||
                    `${selectedCategories.length} categories selected`}
                </p>

                <button
                  type="button"
                  onClick={saveFavouriteCategories}
                  disabled={
                    savingFavourites || favouritesLoading || !currentUser
                  }
                  className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black hover:bg-violet-200 disabled:opacity-50"
                >
                  {savingFavourites ? "Saving..." : "Save preferences"}
                </button>
              </div>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMyFeed((value) => !value);
                    document
                      .getElementById("discover")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`mt-5 rounded-full border px-5 py-3 text-sm font-semibold ${
                    showMyFeed
                      ? "border-violet-400 bg-violet-500 text-white"
                      : "border-white/15 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {showMyFeed ? "✓ My Feed enabled" : "View My Feed →"}
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* Events */}
      <section id="discover" className="mx-auto max-w-7xl px-5 pb-24 pt-12 md:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
              The good stuff
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              {showSaved
                ? "Your saved events"
                : showMyFeed
                  ? "Your personalized feed"
                  : "Upcoming events"}
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              {showMyFeed
                ? "Events from your favourite categories."
                : "Find something exciting happening next."}
            </p>
          </div>

          {(showSaved || showMyFeed) && (
            <button
              type="button"
              onClick={() => {
                setShowSaved(false);
                setShowMyFeed(false);
              }}
              className="self-start text-sm text-violet-300 hover:text-white"
            >
              Show all events →
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mt-8 grid gap-3 md:grid-cols-[1fr_240px]">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-500">
              ⌕
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search events, categories or cities..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-12 pr-4 text-sm outline-none placeholder:text-gray-600 focus:border-violet-400/60"
            />
          </div>

          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#15141c] px-4 py-4 text-sm text-gray-200 outline-none focus:border-violet-400/60"
          >
            {cities.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All cities" : item}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {loading
              ? "Loading events..."
              : `${filteredEvents.length} event${filteredEvents.length === 1 ? "" : "s"} found`}
          </p>

          {(category !== "All" ||
            city !== "All" ||
            search ||
            showSaved ||
            showMyFeed) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-violet-300 hover:text-white"
            >
              Clear filters ×
            </button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-8 rounded-3xl border border-red-400/20 bg-red-400/[0.05] p-8 text-center"
          >
            <p className="text-lg font-bold">Something went wrong</p>
            <p className="mt-2 text-sm text-gray-400">{error}</p>
            <button
              type="button"
              onClick={loadEvents}
              className="mt-5 rounded-full bg-violet-500 px-6 py-3 text-sm font-bold hover:bg-violet-400"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="grid gap-6 pt-7 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03]"
              >
                <div className="h-56 bg-white/[0.06]" />
                <div className="space-y-4 p-5">
                  <div className="h-4 w-1/3 rounded bg-white/[0.08]" />
                  <div className="h-6 w-4/5 rounded bg-white/[0.08]" />
                  <div className="h-4 w-2/3 rounded bg-white/[0.08]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && paginatedEvents.length > 0 && (
          <div className="grid gap-6 pt-7 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedEvents.map((event) => {
              const isSaved = saved.includes(event.id);
              const hasReminder = reminders.includes(event.id);
              const isReminderBusy = reminderBusy.includes(event.id);

              return (
                <article
                  key={event.id}
                  className="group overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111117] transition duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-[0_20px_60px_rgba(124,58,237,0.10)]"
                >
                  <div className="relative h-56 overflow-hidden bg-[#1a1823]">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-900/60 to-fuchsia-900/30">
                        <span className="text-6xl">
                          {getCategoryIcon(event.category)}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                    <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
                      {event.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleSaved(event.id)}
                      aria-label={isSaved ? "Remove saved event" : "Save event"}
                      className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md ${
                        isSaved
                          ? "border-violet-400 bg-violet-500 text-white"
                          : "border-white/20 bg-black/50 text-white hover:bg-violet-500"
                      }`}
                    >
                      {isSaved ? "♥" : "♡"}
                    </button>

                    <div className="absolute bottom-4 left-4">
                      <p className="text-sm font-semibold text-white">
                        {formatDate(event.date)}
                      </p>
                      <p className="mt-1 text-xs text-gray-300">
                        {formatTime(event.date)}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="text-violet-300">⌖</span>
                      {event.city}
                    </div>

                    <h3 className="mt-3 line-clamp-2 min-h-[3.5rem] text-xl font-bold leading-7 transition group-hover:text-violet-200">
                      {event.title}
                    </h3>

                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-6 text-gray-500">
                      {event.description || "Discover this upcoming event."}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
                      <div>
                        <p className="text-xs text-gray-500">Entry price</p>
                        <p className="mt-1 text-lg font-extrabold">
                          {formatPrice(event.price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleReminder(event.id)}
                        disabled={isReminderBusy}
                        aria-pressed={hasReminder}
                        className={`rounded-full px-4 py-2.5 text-xs font-bold transition disabled:opacity-60 ${
                          hasReminder
                            ? "border border-violet-400/30 bg-violet-400/10 text-violet-200"
                            : "bg-white text-black hover:bg-violet-200"
                        }`}
                      >
                        {isReminderBusy
                          ? "Saving..."
                          : hasReminder
                            ? "✓ Reminded"
                            : "Remind me"}
                      </button>
                    </div>

                    {/* Event Card Designer button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) {
                          window.location.assign("/login");
                          return;
                        }

                        setDesigningEvent(event);
                      }}
                      className="mt-4 w-full rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200 transition hover:bg-violet-500/20"
                    >
                      🎨 Customize Event Card
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && paginatedEvents.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-white/15 px-5 py-16 text-center">
            <div className="text-4xl">✦</div>
            <h3 className="mt-4 text-xl font-bold">
              {showMyFeed && favouriteCategories.length === 0
                ? "Choose your favourite categories"
                : "No events found"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {showMyFeed && favouriteCategories.length === 0
                ? "Select and save some favourite categories to personalize your feed."
                : "Try another search term or change your category and city filters."}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-full bg-violet-500 px-6 py-3 text-sm font-bold hover:bg-violet-400"
            >
              Clear filters
            </button>
          </div>
        )}

        {!loading && !error && filteredEvents.length > PAGE_SIZE && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => {
                setPage((current) => Math.max(1, current - 1));
                document
                  .getElementById("discover")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-30"
            >
              ← Previous
            </button>

            <span className="px-3 text-sm text-gray-400">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setPage((current) => Math.min(totalPages, current + 1));
                document
                  .getElementById("discover")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-8">
          <a href="/" className="text-xl font-extrabold">
            gather<span className="text-violet-400">.</span>
          </a>

          <p className="text-sm text-gray-500">
            Discover more. Experience more. Make memories.
          </p>

          <p className="text-xs text-gray-600">
            Community Events Board
          </p>
        </div>
      </footer>

      {/* Designer Modal */}
      {designingEvent && (
        <EventCardDesigner
          event={designingEvent}
          onClose={() => setDesigningEvent(null)}
        />
      )}
    </main>
  );
}