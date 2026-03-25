# Phase 2: Lead Tracking - Research

**Researched:** 2026-03-25
**Domain:** Supabase REST API (bot inserts), Supabase JS SDK v2 (dashboard reads/patches), vanilla HTML/CSS/JS dashboard extension
**Confidence:** HIGH — all findings drawn from reading actual source files in the repository

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Leads are written to Supabase from `bot_agent.mjs` on the VPS — a direct Supabase insert call added alongside (or immediately after) `notifyLeadCaptured`. Same pattern as the existing `logActivity` function. No Supabase triggers or server-side DB functions.
- **D-02:** The Leads section is a new section appended **below the existing activity feed** in `dashboard.html`. The current dashboard layout (stats → bot cards + activity feed → savings) is preserved; Leads grows the page downward.
- **D-03:** Each lead row has an **inline status dropdown** (`<select>`) that doubles as the status badge. Felix clicks the dropdown in the row, picks New / Contacted / Closed / Lost, and it saves to Supabase instantly. Single interaction, no modal, no row expansion.
- **D-04:** Show **all leads, sorted newest first** (`created_at desc`) — no default filtering. LEAD-05 is satisfied as-is. No status tabs or filter controls needed for v1.

### Claude's Discretion

- Visual styling of the Leads section — must match existing dashboard palette (navy/gold/teal, Bebas Neue headings, `var(--card)` backgrounds, `var(--border)` borders)
- Exact status badge colors — teal for New, gold for Contacted, muted for Closed, red for Lost (or similar within existing palette)
- How the inline `<select>` is styled to match the rest of the UI
- Placeholder/empty state when no leads exist yet
- Error handling for failed Supabase inserts or status updates (non-fatal, silent log)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LEAD-01 | A `leads` table exists in Supabase with fields: id, created_at, user_id, name, business, message, bot_name, status, notes | Schema DDL to add + RLS policies mirror the `bot_activity` table pattern already in `supabase_schema.sql` |
| LEAD-02 | When a bot captures a lead, a row is inserted into the `leads` table automatically | `insertLead()` function modeled on existing `logActivity()` in `bot_agent.mjs`; called after `notifyLeadCaptured` in the `actionType === 'lead'` branch |
| LEAD-03 | Felix can view all captured leads in a dedicated section of `dashboard.html` | Dashboard already has a Leads tab skeleton (lines 392–421) and `loadLeads()` / `renderLeads()` functions — but they target a different schema; both must be replaced |
| LEAD-04 | Felix can update a lead's status (New → Contacted → Closed → Lost) | Supabase JS `.update()` PATCH via Supabase JS SDK v2 (already loaded via CDN); triggered by inline `<select>` `onchange` |
| LEAD-05 | Lead list is sorted by newest first and shows name, business, bot, status, and time captured | `.order('created_at', { ascending: false })` already used for `bot_activity`; render function must expose name, business, bot_name, status, created_at |

</phase_requirements>

---

## Summary

Phase 2 extends two artifacts: `supabase_schema.sql` (adding the `leads` table DDL) and the application code pair `bot_agent.mjs` + `dashboard.html`. Both extensions follow patterns already established in Phase 1.

The most important discovery from reading the source: `dashboard.html` already contains a "Leads" tab, a `leadsPanel` div, and working `loadLeads()` / `renderLeads()` functions. **However, this existing leads infrastructure reads a contact-form schema** (`fname`, `lname`, `email`, `phone`, `bizname`, `persona`) — completely different from the bot-capture schema required by REQUIREMENTS.md (`name`, `business`, `message`, `bot_name`, `status`). The planner must treat the existing leads code as **a structural skeleton to replace**, not as partial completion of LEAD-03/LEAD-04/LEAD-05.

The VPS deploy constraint from Phase 1 carries forward: every change to `bot_agent.mjs` must be SCP'd to the VPS and PM2-restarted. This is a required task step, not optional.

