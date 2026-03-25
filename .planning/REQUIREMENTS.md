# Requirements: NoCode-AI

**Defined:** 2026-03-25
**Core Value:** Bots capture and nurture leads automatically; Felix closes the qualified ones personally.

## v1 Requirements

### Lead Notifications

- [x] **NOTF-01**: When a bot logs `action_type = 'lead'` to `bot_activity`, an email is automatically sent to felix@nocode-ai.co
- [x] **NOTF-02**: Email includes lead's name, business name, the message they sent, and which bot captured them
- [x] **NOTF-03**: Email is sent via Resend API from `bot_agent.mjs` on the DigitalOcean VPS
- [x] **NOTF-04**: Email sends reliably without blocking bot message processing (async, non-fatal on failure)

### Lead Tracking

- [ ] **LEAD-01**: A `leads` table exists in Supabase with fields: id, created_at, user_id (Felix's), name, business, message, bot_name, status, notes
- [ ] **LEAD-02**: When a bot captures a lead, a row is inserted into the `leads` table automatically
- [ ] **LEAD-03**: Felix can view all captured leads in a dedicated section of `dashboard.html`
- [ ] **LEAD-04**: Felix can update a lead's status (New → Contacted → Closed → Lost)
- [ ] **LEAD-05**: Lead list is sorted by newest first and shows name, business, bot, status, and time captured

### Client Onboarding

- [ ] **ONBD-01**: When a client with `onboarded = false` logs in, they see a welcome screen instead of a blank/empty dashboard
- [ ] **ONBD-02**: Welcome screen displays which bots are active and which platforms they're connected to
- [ ] **ONBD-03**: Client can dismiss the welcome screen, which sets `onboarded = true` in their Supabase profile
- [ ] **ONBD-04**: After dismissal, client lands on the normal active dashboard with bot activity visible

## v2 Requirements

### Lead Tracking (future)

- **LEAD-06**: Lead detail view — click a lead to see full conversation context from `bot_activity`
- **LEAD-07**: Notes field — Felix can add follow-up notes to a lead
- **LEAD-08**: Follow-up date — set a reminder date on a lead

### Notifications (future)

- **NOTF-05**: SMS notification to Felix when a high-intent lead is captured
- **NOTF-06**: Daily digest email summarizing new leads

### Onboarding (future)

- **ONBD-05**: Self-serve signup flow — clients sign up without Felix manually creating accounts
- **ONBD-06**: In-app bot configuration — clients set tone, platforms, and preferences themselves

## Out of Scope

| Feature | Reason |
|---------|--------|
| Self-serve client signup | Felix closes deals personally for now — not worth automating |
| In-app Stripe billing flow | Manual billing management sufficient for current scale |
| Bot configuration UI | Felix sets this up manually with each client |
| Mobile app | Web dashboard only for this milestone |
| Lead detail / conversation view | Defer to v2 — status tracking is sufficient for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NOTF-01 | Phase 1 | Complete |
| NOTF-02 | Phase 1 | Complete |
| NOTF-03 | Phase 1 | Complete |
| NOTF-04 | Phase 1 | Complete |
| LEAD-01 | Phase 2 | Pending |
| LEAD-02 | Phase 2 | Pending |
| LEAD-03 | Phase 2 | Pending |
| LEAD-04 | Phase 2 | Pending |
| LEAD-05 | Phase 2 | Pending |
| ONBD-01 | Phase 3 | Pending |
| ONBD-02 | Phase 3 | Pending |
| ONBD-03 | Phase 3 | Pending |
| ONBD-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after initial definition*
