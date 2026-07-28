"use client";

import { useState } from "react";
import Link from "next/link";
import { CourseMapSvg, type MapCourse } from "@/components/course-map-svg";
import { distinctStates, type CourseAggregate } from "@/lib/user-logs";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-sm text-flag">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = rating - i;
        return (
          <span
            key={i}
            className={filled >= 1 ? "" : filled >= 0.5 ? "opacity-50" : "text-line"}
          >
            &#9733;
          </span>
        );
      })}
    </span>
  );
}

export function MapView({
  courses,
  totalRounds,
}: {
  courses: CourseAggregate[];
  totalRounds: number;
}) {
  const [active, setActive] = useState<CourseAggregate | null>(null);

  const mappable = courses.filter(
    (c) => c.latitude != null && c.longitude != null,
  );
  const unmappedCount = courses.length - mappable.length;
  const states = distinctStates(courses);

  return (
    <main className="flex flex-1 flex-col px-6 pb-24 pt-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/profile"
          className="mb-6 inline-flex items-center gap-1 text-sm text-fairway-lite transition-colors hover:text-ink"
        >
          <span aria-hidden="true">&larr;</span> Back to profile
        </Link>

        <h1 className="font-display text-3xl text-ink">Your course map</h1>
        <p className="mt-1 text-sm text-fairway-lite">
          {courses.length} {courses.length === 1 ? "course" : "courses"} &middot;{" "}
          {states} {states === 1 ? "state" : "states"} &middot; {totalRounds}{" "}
          {totalRounds === 1 ? "round" : "rounds"}
        </p>

        <div className="mt-6">
          <CourseMapSvg
            courses={mappable as MapCourse[]}
            animated
            activeId={active?.id ?? null}
            onSelectCourse={(c) =>
              setActive(mappable.find((m) => m.id === c.id) ?? null)
            }
            className="h-auto w-full"
          />
        </div>

        <div
          className="mt-4 flex min-h-16 items-center justify-center rounded-[10px] border border-line/40 bg-paper-2 px-4 py-3"
          aria-live="polite"
        >
          {active ? (
            <Link
              href={`/courses/${active.id}`}
              className="text-center transition-opacity hover:opacity-80"
            >
              <span className="font-display text-base text-ink">{active.name}</span>
              <span className="ml-2">
                <Stars rating={active.avgRating} />
              </span>
              <span className="mt-0.5 block text-xs text-fairway-lite">
                {[active.city, active.state].filter(Boolean).join(", ")}
                {active.playCount > 1 && ` · played ${active.playCount} times`}
              </span>
            </Link>
          ) : (
            <p className="text-sm text-fairway-lite/70">
              Tap a pin to see the course
            </p>
          )}
        </div>

        {unmappedCount > 0 && (
          <p className="mt-3 text-center text-xs text-fairway-lite/70">
            {unmappedCount} {unmappedCount === 1 ? "course isn't" : "courses aren't"}{" "}
            on the map yet &mdash; missing coordinates, we&rsquo;ll place{" "}
            {unmappedCount === 1 ? "it" : "them"} soon.
          </p>
        )}

        <Link
          href="/profile/share"
          className="mt-8 block w-full rounded-[10px] bg-fairway py-3 text-center font-display text-base text-paper"
        >
          Make your share card
        </Link>
      </div>
    </main>
  );
}