**Primary recommendation:** Three discrete tasks — (1) add `leads` table DDL to Supabase, (2) add `insertLead()` to `bot_agent.mjs` and deploy to VPS, (3) replace the existing stub leads UI in `dashboard.html` with the bot-leads schema, inline status dropdown, and status PATCH call.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS SDK | v2 (CDN: `@supabase/supabase-js@2`) | Dashboard reads + status PATCH | Already loaded in `dashboard.html` line 8; `sb` client already initialized |
| Node.js `fetch` | native (Node 18+) | Bot inserts from `bot_agent.mjs` | Already used for `logActivity` and `sendEmail`; no additional packages needed |
| Supabase REST API | v1 | Bot-side direct REST insert | Already used for `bot_activity` inserts; same `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` env vars |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Bebas Neue (Google Fonts) | loaded | Section headings | Use for "LEADS" section title, matches all other headings |
| DM Sans (Google Fonts) | loaded | Body / UI text | Use for table cells, dropdown, timestamps |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline `<select>` for status | Modal or expand row | Decided against (D-03 locked) — single interaction is simpler |
| Supabase DB trigger for lead insert | `insertLead()` in bot agent | Decided against (D-01 locked) — explicit code call is more debuggable |

**Installation:** No new packages needed. All dependencies are already present.

---

## Architecture Patterns

### File Locations

```
nocode-ai/
├── supabase_schema.sql          # Add leads table DDL here
├── bot_agent.mjs                # Add insertLead() function + call site
└── dashboard.html               # Replace existing leads stub with bot-leads UI
```

**VPS source of truth:** `/root/.openclaw/scripts/bot_agent.mjs` on DigitalOcean VPS (45.55.68.90). The local repo copy at `nocode-ai/bot_agent.mjs` must be kept in sync and deployed via SCP after every change (established in Phase 1).

### Pattern 1: Supabase INSERT from bot (service role, direct fetch)

This is the exact `logActivity` pattern already in `bot_agent.mjs`. `insertLead()` is a clone with a different table name and different fields.

```javascript
// Source: bot_agent.mjs lines 70–93 (logActivity — model to replicate)
async function insertLead({ botName, userId, name, business, message }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        user_id:  userId  || null,
        bot_name: botName,
        name:     name    || null,
        business: business || null,
        message:  message  ? message.slice(0, 1000) : null,
        status:   'New',
      }),
    });
  } catch (err) {
    // Non-fatal — don't crash the bot over logging
  }
}
```

**Call site** — in the `actionType === 'lead'` branch after `notifyLeadCaptured` (bot_agent.mjs lines 293–299):

```javascript
// After notifyLeadCaptured call, same pattern (fire-and-forget)
insertLead({
  botName:  BOT_NAME,
  userId:   meta.user_id || null,   // ChannelNotificationSchema: user_id is optional
  name:     meta.user,              // Discord username as best available name
  business: null,                   // Discord carries no business field (per Phase 1 decision)
  message:  content,
}).catch(err => log(`insertLead error: ${err.message}`));
```

### Pattern 2: Supabase SELECT from dashboard (anon key + SDK v2)

Follows existing `loadActiveData()` pattern — `sb` client is already initialized with anon key.

```javascript
// Source: dashboard.html lines 651–662 (loadActiveData — model to follow)
async function loadLeads() {
  leadsLoaded = true;
  if (isDemo) { renderLeads(DEMO_LEADS); return; }
  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  renderLeads((!error && data) ? data : []);
}
```

RLS on `leads` ensures `auth.uid() = user_id` — Felix only sees his leads.

### Pattern 3: Supabase PATCH for status update (SDK v2 `.update()`)

```javascript
// Inline onchange handler pattern — mirrors how the rest of the dashboard handles Supabase mutations
async function updateLeadStatus(leadId, newStatus) {
  const { error } = await sb
    .from('leads')
    .update({ status: newStatus })
    .eq('id', leadId);
  if (error) console.error('Status update failed (non-fatal):', error.message);
}
```

### Pattern 4: Supabase `leads` table DDL

Follows `bot_activity` structure from `supabase_schema.sql` exactly — same RLS approach (users see own data; service role bypasses for bot inserts automatically).

