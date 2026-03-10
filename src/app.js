const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const pollRoutes = require('./routes/polls');

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

// Page routes (will serve HTML in Phase 3)
app.get('/', (req, res) => {
  res.json({ message: 'ax-test-polls API', version: '1.0.0' });
});

app.get('/create', (req, res) => {
  res.json({ message: 'Create poll page - coming in Phase 3' });
});

app.get('/poll/:slug', (req, res) => {
  res.json({ message: 'Vote page - coming in Phase 3', slug: req.params.slug });
});

app.get('/poll/:slug/results', (req, res) => {
  res.json({ message: 'Results page - coming in Phase 3', slug: req.params.slug });
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
