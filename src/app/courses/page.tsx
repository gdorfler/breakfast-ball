import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContourLines } from "@/components/contour-lines";
import { CourseSearch } from "./course-search";

export const metadata = {
  title: "Find a course — Breakfast Ball",
};

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="flex flex-1 flex-col">
      <header className="relative overflow-hidden px-6 pb-6 pt-12 text-center">
        <ContourLines className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
        <div className="relative">
          <h1 className="font-display text-3xl text-ink">Find a course</h1>
          <p className="mt-2 text-sm text-fairway-lite">
            Search 764 courses across PA, NJ &amp; DE
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg px-6 pb-24">
        <CourseSearch />
      </div>
    </main>
  );
}
