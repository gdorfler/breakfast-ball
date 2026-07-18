"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <p className="max-w-sm text-fairway-lite">
        Check your email — we sent a link to sign in. You can close this tab.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2 text-left">
        <span className="text-sm text-ink">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-[10px] border border-line/60 bg-paper-2 px-4 py-3 text-ink placeholder:text-fairway-lite/70 focus-visible:border-fairway"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-[10px] bg-fairway px-5 py-3 font-medium text-paper transition-colors hover:bg-fairway/90 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>
      {status === "error" && (
        <p className="text-sm text-flag">Something went wrong sending that. Try again in a moment.</p>
      )}
    </form>
  );
}
