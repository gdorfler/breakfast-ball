"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LogFormProps = {
  courseId: string;
  mode: "create" | "edit";
  logId?: string;
  priorCount?: number;
  initialRating?: number;
  initialNote?: string;
  initialPlayedOn: string;
};

const NOTE_LIMIT = 300;

export function LogForm({
  courseId,
  mode,
  logId,
  priorCount = 0,
  initialRating = 0,
  initialNote = "",
  initialPlayedOn,
}: LogFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [note, setNote] = useState(initialNote);
  const [playedOn, setPlayedOn] = useState(initialPlayedOn);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating <= 0 || saving) return;

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be signed in.");
      setSaving(false);
      return;
    }

    if (mode === "edit" && logId) {
      const { error: updateError } = await supabase
        .from("logs")
        .update({ rating, notes: note.trim() || null, played_on: playedOn })
        .eq("id", logId)
        .eq("user_id", user.id);

      if (updateError) {
        setError("Couldn't save that. Try again.");
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("logs").insert({
        user_id: user.id,
        course_id: courseId,
        rating,
        notes: note.trim() || null,
        played_on: playedOn,
      });

      if (insertError) {
        setError("Couldn't save that. Try again.");
        setSaving(false);
        return;
      }
    }

    setConfirmed(true);
    setTimeout(() => {
      router.push(`/courses/${courseId}?logged=1`);
      router.refresh();
    }, 700);
  }

  async function handleDelete() {
    if (!logId) return;
    if (!window.confirm("Delete this log? This can't be undone.")) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const { error: deleteError } = await supabase
      .from("logs")
      .delete()
      .eq("id", logId)
      .eq("user_id", user.id);

    if (deleteError) {
      setError("Couldn't delete that. Try again.");
      setSaving(false);
      return;
    }

    router.push(`/courses/${courseId}`);
    router.refresh();
  }

  if (confirmed) {
    return (
      <div className="fade-in mt-10 rounded-[10px] border border-line/40 bg-paper-2 p-8 text-center">
        <p className="font-display text-xl text-ink">Logged.</p>
        <p className="mt-1 text-sm text-fairway-lite">Taking you back to the course&hellip;</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((starIndex) => {
            const clamped = Math.max(0, Math.min(1, rating - (starIndex - 1)));
            return (
              <div key={starIndex} className="relative h-10 w-10 text-4xl leading-none">
                <span className="absolute inset-0 select-none text-line" aria-hidden="true">
                  &#9733;
                </span>
                <span
                  className="absolute inset-y-0 left-0 select-none overflow-hidden whitespace-nowrap text-flag"
                  style={{ width: `${clamped * 100}%` }}
                  aria-hidden="true"
                >
                  &#9733;
                </span>
                <button
                  type="button"
                  aria-label={`${starIndex - 0.5} stars`}
                  onClick={() => setRating(starIndex - 0.5)}
                  className="absolute inset-y-0 left-0 w-1/2"
                />
                <button
                  type="button"
                  aria-label={`${starIndex} stars`}
                  onClick={() => setRating(starIndex)}
                  className="absolute inset-y-0 right-0 w-1/2"
                />
              </div>
            );
          })}
          {rating > 0 && (
            <span className="ml-2 font-display text-xl text-ink">{rating.toFixed(1)}</span>
          )}
        </div>
        <p className="mt-2 text-sm text-fairway-lite">
          How&rsquo;s the course &mdash; not how you played.
        </p>
      </div>

      {mode === "create" && priorCount > 0 && (
        <p className="text-sm text-fairway-lite">
          You&rsquo;ve played this course {priorCount} {priorCount === 1 ? "time" : "times"} before.
        </p>
      )}

      <div>
        <label htmlFor="played-on" className="mb-1.5 block text-sm text-ink">
          Date played
        </label>
        <input
          id="played-on"
          type="date"
          value={playedOn}
          max={today}
          onChange={(e) => setPlayedOn(e.target.value)}
          className="w-full rounded-[10px] border border-line/50 bg-paper-2 px-4 py-3 text-ink focus:border-fairway focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm text-ink">
          Note <span className="text-fairway-lite/60">(optional)</span>
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_LIMIT))}
          maxLength={NOTE_LIMIT}
          rows={4}
          placeholder="Firm and fast today?"
          className="w-full resize-none rounded-[10px] border border-line/50 bg-paper-2 px-4 py-3 text-ink placeholder:text-fairway-lite/60 focus:border-fairway focus:outline-none"
        />
        <p
          className={`mt-1 text-right text-xs ${
            note.length >= NOTE_LIMIT ? "text-flag" : "text-fairway-lite/60"
          }`}
        >
          {note.length}/{NOTE_LIMIT}
        </p>
      </div>

      {error && <p className="text-sm text-flag">{error}</p>}

      <button
        type="submit"
        disabled={rating <= 0 || saving}
        className="w-full rounded-[10px] bg-fairway py-3 text-center font-display text-base text-paper transition-opacity disabled:opacity-50"
      >
        {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Log this course"}
      </button>

      {mode === "edit" && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="w-full text-center text-sm text-flag underline underline-offset-4 disabled:opacity-50"
        >
          Delete this log
        </button>
      )}
    </form>
  );
}
