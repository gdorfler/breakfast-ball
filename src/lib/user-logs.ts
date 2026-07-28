import type { SupabaseClient } from "@supabase/supabase-js";

// The one query + aggregation used by the profile page, the map, and the share
// card. Stats (distinct courses, states) are always derived from this same
// result set so no surface can drift from another.

export type UserLog = {
  id: string;
  rating: number;
  notes: string | null;
  played_on: string;
  course: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

export async function fetchUserLogs(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserLog[]> {
  const { data } = await supabase
    .from("logs")
    .select(
      "id, rating, notes, played_on, course:courses(id, name, city, state, latitude, longitude)",
    )
    .eq("user_id", userId)
    .order("played_on", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as UserLog[];
}

export type CourseAggregate = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  avgRating: number;
  playCount: number;
  lastPlayed: string;
};

/** One entry per distinct course, avg of the user's ratings, best-rated first. */
export function aggregateCourses(logs: UserLog[]): CourseAggregate[] {
  const byId = new Map<string, CourseAggregate & { ratingSum: number }>();

  for (const log of logs) {
    if (!log.course) continue;
    const existing = byId.get(log.course.id);
    if (existing) {
      existing.ratingSum += Number(log.rating);
      existing.playCount += 1;
      existing.avgRating = existing.ratingSum / existing.playCount;
      if (log.played_on > existing.lastPlayed) existing.lastPlayed = log.played_on;
    } else {
      byId.set(log.course.id, {
        ...log.course,
        ratingSum: Number(log.rating),
        avgRating: Number(log.rating),
        playCount: 1,
        lastPlayed: log.played_on,
      });
    }
  }

  return [...byId.values()]
    .sort(
      (a, b) => b.avgRating - a.avgRating || b.lastPlayed.localeCompare(a.lastPlayed),
    )
    .map(({ ratingSum: _ratingSum, ...rest }) => rest);
}

export function distinctStates(courses: { state: string | null }[]): number {
  return new Set(courses.map((c) => c.state).filter(Boolean)).size;
}
