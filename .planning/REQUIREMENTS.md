# Requirements: ax-test-polls

**Defined:** 2026-03-10
**Core Value:** Users can create a poll and share it with others to collect votes and see results instantly

## v1 Requirements

### Poll Management

- [ ] **POLL-01**: User can create a poll with a title and 2-10 text options
- [ ] **POLL-02**: User can add and remove options dynamically in the create form
- [ ] **POLL-03**: User can set an expiration date/time when creating a poll
- [ ] **POLL-04**: User can assign one or more category tags to a poll
- [ ] **POLL-05**: Each poll gets a unique slug-based URL for sharing
- [ ] **POLL-06**: User can select from poll templates (yes/no, multiple choice, rating 1-5)

### Voting

- [ ] **VOTE-01**: User can vote on a poll by selecting one option and submitting
- [ ] **VOTE-02**: Each user can only vote once per poll (enforced via cookie/fingerprint)
- [ ] **VOTE-03**: Expired polls reject new votes and show an expired indicator
- [ ] **VOTE-04**: User sees confirmation after voting and is redirected to results

### Results

- [ ] **RSLT-01**: User can view poll results with vote count per option
- [ ] **RSLT-02**: Results display percentage for each option
- [ ] **RSLT-03**: Results render as animated horizontal bar charts
- [ ] **RSLT-04**: Results update when page is refreshed

### Discovery

- [ ] **DISC-01**: User can browse all polls on a listing page
- [ ] **DISC-02**: User can search polls by title text
- [ ] **DISC-03**: User can filter polls by category tag
- [ ] **DISC-04**: Poll listing shows poll title, vote count, status (active/expired)

### Sharing

- [ ] **SHAR-01**: User sees a share modal with the poll's unique URL
- [ ] **SHAR-02**: User can copy the poll link with one click
- [ ] **SHAR-03**: Shared links open directly to the vote page

### Frontend

- [ ] **FRNT-01**: All pages are mobile-responsive (works on 320px+ screens)
- [ ] **FRNT-02**: Create poll form validates input before submission
- [ ] **FRNT-03**: Vote page shows radio buttons for each option
- [ ] **FRNT-04**: Expired polls show a clear visual indicator

### Infrastructure

- [ ] **INFR-01**: Health check endpoint returns 200 OK
- [ ] **INFR-02**: API returns proper error responses (400, 404, 409)
- [ ] **INFR-03**: Application deploys and runs on Vercel

## v2 Requirements

### Real-time
- **RT-01**: Results update in real-time without page refresh (WebSocket)

### Analytics
- **ANLYT-01**: Poll creator can see voter demographics/timing
- **ANLYT-02**: Admin dashboard showing platform-wide stats

### Social
- **SOC-01**: Share to Twitter/Facebook directly from share modal
- **SOC-02**: Embed poll widget in external sites

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts/authentication | Cookie-based dedup is sufficient for v1 |
| Persistent database | In-memory storage per project requirements |
| Poll editing after creation | Immutable polls simplify the model |
| Image/media in poll options | Text-only for v1 |
| WebSocket real-time updates | Standard HTTP is sufficient for v1 |
| Analytics/dashboards | Beyond v1 scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| POLL-01 | Phase 1 | Pending |
| POLL-02 | Phase 3 | Pending |
| POLL-03 | Phase 1 | Pending |
| POLL-04 | Phase 1 | Pending |
| POLL-05 | Phase 1 | Pending |
| POLL-06 | Phase 4 | Pending |
| VOTE-01 | Phase 2 | Pending |
| VOTE-02 | Phase 2 | Pending |
| VOTE-03 | Phase 2 | Pending |
| VOTE-04 | Phase 2 | Pending |
| RSLT-01 | Phase 2 | Pending |
| RSLT-02 | Phase 2 | Pending |
| RSLT-03 | Phase 3 | Pending |
| RSLT-04 | Phase 2 | Pending |
| DISC-01 | Phase 4 | Pending |
| DISC-02 | Phase 4 | Pending |
| DISC-03 | Phase 4 | Pending |
| DISC-04 | Phase 4 | Pending |
| SHAR-01 | Phase 4 | Pending |
| SHAR-02 | Phase 4 | Pending |
| SHAR-03 | Phase 1 | Pending |
| FRNT-01 | Phase 3 | Pending |
| FRNT-02 | Phase 3 | Pending |
| FRNT-03 | Phase 3 | Pending |
| FRNT-04 | Phase 3 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after initial definition*
