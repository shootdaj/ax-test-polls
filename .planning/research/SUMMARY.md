# Research Summary: Polling/Voting App

## Stack Decision
**Node.js 20 + Express 4 + Vanilla JS frontend + In-memory storage + Vercel deployment**

Minimal dependencies: express, uuid, cookie-parser. No build step, no database, no framework overhead.

## Table Stakes
- Create polls with multiple options
- Vote with one-vote-per-user enforcement
- Results with counts and percentages
- Shareable poll links
- Mobile-responsive design

## Key Architecture
- Express serves both API (`/api/*`) and pages (`/`, `/create`, `/poll/:slug`)
- In-memory Maps for polls, slug index, vote tracking
- Cookie-based voter identification
- `api/index.js` exports Express app for Vercel serverless

## Watch Out For
1. **Vercel routing** — Express must handle full paths, Vercel does NOT strip prefixes
2. **In-memory state** — data lost on cold starts (acceptable for demo)
3. **Input validation** — sanitize titles/options, enforce 2-10 options range
4. **Expiration dates** — use UTC everywhere, convert to local only in UI
5. **Mobile touch targets** — radio buttons and buttons need 44px+ touch targets

## Recommended Build Order
1. Core API + Storage (Express, routes, store, health check)
2. Voting + Results + Expiration (vote logic, dedup, results computation)
3. Frontend (all pages, forms, bar charts, responsive CSS)
4. Polish (search/filter, templates, share modal, categories)
