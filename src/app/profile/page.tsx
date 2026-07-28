import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContourLines } from "@/components/contour-lines";
import { fetchUserLogs } from "@/lib/user-logs";
import Link from "next/link";

export const metadata = {
  title: "Your profile — Breakfast Ball",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-sm text-flag">
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
          <ul className="mt-2 divide-y divide-line/30">
            {logs.map((log) =>
              log.course ? (
                <li key={log.id}>
                  <Link
                    href={`/courses/${log.course.id}`}
                    className="block py-4 transition-colors hover:bg-paper-2/50"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="min-w-0 truncate font-display text-base text-ink">
                        {log.course.name}
                      </span>
                      <span className="shrink-0 text-xs text-fairway-lite">
                        {new Date(log.played_on + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars rating={Number(log.rating)} />
                      {(log.course.city || log.course.state) && (
                        <span className="text-xs text-fairway-lite">
                          {[log.course.city, log.course.state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        )}

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
