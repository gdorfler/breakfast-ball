import { redirect } from "next/navigation";
import { ContourLines } from "@/components/contour-lines";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) redirect("/home");

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-6 py-24 text-center">
      <ContourLines className="pointer-events-none absolute inset-x-0 top-0 h-60 w-full" />
      <div className="relative flex flex-col items-center gap-6">
        <h1 className="font-display text-4xl text-ink">One more thing</h1>
        <OnboardingForm userId={user.id} />
      </div>
    </main>
  );
}
