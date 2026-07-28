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
- [ ] 5.1 Profile page listing all logs (most recent first) — a repeat play at the same course appears as its own entry, diary-style
- [ ] 5.2 Basic stats: **distinct** courses played (not total logs), total rounds logged, average rating
- [ ] 5.3 Empty state for a profile with no logs yet (per `fairway-design-system`)

## 6. Shareable course map
- [ ] 6.1 Design and build the course map view (per `fairway-share-card`) — one dot per distinct course (lat/lng from `courses`), not one per log; repeat plays don't add extra dots. **Must filter `WHERE latitude IS NOT NULL`** — user-submitted courses save with NULL coordinates until backfilled and would otherwise be silently dropped or misplotted
- [ ] 6.2 Export map as a shareable image
- [ ] 6.3 Share flow (download image / copy link / native share sheet on mobile web)

## 7. Polish & mobile
- [ ] 7.1 Responsive pass on all screens (phone-first)
- [ ] 7.2 Error and loading states across the app
- [ ] 7.3 Basic SEO/meta tags + social preview image for the landing page

## 8. Launch prep
- [ ] 8.1 Deploy final build to production Vercel URL
- [ ] 8.2 Smoke-test full flow end-to-end as a fresh user
- [ ] 8.3 Recruit and onboard first 50–100 golfers
- [ ] 8.4 Set up a lightweight way to collect feedback (form, email, DM)
- [ ] 8.5 Configure custom SMTP for Supabase Auth (Authentication → Settings → SMTP Settings) — the default built-in email sender is rate-limited to a handful of emails/hour and won't hold up to real onboarding

---
**Explicitly not planned here:** GPS, score analytics, handicap, tee-time booking, trips, native app. See CLAUDE.md if any of these come up.
