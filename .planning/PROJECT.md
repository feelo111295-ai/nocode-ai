# NoCode-AI

## What This Is

NoCode-AI is a done-for-you AI agent service for small businesses. Felix (the owner) sells subscription plans that deploy AI bots on Discord, Telegram, Facebook, and other channels to handle customer interactions 24/7. The platform is proven by Felix using it himself — his own bots generate the leads that sell the service.

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

### Active

- ✓ Lead email notification — when a bot logs `action_type = 'lead'`, send email to feelo111295@gmail.com via Resend with lead name, business, message, and which bot captured them — Validated in Phase 1: Lead Notifications (felix@nocode-ai.co has no inbox; feelo111295@gmail.com is the confirmed recipient)
- [ ] `leads` Supabase table — store captured leads with status (New / Contacted / Closed / Lost)
- [ ] Lead tracking view in dashboard — Felix can see all leads, update their status, and track follow-ups
- ✓ Client first-login experience — new clients (onboarded = false) land on a welcoming active dashboard, not a blank screen; transitions them to onboarded state — Validated in Phase 3: Client Onboarding

### Out of Scope

- Self-serve client signup — Felix closes deals and creates accounts manually for now
- In-app Stripe upgrade/downgrade flow — billing managed manually for now
- Bot configuration UI — bot setup handled offline between Felix and clients
- Mobile app — web dashboard only for now

## Context

**How the business works:** Felix demonstrates the bots by running them for himself. Prospects interact with his bots (Kerry, Brody, Mia, Main), get impressed, and that becomes the sales pitch. When a bot detects buying intent (demo request, expressed interest), it flags a lead. Felix gets notified, then follows up personally to close.

**Current lead process (manual):** Leads are logged to `bot_activity` as `action_type = 'lead'` but there's no notification, no dedicated leads table, and no status tracking. Felix has to manually check the dashboard to find them.

**Client onboarding (manual):** Felix creates a Supabase account for the new client, sets `plan = 'replace'` on their profile, and sends them a login link. Client lands on the dashboard for the first time with `onboarded = false`.

**Codebase state:** Vanilla HTML/CSS/JS frontend on GitHub Pages. No build system, no framework. Each page is self-contained with embedded styles and scripts. Backend is Supabase (auth + PostgreSQL). Bots run on DigitalOcean VPS (45.55.68.90) via Node.js + PM2. Deployed via SFTP.

## Constraints

- **Tech Stack**: Vanilla HTML/JS only — no React, Vue, or other frameworks
- **Deployment**: Frontend via GitHub Pages (static files); VPS changes via SFTP
- **No build pipeline**: All changes must work without a build step
- **Credentials**: Supabase URL/key currently hardcoded in HTML — maintain this pattern for now, address security in a future phase
- **Bot runtime**: `bot_agent.mjs` on VPS is the entry point for lead email logic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Resend for email notifications | Simple Node.js API, free tier, easy to add to VPS | Implemented in Phase 1; sends to feelo111295@gmail.com (felix@nocode-ai.co has no inbox) |
| Leads stored in new `leads` table (not just `bot_activity`) | Dedicated table enables status tracking, notes, follow-ups | — Pending |
| Felix handles onboarding manually | Too early to automate; personal touch improves early client experience | — Pending |
| Bots as the sales demo | Live proof of product value; no deck needed | — Pending |

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
*Last updated: 2026-03-25 after Phase 3: Client Onboarding*
