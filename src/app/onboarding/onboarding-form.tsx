"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "saving" | "error";

export function OnboardingForm({ userId }: { userId: string }) {
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .insert({ id: userId, display_name: displayName.trim() });

    if (error) {
      setStatus("error");
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2 text-left">
        <span className="text-sm text-ink">What should we call you?</span>
        <input
          type="text"
          required
          maxLength={40}
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Your name"
          className="rounded-[10px] border border-line/60 bg-paper-2 px-4 py-3 text-ink placeholder:text-fairway-lite/70 focus-visible:border-fairway"
        />
      </label>
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded-[10px] bg-fairway px-5 py-3 font-medium text-paper transition-colors hover:bg-fairway/90 disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : "Continue"}
      </button>
      {status === "error" && (
        <p className="text-sm text-flag">Couldn&apos;t save that. Try again.</p>
      )}
    </form>
  );
}
