# Stack Research: Polling/Voting App

## Recommended Stack (2025)

### Runtime & Framework
- **Node.js 20 LTS** — stable, well-supported on Vercel
- **Express 4.x** — mature, minimal, perfect for REST APIs
- **Confidence:** High — battle-tested combination

### Frontend
- **Vanilla HTML/CSS/JS** — no build step needed
- **CSS Custom Properties** — for theming
- **Fetch API** — for AJAX voting/results
- **Confidence:** High — simplest path to Vercel deployment

### Storage
- **In-memory JavaScript Map/Object** — per project requirements
- No database driver needed
- **Confidence:** High — simplest possible storage

### Testing
- **Node.js built-in test runner** (`node:test`) — zero dependencies
- **supertest** — HTTP assertion library for Express integration tests
- **Confidence:** High — Node 20 test runner is production-ready

### Deployment
- **Vercel** — serverless Node.js functions
- `vercel.json` + `api/index.js` entry point
- **Confidence:** High — standard Vercel Express pattern

## What NOT to Use
- **React/Vue/Angular** — overkill for this scope, adds build complexity
- **Database (Postgres/MongoDB)** — requirement is in-memory
- **WebSocket (Socket.io)** — not needed for v1, standard HTTP sufficient
- **TypeScript** — adds build step complexity for a demo project
- **ORM (Prisma/Sequelize)** — no database to map to

## Key Dependencies
```json
{
  "express": "^4.21.0",
  "uuid": "^11.0.0",
  "cookie-parser": "^1.4.7"
}
```

Dev dependencies:
```json
{
  "supertest": "^7.0.0"
}
```
