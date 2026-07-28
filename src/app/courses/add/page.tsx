import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddCourseForm } from "./add-course-form";

export const metadata = {
  title: "Add a course — Breakfast Ball",
};

export default async function AddCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const sp = await searchParams;

  return (
    <main className="flex flex-1 flex-col px-6 pb-24 pt-12">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="font-display text-3xl text-ink">Add a missing course</h1>
        <p className="mt-2 text-sm text-fairway-lite">
          Can&rsquo;t find the course you played? Add it here and you can log it
          right away.
        </p>

        <AddCourseForm initialName={sp.name ?? ""} />
      </div>
    </main>
  );
}
