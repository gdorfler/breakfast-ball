import type { SupabaseClient } from "@supabase/supabase-js";

// Kept separate from user-logs.ts on purpose: want-to-play is a distinct
// concept (aspiration, not history) and must never feed the played-courses
// stats or aggregation logic.

export type WantToPlayRow = {
  id: string;
  courseId: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};

export async function fetchWantToPlay(
  supabase: SupabaseClient,
  userId: string,
): Promise<WantToPlayRow[]> {
  const { data } = await supabase
    .from("want_to_play")
    .select("id, course:courses(id, name, city, state, latitude, longitude)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    course: {
      id: string;
      name: string;
      city: string | null;
      state: string | null;
      latitude: number | null;
      longitude: number | null;
    } | null;
  }>;

  return rows
    .filter((row) => row.course)
    .map((row) => ({
      id: row.id,
      courseId: row.course!.id,
      name: row.course!.name,
      city: row.course!.city,
      state: row.course!.state,
      latitude: row.course!.latitude,
      longitude: row.course!.longitude,
    }));
}