```sql
-- Add to supabase_schema.sql
create table if not exists leads (
  id          uuid default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  user_id     uuid references auth.users on delete cascade,
  name        text,
  business    text,
  message     text,
  bot_name    text not null,
  status      text default 'New',
  notes       text
);

create index if not exists leads_user_time
  on leads (user_id, created_at desc);

alter table leads enable row level security;

create policy "Users see own leads"
  on leads for all using (auth.uid() = user_id);
```

### Pattern 5: Inline status `<select>` styled to match dashboard

The existing `.bot-status` pill CSS (lines 136–142 in dashboard.html) gives the reference for status badge colors. The `<select>` element must be styled to visually match a badge — no native OS chrome visible.

```css
/* Add to dashboard.html <style> block */
.lead-status-select {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  -webkit-appearance: none;
  appearance: none;
}
.lead-status-select.status-new       { background: rgba(0,201,167,0.12);  color: var(--teal); }
.lead-status-select.status-contacted { background: rgba(244,163,0,0.12);  color: var(--gold); }
.lead-status-select.status-closed    { background: rgba(255,255,255,0.06); color: var(--muted); }
.lead-status-select.status-lost      { background: rgba(255,77,109,0.10); color: var(--red); }
```

### Dashboard HTML structure (D-02: below activity feed)

Per D-02, the new `#leads-section` is appended **after the closing `</div>` of the `.dash-cols` section** (line 498 in dashboard.html), before the closing `</div><!-- /page -->` on line 500.

```html
<!-- Leads section — appended below dash-cols, before /page -->
<div id="leads-section" style="margin-top: 2rem;">
  <div class="section-title">LEADS</div>
  <div style="font-size:0.85rem; color:var(--muted); margin-bottom:1rem;" id="leadsCount">Loading...</div>
  <div class="leads-table-wrap">
    <table class="leads-table">
      <thead>
        <tr>
          <th>Name</th><th>Business</th><th>Bot</th><th>Status</th><th>Time</th>
        </tr>
      </thead>
      <tbody id="leadsTableBody">
        <tr><td colspan="5" class="leads-empty">Loading leads...</td></tr>
      </tbody>
    </table>
  </div>
</div>
```

**Note on the existing Leads tab:** `dashboard.html` already has a tab-based leads panel (`#leadsPanel`, lines 397–421) targeting a different schema. The simplest path is to remove or replace that stub entirely — the D-02 decision places Leads below the activity feed as a persistent section, not behind a tab. Verify with the planner whether to remove the tab nav or leave it (the tab nav is lines 391–395 and references `switchTab('leads')` / `loadLeads()`). If D-02 means a section, not a tab, the existing tab infrastructure should be removed to avoid confusion.

### Anti-Patterns to Avoid

- **Blocking the bot on Supabase insert:** `insertLead()` must use `.catch()` fire-and-forget, same as `notifyLeadCaptured`. Never `await` it in the main message handling path.
- **Hardcoding hex colors:** Always use `var(--gold)`, `var(--teal)`, `var(--red)`, `var(--muted)` — never hex values. This is an established project rule.
- **Separate .js files:** All JS must stay inline in `dashboard.html`. No separate script files.
- **Skipping the VPS deploy:** Any change to `bot_agent.mjs` is inert until deployed to the VPS and PM2-restarted. This step must be a required task action, not optional.
- **Using `user_id` from Discord for RLS reads:** Discord's `meta.user_id` is optional and is a Discord user ID string, not a Supabase UUID. The bot should pass `null` for `user_id` unless a reliable mapping from Discord user to Supabase UUID is established. For now, Felix's Supabase UUID should be hardcoded or fetched from env — leads belong to Felix's account.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status update persistence | Custom AJAX fetch to Supabase REST | `sb.from('leads').update(...)` via Supabase JS SDK | SDK handles auth headers, error types, response parsing |
| Bot insert auth | Custom JWT generation | Service role key in `Authorization` header (same as `logActivity`) | Service key bypasses RLS automatically — no JWT needed |
| RLS for dashboard reads | Manual `user_id` filter in JS | Supabase RLS policy `auth.uid() = user_id` | DB-enforced — cannot be bypassed by client code |
| Status dropdown state refresh | Full page reload after status change | Update the `<select>` element's class in-place after successful PATCH | Avoids re-fetching all leads; better UX |

