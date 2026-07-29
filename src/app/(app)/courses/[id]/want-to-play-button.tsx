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
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={wanted}
        className={`w-full rounded-[10px] border py-3 text-center font-display text-base transition-colors disabled:opacity-50 ${
          wanted
            ? "border-fairway bg-fairway/10 text-fairway"
            : "border-fairway text-fairway hover:bg-fairway hover:text-paper"
        }`}
      >
        {wanted ? "On your want-to-play list" : "Want to play"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-flag">{error}</p>}
    </div>
  );
}
