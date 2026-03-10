# Roadmap: ax-test-polls

## Overview

**4 phases** | **28 requirements** | All v1 requirements covered

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Core API & Storage | Working Express API with poll CRUD, in-memory store, and Vercel deployment | POLL-01, POLL-03, POLL-04, POLL-05, SHAR-03, INFR-01, INFR-02, INFR-03 | 4 |
| 2 | Voting & Results | Complete voting flow with dedup, expiration, and results computation | VOTE-01, VOTE-02, VOTE-03, VOTE-04, RSLT-01, RSLT-02, RSLT-04 | 4 |
| 3 | Frontend UI | Responsive frontend with create form, vote page, results with bar charts | POLL-02, RSLT-03, FRNT-01, FRNT-02, FRNT-03, FRNT-04 | 4 |
| 4 | Discovery & Polish | Poll listing, search/filter, templates, share modal, categories | POLL-06, DISC-01, DISC-02, DISC-03, DISC-04, SHAR-01, SHAR-02 | 4 |

---

## Phase 1: Core API & Storage

**Goal:** Set up Express server with in-memory store, poll CRUD endpoints, health check, and Vercel deployment configuration.

**Requirements:** POLL-01, POLL-03, POLL-04, POLL-05, SHAR-03, INFR-01, INFR-02, INFR-03

**Success Criteria:**
1. POST /api/polls creates a poll and returns a slug
2. GET /api/polls/:slug returns poll data
3. GET /health returns 200
4. App runs locally and Vercel config is in place

**Deliverables:**
- `package.json` with dependencies
- `src/app.js` — Express application
- `src/store.js` — in-memory data store
- `src/routes/polls.js` — poll API routes
- `api/index.js` — Vercel entry point
- `vercel.json` — Vercel routing config
- Unit tests for store operations
- Integration tests for API endpoints

---

## Phase 2: Voting & Results

**Goal:** Implement voting with cookie-based dedup, expiration checking, and results computation with counts and percentages.

**Requirements:** VOTE-01, VOTE-02, VOTE-03, VOTE-04, RSLT-01, RSLT-02, RSLT-04

**Success Criteria:**
1. POST /api/polls/:slug/vote records a vote and sets cookie
2. Second vote from same user returns 409
3. Vote on expired poll returns 410
4. GET /api/polls/:slug/results returns counts and percentages

**Deliverables:**
- Vote submission endpoint
- Cookie-based voter tracking
- Expiration checking middleware
- Results computation logic
- Unit tests for vote dedup and expiration
- Integration tests for voting flow

---

## Phase 3: Frontend UI

**Goal:** Build responsive HTML pages for creating polls, voting, and viewing animated results.

**Requirements:** POLL-02, RSLT-03, FRNT-01, FRNT-02, FRNT-03, FRNT-04

**Success Criteria:**
1. Create form allows adding/removing options dynamically
2. Vote page shows radio buttons and submits correctly
3. Results page shows animated bar charts
4. All pages work on mobile (320px+)

**Deliverables:**
- `public/` directory with CSS and JS
- HTML templates (rendered server-side)
- Create poll page with dynamic form
- Vote page with radio buttons
- Results page with animated bars
- Expired poll indicator
- Mobile-responsive CSS
- Scenario tests for user flows

---

## Phase 4: Discovery & Polish

**Goal:** Add poll listing, search/filter, templates, share modal, and category browsing.

**Requirements:** POLL-06, DISC-01, DISC-02, DISC-03, DISC-04, SHAR-01, SHAR-02

**Success Criteria:**
1. Home page lists polls with search and tag filter
2. Poll templates pre-fill the create form
3. Share modal shows URL with copy button
4. Polls display tag badges and vote counts

**Deliverables:**
- Poll listing page with pagination
- Search by title functionality
- Filter by tag functionality
- Poll templates (yes/no, multiple choice, rating)
- Share modal component
- Category badge display
- Integration tests for search/filter
- Scenario tests for template and share flows