---

## Critical Discovery: Existing Leads Code Is a Different Schema

**What exists in `dashboard.html` today (lines 397–828):**

The dashboard already contains:
- A "Leads" tab button in `.tab-nav` (line 394)
- `#leadsPanel` div (lines 397–421)
- `switchTab()` function that shows/hides `leadsPanel` vs `dashCols` (lines 749–756)
- `loadLeads()` that queries `sb.from('leads').select('*')` (lines 768–776)
- `renderLeads()` that renders rows using `l.fname`, `l.lname`, `l.email`, `l.phone`, `l.bizname`, `l.persona` (lines 778–810)
- `exportLeads()` CSV exporter using same fields (lines 812–828)
- `DEMO_LEADS` sample data array using the same contact-form schema (lines 761–766)

**Why this matters:**
This is a *contact form leads* schema, built for an earlier use case. The `leads` table for Phase 2 uses `name` (not `fname`/`lname`), `business` (not `bizname`), `bot_name` (new field), and `status` (new field). There is no overlap.

**What the planner must decide (flagged as Open Question):**

Option A: Replace the existing tab-based leads panel with a new section-based one per D-02. Remove the tab, replace `renderLeads()`, update `loadLeads()`.

Option B: Keep the tab structure but replace all field references to match the new schema and add the status column + inline dropdown.

Research recommendation: **Option A** — D-02 explicitly says "a new section appended below the existing activity feed", which implies a persistent section, not a tab. The tab UI contradicts D-02. Remove the tab nav (or keep it for future use), and build the new section as specified.

---

## Common Pitfalls

### Pitfall 1: `user_id` mismatch between bot inserts and dashboard RLS

**What goes wrong:** Bot inserts `user_id = meta.user_id` (a Discord user ID string like `"123456789"`). Dashboard RLS policy requires `auth.uid() = user_id` (a Supabase UUID). Result: Felix sees zero leads in the dashboard.

**Why it happens:** Discord's `ChannelNotificationSchema` has `user_id` as an optional string — this is the Discord user's snowflake ID, not a Supabase UUID.

**How to avoid:** `insertLead()` should set `user_id` to Felix's hardcoded Supabase UUID (available from `supabase_schema.sql` context or env var), NOT `meta.user_id`. All leads belong to Felix's account for now. Alternatively, pass `null` and query without RLS filter using service key from a separate admin endpoint — but that complicates the dashboard. **Simplest fix: hardcode Felix's UUID as `FELIX_USER_ID` env var on the VPS, same pattern as `SUPABASE_URL`.**

**Warning signs:** Dashboard loads 0 leads even after bot has captured leads verified in Supabase table.

### Pitfall 2: Schema mismatch between existing `renderLeads()` and new `leads` table

**What goes wrong:** The existing `renderLeads()` function in `dashboard.html` reads `l.fname`, `l.lname`, `l.bizname`, `l.persona`, `l.email`, `l.phone`. The new `leads` table has `l.name`, `l.business`, `l.bot_name`, `l.status`. Every field reference is wrong.

**Why it happens:** The existing dashboard leads code was scaffolded for a contact-form intake, not bot-captured leads.

**How to avoid:** Replace `renderLeads()` entirely. Do not attempt to patch individual field references — the render logic, table columns, and demo data all need to change together.

**Warning signs:** Lead rows render as all dashes or empty, despite data existing in the table.

### Pitfall 3: Forgetting the VPS deploy step for `bot_agent.mjs`

**What goes wrong:** `insertLead()` is added to the local `bot_agent.mjs` but leads never appear in Supabase. The local file is not the running file.

**Why it happens:** The bot runs on DigitalOcean VPS at `45.55.68.90` as a PM2 process. Local edits have no effect until SCP'd and PM2-restarted.

