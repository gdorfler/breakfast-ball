import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogForm } from "./log-form";
import Link from "next/link";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Log a round — Breakfast Ball",
};

export default async function LogCoursePage({ params }: { params: Params }) {
  const { id } = await params;
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

  const { count } = await supabase
    .from("logs")
    .select("*", { count: "exact", head: true })
    .eq("course_id", id)
    .eq("user_id", user.id);

  const today = new Date().toISOString().slice(0, 10);

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
          mode="create"
          priorCount={count ?? 0}
          initialPlayedOn={today}
        />
      </div>
    </main>
  );
}
