"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

export function WantToPlayButton({
  courseId,
  initialWanted,
}: {
  courseId: string;
  initialWanted: boolean;
}) {
  const [wanted, setWanted] = useState(initialWanted);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const supabase = createClient();

  function toggle() {
    setError("");
    const next = !wanted;
    setWanted(next);

    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setWanted(!next);
        setError("You need to be signed in.");
        return;
      }

      if (next) {
        const { error: insertError } = await supabase
          .from("want_to_play")
          .insert({ user_id: user.id, course_id: courseId });

        // 23505 = unique_violation — it's already on the list, treat as success.
        if (insertError && insertError.code !== "23505") {
          setWanted(!next);
          setError("Couldn't save that. Try again.");
        }
      } else {
        const { error: deleteError } = await supabase
          .from("want_to_play")
          .delete()
          .eq("user_id", user.id)
          .eq("course_id", courseId);

        if (deleteError) {
          setWanted(!next);
          setError("Couldn't remove that. Try again.");
        }
      }
    });
  }

  return (
    <div>
      {/* A light intent marker, not a competing CTA — pill-shaped and quiet
          (fairway-lite), unlike the solid full-width "Log this course" button. */}
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={wanted}
        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors disabled:opacity-50 ${
          wanted
            ? "border-fairway-lite bg-fairway-lite/15 text-fairway"
            : "border-line text-fairway-lite hover:border-fairway-lite hover:text-ink"
        }`}
      >
        <span aria-hidden="true">{wanted ? "✓" : "+"}</span>
        {wanted ? "On your want-to-play list" : "Want to play"}
      </button>
      {error && <p className="mt-2 text-sm text-flag">{error}</p>}
    </div>
  );
}
