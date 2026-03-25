# Phase 2: Lead Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 02 — Lead Tracking

---

## Area 1: Lead Insert Source

**Question:** Where should the leads table row get written when a bot captures a lead?

| Option | Description |
|--------|-------------|
| bot_agent.mjs on VPS ✓ | Add Supabase insert after notifyLeadCaptured, same pattern as logActivity |
| Supabase trigger on bot_activity | Postgres trigger watches for action_type='lead', auto-inserts |

**Selected:** bot_agent.mjs on VPS

---

## Area 2: Lead Section Placement

**Question:** Where in dashboard.html should the Leads section live?

| Option | Description |
|--------|-------------|
| New section below activity feed ✓ | Appended below existing layout — dashboard grows downward |
| Top of page above stats | First thing Felix sees on load |
| Side-by-side with activity feed | Replaces or sits beside activity in two-column layout |

**Selected:** New section below activity feed

---

## Area 3: Status Update UX

**Question:** How does Felix change a lead's status in the dashboard?

| Option | Description |
|--------|-------------|
| Inline dropdown per row ✓ | Status badge is a `<select>` — click, pick, save instantly |
| Expand row with status buttons | Click row to reveal 4 status buttons |
| Quick modal on row click | Modal with status options (and future notes field) |

**Selected:** Inline dropdown per row

---

## Area 4: Default Lead View

**Question:** What does Felix see by default when he opens the Leads section?

| Option | Description |
|--------|-------------|
| All leads, newest first ✓ | No filtering, sorted by created_at desc — satisfies LEAD-05 directly |
| New leads only by default with filter tabs | Default = New, tabs for other statuses |
| All leads with status filter dropdown | Filter dropdown but no tabs |

**Selected:** All leads, newest first
