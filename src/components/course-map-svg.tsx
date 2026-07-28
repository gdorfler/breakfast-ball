import {
  US_MAP_VIEWBOX,
  US_NATION_PATH,
  US_STATES_MESH_PATH,
} from "@/lib/us-map-data";
import { projectPoint } from "@/lib/map-projection";

export type MapCourse = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  avgRating: number;
};

type CourseMapSvgProps = {
  courses: MapCourse[];
  /** Staggered pin-drop entrance. Off for exports so no frame is ever mid-animation. */
  animated?: boolean;
  activeId?: string | null;
  onSelectCourse?: (course: MapCourse) => void;
  className?: string;
};

/**
 * The stylized paper US map — shared by the in-app interactive view and the
 * static share-card export. Courses that can't be projected (NULL or bad
 * coordinates) are filtered out here; they never plot at (0,0).
 */
export function CourseMapSvg({
  courses,
  animated = false,
  activeId = null,
  onSelectCourse,
  className = "",
}: CourseMapSvgProps) {
  const plotted = courses
    .map((course) => {
      const point = projectPoint(course.latitude, course.longitude);
      return point ? { course, x: point[0], y: point[1] } : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Dots shrink a touch as density grows so a 100-course map stays readable.
  const dotRadius = plotted.length > 60 ? 5 : plotted.length > 25 ? 6.5 : 9;
  const interactive = Boolean(onSelectCourse);

  return (
    <svg
      viewBox={`0 0 ${US_MAP_VIEWBOX.width} ${US_MAP_VIEWBOX.height}`}
      className={className}
      role="img"
      aria-label={`US map with ${plotted.length} logged ${plotted.length === 1 ? "course" : "courses"}`}
    >
      <path
        d={US_NATION_PATH}
        fill="var(--paper-2)"
        stroke="var(--ink)"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <path
        d={US_STATES_MESH_PATH}
        fill="none"
        stroke="var(--line)"
        strokeOpacity="0.6"
        strokeWidth="0.75"
      />
      {plotted.map(({ course, x, y }, i) => {
        const standout = course.avgRating >= 4.5;
        const isActive = activeId === course.id;
        return (
          <circle
            key={course.id}
            cx={x}
            cy={y}
            r={isActive ? dotRadius * 1.4 : dotRadius}
            fill={standout ? "var(--flag)" : "var(--fairway)"}
            stroke="var(--paper)"
            strokeWidth="1.5"
            className={[
              animated ? "pin-drop" : "",
              interactive ? "cursor-pointer" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              animated ? { animationDelay: `${Math.min(i * 30, 1200)}ms` } : undefined
            }
            {...(interactive
              ? {
                  tabIndex: 0,
                  role: "button",
                  "aria-label": `${course.name}, rated ${course.avgRating.toFixed(1)}`,
                  onClick: () => onSelectCourse?.(course),
                  onMouseEnter: () => onSelectCourse?.(course),
                  onFocus: () => onSelectCourse?.(course),
                }
              : {})}
          />
        );
      })}
    </svg>
  );
}
