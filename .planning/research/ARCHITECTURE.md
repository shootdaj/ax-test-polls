# Architecture Research: Polling/Voting App

## System Components

### 1. Express API Server (`src/app.js`)
- Poll CRUD endpoints
- Vote submission endpoint
- Results retrieval endpoint
- Poll listing with search/filter
- Static file serving for frontend

### 2. In-Memory Store (`src/store.js`)
- Polls Map: `pollId → { title, options, votes, slug, tags, expiresAt, template, createdAt }`
- Slug index: `slug → pollId` for fast lookup
- Vote tracking: `pollId:visitorId → true` for dedup

### 3. Frontend Pages
- **Home/Listing** (`/`) — browse polls, search, filter by tag
- **Create Poll** (`/create`) — form with dynamic option management
- **Vote** (`/poll/:slug`) — radio buttons, submit
- **Results** (`/poll/:slug/results`) — animated bar chart

### 4. Vercel Adapter (`api/index.js`)
- Exports Express app for serverless function

## Data Flow

```
User creates poll → POST /api/polls → Store.create() → redirect to share page
User votes → POST /api/polls/:slug/vote → check cookie → Store.vote() → redirect to results
User views results → GET /api/polls/:slug/results → Store.getResults() → render bars
User browses → GET /api/polls?tag=X&q=Y → Store.list() → render listing
```

## API Design

```
GET    /                          → Home/listing page
GET    /create                    → Create poll form
GET    /poll/:slug                → Vote page
GET    /poll/:slug/results        → Results page

POST   /api/polls                 → Create poll (returns slug)
GET    /api/polls                 → List polls (query params: tag, q, page)
GET    /api/polls/:slug           → Get poll details
POST   /api/polls/:slug/vote      → Submit vote
GET    /api/polls/:slug/results   → Get results data (JSON)
GET    /api/templates             → Get available templates

GET    /health                    → Health check
```

## Build Order (suggested phases)
1. **Core API + Storage** — Express setup, poll CRUD, in-memory store, health check
2. **Voting + Results** — Vote submission, dedup, results computation
3. **Frontend** — All pages, forms, bar charts, responsive design
4. **Search, Filters, Templates** — Poll listing, categories, templates, share modal

## Key Patterns
- **Slug-based URLs** — human-friendly poll links (`/poll/favorite-color-abc123`)
- **Cookie-based dedup** — `poll_voter_id` cookie set on first visit
- **Server-side HTML rendering** — template literals or simple template engine
- **Progressive enhancement** — forms work without JS, JS enhances UX
