/**
 * The signature "green-complex" motif: thin topographic contour lines,
 * drawn from golf course routing plans. Use once per screen, quietly,
 * behind a header or as a divider — never as repeated wallpaper.
 */
export function ContourLines({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 240"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M-20 60 C 100 10, 200 100, 300 50 S 500 10, 620 60"
        stroke="var(--fairway-lite)"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <path
        d="M-20 100 C 120 60, 220 150, 320 100 S 520 60, 620 110"
        stroke="var(--fairway-lite)"
        strokeOpacity="0.28"
        strokeWidth="1"
      />
      <path
        d="M-20 140 C 140 110, 240 190, 340 150 S 540 110, 620 160"
        stroke="var(--fairway-lite)"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      <path
        d="M-20 180 C 160 160, 260 220, 360 190 S 560 160, 620 200"
        stroke="var(--fairway-lite)"
        strokeOpacity="0.16"
        strokeWidth="1"
      />
    </svg>
  );
}
