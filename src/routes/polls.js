const express = require('express');
const { store } = require('../store');

const router = express.Router();

/**
 * POST /api/polls — Create a new poll
 */
router.post('/api/polls', (req, res) => {
  try {
    const { title, options, tags, expiresAt, template } = req.body;
    const poll = store.createPoll({ title, options, tags, expiresAt, template });
    res.status(201).json({
      slug: poll.slug,
      id: poll.id,
      title: poll.title,
      options: poll.options,
      tags: poll.tags,
      expiresAt: poll.expiresAt,
      createdAt: poll.createdAt
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/polls — List polls with optional search and tag filter
 */
router.get('/api/polls', (req, res) => {
  const { q, tag, page = 1, limit = 20 } = req.query;
  const result = store.list({
    q: q || '',
    tag: tag || '',
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20
  });
  res.json(result);
});

/**
 * GET /api/polls/:slug — Get poll details
 */
router.get('/api/polls/:slug', (req, res) => {
  const poll = store.getBySlug(req.params.slug);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  // Check if visitor has voted
  const visitorId = req.cookies && req.cookies.poll_voter_id;
  const hasVoted = visitorId ? store.hasVoted(req.params.slug, visitorId) : false;

  res.json({
    slug: poll.slug,
    title: poll.title,
    options: poll.options,
    tags: poll.tags,
    totalVotes: poll.totalVotes,
    expired: store.isExpired(poll),
    expiresAt: poll.expiresAt,
    template: poll.template,
    createdAt: poll.createdAt,
    hasVoted
  });
});

/**
 * POST /api/polls/:slug/vote — Submit a vote
 */
router.post('/api/polls/:slug/vote', (req, res) => {
  const { optionId } = req.body;

  // Get or create visitor ID
  let visitorId = req.cookies && req.cookies.poll_voter_id;
  if (!visitorId) {
    const { v4: uuidv4 } = require('uuid');
    visitorId = uuidv4();
    res.cookie('poll_voter_id', visitorId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: 'lax'
    });
  }

  try {
    const poll = store.vote(req.params.slug, parseInt(optionId, 10), visitorId);
    res.json({
      success: true,
      slug: poll.slug,
      totalVotes: poll.totalVotes
    });
  } catch (err) {
    if (err.code === 'EXPIRED') {
      return res.status(410).json({ error: 'Poll has expired' });
    }
    if (err.code === 'DUPLICATE') {
      return res.status(409).json({ error: 'Already voted on this poll' });
    }
    if (err.message === 'Poll not found') {
      return res.status(404).json({ error: 'Poll not found' });
    }
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/polls/:slug/results — Get poll results
 */
router.get('/api/polls/:slug/results', (req, res) => {
  const results = store.getResults(req.params.slug);
  if (!results) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  res.json(results);
});

/**
 * GET /api/templates — Get available poll templates
 */
router.get('/api/templates', (req, res) => {
  res.json({
    templates: [
      {
        id: 'yes-no',
        name: 'Yes / No',
        options: ['Yes', 'No']
      },
      {
        id: 'multiple-choice',
        name: 'Multiple Choice',
        options: ['Option A', 'Option B', 'Option C', 'Option D']
      },
      {
        id: 'rating',
        name: 'Rating 1-5',
        options: ['1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent']
      }
    ]
  });
});

/**
 * GET /api/tags — Get all unique tags
 */
router.get('/api/tags', (req, res) => {
  res.json({ tags: store.getAllTags() });
});

module.exports = router;
