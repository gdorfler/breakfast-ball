import { geoAlbersUsa } from "d3-geo";

// Must exactly match the projection us-atlas pre-projected the state shapes with
// (see scripts/gen-us-map-data.mjs), or dots won't line up with the map.
const projection = geoAlbersUsa().scale(1300).translate([487.5, 305]);

/**
 * Projects a course's lat/lng onto the 975x610 map viewport.
 * Returns null for anything unplottable — missing coordinates, or points the
 * AlbersUSA projection rejects (outside the US + AK/HI insets). Callers filter
 * nulls; nothing ever plots at (0,0).
 */
export function projectPoint(
  latitude: number | null,
  longitude: number | null,
): [number, number] | null {
  if (latitude == null || longitude == null) return null;
  const point = projection([longitude, latitude]);
  if (!point) return null;
  // Round to 2 decimals (sub-pixel here): trig results differ in the last
  // float digit between Node and the browser, which otherwise causes React
  // hydration mismatches on every dot.
  return [Math.round(point[0] * 100) / 100, Math.round(point[1] * 100) / 100];
}
