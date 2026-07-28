"use client";

import { useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { CourseMapSvg } from "@/components/course-map-svg";
import type { CourseAggregate } from "@/lib/user-logs";
import { ShareCard, CARD_SIZES, type CardVariant } from "@/app/(app)/profile/share/share-card";

const SPARSE: CourseAggregate[] = [
  { id: "s1", name: "Cobbs Creek Golf Club", city: "Philadelphia", state: "PA", latitude: 39.9634, longitude: -75.2724, avgRating: 4.5, playCount: 2, lastPlayed: "2026-06-20" },
  { id: "s2", name: "Bethpage Black", city: "Farmingdale", state: "NY", latitude: 40.7419, longitude: -73.4554, avgRating: 5.0, playCount: 1, lastPlayed: "2026-05-30" },
  { id: "s3", name: "Wissahickon Valley", city: "Ambler", state: "PA", latitude: 40.1546, longitude: -75.2216, avgRating: 3.5, playCount: 3, lastPlayed: "2026-07-04" },
  { id: "s4", name: "Seaview Bay Course", city: "Galloway", state: "NJ", latitude: 39.4665, longitude: -74.5104, avgRating: 4.0, playCount: 1, lastPlayed: "2026-04-12" },
  { id: "s5", name: "Rock Manor Golf Course", city: "Wilmington", state: "DE", latitude: 39.7756, longitude: -75.5613, avgRating: 3.0, playCount: 1, lastPlayed: "2026-03-28" },
  { id: "s6", name: "Un-geocoded Muni", city: "Somewhere", state: "PA", latitude: null, longitude: null, avgRating: 4.0, playCount: 1, lastPlayed: "2026-06-01" },
];

// 120 deterministic dots scattered across the continental US (golden-angle
// spiral over a lat/lng box; anything the projection rejects just won't plot).
const DENSE: CourseAggregate[] = Array.from({ length: 120 }, (_, i) => {
  const t = i / 120;
  const angle = i * 137.508;
  const lat = 31 + ((angle * 7) % 100) / 100 * 16;
  const lng = -118 + t * 42 + (((angle * 13) % 100) / 100) * 4;
  return {
    id: `d${i}`,
    name: `Course ${i + 1} Golf Club`,
    city: "Town",
    state: "US",
    latitude: Math.round(lat * 1000) / 1000,
    longitude: Math.round(lng * 1000) / 1000,
    avgRating: 2.5 + ((i * 7) % 6) * 0.5,
    playCount: 1 + (i % 4),
    lastPlayed: "2026-06-15",
  };
});

function Scaled({
  variant,
  children,
}: {
  variant: CardVariant;
  children: React.ReactNode;
}) {
  const scale = 0.32;
  const { width, height } = CARD_SIZES[variant];
  return (
    <div
      className="overflow-hidden rounded"
      style={{ width: width * scale, height: height * scale, boxShadow: "0 4px 16px rgba(23,37,28,0.15)" }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

export function DevCardGallery() {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportResult, setExportResult] = useState("not run");

  async function testExport() {
    setExportResult("running…");
    try {
      const blob = await toBlob(exportRef.current!, { pixelRatio: 2, cacheBust: true });
      if (!blob) throw new Error("null blob");
      const bmp = await createImageBitmap(blob);
      setExportResult(
        `ok: ${blob.type}, ${Math.round(blob.size / 1024)}KB, ${bmp.width}x${bmp.height}`,
      );
    } catch (e) {
      setExportResult(`FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <main className="flex flex-col gap-10 p-8">
      <section>
        <button
          onClick={testExport}
          className="rounded-[10px] border border-fairway px-4 py-2 text-sm text-fairway"
        >
          Test export (portrait sparse)
        </button>
        <p className="mt-2 text-sm" data-testid="export-result">
          {exportResult}
        </p>
        <div aria-hidden="true" style={{ position: "fixed", top: 0, left: -2300 }}>
          <div ref={exportRef}>
            <ShareCard variant="portrait" eyebrow="2026 · Year in golf" headline="Gavin’s 2026, mapped" courses={SPARSE} totalRounds={9} />
          </div>
        </div>
      </section>
      <section>
        <h2 className="font-display mb-3 text-xl">Interactive map (animated, sparse)</h2>
        <div className="max-w-xl">
          <CourseMapSvg courses={SPARSE} animated className="w-full" />
        </div>
      </section>

      <section>
        <h2 className="font-display mb-3 text-xl">Cards</h2>
        <div className="flex flex-wrap items-start gap-8">
          <div>
            <p className="mb-2 text-sm text-fairway-lite">Portrait · sparse (5 mapped + 1 unmapped)</p>
            <Scaled variant="portrait">
              <ShareCard variant="portrait" eyebrow="2026 · Year in golf" headline="Gavin’s 2026, mapped" courses={SPARSE} totalRounds={9} />
            </Scaled>
          </div>
          <div>
            <p className="mb-2 text-sm text-fairway-lite">Portrait · dense (120)</p>
            <Scaled variant="portrait">
              <ShareCard variant="portrait" eyebrow="Course map · All time" headline="Gavin’s courses, mapped" courses={DENSE} totalRounds={214} />
            </Scaled>
          </div>
          <div>
            <p className="mb-2 text-sm text-fairway-lite">Square · sparse</p>
            <Scaled variant="square">
              <ShareCard variant="square" eyebrow="Course map" headline="Gavin’s courses, mapped" courses={SPARSE} totalRounds={9} />
            </Scaled>
          </div>
          <div>
            <p className="mb-2 text-sm text-fairway-lite">Square · dense</p>
            <Scaled variant="square">
              <ShareCard variant="square" eyebrow="Course map" headline="Gavin’s courses, mapped" courses={DENSE} totalRounds={214} />
            </Scaled>
          </div>
        </div>
      </section>
    </main>
  );
}
