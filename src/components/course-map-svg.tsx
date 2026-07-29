import {
  US_MAP_VIEWBOX,
  US_NATION_PATH,
  US_STATES_MESH_PATH,
} from "@/lib/us-map-data";
import {
  FULL_VIEW,
  clusterPins,
  viewBoxOf,
  type MapCluster,
  type MapPin,
  type MapViewState,
} from "@/lib/map-view";

type CourseMapSvgProps = {
  pins: MapPin[];
  /** Current view; defaults to the full-US view (what the share card uses). */
  view?: MapViewState;
  /** Staggered pin-drop entrance. Off for exports so no frame is ever mid-animation. */
  animated?: boolean;
  activeId?: string | null;
  onSelectPin?: (pin: MapPin) => void;
  onSelectCluster?: (cluster: MapCluster) => void;
  className?: string;
};

/**
 * The stylized paper US map, now a two-state "dream board": solid fairway
 * pins for played courses (earned), hollow outlined pins for want-to-play
 * (a promise). Overlapping pins merge into count bubbles per the same
 * metaphor: solid = all played, hollow = all want-to-play, solid with an
 * outer ring = mixed. No flag-red anywhere on the map — it stays in reserve.
 *
 * Pin/bubble sizes divide by view.scale and strokes use
 * vector-effect: non-scaling-stroke, so zooming magnifies the terrain while
 * marks and lines keep constant screen size.
 */
export function CourseMapSvg({
  pins,
  view = FULL_VIEW,
  animated = false,
  activeId = null,
  onSelectPin,
  onSelectCluster,
  className = "",
}: CourseMapSvgProps) {
  const k = view.scale;
  const clusters = clusterPins(pins, k);
  const interactive = Boolean(onSelectPin || onSelectCluster);

  const playedCount = pins.filter((p) => p.status === "played").length;
  const wantedCount = pins.length - playedCount;

  return (
    <svg
      viewBox={viewBoxOf(view)}
      className={className}
      role="img"
      aria-label={`US map: ${playedCount} played, ${wantedCount} want-to-play`}
    >
      <path
        d={US_NATION_PATH}
        fill="var(--paper-2)"
        stroke="var(--ink)"
        strokeOpacity="0.45"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={US_STATES_MESH_PATH}
        fill="none"
        stroke="var(--line)"
        strokeOpacity="0.6"
        strokeWidth="0.75"
        vectorEffect="non-scaling-stroke"
      />

      {clusters.map((cluster, i) => {
        const delayStyle = animated
          ? { animationDelay: `${Math.min(i * 30, 1200)}ms` }
          : undefined;
        const animClass = animated ? "pin-drop" : "";

        if (cluster.pins.length === 1) {
          const pin = cluster.pins[0];
          const played = pin.status === "played";
          const isActive = activeId === pin.id;
          const r = (isActive ? 11 : 8) / k;
          return (
            <circle
              key={pin.id}
              cx={pin.x}
              cy={pin.y}
              r={r}
              fill={played ? "var(--fairway)" : "var(--paper)"}
              stroke={played ? "var(--paper)" : "var(--fairway)"}
              strokeWidth={played ? 1.5 / k : 2 / k}
              className={[animClass, interactive ? "cursor-pointer" : ""]
                .filter(Boolean)
                .join(" ")}
              style={delayStyle}
              {...(onSelectPin
                ? {
                    tabIndex: 0,
                    role: "button",
                    "aria-label": played
                      ? `${pin.name}, rated ${pin.rating?.toFixed(1)}`
                      : `${pin.name}, on your want-to-play list`,
                    onClick: () => onSelectPin(pin),
                    onMouseEnter: () => onSelectPin(pin),
                    onFocus: () => onSelectPin(pin),
                  }
                : {})}
            />
          );
        }

        const hasPlayed = cluster.pins.some((p) => p.status === "played");
        const hasWanted = cluster.pins.some((p) => p.status === "wanted");
        const mixed = hasPlayed && hasWanted;
        const r = 14 / k;

        return (
          <g
            key={cluster.key}
            className={[animClass, interactive ? "cursor-pointer" : ""]
              .filter(Boolean)
              .join(" ")}
            style={delayStyle}
            {...(onSelectCluster
              ? {
                  tabIndex: 0,
                  role: "button",
                  "aria-label": `${cluster.pins.length} courses here — zoom in`,
                  onClick: () => onSelectCluster(cluster),
                }
              : {})}
          >
            {mixed && (
              <circle
                cx={cluster.x}
                cy={cluster.y}
                r={r + 3.5 / k}
                fill="none"
                stroke="var(--fairway)"
                strokeWidth={1.5 / k}
              />
            )}
            <circle
              cx={cluster.x}
              cy={cluster.y}
              r={r}
              fill={hasPlayed ? "var(--fairway)" : "var(--paper)"}
              stroke={hasPlayed ? "var(--paper)" : "var(--fairway)"}
              strokeWidth={hasPlayed ? 1.5 / k : 2 / k}
            />
            <text
              x={cluster.x}
              y={cluster.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={hasPlayed ? "var(--paper)" : "var(--fairway)"}
              fontSize={13 / k}
              className="select-none font-body"
            >
              {cluster.pins.length}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** The filled-vs-hollow legend, shared by the in-app map and the share card. */
export function MapLegend({
  className = "",
  dotSize = 10,
}: {
  className?: string;
  dotSize?: number;
}) {
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            background: "var(--fairway)",
          }}
        />
        Played
      </span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            background: "var(--paper)",
            border: "1.5px solid var(--fairway)",
          }}
        />
        Want to play
      </span>
    </div>
  );
}
