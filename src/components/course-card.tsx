import Link from "next/link";
import type { ReactNode } from "react";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-flag">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = rating - i;
        return (
          <span
            key={i}
            className={filled >= 1 ? "" : filled >= 0.5 ? "opacity-50" : "text-line"}
          >
            &#9733;
          </span>
        );
      })}
    </span>
  );
}

type CourseCardProps = {
  courseId: string;
  name: string;
  city: string | null;
  state: string | null;
  status: "played" | "wanted";
  /** Played only. */
  rating?: number | null;
  /** Played only, pre-formatted (e.g. "Jul 4, 2026"). */
  dateLabel?: string | null;
  /**
   * No course photography exists yet in v0.5 — this is always undefined
   * today. The slot exists so wiring up real round photos later is a data
   * change, not a redesign: pass photoUrl and the stylized pin swatch below
   * is replaced with the image, no other markup changes.
   */
  photoUrl?: string | null;
  /** Rendered outside the course-page link, e.g. a remove control. */
  trailing?: ReactNode;
};

/**
 * A photo-independent course card. With no photo, the image slot falls back
 * to a small "pin" swatch that echoes the dream-board map's own language:
 * solid fairway circle = played (earned), hollow fairway-outline circle =
 * want-to-play (a promise) — so the card never looks empty or broken, and
 * the played/wanted distinction reads the same way it does on the map.
 */
export function CourseCard({
  courseId,
  name,
  city,
  state,
  status,
  rating,
  dateLabel,
  photoUrl,
  trailing,
}: CourseCardProps) {
  const played = status === "played";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={`flex items-center gap-3 rounded-[10px] border px-3 py-3 transition-colors ${
        played
          ? "border-line/30 bg-paper-2/40 hover:bg-paper-2/70"
          : "border-line/20 bg-paper-2/15 hover:bg-paper-2/40"
      }`}
    >
      <Link
        href={`/courses/${courseId}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-paper-2">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : played ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fairway font-display text-base text-paper">
              {initial}
            </span>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-fairway-lite font-display text-base text-fairway-lite">
              {initial}
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base text-ink">
            {name}
          </span>
          {(city || state) && (
            <span className="block truncate text-xs text-fairway-lite">
              {[city, state].filter(Boolean).join(", ")}
            </span>
          )}
          {played && rating != null && (
            <span className="mt-1 flex items-center gap-2 text-sm">
              <Stars rating={rating} />
              {dateLabel && (
                <span className="text-xs text-fairway-lite">{dateLabel}</span>
              )}
            </span>
          )}
        </span>
      </Link>

      {trailing}
    </div>
  );
}
