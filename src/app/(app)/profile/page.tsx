import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContourLines } from "@/components/contour-lines";
import { CourseCard } from "@/components/course-card";
import { fetchUserLogs } from "@/lib/user-logs";
import { fetchWantToPlay } from "@/lib/want-to-play";
import { WantToPlaySection } from "./want-to-play-section";
import Link from "next/link";

export const metadata = {
  title: "Your profile — Breakfast Ball",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  // Single source of truth: the same fetch the map and share card use, and
  // stats below derive from this same result set — no surface can drift.
  const logs = await fetchUserLogs(supabase, user.id);
  // Fetched and rendered entirely separately from logs — want-to-play must
  // never feed the played-courses stats below.
  const wantToPlay = await fetchWantToPlay(supabase, user.id);

  const distinctCourses = new Set(
    logs.map((l) => l.course?.id).filter(Boolean),
  ).size;
  const distinctStates = new Set(
    logs.map((l) => l.course?.state).filter(Boolean),
  ).size;
  const totalRounds = logs.length;

  return (
    <main className="flex flex-1 flex-col">
      <header className="relative overflow-hidden px-6 pb-8 pt-12">
        <ContourLines className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
        <div className="relative mx-auto flex w-full max-w-lg items-center gap-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-14 w-14 rounded-full border border-line/50 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line/50 bg-paper-2 font-display text-xl text-fairway">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl text-ink">
              {profile.display_name}
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg px-6 pb-24">
        <div className="flex divide-x divide-line/40 border-y border-line/40 py-5">
          <div className="flex-1 text-center">
            <div className="font-display text-3xl text-ink">{distinctCourses}</div>
            <div className="mt-1 text-xs text-fairway-lite">
              {distinctCourses === 1 ? "course" : "courses"}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="font-display text-3xl text-ink">{distinctStates}</div>
            <div className="mt-1 text-xs text-fairway-lite">
              {distinctStates === 1 ? "state" : "states"}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="font-display text-3xl text-ink">{totalRounds}</div>
            <div className="mt-1 text-xs text-fairway-lite">
              {totalRounds === 1 ? "round" : "rounds"}
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <Link
            href="/profile/map"
            className="mt-6 block rounded-[10px] border border-fairway py-3 text-center font-display text-base text-fairway transition-colors hover:bg-fairway hover:text-paper"
          >
            View your course map
          </Link>
        )}

        {logs.length === 0 ? (
          <div className="mt-10 rounded-[10px] border border-line/40 bg-paper-2 p-8 text-center">
            <p className="font-display text-lg text-ink">
              Your map starts with one round
            </p>
            <p className="mt-2 text-sm text-fairway-lite">
              Log a course you&rsquo;ve played and it shows up here.
            </p>
            <Link
              href="/courses"
              className="mt-4 inline-block rounded-[10px] bg-fairway px-6 py-3 font-display text-base text-paper"
            >
              Find a course
            </Link>
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {logs.map((log) =>
              log.course ? (
                <li key={log.id}>
                  <CourseCard
                    courseId={log.course.id}
                    name={log.course.name}
                    city={log.course.city}
                    state={log.course.state}
                    status="played"
                    rating={Number(log.rating)}
                    dateLabel={new Date(
                      log.played_on + "T00:00:00",
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  />
                </li>
              ) : null,
            )}
          </ul>
        )}

        <WantToPlaySection initialItems={wantToPlay} />

        <div className="mt-10 text-center">
          <Link
            href="/home"
            className="text-sm text-fairway-lite underline underline-offset-4 hover:text-ink"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
