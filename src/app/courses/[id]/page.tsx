import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: course ? `${course.name} — Breakfast Ball` : "Course not found",
  };
}

export default async function CourseDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  const { count: logCount } = await supabase
    .from("logs")
    .select("*", { count: "exact", head: true })
    .eq("course_id", id);

  const { data: ratingData } = await supabase
    .from("logs")
    .select("rating")
    .eq("course_id", id);

  const totalLogs = logCount ?? 0;
  let avgRating: number | null = null;
  if (ratingData && ratingData.length >= 5) {
    const sum = ratingData.reduce((acc, r) => acc + Number(r.rating), 0);
    avgRating = sum / ratingData.length;
  }

  return (
    <main className="flex flex-1 flex-col px-6 pb-24 pt-12">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/courses"
          className="mb-6 inline-flex items-center gap-1 text-sm text-fairway-lite transition-colors hover:text-ink"
        >
          <span aria-hidden="true">&larr;</span> Back to search
        </Link>

        {course.source !== "seed" && course.source !== "osm" && (
          <span className="mb-2 inline-block rounded-full bg-sand/50 px-3 py-0.5 text-xs text-fairway-lite">
            Community-added
          </span>
        )}

        <div className="mb-1 text-sm text-fairway-lite">
          {[course.city, course.state].filter(Boolean).join(", ")}
          {course.num_holes && ` · ${course.num_holes} holes`}
          {course.par && ` · Par ${course.par}`}
        </div>

        <h1 className="font-display text-3xl leading-tight text-ink">
          {course.name}
        </h1>

        <div className="mt-8 rounded-[10px] border border-line/40 bg-paper-2 p-6">
          {avgRating !== null ? (
            <div className="text-center">
              <div className="font-display text-4xl text-ink">
                {avgRating.toFixed(1)}
              </div>
              <div className="mt-1 flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <= Math.round(avgRating!)
                        ? "text-flag"
                        : "text-line"
                    }
                  >
                    &#9733;
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-fairway-lite">
                {totalLogs} {totalLogs === 1 ? "round" : "rounds"} logged
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-display text-lg text-ink">
                {totalLogs > 0
                  ? `${totalLogs} ${totalLogs === 1 ? "round" : "rounds"} logged so far`
                  : "No one’s logged this yet"}
              </p>
              <p className="mt-1 text-sm text-fairway-lite">
                {totalLogs > 0
                  ? `Ratings appear after 5 rounds`
                  : "Be the first to call it."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            disabled
            className="w-full rounded-[10px] bg-fairway py-3 text-center font-display text-base text-paper opacity-60"
          >
            Log this course
          </button>
          <p className="mt-2 text-center text-xs text-fairway-lite/60">
            Coming soon
          </p>
        </div>

        {course.website && (
          <a
            href={
              course.website.startsWith("http")
                ? course.website
                : `https://${course.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block text-center text-sm text-fairway underline underline-offset-4 hover:text-ink"
          >
            Visit course website
          </a>
        )}
      </div>
    </main>
  );
}
