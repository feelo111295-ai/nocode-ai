---
phase: 01-lead-notifications
plan: 01
subsystem: infra
tags: [resend, email, notifications, discord, bot, nodejs]

# Dependency graph
requires: []
provides:
  - notifyLeadCaptured function in bot_agent.mjs — sends HTML email to felix@nocode-ai.co on lead detection
  - Async fire-and-forget lead notification wired into reply tool handler
  - Non-fatal error handling ensuring bot resilience on Resend failure
affects:
  - 02-leads-table (will add structured lead storage; businessName currently 'Not provided')
  - future phases consuming bot_agent.mjs

# Tech tracking
tech-stack:
  added: [Resend HTTP API (already had RESEND_API_KEY env var; this plan adds the notifyLeadCaptured consumer)]
  patterns:
    - fire-and-forget async with .catch() for non-blocking side effects
    - try/catch wrapping third-party API calls for bot resilience
    - HTML email templating inline in Node.js function

key-files:
  created: []
  modified:
    - C:/Users/feelo/OneDrive/Desktop/bot_agent.mjs

key-decisions:
  - "businessName hardcoded as 'Not provided' at call site — Discord ChannelNotificationSchema carries no business field; structured capture deferred to Phase 2 leads table"
  - "notifyLeadCaptured called with .catch() not await — email send must never delay or block the bot's Discord reply"
  - "bot_agent.mjs added to nocode-ai git repo for version tracking (was previously only on Desktop, deployed via SCP)"

patterns-established:
  - "Non-blocking side effects: fire-and-forget with .catch(err => log(...)) pattern for async notifications"
  - "Non-fatal third-party calls: try/catch inside notification functions so Resend failures never crash the bot"

requirements-completed: [NOTF-01, NOTF-02, NOTF-03, NOTF-04]

# Metrics
duration: 8min
completed: 2026-03-25
---

# Phase 01 Plan 01: Lead Notifications Summary

**Async email notification via Resend wired into bot_agent.mjs reply handler — fires on every 'lead' action_type, sends Discord username, bot name, and message to felix@nocode-ai.co**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-25T05:47:40Z
- **Completed:** 2026-03-25T05:55:00Z
- **Tasks:** 2 of 3 complete (Task 3 is a deploy/verify checkpoint awaiting human action)
- **Files modified:** 1

## Accomplishments
- Added `notifyLeadCaptured({ botDisplay, userName, businessName, messageText })` function to bot_agent.mjs, positioned between `sendEmail` and `logActivity`
- HTML email template includes all four NOTF-02 fields: bot name, Discord username, business name ("Not provided"), original message in a blockquote
- Wired call site into reply tool handler — fires async when `detectActionType` returns `'lead'`
- Full non-blocking, non-fatal error handling (try/catch inside function + .catch() at call site)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add notifyLeadCaptured function** - `ae45541` (feat)
2. **Task 2: Wire call site into reply handler** - `dea1ead` (feat)
3. **Task 3: Deploy to VPS and verify** - PENDING (checkpoint:human-verify)

## Files Created/Modified
- `C:/Users/feelo/OneDrive/Desktop/bot_agent.mjs` (also tracked in repo as `bot_agent.mjs`) — added `notifyLeadCaptured` function and call site in reply handler

## Decisions Made
- **businessName = 'Not provided'**: Discord's ChannelNotificationSchema carries only chat_id, message_id, user (Discord handle), user_id, ts, attachment_count, attachments. There is no business or company field. Hardcoding 'Not provided' is accurate, not a gap. Phase 2 (leads table) will enable structured intake.
- **Fire-and-forget pattern**: `notifyLeadCaptured(...).catch(...)` ensures the notification never delays the bot's Discord reply. Email latency is irrelevant to the user experience.
- **bot_agent.mjs added to git repo**: The file previously lived only on the Desktop (deployed via SCP). Added to nocode-ai repo for version control alongside planning artifacts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] bot_agent.mjs was outside the git repo**
- **Found during:** Task 1 (commit attempt)
- **Issue:** `bot_agent.mjs` is at `C:/Users/feelo/OneDrive/Desktop/bot_agent.mjs` — outside the nocode-ai git repo at `C:/Users/feelo/OneDrive/Desktop/nocode-ai/`. `git add` failed with "outside repository" error.
- **Fix:** Copied `bot_agent.mjs` into the nocode-ai repo root before staging. Both files kept in sync — edits are made to the Desktop copy (source of truth for VPS deployment) and synced to the repo copy before each commit.
- **Files modified:** `nocode-ai/bot_agent.mjs` (new tracked file)
- **Verification:** `git add bot_agent.mjs` succeeded; commit `ae45541` created.
- **Committed in:** ae45541 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** File path resolved cleanly. No scope creep. Desktop copy remains the VPS deployment source.

## Issues Encountered
- None beyond the git path deviation above.

## User Setup Required

**External service requires configuration before Task 3 can complete.**

- **RESEND_API_KEY** must be set in `/root/.bashrc` on VPS (45.55.68.90):
  ```bash
  echo 'export RESEND_API_KEY="re_xxxx"' >> /root/.bashrc
  source /root/.bashrc
  ```
  Get key from: Resend Dashboard → API Keys → Create API Key

- **Verify it is set:**
  ```bash
  ssh root@45.55.68.90 "echo $RESEND_API_KEY"
  ```

## Known Stubs

- `businessName: 'Not provided'` — hardcoded at the call site in the reply handler. This is intentional and documented (Discord provides no business metadata). The field exists and renders in the email. Phase 2 (leads table) will populate it with structured data when leads are stored in Supabase. This stub does NOT prevent the plan's goal (NOTF-01 through NOTF-04 are met structurally); it is an accurate reflection of what Discord provides.

## Next Phase Readiness
- Task 3 (VPS deploy + live email verification) is ready to execute once RESEND_API_KEY is confirmed on VPS
- After Task 3 is verified, Phase 1 Plan 1 is complete
- Phase 2 (leads table in Supabase) can begin — it will resolve the businessName stub by storing structured lead data

---
*Phase: 01-lead-notifications*
*Completed: 2026-03-25 (Tasks 1-2 only; Task 3 pending human verification)*
