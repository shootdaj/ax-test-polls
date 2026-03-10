# ax-test-polls

## What This Is

A full-stack Polling/Voting web application built with Node.js and Express. Users can create polls with multiple options, vote on them, view animated results, and share polls via unique links. The app uses in-memory storage and is designed for quick, casual polling scenarios.

## Core Value

Users can create a poll and share it with others to collect votes and see results instantly — the entire flow from creation to results must be fast, intuitive, and work on any device.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Create polls with 2-10 options and customizable titles
- [ ] Vote on polls with one vote per user (cookie/fingerprint enforcement)
- [ ] Poll expiration with automatic close after deadline
- [ ] View poll results with vote counts and percentages
- [ ] Categorize polls with tags
- [ ] Share polls via unique slug-based URLs
- [ ] Poll templates (yes/no, multiple choice, rating 1-5)
- [ ] Create poll form with dynamic option adding/removing
- [ ] Vote page with radio buttons and submit
- [ ] Live results display with animated bar charts
- [ ] Poll listing page with search and filter by category
- [ ] Share modal with copy-link functionality
- [ ] Expired poll indicator on vote and results pages
- [ ] Mobile-responsive design across all pages

### Out of Scope

- User authentication/accounts — anonymous voting via cookies is sufficient for v1
- Persistent database — in-memory storage keeps the project simple
- Real-time WebSocket updates — standard HTTP polling is fine for v1
- Poll editing after creation — create-once simplifies the model
- Image/media in polls — text-only options for v1

## Context

This is a test/demo project for the AX development lifecycle tool. It exercises a typical full-stack web app pattern: REST API backend with server-rendered or client-side frontend, deployed to Vercel. The in-memory storage constraint simplifies infrastructure (no database needed) while still requiring proper API design and state management.

Technology decisions:
- **Runtime:** Node.js with Express
- **Frontend:** Server-rendered HTML with vanilla JS (no framework overhead)
- **Storage:** In-memory JavaScript objects
- **Deployment:** Vercel serverless

## Constraints

- **Storage:** In-memory only — no external database
- **Stack:** Node.js/Express — specified by project requirements
- **Deployment:** Vercel — serverless function deployment
- **Vote enforcement:** Cookie/fingerprint-based — no user accounts

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| In-memory storage | Simplicity, no infrastructure dependencies | — Pending |
| Cookie-based vote dedup | No user accounts needed, reasonable for casual polls | — Pending |
| Vanilla JS frontend | No build step, fast load, simple deployment | — Pending |
| Express on Vercel | Familiar pattern, straightforward serverless adapter | — Pending |

---
*Last updated: 2026-03-10 after initialization*
