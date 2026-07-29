# Breakfast Ball — Project Brief

Re-read this file at the start of every session. It is the source of truth for what this project is and what it is not.

## Concept

"Letterboxd for golf courses." Golfers log the courses they've played, rate them, and build a personal map/history of everywhere they've golfed. Social/discovery layer (following, seeing friends' logs) can come later — v0.5 is about proving people will bother to log courses at all.

## Founder context

Solo, non-engineer founder building this with Claude Code. Explain tradeoffs in plain terms when they matter (cost, complexity, time-to-ship) rather than assuming prior engineering background. Default to the simplest thing that works; avoid introducing infrastructure or patterns that need ongoing maintenance the founder can't do solo.

## Stack

- **Framework:** Next.js (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Backend/DB/Auth:** Supabase (Postgres + Auth + Storage)
- **Hosting:** Vercel
- **Design:** Use the `fairway-design-system` skill for every screen, component, or UI decision. Use the `fairway-share-card` skill for anything a user exports or shares outward (course map, year-in-golf card, badges).

## v0.5 Scope — Validation MVP

Goal: get 50–100 real golfers to sign up, log courses they've played, rate them, see a shareable map of everywhere they've golfed, and mark courses they want to play. Scope is deliberately narrow — see the in-scope list and Scope changes section for the current boundary.

In scope:
1. Email or magic-link auth (Supabase Auth)
2. A searchable course database (seeded, not user-submitted at this stage — unless a course is missing, see below)
3. Logging a played course: course + rating + optional short note + date played. Logging is additive/diary-style — a user can log the same course multiple times (e.g. a home course); each play is its own entry, never blocked or merged. Aggregate views (stats, map) count **distinct courses**, not total logs.
4. A profile page listing all logged courses
5. A shareable "course map" (visual, exportable/shareable image) showing everywhere the user has golfed
6. Basic ability to add a missing course if it's not in the seed database
7. Mobile-friendly responsive web (not a native app)
8. Want-to-play list — a user can mark courses they want to play; these appear on their profile and on the course map as a distinct pin state (a "dream board").

## Explicitly OUT of scope for v0.5

Do not build these, even if they seem easy or "just a small addition." If a request would require one of these, flag it and confirm before proceeding.

- GPS / location tracking of any kind
- Score entry or score analytics (strokes, stats, trends)
- Handicap tracking or calculation
- Tee-time booking or availability
- Trip planning / multi-day itineraries
- Native mobile app (iOS/Android) — mobile-friendly responsive web only
- Social feed, comments, following/followers (may come later, not now)
- Course reviews beyond a simple rating + short note
- Payments/monetization of any kind

## Scope changes

- 2026-07-29 — Added want-to-play/dream board to v0.5 scope. Rationale: testing the two-dimensional product (memory + desire), not a pure past-logger.

## Naming

The project is named **Breakfast Ball**. Use it as the display/marketing name (titles, landing page, README). For code-level naming (package.json `name`, repo, project folder, env var prefixes, etc.), use the kebab-case form `breakfast-ball`.

## Working agreements

- This is a many-short-sessions project. Keep changes small and shippable; update [BUILD_PLAN.md](BUILD_PLAN.md) checkboxes as milestones complete.
- Before starting new work each session, re-read this file and the current state of BUILD_PLAN.md.
- Every UI screen or component change goes through the `fairway-design-system` skill. Every shareable/exportable artifact goes through the `fairway-share-card` skill.
- When a request would expand scope beyond the v0.5 list above, say so explicitly and ask before building it.
