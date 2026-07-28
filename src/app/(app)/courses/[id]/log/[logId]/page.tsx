import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogForm } from "../log-form";
import Link from "next/link";

type Params = Promise<{ id: string; logId: string }>;

export const metadata = {
  title: "Edit round — Breakfast Ball",
};

export default async function EditLogPage({ params }: { params: Params }) {
  const { id, logId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, name, city, state")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  const { data: log } = await supabase
    .from("logs")
    .select("id, rating, notes, played_on, user_id")
    .eq("id", logId)
    .eq("course_id", id)
    .maybeSingle();

  if (!log || log.user_id !== user.id) notFound();

  return (
    <main className="flex flex-1 flex-col px-6 pb-24 pt-12">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href={`/courses/${id}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-fairway-lite transition-colors hover:text-ink"
        >
          <span aria-hidden="true">&larr;</span> Back to {course.name}
        </Link>

        <h1 className="font-display text-3xl text-ink">{course.name}</h1>
        {(course.city || course.state) && (
          <p className="mt-1 text-sm text-fairway-lite">
            {[course.city, course.state].filter(Boolean).join(", ")}
          </p>
        )}

        <LogForm
          courseId={id}
          mode="edit"
          logId={log.id}
          initialRating={Number(log.rating)}
          initialNote={log.notes ?? ""}
          initialPlayedOn={log.played_on}
        />
      </div>
    </main>
  );
}
