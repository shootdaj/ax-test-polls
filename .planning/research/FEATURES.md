# Features Research: Polling/Voting App

## Table Stakes (must have or users leave)
- **Create poll** — title + multiple options (2-10)
- **Vote** — select option, submit, see confirmation
- **Results** — vote counts, percentages, visual bar chart
- **Share** — unique URL per poll for sharing
- **Mobile support** — responsive layout that works on phones

## Differentiators (competitive advantage)
- **Poll templates** — quick-start with yes/no, rating, multiple choice
- **Categories/tags** — organize and filter polls
- **Animated results** — bar charts that animate on load
- **Poll expiration** — auto-close after deadline
- **Copy link modal** — one-click sharing

## Anti-features (deliberately NOT building)
- **User accounts** — adds friction, cookie-based dedup is sufficient
- **Real-time updates** — WebSocket adds complexity for marginal value
- **Poll editing** — immutable polls are simpler and prevent manipulation concerns
- **Analytics dashboard** — beyond v1 scope
- **Embed widget** — beyond v1 scope

## Feature Dependencies
```
Create Poll → generates slug → Share URL
Create Poll → sets expiration → Expiration check
Vote → checks expiration → may reject
Vote → checks cookie → may reject (duplicate)
Vote → updates counts → Results display
Poll Listing → uses categories → Filter/Search
Templates → pre-fills → Create Poll form
```

## Complexity Assessment
| Feature | Complexity | Notes |
|---------|-----------|-------|
| Create poll API | Low | CRUD with validation |
| Vote with dedup | Medium | Cookie/fingerprint logic |
| Results with bars | Medium | Frontend animation |
| Share links/slugs | Low | UUID or nanoid |
| Poll expiration | Low | Date comparison |
| Categories/tags | Low | String array filtering |
| Templates | Low | Pre-defined option sets |
| Search/filter | Medium | Text search + tag filter |
| Mobile responsive | Medium | CSS media queries |
