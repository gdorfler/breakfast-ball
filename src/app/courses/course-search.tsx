"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type CourseResult = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  num_holes: number;
  sim: number;
};

export function CourseSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const supabase = createClient();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_courses", {
        query: trimmed,
      });

      if (!error && data) {
        setResults(data as CourseResult[]);
      } else {
        setResults([]);
      }
      setHasSearched(true);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const showNoResults = hasSearched && !loading && results.length === 0 && query.trim().length >= 2;

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Course name, e.g. 'Cobbs Creek'"
          autoFocus
          className="w-full rounded-[10px] border border-line/50 bg-paper-2 px-4 py-3 text-ink placeholder:text-fairway-lite/60 focus:border-fairway focus:outline-none"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-fairway-lite border-t-fairway" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <ul className="mt-4 divide-y divide-line/30">
          {results.map((course) => (
            <li key={course.id}>
              <Link
                href={`/courses/${course.id}`}
                className="flex items-baseline justify-between gap-4 py-3 transition-colors hover:bg-paper-2/50"
              >
                <div className="min-w-0">
                  <span className="font-display text-base text-ink">
                    {course.name}
                  </span>
                  {(course.city || course.state) && (
                    <span className="ml-2 text-sm text-fairway-lite">
                      {[course.city, course.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-fairway-lite/60">
                  {course.num_holes}h
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showNoResults && (
        <div className="mt-8 text-center">
          <p className="text-sm text-fairway-lite">
            No courses match &ldquo;{query.trim()}&rdquo;
          </p>
          <Link
            href={`/courses/add?name=${encodeURIComponent(query.trim())}`}
            className="mt-3 inline-block rounded-full border border-fairway px-5 py-2 text-sm text-fairway transition-colors hover:bg-fairway hover:text-paper"
          >
            Add a missing course
          </Link>
        </div>
      )}

      {!hasSearched && query.trim().length < 2 && (
        <p className="mt-6 text-center text-sm text-fairway-lite/60">
          Type at least two letters to search
        </p>
      )}
    </div>
  );
}
