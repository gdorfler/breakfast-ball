"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type DuplicateMatch = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  sim: number;
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

type Step = "form" | "checking" | "confirm-dupes" | "saving" | "done";

export function AddCourseForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [numHoles, setNumHoles] = useState<"9" | "18">("18");
  const [step, setStep] = useState<Step>("form");
  const [dupes, setDupes] = useState<DuplicateMatch[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const canSubmit = name.trim().length >= 2 && city.trim().length >= 1 && state.length === 2;

  async function checkForDuplicates() {
    if (!canSubmit) return;
    setError("");
    setStep("checking");

    const { data, error: rpcError } = await supabase.rpc(
      "check_duplicate_courses",
      { course_name: name.trim(), course_state: state || null }
    );

    if (rpcError) {
      setError("Something went wrong checking for duplicates. Try again.");
      setStep("form");
      return;
    }

    const matches = (data as DuplicateMatch[]) ?? [];
    if (matches.length > 0) {
      setDupes(matches);
      setStep("confirm-dupes");
    } else {
      await insertCourse();
    }
  }

  async function insertCourse() {
    setStep("saving");
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be signed in.");
      setStep("form");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("courses")
      .insert({
        name: name.trim(),
        city: city.trim(),
        state,
        country: "US",
        num_holes: parseInt(numHoles),
        source: "user",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      setError("Couldn't save that course. Try again.");
      setStep("form");
      return;
    }

    setStep("done");
    router.push(`/courses/${data.id}`);
  }

  if (step === "confirm-dupes") {
    return (
      <div className="mt-8">
        <h2 className="font-display text-xl text-ink">Did you mean one of these?</h2>
        <p className="mt-1 text-sm text-fairway-lite">
          We found some courses with similar names.
        </p>

        <ul className="mt-4 divide-y divide-line/30">
          {dupes.map((d) => (
            <li key={d.id}>
              <Link
                href={`/courses/${d.id}`}
                className="flex items-baseline justify-between gap-4 py-3 transition-colors hover:bg-paper-2/50"
              >
                <div>
                  <span className="font-display text-base text-ink">{d.name}</span>
                  {(d.city || d.state) && (
                    <span className="ml-2 text-sm text-fairway-lite">
                      {[d.city, d.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={insertCourse}
            className="rounded-[10px] border border-fairway px-5 py-3 text-sm text-fairway transition-colors hover:bg-fairway hover:text-paper"
          >
            None of these &mdash; add &ldquo;{name.trim()}&rdquo;
          </button>
          <button
            onClick={() => {
              setStep("form");
              setDupes([]);
            }}
            className="text-sm text-fairway-lite underline underline-offset-4 hover:text-ink"
          >
            Go back and edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        checkForDuplicates();
      }}
      className="mt-8 space-y-5"
    >
      <div>
        <label htmlFor="course-name" className="mb-1.5 block text-sm text-ink">
          Course name
        </label>
        <input
          id="course-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Pine Valley Golf Club"
          required
          className="w-full rounded-[10px] border border-line/50 bg-paper-2 px-4 py-3 text-ink placeholder:text-fairway-lite/60 focus:border-fairway focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="course-city" className="mb-1.5 block text-sm text-ink">
            City
          </label>
          <input
            id="course-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Clementon"
            required
            className="w-full rounded-[10px] border border-line/50 bg-paper-2 px-4 py-3 text-ink placeholder:text-fairway-lite/60 focus:border-fairway focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="course-state" className="mb-1.5 block text-sm text-ink">
            State
          </label>
          <select
            id="course-state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            className="w-full rounded-[10px] border border-line/50 bg-paper-2 px-4 py-3 text-ink focus:border-fairway focus:outline-none"
          >
            <option value="">Select</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm text-ink">Holes</span>
        <div className="flex gap-3">
          {(["18", "9"] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setNumHoles(val)}
              className={`rounded-full border px-5 py-2 text-sm transition-colors ${
                numHoles === val
                  ? "border-fairway bg-fairway text-paper"
                  : "border-line/50 text-fairway-lite hover:border-fairway hover:text-ink"
              }`}
            >
              {val} holes
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-flag">{error}</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || step === "checking" || step === "saving"}
        className="w-full rounded-[10px] bg-fairway py-3 text-center font-display text-base text-paper transition-opacity disabled:opacity-50"
      >
        {step === "checking"
          ? "Checking for duplicates…"
          : step === "saving"
            ? "Adding…"
            : "Add course"}
      </button>

      <p className="text-center text-xs text-fairway-lite/60">
        Coordinates will be added later &mdash; the course won&rsquo;t appear
        on maps until then.
      </p>
    </form>
  );
}
