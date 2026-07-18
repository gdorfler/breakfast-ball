import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="font-display text-4xl text-ink">Sign in</h1>
      <p className="max-w-sm text-fairway-lite">
        Enter your email and we&apos;ll send you a link — no password needed.
      </p>
      <LoginForm />
    </main>
  );
}
