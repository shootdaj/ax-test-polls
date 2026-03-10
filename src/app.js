const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const pollRoutes = require('./routes/polls');
const { store } = require('./store');
const { homePage, createPage, votePage, resultsPage } = require('./views/pages');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use(pollRoutes);

// Helper to get base URL
function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}`;
}

// Page routes — serve HTML
app.get('/', (req, res) => {
  const { q, tag, page = 1 } = req.query;
  const result = store.list({
    q: q || '',
    tag: tag || '',
    page: parseInt(page, 10) || 1,
    limit: 20
  });
  const allTags = store.getAllTags();

  res.send(homePage({
    ...result,
    q: q || '',
    tag: tag || '',
    allTags
  }));
});

app.get('/create', (req, res) => {
  const templates = [
    { id: 'yes-no', name: 'Yes / No', options: ['Yes', 'No'] },
    { id: 'multiple-choice', name: 'Multiple Choice', options: ['Option A', 'Option B', 'Option C', 'Option D'] },
    { id: 'rating', name: 'Rating 1-5', options: ['1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'] }
  ];
  res.send(createPage({ templates }));
});

app.get('/poll/:slug', (req, res) => {
  const poll = store.getBySlug(req.params.slug);
  if (!poll) {
    return res.status(404).send('<h1>Poll not found</h1><p><a href="/">Go home</a></p>');
  }

  const visitorId = req.cookies && req.cookies.poll_voter_id;
  const hasVoted = visitorId ? store.hasVoted(req.params.slug, visitorId) : false;

  res.send(votePage({
    poll: {
      ...poll,
      expired: store.isExpired(poll)
    },
    hasVoted,
    baseUrl: getBaseUrl(req)
  }));
});

app.get('/poll/:slug/results', (req, res) => {
  const results = store.getResults(req.params.slug);
  if (!results) {
    return res.status(404).send('<h1>Poll not found</h1><p><a href="/">Go home</a></p>');
  }

  res.send(resultsPage({
    results,
    baseUrl: getBaseUrl(req)
  }));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
