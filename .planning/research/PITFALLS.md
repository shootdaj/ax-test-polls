# Pitfalls Research: Polling/Voting App

## Critical Pitfalls

### 1. Vercel Routing Mismatch
- **Warning signs:** 404s on deployed app, routes work locally but not on Vercel
- **Prevention:** Express routes must use FULL paths (`/api/polls`, not `/polls`). Vercel does NOT strip prefixes — `vercel.json` route `"/api/(.*)"` passes the full URL to Express.
- **Phase:** Address in Phase 1 (core setup)

### 2. In-Memory State Loss on Vercel
- **Warning signs:** Polls disappear between requests
- **Prevention:** Accept this as a known limitation. Vercel serverless functions are stateless — each invocation may get a cold start. For a demo app, this is acceptable. Document it clearly.
- **Phase:** Acknowledge in Phase 1, don't try to work around it

### 3. Cookie-Based Dedup is Bypassable
- **Warning signs:** Users vote multiple times by clearing cookies
- **Prevention:** Accept this trade-off. Add browser fingerprinting as a secondary check if desired, but don't over-engineer. For casual polls, cookie-based is sufficient.
- **Phase:** Phase 2 (voting)

### 4. Dynamic Options UI Complexity
- **Warning signs:** Add/remove option buttons don't work, option count validation breaks
- **Prevention:** Keep the DOM manipulation simple. Use data attributes for option indexing. Validate both client-side and server-side.
- **Phase:** Phase 3 (frontend)

### 5. Expiration Timezone Issues
- **Warning signs:** Polls expire at wrong times
- **Prevention:** Store all dates as UTC ISO strings. Convert to local time only in the frontend display. Use `Date.now()` for comparisons.
- **Phase:** Phase 2 (voting logic includes expiration check)

### 6. Missing Input Validation
- **Warning signs:** Empty polls, XSS via poll titles, polls with 0 options
- **Prevention:** Validate on both client and server: min 2 options, max 10, title required, sanitize HTML in titles/options.
- **Phase:** Phase 1 (API validation)

## Minor Pitfalls

### Search Performance
- In-memory search is fine for demo scale
- Don't build a search index — simple string matching is sufficient

### CSS Animation Performance
- Bar chart animations should use CSS transitions on `width`
- Avoid JS animation loops — they're unnecessary for this use case

### Mobile Touch Targets
- Radio buttons need adequate touch target size (minimum 44x44px)
- Buttons need padding for mobile use
