# NoCode-AI

## What This Is

NoCode-AI is a done-for-you AI agent service for small businesses. Felix (the owner) sells subscription plans that deploy AI bots on Discord, Telegram, Facebook, and other channels to handle customer interactions 24/7. The platform is proven by Felix using it himself — his own bots generate the leads that sell the service.

As of v1.0: bots capture leads, Felix gets notified instantly, leads appear in a tracked dashboard, and new clients land on a welcoming onboarding screen.

## Core Value

Bots capture and nurture leads automatically; Felix closes the qualified ones personally.

## Requirements

### Validated

- ✓ Marketing landing page (`index.html`) with ROI calculator — existing
- ✓ Supabase auth (email/password login) — existing
- ✓ Client dashboard showing bot activity feed — existing
- ✓ 4 live bots (Kerry, Brody, Mia, Main) on Discord and Telegram — existing
- ✓ Stripe billing connected — existing
- ✓ Google Workspace integration (Gmail, Calendar, Drive, Sheets) — existing
- ✓ Bot activity logged to Supabase `bot_activity` table — existing
- ✓ Lead email notification — when a bot logs `action_type = 'lead'`, send email to feelo111295@gmail.com via Resend with lead name, business, message, and which bot captured them — v1.0 (felix@nocode-ai.co has no inbox; feelo111295@gmail.com is the confirmed recipient)
- ✓ `leads` Supabase table — store captured leads with status (New / Contacted / Closed / Lost) — v1.0
- ✓ Lead tracking view in dashboard — Felix can see all leads, update their status, and track follow-ups — v1.0
- ✓ Client first-login experience — new clients (onboarded = false) land on a welcoming active dashboard, not a blank screen — v1.0

### Active

- [ ] Lead detail view — click a lead to see full conversation context from `bot_activity` (LEAD-06)
- [ ] Notes field on leads — Felix can add follow-up notes (LEAD-07)
- [ ] Follow-up date — set a reminder date on a lead (LEAD-08)
- [ ] In-dashboard Felix Bot chat widget — client support chat powered by Felix Bot (Claude API), replaces Discord support button

### Out of Scope

- Self-serve client signup — Felix closes deals and creates accounts manually for now
- In-app Stripe upgrade/downgrade flow — billing managed manually for now
- Bot configuration UI — bot setup handled offline between Felix and clients
- Mobile app — web dashboard only for now
- SMS lead notifications — email sufficient for current volume
- Daily digest email — individual alerts sufficient for now

## Context

**How the business works:** Felix demonstrates the bots by running them for himself. Prospects interact with his bots (Kerry, Brody, Mia, Main), get impressed, and that becomes the sales pitch. When a bot detects buying intent (demo request, expressed interest), it flags a lead. Felix gets notified instantly by email, then follows up personally to close.

**Current lead process (v1.0):** Leads are captured by bots → emailed to Felix immediately via Resend → stored in `leads` table with status → visible in dashboard with inline status dropdowns. Felix can track New → Contacted → Closed / Lost.

**Client onboarding (v1.0):** Felix creates a Supabase account for the new client, sets `plan = 'replace'` on their profile, and sends them a login link. Client lands on the onboarding overlay with all 4 bots and platform badges. They dismiss it ("LET'S GO →"), `onboarded = true` is set, and they see the normal dashboard.

**Codebase state (v1.0):** Vanilla HTML/CSS/JS frontend deployed on DigitalOcean VPS at `/var/www/nocode-ai/`. No build system, no framework — each page is self-contained. Backend is Supabase (auth + PostgreSQL). Bots run on VPS (45.55.68.90) via Node.js + PM2. Deployed via SCP. ~700 LOC added in v1.0.

## Constraints

- **Tech Stack**: Vanilla HTML/JS only — no React, Vue, or other frameworks
- **Deployment**: Frontend via SCP to VPS at `/var/www/nocode-ai/`; bots via SCP to `/root/.openclaw/scripts/`
- **No build pipeline**: All changes must work without a build step
- **Credentials**: Supabase URL/key currently hardcoded in HTML — maintain this pattern for now, address security in a future phase
- **Bot runtime**: `bot_agent.mjs` on VPS is the entry point for lead email logic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Resend for email notifications | Simple Node.js API, free tier, RESEND_API_KEY already set on VPS | ✓ Good — works reliably, sends to feelo111295@gmail.com (felix@nocode-ai.co has no inbox) |
| Leads stored in new `leads` table (not just `bot_activity`) | Dedicated table enables status tracking, notes, follow-ups | ✓ Good — schema clean, RLS in place, insertLead() mirrors logActivity pattern |
| Fire-and-forget .catch() for notifications and insertLead | Non-blocking side effects; email/storage failure must never block bot replies | ✓ Good — established codebase pattern now used for all async side effects |
| FELIX_USER_ID from process.env | UUID never hardcoded in source | ✓ Good — set in VPS .bashrc |
| Persistent leads section (not tab) | Leads always visible; no tab click required | ✓ Good — auto-loads on page open |
| ACTIVE_BOTS array for onboarding | All clients share 4 bots; no per-client Supabase query needed | ✓ Good — no extra round-trip, matches client reality |
| Felix handles onboarding manually | Too early to automate; personal touch improves early client experience | — Pending re-evaluation at v1.1+ |
| Bots as the sales demo | Live proof of product value; no deck needed | — Pending re-evaluation at v1.1+ |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after v1.0 milestone — all 3 phases complete, 13/13 requirements validated*
