"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { toBlob } from "html-to-image";
import { aggregateCourses, type UserLog } from "@/lib/user-logs";
import type { WantToPlayRow } from "@/lib/want-to-play";
import { ShareCard, CARD_SIZES, type CardVariant } from "./share-card";

type Scope = "all" | "year";

export function ShareStudio({
  displayName,
  logs,
  wantToPlay,
}: {
  displayName: string;
  logs: UserLog[];
  wantToPlay: WantToPlayRow[];
}) {
  const [variant, setVariant] = useState<CardVariant>("portrait");
  const [scope, setScope] = useState<Scope>("all");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  const year = new Date().getFullYear();

  const scopedLogs = useMemo(
    () =>
      scope === "year"
        ? logs.filter((l) => l.played_on.startsWith(String(year)))
        : logs,
    [logs, scope, year],
  );
  const courses = useMemo(() => aggregateCourses(scopedLogs), [scopedLogs]);

  const eyebrow = scope === "year" ? `${year} · Year in golf` : "Course map · All time";
  const headline =
    scope === "year"
      ? `${displayName}’s ${year}, mapped`
      : `${displayName}’s courses, mapped`;

  const { width, height } = CARD_SIZES[variant];

  // Scale the true-size card down to fit the screen for preview.
  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setScale(Math.min(el.clientWidth / width, 1));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [width]);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  async function renderPng(): Promise<Blob | null> {
    if (!exportRef.current) return null;
    // 2x for retina/social crispness; fonts are same-origin (next/font) so
    // html-to-image embeds Fraunces/Inter instead of falling back.
    return toBlob(exportRef.current, { pixelRatio: 2, cacheBust: true });
  }

  const filename = `breakfast-ball-${scope === "year" ? year : "all-time"}-${variant}.png`;

  async function handleDownload() {
    setExporting(true);
    setError("");
    try {
      const blob = await renderPng();
      if (!blob) throw new Error("no blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't create the image. Try again.");
    }
    setExporting(false);
  }

  async function handleNativeShare() {
    setExporting(true);
    setError("");
    try {
      const blob = await renderPng();
      if (!blob) throw new Error("no blob");
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Device supports share() but not files — fall back to download.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // User cancelling the share sheet is not an error.
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError("Couldn't share the image. Try downloading instead.");
      }
    }
    setExporting(false);
  }

  const scopeEmpty = courses.length === 0;

  return (
    <main className="flex flex-1 flex-col px-6 pb-24 pt-12">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/profile/map"
          className="mb-6 inline-flex items-center gap-1 text-sm text-fairway-lite transition-colors hover:text-ink"
        >
          <span aria-hidden="true">&larr;</span> Back to your map
        </Link>

        <h1 className="font-display text-3xl text-ink">Your share card</h1>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex rounded-full border border-line/50 p-1">
            {(
              [
                ["all", "All time"],
                ["year", String(year)],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  scope === value
                    ? "bg-fairway text-paper"
                    : "text-fairway-lite hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex rounded-full border border-line/50 p-1">
            {(
              [
                ["portrait", "Portrait"],
                ["square", "Square"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setVariant(value)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  variant === value
                    ? "bg-fairway text-paper"
                    : "text-fairway-lite hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {scopeEmpty ? (
          <div className="mt-8 rounded-[10px] border border-line/40 bg-paper-2 p-8 text-center">
            <p className="font-display text-lg text-ink">
              Nothing logged in {year} yet
            </p>
            <p className="mt-2 text-sm text-fairway-lite">
              Switch to all time, or log a round from this year.
            </p>
          </div>
        ) : (
          <>
            <div ref={previewWrapRef} className="mt-6 w-full">
              <div
                className="overflow-hidden rounded-[10px]"
                style={{
                  height: height * scale,
                  boxShadow: "0 8px 32px rgba(23, 37, 28, 0.14)",
                }}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <ShareCard
                    variant={variant}
                    eyebrow={eyebrow}
                    headline={headline}
                    courses={courses}
                    wantToPlay={wantToPlay}
                    totalRounds={scopedLogs.length}
                  />
                </div>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-flag">{error}</p>}

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleDownload}
                disabled={exporting}
                className="w-full rounded-[10px] bg-fairway py-3 text-center font-display text-base text-paper transition-opacity disabled:opacity-50"
              >
                {exporting ? "Creating image…" : "Download image"}
              </button>
              {canNativeShare && (
                <button
                  onClick={handleNativeShare}
                  disabled={exporting}
                  className="w-full rounded-[10px] border border-fairway py-3 text-center font-display text-base text-fairway transition-colors hover:bg-fairway hover:text-paper disabled:opacity-50"
                >
                  Share
                </button>
              )}
            </div>

            {/* Full-size instance the export captures — rendered offscreen, never animated. */}
            <div
              aria-hidden="true"
              style={{ position: "fixed", top: 0, left: -width * 2 - 100 }}
            >
              <div ref={exportRef}>
                <ShareCard
                  variant={variant}
                  eyebrow={eyebrow}
                  headline={headline}
                  courses={courses}
                  wantToPlay={wantToPlay}
                  totalRounds={scopedLogs.length}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
