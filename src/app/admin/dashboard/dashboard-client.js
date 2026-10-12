"use client";

import { useEffect, useState } from "react";

const initialForm = {
  title: "",
  category: "Music",
  city: "",
  date: "",
  price: "0",
  description: "",
  imageUrl: "",
  isActive: true,
};

const categories = ["Music", "Workshop", "Food", "Sports", "Kids"];

function toDateTimeLocal(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function DashboardClient() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  async function loadEvents() {
    try {
      setError("");

      const response = await fetch("/api/admin/events", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load events.");
      }

      setEvents(data.events || []);
    } catch (err) {
      setError(err.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startEditing(event) {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      category: event.category || "Music",
      city: event.city || "",
      date: toDateTimeLocal(event.date),
      price: String(event.price ?? 0),
      description: event.description || "",
      imageUrl: event.imageUrl || "",
      isActive: Boolean(event.isActive),
    });

    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!form.date || Number.isNaN(new Date(form.date).getTime())) {
        throw new Error("Please select a valid event date and time.");
      }

      const payload = {
        ...form,
        price: Number(form.price),
        date: new Date(form.date).toISOString(),
      };

      if (editingId !== null) {
        payload.id = editingId;
      }

      const response = await fetch("/api/admin/events", {
        method: editingId !== null ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (editingId !== null
              ? "Failed to update event."
              : "Failed to create event.")
        );
      }

      const wasEditing = editingId !== null;

      setEditingId(null);
      setForm(initialForm);
      setMessage(
        wasEditing
          ? "Event updated successfully!"
          : "Event added successfully!"
      );

      await loadEvents();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/admin";
      } else {
        setError("Logout failed. Please try again.");
      }
    } catch {
      setError("Unable to connect to the server.");
    }
  }

  const activeEvents = events.filter((event) => event.isActive);
  const inactiveEvents = events.filter((event) => !event.isActive);

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-purple-400">
              COMMUNITY EVENTS BOARD
            </p>

            <h1 className="mt-2 text-3xl font-bold">Admin Dashboard</h1>

            <p className="mt-2 text-slate-400">
              Manage and monitor community events.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-700 px-5 py-3 font-medium hover:bg-slate-800"
          >
            Logout
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300"
          >
            {message}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Events" value={events.length} />
          <StatCard title="Active Events" value={activeEvents.length} />
          <StatCard title="Inactive Events" value={inactiveEvents.length} />
        </section>

        {/* Add / Edit Event Form */}
        <section
          id="event-form"
          className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              {editingId !== null ? "Edit Event" : "Add New Event"}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {editingId !== null
                ? "Update the event details below."
                : "Enter the event details below."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Event Title">
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  placeholder="Event title"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Category">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="City">
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  placeholder="e.g. Delhi"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Date and Time">
                <input
                  type="datetime-local"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </FormField>

              <FormField label="Price (INR ₹)">
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Image URL (optional)">
                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/event-image.jpg"
                  className={inputClass}
                />
              </FormField>
            </div>

            {form.imageUrl.trim() && (
              <div>
                <p className="mb-2 text-sm text-slate-400">Image Preview</p>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="Event image preview"
                  className="h-48 w-full rounded-xl border border-slate-700 object-cover sm:w-80"
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                  onLoad={(event) => {
                    event.currentTarget.style.visibility = "visible";
                  }}
                />
              </div>
            )}

            <FormField label="Description">
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                maxLength={5000}
                placeholder="Describe the event..."
                className={inputClass}
              />
            </FormField>

            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4 accent-purple-500"
              />
              Publish this event as Active
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Add Event"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-6 py-3 font-semibold transition hover:bg-slate-800 disabled:opacity-60"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Events List */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-7">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">All Events</h2>
            <p className="mt-1 text-sm text-slate-400">
              Events are sorted by date.
            </p>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-400">
              Loading events...
            </p>
          ) : events.length === 0 ? (
            <p className="py-10 text-center text-slate-400">
              No events found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="px-4 py-4">Event</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">City</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Price</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-slate-800 last:border-0"
                    >
                      <td className="px-4 py-4 font-medium">{event.title}</td>
                      <td className="px-4 py-4 text-slate-300">
                        {event.category}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {event.city}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {formatDate(event.date)}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {formatPrice(event.price)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            event.isActive
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {event.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => startEditing(event)}
                          className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-4 py-2 font-semibold text-purple-300 transition hover:bg-purple-500 hover:text-white"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20";

function FormField({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      {label}
      {children}
    </label>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}