**How to avoid:** Every plan task that modifies `bot_agent.mjs` must include an explicit VPS deploy action: `scp bot_agent.mjs root@45.55.68.90:/root/.openclaw/scripts/bot_agent.mjs && ssh root@45.55.68.90 "pm2 restart all"`.

**Warning signs:** Code exists locally but no leads are captured; git history shows the change but VPS file is older.

### Pitfall 4: `status` field not defaulting on insert

**What goes wrong:** `insertLead()` omits `status` from the insert body. The `<select>` in the dashboard renders with no initial value; PATCH updates fail on missing status baseline.

**Why it happens:** Forgetting that the default in SQL (`status text default 'New'`) only applies if the column is omitted from the insert. If `status: undefined` is explicitly passed, Postgres may receive a null.

**How to avoid:** Always explicitly pass `status: 'New'` in the insert body. Do not rely on SQL default when constructing JSON payloads.

### Pitfall 5: `<select>` styling overridden by browser defaults

**What goes wrong:** The inline status dropdown looks like a native OS form control — mismatched with the polished dashboard aesthetic.

**Why it happens:** `<select>` elements are notoriously hard to style cross-browser. Without `appearance: none` and explicit background/border overrides, OS chrome shows through.

**How to avoid:** Apply `-webkit-appearance: none; appearance: none;` and explicit background/color per status class. Test in Chrome (Felix's likely browser).

---

## Code Examples

### Insert into `leads` from `bot_agent.mjs`

```javascript
// Source: modeled on logActivity (bot_agent.mjs lines 70–93)
async function insertLead({ botName, userId, name, business, message }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        user_id:  userId  || null,
        bot_name: botName,
        name:     name    || null,
        business: business || null,
        message:  message  ? message.slice(0, 1000) : null,
        status:   'New',
      }),
    });
  } catch (err) {
    // Non-fatal
  }
}
```

### PATCH lead status from dashboard

```javascript
// Source: modeled on sb.from('bot_activity') pattern in dashboard.html
async function updateLeadStatus(leadId, newStatus) {
  const { error } = await sb
    .from('leads')
    .update({ status: newStatus })
    .eq('id', leadId);
  if (error) {
    console.warn('Status update failed (non-fatal):', error.message);
  }
}
```

### Status `<select>` in rendered table row

```javascript
// Inside renderLeads() map — render status as inline dropdown
const statusClass = {
  'New':       'status-new',
  'Contacted': 'status-contacted',
  'Closed':    'status-closed',
  'Lost':      'status-lost',
}[l.status] || 'status-new';

const selectHtml = `
  <select
    class="lead-status-select ${statusClass}"
    onchange="updateLeadStatus('${escHtml(l.id)}', this.value); this.className='lead-status-select status-'+this.value.toLowerCase();"
  >
    ${['New','Contacted','Closed','Lost'].map(s =>
      `<option value="${s}"${l.status === s ? ' selected' : ''}>${s}</option>`
    ).join('')}
  </select>`;
```

### `leads` table DDL (to add to `supabase_schema.sql`)

```sql
-- ── Bot-captured leads ───────────────────────────────────────────────────────
create table if not exists leads (
  id          uuid default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  user_id     uuid references auth.users on delete cascade,
  name        text,
  business    text,
  message     text,
  bot_name    text not null,
  status      text default 'New',
  notes       text
);

create index if not exists leads_user_time
  on leads (user_id, created_at desc);

alter table leads enable row level security;

create policy "Users see own leads"
  on leads for all using (auth.uid() = user_id);
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|---------|
| Supabase project (vcvjzinpkefsvcmwetcl) | All lead storage/reads | Yes | Verified (used in production for bot_activity) | None — blocking |
| SUPABASE_URL env var on VPS | insertLead() in bot_agent.mjs | Yes | Set in /root/.bashrc (verified Phase 1) | None — blocking |
| SUPABASE_SERVICE_KEY env var on VPS | insertLead() inserts | Yes | Set in /root/.bashrc (verified Phase 1) | None — blocking |
| FELIX_USER_ID env var on VPS | user_id field in lead inserts | Not confirmed | Unknown | Hardcode UUID as fallback, or query profiles table |
| SCP access to VPS (45.55.68.90) | bot_agent.mjs deploy | Yes | Verified (used in Phase 1 deploy) | None — blocking |
| PM2 on VPS | Bot process management | Yes | Verified running in Phase 1 | None |
| Supabase JS SDK v2 (CDN) | Dashboard status PATCH | Yes | @supabase/supabase-js@2 loaded in dashboard.html line 8 | None |

**Missing dependencies with no fallback:**
- `FELIX_USER_ID` env var: Not confirmed present on VPS. Must be set so `insertLead()` can write Felix's Supabase UUID as `user_id` — otherwise RLS blocks dashboard reads. Task must include adding this env var to `/root/.bashrc` and reloading.

**Missing dependencies with fallback:**
- None beyond the above.

---

## Open Questions

1. **Tab nav vs. persistent section for Leads**
   - What we know: D-02 says "new section appended below existing activity feed." The existing dashboard already has a "Leads" tab in the tab nav (lines 391–395).
   - What's unclear: Should the tab nav be removed entirely? Or should the tab remain but point to the new section-based layout? The tab shows/hides `#leadsPanel` and `#dashCols` — if Leads is a persistent section below both, the tab is now redundant or misleading.
   - Recommendation: Remove the tab nav from the HTML (lines 391–395) and the `switchTab()` function or simplify it. Build the new leads section as a persistent block per D-02. This also removes the need to manage `leadsLoaded` state.

2. **Felix's Supabase UUID for `user_id` in bot inserts**
   - What we know: All leads need `user_id = Felix's Supabase UUID` for RLS to allow dashboard reads. Discord's `meta.user_id` is a Discord snowflake (string), not a Supabase UUID.
   - What's unclear: Is Felix's UUID known/available as an env var? It can be found from Supabase Auth dashboard or queried.
   - Recommendation: Add `FELIX_USER_ID=<uuid>` to `/root/.bashrc` on the VPS as part of the Task 2 deploy step. The executor will need to retrieve this UUID from the Supabase dashboard.

3. **Handling the existing contact-form `leads` schema in `renderLeads()`**
   - What we know: The existing `renderLeads()` uses `l.fname`, `l.lname`, `l.bizname` etc. — incompatible with the new schema.
   - What's unclear: Is there any live data in a `leads` table already (contact form submissions)?
   - Recommendation: The `supabase_schema.sql` does not define a `leads` table — so no live table exists yet. The existing `renderLeads()` code was pre-scaffolded but never connected to real data. Safe to replace completely.

---

## Sources

### Primary (HIGH confidence)
- `nocode-ai/bot_agent.mjs` — read in full; `logActivity` pattern, `notifyLeadCaptured` call site, env var usage
- `nocode-ai/dashboard.html` — read in full; existing leads tab/panel code, Supabase SDK setup, CSS variables, activity feed patterns
- `nocode-ai/supabase_schema.sql` — read in full; `bot_activity` table as RLS model, confirmed `leads` table does NOT exist yet
- `.planning/REQUIREMENTS.md` — LEAD-01 through LEAD-05 field definitions
- `.planning/phases/02-lead-tracking/02-CONTEXT.md` — all locked decisions
- `.planning/phases/01-lead-notifications/01-01-SUMMARY.md` — Phase 1 VPS deploy pattern, businessName stub note

### Secondary (MEDIUM confidence)
- Supabase JS SDK v2 `.update()` / `.from().select()` API — well-established SDK patterns consistent with existing usage in dashboard.html

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in use in the codebase; no new dependencies
- Architecture: HIGH — patterns read directly from source files, not inferred
- Pitfalls: HIGH — pitfalls 1, 2, 3 are grounded in specific line-number evidence from the actual source
- Open questions: MEDIUM — questions are well-scoped; answers require human input (Felix's UUID) or a planner decision (tab vs. section)

**Research date:** 2026-03-25
**Valid until:** Stable — no fast-moving dependencies; valid until codebase structure changes
