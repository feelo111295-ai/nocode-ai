# Retrospective: NoCode-AI

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-25
**Phases:** 3 | **Plans:** 4

### What Was Built

1. Async lead notification emails via Resend wired into all 5 production bots on VPS
2. Supabase `leads` table (9 columns, RLS) + `insertLead()` deployed to all bots
3. Dashboard leads section: 5-column table, inline color-coded status dropdowns, CSV export
4. Client onboarding welcome overlay with 4 bot cards and dismiss-to-onboard flow

### What Worked

- **Short phases, clear goals**: Each phase had 1–2 focused plans with unambiguous success criteria. Zero scope creep.
- **Fire-and-forget pattern**: Established early in Phase 1 and reused verbatim in Phase 2 for insertLead — consistent, non-blocking, non-fatal.
- **Human-verify checkpoints**: VPS deploys required SSH access from Felix's machine. Returning checkpoint:human-verify was the right call — no time wasted fighting SSH auth.
- **Idempotent DDL**: The leads table already existed on Supabase. `CREATE TABLE IF NOT EXISTS` absorbed it cleanly — no surprise rework.
- **Persistent section over tab**: Placing the leads section permanently below the activity feed (not behind a tab) was the right UX call. Felix sees leads immediately on dashboard open.

### What Was Inefficient

- `bot_agent.mjs` lived outside the git repo initially — caused a commit error on Task 1. A note in PROJECT.md about the Desktop/repo dual-file pattern would have prevented this.
- Phase ordering: Phase 3 (onboarding) was planned before Phase 2 (lead tracking) but doesn't depend on it. Could have run concurrently — but sequential was fine given the 2-day timeline.

### Patterns Established

- `fire-and-forget .catch(err => log(...))` for all async VPS side effects (notifications, storage)
- `try/catch` inside third-party API functions — Resend/Supabase failures never crash the bot
- `INSERT` mirrors `logActivity` pattern — fetch POST to `/rest/v1/{table}` with service key auth
- Overlay pattern: `position:fixed inset:0` with `.hide` class toggle — reuse for all future full-screen overlays
- Section-below-layout for new dashboard sections (not tabs)

### Key Lessons

- Confirm email recipient before wiring notification logic — felix@nocode-ai.co has no inbox; feelo111295@gmail.com is the real address. Catch this in planning, not after deploy.
- VPS deploy is always human-verify. Don't attempt SCP from executor environment — SSH key lives on Felix's machine.
- Supabase environment state (existing tables, policies) can diverge from the plan. Idempotent SQL is a must.

### Cost Observations

- 3 phases, 4 plans, 2-day timeline
- Sessions: ~4 (initial plan + 3 phase executions)
- Notable: coarse granularity setting produced compact, efficient plans — no over-engineering

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Timeline | Notable Pattern |
|-----------|--------|-------|----------|-----------------|
| v1.0 MVP | 3 | 4 | 2 days | Human-verify VPS deploys; fire-and-forget side effects |
