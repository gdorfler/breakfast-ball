import { CourseMapSvg, MapLegend } from "@/components/course-map-svg";
import { ContourLines } from "@/components/contour-lines";
import { distinctStates, type CourseAggregate } from "@/lib/user-logs";
import type { WantToPlayRow } from "@/lib/want-to-play";
import { buildMapPins } from "@/lib/map-view";

export type CardVariant = "portrait" | "square";

export const CARD_SIZES: Record<CardVariant, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
};

function CardStars({ rating, size }: { rating: number; size: number }) {
  return (
    <span
      className="inline-flex items-center"
      style={{ gap: 2, fontSize: size, color: "var(--flag)", lineHeight: 1 }}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const filled = rating - i;
        return (
          <span
            key={i}
            style={
              filled >= 1
                ? undefined
                : filled >= 0.5
                  ? { opacity: 0.45 }
                  : { color: "var(--line)" }
            }
          >
            &#9733;
          </span>
        );
      })}
    </span>
  );
}

type ShareCardProps = {
  variant: CardVariant;
  eyebrow: string;
  headline: string;
  courses: CourseAggregate[];
  wantToPlay: WantToPlayRow[];
  totalRounds: number;
};

/**
 * The exportable card — always rendered at true pixel size (1080-wide) and
 * never animated, so the PNG capture is deterministic. Public data only:
 * display name, course names, stats. The map keeps the full-US view (the
 * recognizable object at thumbnail size) and runs the same pure cluster math
 * as the interactive map, so dense metros read as count bubbles, not a pile.
 * Stats count PLAYED courses only; want-to-play appears as hollow pins and
 * the "still chasing" hook line, never in the numbers.
 */
export function ShareCard({
  variant,
  eyebrow,
  headline,
  courses,
  wantToPlay,
  totalRounds,
}: ShareCardProps) {
  const { width, height } = CARD_SIZES[variant];
  const states = distinctStates(courses);
  const topCourses = [...courses]
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5);
  const { pins } = buildMapPins(courses, wantToPlay);
  // The conversation hook (share-card skill): the two most recently added
  // want-to-play courses. Omitted gracefully when the list is empty.
  const chasing = wantToPlay.slice(0, 2).map((w) => w.name);

  const stats: Array<[number, string]> = [
    [courses.length, courses.length === 1 ? "course" : "courses"],
    [states, states === 1 ? "state" : "states"],
    [totalRounds, totalRounds === 1 ? "round" : "rounds"],
  ];

  const legend = (
    <MapLegend
      className="justify-center font-body"
      dotSize={14}
      // Inline size for the fixed-format card, not a responsive screen.
    />
  );

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        width,
        height,
        padding: 72,
        background: "var(--paper)",
        color: "var(--ink)",
      }}
    >
      <ContourLines
        className="pointer-events-none absolute inset-x-0 bottom-0"
        // One quiet motif, anchored low so it never fights the map.
      />

      {variant === "portrait" ? (
        <div className="relative flex h-full flex-col">
          <div
            className="font-body uppercase"
            style={{ fontSize: 25, letterSpacing: 4, color: "var(--fairway-lite)" }}
          >
            {eyebrow}
          </div>
          <h1
            className="font-display"
            style={{ fontSize: 62, lineHeight: 1.1, marginTop: 10 }}
          >
            {headline}
          </h1>

          <div style={{ width: 860, alignSelf: "center", marginTop: 14 }}>
            <CourseMapSvg pins={pins} className="w-full" />
          </div>

          <div
            style={{ marginTop: 8, fontSize: 21, color: "var(--fairway-lite)" }}
          >
            {legend}
          </div>

          <div
            className="flex items-start justify-center text-center"
            style={{ marginTop: 24, gap: 96 }}
          >
            {stats.map(([value, label]) => (
              <div key={label}>
                <div className="font-display" style={{ fontSize: 74, lineHeight: 1 }}>
                  {value}
                </div>
                <div
                  className="font-body"
                  style={{ fontSize: 24, marginTop: 6, color: "var(--fairway-lite)" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {topCourses.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <div
                className="font-body uppercase"
                style={{ fontSize: 21, letterSpacing: 3, color: "var(--fairway-lite)" }}
              >
                Top courses
              </div>
              <div style={{ marginTop: 8 }}>
                {topCourses.map((course, i) => (
                  <div
                    key={course.id}
                    className="flex items-center"
                    style={{ height: 42, gap: 18 }}
                  >
                    <span
                      className="font-display"
                      style={{ fontSize: 26, color: "var(--fairway-lite)", width: 24 }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="font-display truncate"
                      style={{ fontSize: 28, flex: 1, minWidth: 0 }}
                    >
                      {course.name}
                    </span>
                    <CardStars rating={course.avgRating} size={25} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end justify-between" style={{ flex: 1, gap: 24 }}>
            {chasing.length > 0 ? (
              <div
                className="font-body truncate"
                style={{ fontSize: 24, color: "var(--fairway-lite)", minWidth: 0 }}
              >
                still chasing:{" "}
                <span className="font-display" style={{ color: "var(--ink)" }}>
                  {chasing.join(" · ")}
                </span>
              </div>
            ) : (
              <div />
            )}
            <div
              className="font-display"
              style={{ fontSize: 26, color: "var(--fairway)", whiteSpace: "nowrap" }}
            >
              Breakfast Ball
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex h-full flex-col">
          <div>
            <div
              className="font-body uppercase"
              style={{ fontSize: 24, letterSpacing: 4, color: "var(--fairway-lite)" }}
            >
              {eyebrow}
            </div>
            <h1
              className="font-display"
              style={{ fontSize: 48, lineHeight: 1.15, marginTop: 8 }}
            >
              {headline}
            </h1>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center">
            <CourseMapSvg pins={pins} className="w-full" />
            <div
              style={{ marginTop: 6, fontSize: 20, color: "var(--fairway-lite)" }}
            >
              {legend}
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div
              className="font-body"
              style={{ fontSize: 27, color: "var(--ink)" }}
            >
              {stats.map(([value, label], i) => (
                <span key={label}>
                  {i > 0 && (
                    <span style={{ color: "var(--fairway-lite)" }}> &middot; </span>
                  )}
                  <span className="font-display" style={{ fontSize: 32 }}>
                    {value}
                  </span>{" "}
                  <span style={{ color: "var(--fairway-lite)" }}>{label}</span>
                </span>
              ))}
            </div>
            <div
              className="font-display"
              style={{ fontSize: 26, color: "var(--fairway)" }}
            >
              Breakfast Ball
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
