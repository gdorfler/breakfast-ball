# Breakfast Ball — Build Plan (v0.5 Validation MVP)

Numbered milestones, each sized for a short session. Check items off as they're completed. See [CLAUDE.md](CLAUDE.md) for scope.

## 0. Project setup
- [x] 0.1 Init Next.js (App Router) + TypeScript project named `breakfast-ball`
- [x] 0.2 Install and configure Tailwind CSS
- [x] 0.3 Create Supabase project; store keys in `.env.local`
- [x] 0.4 Connect repo to Vercel; confirm a blank page deploys — live at breakfast-ball.vercel.app, auth flow verified against production
- [x] 0.5 Add base layout, fonts, and global styles per `fairway-design-system`

## 1. Data model
- [x] 1.1 `courses` table (name, city/state or region, lat, lng, seed source, created_at) — also has country, num_holes, par, website, external_id, created_by
- [x] 1.2 `profiles` table (linked to Supabase auth user, display name, avatar)
- [x] 1.3 `logs` table (user_id, course_id, rating, note, date_played, created_at) — **no uniqueness constraint on (user_id, course_id)**; a user may log the same course multiple times (repeat plays), each as its own row. See section 4 for behavior.
- [x] 1.4 Row-level security policies: users can only write their own logs/profile — verified with a real two-user test: cross-user INSERT/UPDATE/DELETE all correctly blocked, courses publicly readable, own-logs-only enforced both ways
- [x] 1.5 Seed `courses` with an initial batch of real courses, including lat/lng for each (enough to demo, not exhaustive) — 764 PA/NJ/DE courses from OpenStreetMap (source='osm'), upsert verified idempotent

## 2. Auth
- [x] 2.1 Sign up / log in with Supabase Auth (email magic link) — verified: `signInWithOtp` succeeds against the live project
- [x] 2.2 Logged-out landing page explaining the concept — "Sign in" button added; full landing copy/marketing pass still TODO
- [x] 2.3 Logged-in redirect to profile/home — verified end-to-end
- [x] 2.4 Basic profile creation on first sign-in (display name) — verified end-to-end

## 3. Course search & add
- [x] 3.1 Course search page (search by name/city) — pg_trgm fuzzy search via `search_courses` RPC, debounced 300ms, ranks by trigram similarity + ILIKE fallback
- [x] 3.2 Course detail page (name, location, aggregate rating if any logs exist) — rating hidden until 5+ logs, "Log this course" button stubbed for milestone 4
- [x] 3.3 "Can't find your course?" flow — shown only after empty/weak search results; requires name + city + state; lat/lng left NULL (self-documenting "needs geocoding" state, won't appear on map until backfilled)
- [x] 3.4 Basic duplicate-prevention on course add (fuzzy match by name/location) — `check_duplicate_courses` RPC with 0.35 similarity threshold + state filter, user must confirm "none of these" before insert

## 4. Logging a round
- [x] 4.1 "Log this course" form: rating, optional note, date played — half-star tap rating (0.5–5.0, required), 300-char note with live counter, date defaults to today. No score/GPS/performance fields.
- [x] 4.2 Save log, show confirmation. Repeat plays are additive: logging a course a user has already logged before creates a new log entry (like a diary entry), it does not block, warn, or overwrite. Form shows "you've played this course X times before" hint when applicable; course page shows a dated history of the user's own past rounds at that course.
- [x] 4.3 Edit/delete an existing log (affects only that single log entry, not other logs of the same course) — enforced via existing RLS (own-rows-only), reachable via "Edit" on the course page's history list

## 5. Profile & history
- [x] 5.1 Profile page listing all logs (most recent first) — a repeat play at the same course appears as its own entry, diary-style. Lives at `/profile`; each entry links to its course page
- [x] 5.2 Basic stats: **distinct** courses played (not total logs), total rounds logged, average rating — stats row shows distinct courses / distinct states / total rounds, all derived from the same single query as the list so they can't drift. Average rating intentionally not shown (founder-specified stat row was courses/states/rounds; "munis" isn't derivable — no ownership-type data in schema or OSM seed)
- [x] 5.3 Empty state for a profile with no logs yet (per `fairway-design-system`) — "Your map starts with one round" + Find-a-course CTA

