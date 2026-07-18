import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="font-display text-4xl text-ink">Welcome, {profile.display_name}</h1>
      <p className="max-w-sm text-fairway-lite">Your course map starts here.</p>
      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-fairway-lite underline underline-offset-4 hover:text-ink"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
