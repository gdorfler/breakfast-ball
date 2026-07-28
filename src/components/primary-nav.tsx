"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Search", href: "/courses" },
  { label: "Map", href: "/profile/map" },
  { label: "Profile", href: "/profile" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/profile") {
    // Exact only — /profile/map and /profile/share belong to the Map tab.
    return pathname === "/profile";
  }
  if (href === "/profile/map") {
    return pathname.startsWith("/profile/map") || pathname.startsWith("/profile/share");
  }
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Persistent primary nav for logged-in screens: a bottom tab bar on mobile
 * (thumb-reachable), a top bar on desktop. Both render the same items from
 * the same active-path logic; only one is ever in the a11y tree at a given
 * viewport since the other uses `hidden` (display:none).
 */
export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="hidden border-b border-line/40 bg-paper md:block">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/home" className="font-display text-lg text-ink">
            Breakfast Ball
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`font-body text-sm transition-colors ${
                    active ? "text-fairway" : "text-fairway-lite hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line/40 bg-paper md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-center"
              >
                <span
                  className={`font-display text-sm ${active ? "text-fairway" : "text-ink"}`}
                >
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-1 w-1 rounded-full bg-fairway transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
