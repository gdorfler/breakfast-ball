import { CourseMapSvg } from "@/components/course-map-svg";
import { ContourLines } from "@/components/contour-lines";
import {
  distinctStates,
  type CourseAggregate,
} from "@/lib/user-logs";

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
  totalRounds: number;
};

/**
 * The exportable card — always rendered at true pixel size (1080-wide) and
 * never animated, so the PNG capture is deterministic. Public data only:
 * display name, course names, stats. Sizing is inline px on purpose; this is a
 * fixed-format print object, not a responsive screen.
 */
export function ShareCard({
  variant,
  eyebrow,
  headline,
  courses,
  totalRounds,
}: ShareCardProps) {
  const { width, height } = CARD_SIZES[variant];
  const states = distinctStates(courses);
  const topCourses = [...courses]
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5);

  const stats: Array<[number, string]> = [
    [courses.length, courses.length === 1 ? "course" : "courses"],
    [states, states === 1 ? "state" : "states"],
    [totalRounds, totalRounds === 1 ? "round" : "rounds"],
  ];

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

          <CourseMapSvg
            courses={courses}
            className="w-full"
            // 936 x 585 — the hero, largest element on the card
          />

          <div
            className="flex items-start justify-center text-center"
            style={{ marginTop: 34, gap: 96 }}
          >
            {stats.map(([value, label]) => (
              <div key={label}>
                <div className="font-display" style={{ fontSize: 76, lineHeight: 1 }}>
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
            <div style={{ marginTop: 38 }}>
              <div
                className="font-body uppercase"
                style={{ fontSize: 21, letterSpacing: 3, color: "var(--fairway-lite)" }}
              >
                Top courses
              </div>
              <div style={{ marginTop: 10 }}>
                {topCourses.map((course, i) => (
                  <div
                    key={course.id}
                    className="flex items-center"
                    style={{ height: 44, gap: 18 }}
                  >
                    <span
                      className="font-display"
                      style={{ fontSize: 26, color: "var(--fairway-lite)", width: 24 }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="font-display truncate"
                      style={{ fontSize: 29, flex: 1, minWidth: 0 }}
                    >
                      {course.name}
                    </span>
                    <CardStars rating={course.avgRating} size={26} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="font-display flex items-end justify-end"
            style={{ flex: 1, fontSize: 26, color: "var(--fairway)" }}
          >
            Breakfast Ball
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

          <div className="flex flex-1 items-center">
            <CourseMapSvg courses={courses} className="w-full" />
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
