import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchUserLogs } from "@/lib/user-logs";
import { fetchWantToPlay } from "@/lib/want-to-play";
import { ShareStudio } from "./share-studio";

export const metadata = {
  title: "Your share card — Breakfast Ball",
};

export default async function SharePage() {
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

  const logs = await fetchUserLogs(supabase, user.id);

  if (logs.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-lg rounded-[10px] border border-line/40 bg-paper-2 p-8 text-center">
          <p className="font-display text-lg text-ink">
            Your card starts with one round
          </p>
          <p className="mt-2 text-sm text-fairway-lite">
            Log a course you&rsquo;ve played, then come back for the share card.
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-block rounded-[10px] bg-fairway px-6 py-3 font-display text-base text-paper"
          >
            Find a course
          </Link>
        </div>
      </main>
    );
  }

  const wantToPlay = await fetchWantToPlay(supabase, user.id);

  return (
    <ShareStudio
      displayName={profile.display_name}
      logs={logs}
      wantToPlay={wantToPlay}
    />
  );
}
