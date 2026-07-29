"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CourseMapSvg, MapLegend } from "@/components/course-map-svg";
import {
  MAX_SCALE,
  MIN_SCALE,
  clampView,
  fitView,
  type MapCluster,
  type MapPin,
  type MapViewState,
} from "@/lib/map-view";
import { US_MAP_VIEWBOX } from "@/lib/us-map-data";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-sm text-flag">
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

export function MapView({
  pins,
  unmappedCount,
  totalRounds,
}: {
  pins: MapPin[];
  unmappedCount: number;
  totalRounds: number;
}) {
  const initialView = useMemo(() => fitView(pins), [pins]);
  const [view, setView] = useState<MapViewState>(initialView);
  const [active, setActive] = useState<MapPin | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Live pointer positions for drag-pan and pinch-zoom.
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const viewRef = useRef(view);
  viewRef.current = view;

  const playedCount = pins.filter((p) => p.status === "played").length;
  const wantedCount = pins.length - playedCount;
  const states = new Set(
    pins.filter((p) => p.status === "played").map((p) => p.state).filter(Boolean),
  ).size;

  function applyView(next: MapViewState) {
    setHasInteracted(true);
    setView(clampView(next));
  }

  function zoomBy(factor: number, center?: { x: number; y: number }) {
    const cur = viewRef.current;
    const scale = Math.min(Math.max(cur.scale * factor, MIN_SCALE), MAX_SCALE);
    if (!center) {
      applyView({ ...cur, scale });
      return;
    }
    // Keep the map point under the cursor fixed while zooming.
    const ratio = cur.scale / scale;
    applyView({
      scale,
      cx: center.x - (center.x - cur.cx) * ratio,
      cy: center.y - (center.y - cur.cy) * ratio,
    });
  }

  /** Converts a client (px) position to map coordinates under the current view. */
  function clientToMap(clientX: number, clientY: number) {
    const el = containerRef.current;
    const cur = viewRef.current;
    if (!el) return { x: cur.cx, y: cur.cy };
    const rect = el.getBoundingClientRect();
    const vw = US_MAP_VIEWBOX.width / cur.scale;
    const vh = US_MAP_VIEWBOX.height / cur.scale;
    return {
      x: cur.cx - vw / 2 + ((clientX - rect.left) / rect.width) * vw,
      y: cur.cy - vh / 2 + ((clientY - rect.top) / rect.height) * vh,
    };
  }

  // Wheel zoom needs a non-passive native listener to preventDefault page scroll.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.25 : 0.8, clientToMap(e.clientX, e.clientY));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const pointers = pointersRef.current;
    const prev = pointers.get(e.pointerId);
    if (!prev) return;

    const el = containerRef.current;
    const cur = viewRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const unitsPerPx = US_MAP_VIEWBOX.width / cur.scale / rect.width;

    if (pointers.size === 2) {
      // Pinch: zoom by the distance ratio, pan by the midpoint delta.
      const entries = [...pointers.entries()];
      const other = entries.find(([id]) => id !== e.pointerId)![1];
      const distBefore = Math.hypot(prev.x - other.x, prev.y - other.y);
      const distAfter = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      const midBefore = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 };
      const midAfter = { x: (e.clientX + other.x) / 2, y: (e.clientY + other.y) / 2 };

      const scale = Math.min(
        Math.max(cur.scale * (distBefore > 0 ? distAfter / distBefore : 1), MIN_SCALE),
        MAX_SCALE,
      );
      const mid = clientToMap(midBefore.x, midBefore.y);
      const ratio = cur.scale / scale;
      const panX = (midAfter.x - midBefore.x) * (US_MAP_VIEWBOX.width / scale / rect.width);
      const panY = (midAfter.y - midBefore.y) * (US_MAP_VIEWBOX.height / scale / rect.height);

      applyView({
        scale,
        cx: mid.x - (mid.x - cur.cx) * ratio - panX,
        cy: mid.y - (mid.y - cur.cy) * ratio - panY,
      });
    } else if (pointers.size === 1 && e.pointerType !== "touch") {
      // Mouse/pen drag pans. Single-finger touch is left alone so the page
      // can still scroll on phones — pinch, buttons, and cluster-tap zoom
      // cover touch navigation.
      applyView({
        ...cur,
        cx: cur.cx - (e.clientX - prev.x) * unitsPerPx,
        cy: cur.cy - (e.clientY - prev.y) * unitsPerPx,
      });
    }

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function onPointerEnd(e: React.PointerEvent) {
    pointersRef.current.delete(e.pointerId);
  }

  function onClusterSelect(cluster: MapCluster) {
    setActive(null);
    const fitted = fitView(cluster.pins, MAX_SCALE);
    // Always move meaningfully inward, even for very tight clusters.
    applyView({
      ...fitted,
      scale: Math.max(fitted.scale, Math.min(viewRef.current.scale * 2.2, MAX_SCALE)),
      cx: cluster.x,
      cy: cluster.y,
    });
  }

  return (
    <main className="flex flex-1 flex-col px-6 pb-24 pt-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/profile"
          className="mb-6 inline-flex items-center gap-1 text-sm text-fairway-lite transition-colors hover:text-ink"
        >
          <span aria-hidden="true">&larr;</span> Back to profile
        </Link>

        <h1 className="font-display text-3xl text-ink">Your course map</h1>
        <p className="mt-1 text-sm text-fairway-lite">
          {playedCount} played &middot; {wantedCount} want to play &middot; {states}{" "}
          {states === 1 ? "state" : "states"} &middot; {totalRounds}{" "}
          {totalRounds === 1 ? "round" : "rounds"}
        </p>

        <div
          ref={containerRef}
          className="relative mt-6 touch-pan-y select-none overflow-hidden rounded-[10px]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onDoubleClick={(e) => zoomBy(2, clientToMap(e.clientX, e.clientY))}
        >
          <CourseMapSvg
            pins={pins}
            view={view}
            animated={!hasInteracted}
            activeId={active?.id ?? null}
            onSelectPin={setActive}
            onSelectCluster={onClusterSelect}
            className="h-auto w-full"
          />

          <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-[10px] border border-line/50 bg-paper shadow-sm">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomBy(1.6)}
              className="px-3 py-1.5 font-display text-lg leading-none text-ink transition-colors hover:bg-paper-2"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => zoomBy(0.625)}
              className="border-t border-line/40 px-3 py-1.5 font-display text-lg leading-none text-ink transition-colors hover:bg-paper-2"
            >
              &minus;
            </button>
          </div>

          {hasInteracted && (
            <button
              type="button"
              onClick={() => {
                setView(initialView);
                setActive(null);
              }}
              className="absolute bottom-2 right-2 rounded-full border border-line/50 bg-paper px-3 py-1 text-xs text-fairway-lite transition-colors hover:text-ink"
            >
              Reset view
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <MapLegend className="text-xs text-fairway-lite" />
          <span className="hidden text-xs text-fairway-lite/60 md:block">
            Scroll or drag to explore
          </span>
        </div>

        <div
          className="mt-4 flex min-h-16 items-center justify-center rounded-[10px] border border-line/40 bg-paper-2 px-4 py-3"
          aria-live="polite"
        >
          {active ? (
            <Link
              href={`/courses/${active.id}`}
              className="text-center transition-opacity hover:opacity-80"
            >
              <span className="font-display text-base text-ink">{active.name}</span>
              <span className="ml-2">
                {active.status === "played" && active.rating !== null ? (
                  <Stars rating={active.rating} />
                ) : (
                  <span className="text-xs text-fairway-lite">on your list</span>
                )}
              </span>
              <span className="mt-0.5 block text-xs text-fairway-lite">
                {[active.city, active.state].filter(Boolean).join(", ")}
                {active.status === "played" &&
                  active.playCount > 1 &&
                  ` · played ${active.playCount} times`}
              </span>
            </Link>
          ) : (
            <p className="text-sm text-fairway-lite/70">
              Tap a pin for the course &mdash; tap a numbered bubble to zoom in
            </p>
          )}
        </div>

        {unmappedCount > 0 && (
          <p className="mt-3 text-center text-xs text-fairway-lite/70">
            {unmappedCount} {unmappedCount === 1 ? "course isn't" : "courses aren't"}{" "}
            on the map yet &mdash; missing coordinates, we&rsquo;ll place{" "}
            {unmappedCount === 1 ? "it" : "them"} soon.
          </p>
        )}

        <Link
          href="/profile/share"
          className="mt-8 block w-full rounded-[10px] bg-fairway py-3 text-center font-display text-base text-paper"
        >
          Make your share card
        </Link>
      </div>
    </main>
  );
}
