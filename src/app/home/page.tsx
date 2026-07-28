import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ContourLines } from "@/components/contour-lines";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const { count: logCount } = await supabase
    .from("logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const totalLogs = logCount ?? 0;

  return (
    <main className="flex flex-1 flex-col">
      <header className="relative overflow-hidden px-6 pb-8 pt-12 text-center">
        <ContourLines className="pointer-events-none absolute inset-0 h-full w-full opacity-60" />
        <div className="relative">
          <h1 className="font-display text-3xl text-ink">
            {profile.display_name}
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg px-6 pb-24">
        {totalLogs === 0 ? (
          <div className="mt-4 rounded-[10px] border border-line/40 bg-paper-2 p-8 text-center">
            <p className="font-display text-lg text-ink">
              Your map starts with one round
            </p>
            <p className="mt-2 text-sm text-fairway-lite">
              Find a course you&rsquo;ve played and log it.
            </p>
            <Link
              href="/courses"
              className="mt-4 inline-block rounded-[10px] bg-fairway px-6 py-3 font-display text-base text-paper"
            >
              Find a course
            </Link>
          </div>
        ) : (
          <Link
            href="/courses"
            className="mt-4 block rounded-[10px] bg-fairway py-3 text-center font-display text-base text-paper"
          >
            Find a course
          </Link>
        )}

        <form action={signOut} className="mt-8 text-center">
          <button
            type="submit"
            className="text-sm text-fairway-lite underline underline-offset-4 hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