## 6. Shareable course map
- [x] 6.1 Design and build the course map view (per `fairway-share-card`) — `/profile/map`: stylized paper US map (AlbersUSA, hand-rolled SVG from us-atlas — no map library/tiles), one dot per distinct course, staggered pin-drop entrance (reduced-motion respected), tap/hover a pin for name + rating. NULL-coordinate courses filtered before projection (never plotted at 0,0) with an honest "N courses aren't on the map yet" note
- [x] 6.2 Export map as a shareable image — `/profile/share`: portrait (1080×1350, year-in-golf recipe with top-5 courses) + square (1080×1080, everyday-map recipe) variants, This-year/All-time scope toggle, exported via html-to-image at 2x (2160px) with Fraunces/Inter embedded; export renders a static non-animated instance so no frame is mid-animation. Verified end-to-end (PNG 2160×2700 produced) and at both sparse (5-course) and dense (120-course) data via the dev-only `/dev/card` test bench
- [x] 6.3 Share flow (download image / copy link / native share sheet on mobile web) — Download button + native share sheet (`navigator.share` with the PNG file) where supported; "still chasing" line omitted (no want-to-play data in v0.5), "munis" stat not derivable (no ownership data) — card shows courses / states / rounds

## 7. Want-to-play / dream board
- [x] 7.1 (a) `want_to_play` table (user_id, course_id, created_at) + add/remove "want to play" flow from course pages — RLS own-rows-only (single FOR ALL policy, mirrors the `logs` table pattern), `unique (user_id, course_id)` so a course can only be on the list once. Verified against live Supabase: table exists, anon reads return empty (RLS-filtered), anon inserts rejected with 42501. Toggle lives near the course title as a quiet pill (fairway-lite, "+ Want to play" / "✓ On your want-to-play list") — deliberately lighter than the solid full-width "Log this course" CTA so it doesn't compete for visual weight; independent of logged state, so a course can be both logged and want-to-played
- [x] 7.2 (b) Surface the want-to-play list on the profile — a distinct section below the played-courses list, fetched and rendered independently (`fetchWantToPlay` never touches `fetchUserLogs`/stats math, so it structurally can't leak into courses/states/rounds). Quiet uppercase eyebrow header + count ("N on the list"), items styled as soft `paper-2` cards rather than the played list's plain divided rows, no star ratings — reads as a wishlist, not a ledger. Remove control per item (optimistic, reverts on failure), same delete as the 7.1 toggle. Empty state: "Nothing on the list yet. What are you chasing?" (verbatim from the design system's example copy)
- [x] 7.3 (c) Dream-board map: played + want-to-play pins together, visually distinct pin states — solid fairway = played (earned), hollow fairway outline = want-to-play (promise); flag-red fully reserved off the map. Played wins when a course is both (never two pins). NULL-coordinate courses excluded from both states with the "not on the map yet" note. Legend below the map; tap/hover shows name + rating (played) or "on your list" (wanted), linking to the course page; pin-drop entrance respects reduced-motion. Share card includes both states + legend and gains the share-card skill's "still chasing: X · Y" hook line (top-2 most recent wants, omitted when empty); card stats remain played-only. Export re-verified end-to-end (2160×2700 PNG)
- [x] 7.4 (d) Regional zoom/clustering on the map — custom, zero new deps: zoom/pan is SVG viewBox math (pinch, mouse drag, wheel, double-tap, +/− buttons; one-finger touch deliberately left to page scroll), greedy screen-distance clustering into count bubbles (solid = all played, hollow = all wanted, solid + outer ring = mixed; tap a bubble to zoom into it), clusters dissolve automatically as the threshold shrinks with zoom. Default view auto-fits the user's pins (capped, floored at full US). Pure deterministic math shared with the share card, which keeps the full-US framing (recognizable at thumbnail size) with clustering active so dense metros read as bubbles on the PNG. Verified: auto-fit on a PA/NJ/DE-only set zooms ~8×, the national "5" bubble dissolves to 5 pins
- [ ] 7.5 (e) Visual course list (want-to-play + played, browsable) — **interactive/visual layer**

## 8. Polish & mobile
- [x] 8.0 Persistent primary nav (Search / Map / Profile) on every logged-in screen — bottom tab bar on mobile, top bar on desktop, same items and active-state logic both ways. Implemented via a `src/app/(app)` route group layout wrapping home/courses/profile so auth-gating (per-page redirect) and nav rendering can't get out of sync; logged-out routes (`/`, `/login`, `/onboarding`) sit outside the group and never see it
- [ ] 8.1 Responsive pass on all screens (phone-first)
- [ ] 8.2 Error and loading states across the app
- [ ] 8.3 Basic SEO/meta tags + social preview image for the landing page

## 9. Launch prep
- [ ] 9.1 Deploy final build to production Vercel URL
- [ ] 9.2 Smoke-test full flow end-to-end as a fresh user
- [ ] 9.3 Recruit and onboard first 50–100 golfers
- [ ] 9.4 Set up a lightweight way to collect feedback (form, email, DM)
- [ ] 9.5 Configure custom SMTP for Supabase Auth (Authentication → Settings → SMTP Settings) — the default built-in email sender is rate-limited to a handful of emails/hour and won't hold up to real onboarding

---
**Explicitly not planned here:** GPS, score analytics, handicap, tee-time booking, trips, native app. See CLAUDE.md if any of these come up.
