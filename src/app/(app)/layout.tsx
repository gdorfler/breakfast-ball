import { PrimaryNav } from "@/components/primary-nav";

// Wraps every logged-in screen (search, map, profile, and their subroutes)
// with the persistent nav. No auth check here — each page already redirects
// unauthenticated users via its own supabase.auth.getUser() call, and a
// redirect() thrown during that render replaces the whole response before
// this layout's markup (including the nav) ever reaches the client.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <PrimaryNav />
      <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
    </div>
  );
}
