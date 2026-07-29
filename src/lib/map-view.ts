import { US_MAP_VIEWBOX } from "@/lib/us-map-data";
import { projectPoint } from "@/lib/map-projection";
import type { CourseAggregate } from "@/lib/user-logs";
import type { WantToPlayRow } from "@/lib/want-to-play";

// Pure view/cluster math for the dream-board map. Everything here is
// deterministic (no Date, no random) so the interactive map, the share-card
// preview, and the exported PNG all compute the exact same picture.

export type MapViewState = {
  cx: number;
  cy: number;
  scale: number;
};

export const MIN_SCALE = 1;
export const MAX_SCALE = 24;

const W = US_MAP_VIEWBOX.width;
const H = US_MAP_VIEWBOX.height;

export const FULL_VIEW: MapViewState = { cx: W / 2, cy: H / 2, scale: 1 };

export function clampView(view: MapViewState): MapViewState {
  const scale = Math.min(Math.max(view.scale, MIN_SCALE), MAX_SCALE);
  const halfW = W / (2 * scale);
  const halfH = H / (2 * scale);
  return {
    scale,
    cx: Math.min(Math.max(view.cx, halfW), W - halfW),
    cy: Math.min(Math.max(view.cy, halfH), H - halfH),
  };
}

export function viewBoxOf(view: MapViewState): string {
  const halfW = W / (2 * view.scale);
  const halfH = H / (2 * view.scale);
  return `${view.cx - halfW} ${view.cy - halfH} ${halfW * 2} ${halfH * 2}`;
}

/**
 * Fit the view to a set of points with padding. Capped so one or two pins
 * don't zoom to a single fairway; floored at the full-US view.
 */
export function fitView(
  points: Array<{ x: number; y: number }>,
  maxScale = 9,
): MapViewState {
  if (points.length === 0) return FULL_VIEW;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // Pad the bounding box ~18% per side, with a floor so a tight metro
  // cluster still gets breathing room around it.
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const padX = Math.max(spanX * 0.18, 40);
  const padY = Math.max(spanY * 0.18, 30);

  const scale = Math.min(
    W / (spanX + padX * 2),
    H / (spanY + padY * 2),
    maxScale,
    MAX_SCALE,
  );

  return clampView({
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    scale: Math.max(scale, MIN_SCALE),
  });
}

export type MapPin = {
  id: string;
  name: string;
  x: number;
  y: number;
  status: "played" | "wanted";
  rating: number | null;
  playCount: number;
  city: string | null;
  state: string | null;
};

/**
 * Builds the dream-board pin list: played courses (filled) + want-to-play
 * courses (hollow). A course that is both logged and on the list renders as
 * played — played wins, never two pins for one course. NULL/unprojectable
 * coordinates are dropped (never plotted at 0,0) and counted for the
 * "not on the map yet" note.
 */
export function buildMapPins(
  played: CourseAggregate[],
  wanted: WantToPlayRow[],
): { pins: MapPin[]; unmappedCount: number } {
  const pins: MapPin[] = [];
  let unmappedCount = 0;

  const playedIds = new Set(played.map((c) => c.id));

  for (const course of played) {
    const point = projectPoint(course.latitude, course.longitude);
    if (!point) {
      unmappedCount++;
      continue;
    }
    pins.push({
      id: course.id,
      name: course.name,
      x: point[0],
      y: point[1],
      status: "played",
      rating: course.avgRating,
      playCount: course.playCount,
      city: course.city,
      state: course.state,
    });
  }

  for (const row of wanted) {
    if (playedIds.has(row.courseId)) continue; // played wins
    const point = projectPoint(row.latitude, row.longitude);
    if (!point) {
      unmappedCount++;
      continue;
    }
    pins.push({
      id: row.courseId,
      name: row.name,
      x: point[0],
      y: point[1],
      status: "wanted",
      rating: null,
      playCount: 0,
      city: row.city,
      state: row.state,
    });
  }

  return { pins, unmappedCount };
}

export type MapCluster = {
  key: string;
  x: number;
  y: number;
  pins: MapPin[];
};

/**
 * Greedy screen-distance clustering: pins closer than `radiusPx` on screen
 * (i.e. radiusPx / scale in map units) merge into a count bubble. Zooming in
 * shrinks the map-unit threshold, so clusters dissolve automatically.
 * Deterministic: input is sorted by position/id before grouping.
 */
export function clusterPins(
  pins: MapPin[],
  scale: number,
  radiusPx = 18,
): MapCluster[] {
  const threshold = radiusPx / scale;
  const sorted = [...pins].sort(
    (a, b) => a.x - b.x || a.y - b.y || a.id.localeCompare(b.id),
  );

  const clusters: Array<MapCluster & { sumX: number; sumY: number }> = [];

  for (const pin of sorted) {
    let target = null;
    for (const cluster of clusters) {
      const dx = pin.x - cluster.x;
      const dy = pin.y - cluster.y;
      if (dx * dx + dy * dy <= threshold * threshold) {
        target = cluster;
        break;
      }
    }
    if (target) {
      target.pins.push(pin);
      target.sumX += pin.x;
      target.sumY += pin.y;
      target.x = target.sumX / target.pins.length;
      target.y = target.sumY / target.pins.length;
    } else {
      clusters.push({ key: pin.id, x: pin.x, y: pin.y, sumX: pin.x, sumY: pin.y, pins: [pin] });
    }
  }

  return clusters.map(({ sumX: _x, sumY: _y, ...cluster }) => cluster);
}
