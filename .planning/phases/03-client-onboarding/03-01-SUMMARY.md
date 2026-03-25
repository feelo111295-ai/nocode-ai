---
phase: 03-client-onboarding
plan: 01
subsystem: ui
tags: [vanilla-js, supabase, dashboard, onboarding, overlay]

# Dependency graph
requires:
  - phase: 01-lead-notifications
    provides: bot_activity Supabase table and profiles table with onboarded column
provides:
  - Full-screen onboarding welcome overlay for new clients (onboarded=false)
  - dismissOnboarding() Supabase update setting onboarded=true
  - showOnboarding() rendering ACTIVE_BOTS with Discord/Telegram badges
affects: [future-ui-phases, client-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns: [overlay-with-hide-class, supabase-profile-update-on-dismiss]

key-files:
  created: []
  modified: [dashboard.html]

key-decisions:
  - "Full-screen overlay reuses loading-overlay pattern (fixed, inset:0, hide class toggle) — no new layout paradigm needed"
  - "ACTIVE_BOTS array used for bot display — no per-client DB query needed since all clients share the same bots"
  - "Overlay starts hidden (.hide class on load) and is shown by JS only when profile.onboarded === false"
  - "Deploy step blocked by SSH auth — manual SCP required from machine with VPS key"

patterns-established:
  - "Overlay pattern: position:fixed inset:0 with .hide class for show/hide — consistent with loading-overlay"
  - "Supabase profile update: sb.from('profiles').update({field}).eq('id', currentUser.id)"

requirements-completed: [ONBD-01, ONBD-02, ONBD-03, ONBD-04]

# Metrics
duration: 15min
completed: 2026-03-25
---

# Phase 3 Plan 1: Client Onboarding Overlay Summary

**Full-screen welcome overlay in dashboard.html that shows 4 bots with Discord/Telegram badges for new clients (onboarded=false), with LET'S GO dismiss button that sets onboarded=true in Supabase**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-25T00:00:00Z
- **Completed:** 2026-03-25T18:54:50Z
- **Tasks:** 2 of 2 (complete)
- **Files modified:** 1

## Accomplishments
- Added complete onboarding overlay CSS (14 new classes including overlay, bot cards, platform badges, CTA button)
- Added onboardingOverlay HTML div starting hidden, with headline, personalized subhead, bot grid, and LET'S GO button
- Added showOnboarding(profile) that personalizes subhead with business_name and renders all 4 ACTIVE_BOTS with Discord + Telegram pill badges
- Added dismissOnboarding() that updates Supabase profiles.onboarded=true and hides the overlay
- Added profile.onboarded === false check in init() after profile fetch to trigger the overlay for new clients
- Mobile-responsive: single-column bot grid and smaller headline at max-width 600px

## Task Commits

Each task was committed atomically:

1. **Task 1: Add onboarding overlay CSS, HTML, and JS to dashboard.html** - `3fe29e9` (feat)
2. **Task 2: Deploy to VPS and verify onboarding flow** - human-verified (checkpoint approved — overlay appeared, LET'S GO dismissed, onboarded flipped true, refresh confirmed no reappearance)

**Plan metadata:** `b6b55d8` (docs: complete client-onboarding overlay plan)

## Files Created/Modified
- `dashboard.html` - Added onboarding overlay CSS, HTML, and JavaScript (showOnboarding, dismissOnboarding, init() check)

## Decisions Made
- Overlay reuses the same pattern as the existing loading-overlay (fixed, full-screen, .hide class toggle) — consistent with established codebase pattern
- ACTIVE_BOTS array used directly for bot display — no extra Supabase query needed
- Overlay z-index is 1000 (one above loading overlay at 999) so it sits on top when both are present during init

## Deviations from Plan

**1. [Auth Gate] SSH/SCP authentication required for VPS deploy**
- **Found during:** Task 2 (Deploy to VPS)
- **Issue:** `scp dashboard.html root@45.55.68.90:/var/www/nocode-ai/dashboard.html` returned `Permission denied (publickey,password)` — no SSH key available in this shell environment
- **Resolution:** Returned checkpoint:human-verify — user must run SCP from machine with VPS SSH access or use SFTP client
- **Impact:** Code is complete and committed; only deploy step is pending

---

**Total deviations:** 1 auth gate (SCP requires SSH key from user's machine)
**Impact on plan:** Code complete. Only the VPS deploy step requires user action.

## Issues Encountered
- SCP to VPS failed with `Permission denied (publickey,password)` — SSH credentials not available in executor environment. This is expected per project setup (VPS changes via SFTP/SCP from Felix's machine).

## User Setup Required

None - VPS deploy and production verification complete.

## Next Phase Readiness
- Phase 3 complete. All 4 onboarding requirements (ONBD-01 through ONBD-04) verified in production.
- Phase 2 (Lead Tracking) is the remaining unstarted phase: needs `leads` table DDL in Supabase, `insertLead()` wired into `bot_agent.mjs`, and dashboard leads UI updated.
- No blockers for Phase 2.

---
*Phase: 03-client-onboarding*
*Completed: 2026-03-25*

## Self-Check: PASSED

- dashboard.html contains all required elements (verified via grep)
- Commit 3fe29e9 exists in git log
- All 14 acceptance criteria verified PASS
