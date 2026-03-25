# Phase 2: Lead Tracking - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers two things:
1. A `leads` Supabase table that auto-captures a row every time a bot flags a lead
2. A Leads management section in `dashboard.html` where Felix can view all captured leads and update their status

This phase does NOT add: filtering/tabs by status, lead detail views, notes fields, or search. Those are v2 (LEAD-06 through LEAD-08).

</domain>

<decisions>
## Implementation Decisions

### Lead Insert Source
- **D-01:** Leads are written to Supabase from `bot_agent.mjs` on the VPS — a direct Supabase insert call added alongside (or immediately after) `notifyLeadCaptured`. Same pattern as the existing `logActivity` function. No Supabase triggers or server-side DB functions.

### Dashboard Placement
- **D-02:** The Leads section is a new section appended **below the existing activity feed** in `dashboard.html`. The current dashboard layout (stats → bot cards + activity feed → savings) is preserved; Leads grows the page downward.

### Status Update UX
- **D-03:** Each lead row has an **inline status dropdown** (`<select>`) that doubles as the status badge. Felix clicks the dropdown in the row, picks New / Contacted / Closed / Lost, and it saves to Supabase instantly. Single interaction, no modal, no row expansion.

### Default Lead View
- **D-04:** Show **all leads, sorted newest first** (`created_at desc`) — no default filtering. LEAD-05 is satisfied as-is. No status tabs or filter controls needed for v1.

### Claude's Discretion
- Visual styling of the Leads section — must match existing dashboard palette (navy/gold/teal, Bebas Neue headings, `var(--card)` backgrounds, `var(--border)` borders)
- Exact status badge colors — teal for New, gold for Contacted, muted for Closed, red for Lost (or similar within existing palette)
- How the inline `<select>` is styled to match the rest of the UI
- Placeholder/empty state when no leads exist yet
- Error handling for failed Supabase inserts or status updates (non-fatal, silent log)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema
- `supabase_schema.sql` — existing `bot_activity` and `profiles` tables; `leads` table must follow the same RLS patterns. Service role key bypasses RLS for bot inserts; anon key + auth.uid() for Felix's dashboard reads.

### Existing code to extend
- `bot_agent.mjs` (on VPS at `/root/.openclaw/scripts/bot_agent.mjs`) — `logActivity` function shows the existing Supabase insert pattern to replicate for leads. `notifyLeadCaptured` is the call site where the leads insert should be added.
- `dashboard.html` — existing layout, CSS variables, component patterns (stat cards, activity feed, section titles) must all be reused for the Leads section.

### Requirements
- `.planning/REQUIREMENTS.md` §Lead Tracking — LEAD-01 through LEAD-05 define the `leads` table schema (id, created_at, user_id, name, business, message, bot_name, status, notes) and the exact fields visible in the list (name, business, bot, status, time).

No external ADRs — all decisions captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `activity-feed` / `activity-item` CSS classes — similar row-based list pattern; Leads list can follow the same structure
- `stat-card` / `.card` pattern (background: var(--card), border: var(--border), border-radius: 14px) — reuse for the Leads section wrapper
- `section-title` class (Bebas Neue heading) — reuse for "LEADS" heading
- `bot-status` pill CSS (small uppercase badge with color variants) — adapt for status badge in lead rows
- Existing Supabase client setup in `dashboard.html` (hardcoded URL + anon key) — reuse directly

### Established Patterns
- Supabase inserts from bot: service role key, direct `fetch` to REST API (see `logActivity` in `bot_agent.mjs`)
- Supabase reads from dashboard: anon key + Supabase JS client, filtered by `auth.uid()`
- All JS inline in HTML — no separate .js files
- CSS variables for colors — always use `var(--gold)`, `var(--teal)`, etc., never hardcode hex

### Integration Points
- `bot_agent.mjs`: new `insertLead()` function called after `notifyLeadCaptured` in the lead detection path
- `dashboard.html`: new `#leads-section` HTML block appended after the activity feed section; new JS to fetch and render leads on load; status dropdown `onchange` handler to PATCH lead status

</code_context>

<specifics>
## Specific Ideas

No specific visual references given — Felix is happy with the existing dashboard aesthetic. The Leads section should feel native to the current design, not a bolt-on.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-lead-tracking*
*Context gathered: 2026-03-25*
