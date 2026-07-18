import Link from "next/link";
import { redirect } from "next/navigation";
import { ContourLines } from "@/components/contour-lines";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/home");

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <ContourLines className="pointer-events-none absolute inset-x-0 top-0 h-60 w-full" />
      <div className="relative flex flex-col items-center gap-6">
        <h1 className="text-5xl font-display text-ink">Breakfast Ball</h1>
        <p className="max-w-sm text-base text-fairway-lite">
          Log the courses you&apos;ve played. Build your map.
        </p>
        <Link
          href="/login"
          className="rounded-[10px] bg-fairway px-6 py-3 font-medium text-paper transition-colors hover:bg-fairway/90"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
