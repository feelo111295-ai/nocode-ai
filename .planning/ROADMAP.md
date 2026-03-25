# Roadmap: NoCode-AI

## Overview

Three focused phases that close the gap between leads being captured and Felix being able to act on them — plus a clean first-login experience for new clients. Phase 1 wires up real-time email alerts so Felix stops missing leads. Phase 2 persists those leads with status tracking so Felix can manage follow-ups. Phase 3 ensures new clients land on a welcoming dashboard instead of a blank screen.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Lead Notifications** - Bot emails Felix the moment a lead is captured
- [ ] **Phase 2: Lead Tracking** - Leads stored in Supabase and manageable from the dashboard
- [ ] **Phase 3: Client Onboarding** - New clients land on a welcoming active dashboard, not a blank screen

## Phase Details

### Phase 1: Lead Notifications
**Goal**: Felix receives an email the moment any bot captures a lead
**Depends on**: Nothing (VPS-only change, existing infrastructure)
**Requirements**: NOTF-01, NOTF-02, NOTF-03, NOTF-04
**Success Criteria** (what must be TRUE):
  1. When a bot logs `action_type = 'lead'` to `bot_activity`, Felix receives an email at felix@nocode-ai.co within seconds
  2. The email shows the lead's name, business, their message, and which bot captured them
  3. If the Resend API call fails, the bot continues processing messages normally (no crash, no blocked replies)
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Add notifyLeadCaptured to bot_agent.mjs and deploy to VPS

### Phase 2: Lead Tracking
**Goal**: Captured leads are stored with status and Felix can manage them from the dashboard
**Depends on**: Phase 1
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05
**Success Criteria** (what must be TRUE):
  1. Every bot-captured lead automatically appears as a row in the Supabase `leads` table
  2. Felix can open `dashboard.html` and see all leads sorted newest first, with name, business, bot, status, and time
  3. Felix can change a lead's status (New, Contacted, Closed, Lost) directly in the dashboard and it persists
**Plans**: TBD
**UI hint**: yes

### Phase 3: Client Onboarding
**Goal**: New clients see a welcoming, informative screen on first login instead of a blank dashboard
**Depends on**: Phase 2
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04
**Success Criteria** (what must be TRUE):
  1. A client with `onboarded = false` logs in and sees a welcome screen (not an empty activity feed)
  2. The welcome screen shows which bots are active and which platforms they cover
  3. Client can dismiss the welcome screen and it never appears again (Supabase `onboarded` flips to true)
  4. After dismissal, the client sees the normal bot activity dashboard
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Lead Notifications | 0/1 | Not started | - |
| 2. Lead Tracking | 0/? | Not started | - |
| 3. Client Onboarding | 0/? | Not started | - |
