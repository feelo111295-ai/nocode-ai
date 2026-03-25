# Milestones

## v1.0 MVP

**Shipped:** 2026-03-25
**Phases:** 3 (Lead Notifications, Lead Tracking, Client Onboarding)
**Plans:** 4 | **Requirements:** 13/13 validated

### Delivered

Bots now notify Felix by email the moment a lead is captured, store every lead in Supabase with status tracking, and give new clients a welcoming onboarding screen instead of a blank dashboard.

### Key Accomplishments

1. Async lead notification emails via Resend wired into all 5 production bots on VPS — Felix notified within seconds of any lead
2. Supabase `leads` table (9 columns, RLS) + `insertLead()` deployed to all bots — every bot-captured lead now persists automatically
3. Dashboard leads section: 5-column table with inline color-coded status dropdowns (New/Contacted/Closed/Lost) and CSV export
4. Client onboarding overlay: 4 bot cards with platform badges, dismiss sets `onboarded=true` in Supabase — never reappears

### Archive

- Roadmap: `.planning/milestones/v1.0-ROADMAP.md`
- Requirements: `.planning/milestones/v1.0-REQUIREMENTS.md`
