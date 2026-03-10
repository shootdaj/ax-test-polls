const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');
const { store } = require('../../src/store');

describe('API Integration Tests', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.ok(res.body.timestamp);
    });
  });

  describe('POST /api/polls', () => {
    it('creates a poll and returns 201', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send({
          title: 'Favorite Color',
          options: ['Red', 'Blue', 'Green'],
          tags: ['fun']
        });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.slug);
      assert.strictEqual(res.body.title, 'Favorite Color');
      assert.strictEqual(res.body.options.length, 3);
    });

    it('returns 400 for invalid poll data', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send({ title: '', options: ['Only one'] });

      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error);
    });

    it('creates poll with expiration date', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post('/api/polls')
        .send({
          title: 'Expiring Poll',
          options: ['Yes', 'No'],
          expiresAt: futureDate
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.expiresAt, futureDate);
    });
  });

  describe('GET /api/polls/:slug', () => {
    it('returns poll by slug', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Test Poll', options: ['A', 'B'] });

      const slug = createRes.body.slug;
      const res = await request(app).get(`/api/polls/${slug}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.title, 'Test Poll');
      assert.strictEqual(res.body.slug, slug);
    });

    it('returns 404 for nonexistent slug', async () => {
      const res = await request(app).get('/api/polls/nonexistent-slug');
      assert.strictEqual(res.status, 404);
    });
  });

  describe('GET /api/polls', () => {
    it('returns list of polls', async () => {
      await request(app)
        .post('/api/polls')
        .send({ title: 'Poll A', options: ['X', 'Y'] });
      await request(app)
        .post('/api/polls')
        .send({ title: 'Poll B', options: ['X', 'Y'] });

      const res = await request(app).get('/api/polls');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.total, 2);
      assert.strictEqual(res.body.polls.length, 2);
    });

    it('filters by search query', async () => {
      await request(app)
        .post('/api/polls')
        .send({ title: 'Favorite Color', options: ['R', 'B'] });
      await request(app)
        .post('/api/polls')
        .send({ title: 'Best Movie', options: ['A', 'B'] });

      const res = await request(app).get('/api/polls?q=color');
      assert.strictEqual(res.body.total, 1);
    });

    it('filters by tag', async () => {
      await request(app)
        .post('/api/polls')
        .send({ title: 'P1', options: ['A', 'B'], tags: ['tech'] });
      await request(app)
        .post('/api/polls')
        .send({ title: 'P2', options: ['A', 'B'], tags: ['food'] });

      const res = await request(app).get('/api/polls?tag=tech');
      assert.strictEqual(res.body.total, 1);
    });
  });

  describe('POST /api/polls/:slug/vote', () => {
    it('records a vote successfully', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Vote Test', options: ['A', 'B'] });

      const slug = createRes.body.slug;
      const res = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .send({ optionId: 0 });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.totalVotes, 1);
    });

    it('sets voter cookie on first vote', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Cookie Test', options: ['A', 'B'] });

      const slug = createRes.body.slug;
      const res = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .send({ optionId: 0 });

      assert.strictEqual(res.status, 200);
      const setCookie = res.headers['set-cookie'];
      assert.ok(setCookie);
      assert.ok(setCookie.some(c => c.includes('poll_voter_id')));
    });

    it('returns 409 for duplicate vote', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Dup Test', options: ['A', 'B'] });

      const slug = createRes.body.slug;

      // First vote
      const firstRes = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=test-visitor')
        .send({ optionId: 0 });
      assert.strictEqual(firstRes.status, 200);

      // Second vote with same cookie
      const secondRes = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=test-visitor')
        .send({ optionId: 1 });
      assert.strictEqual(secondRes.status, 409);
    });

    it('returns 410 for expired poll', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const createRes = await request(app)
        .post('/api/polls')
        .send({
          title: 'Expired',
          options: ['A', 'B'],
          expiresAt: pastDate
        });

      const slug = createRes.body.slug;
      const res = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .send({ optionId: 0 });
      assert.strictEqual(res.status, 410);
    });

    it('returns 404 for nonexistent poll', async () => {
      const res = await request(app)
        .post('/api/polls/nonexistent/vote')
        .send({ optionId: 0 });
      assert.strictEqual(res.status, 404);
    });
  });

  describe('GET /api/polls/:slug/results', () => {
    it('returns results with percentages', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Results Test', options: ['A', 'B'] });

      const slug = createRes.body.slug;

      // Add votes
      await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v1')
        .send({ optionId: 0 });
      await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v2')
        .send({ optionId: 0 });
      await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v3')
        .send({ optionId: 1 });

      const res = await request(app).get(`/api/polls/${slug}/results`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.totalVotes, 3);
      assert.strictEqual(res.body.options[0].percentage, 67);
      assert.strictEqual(res.body.options[1].percentage, 33);
    });

    it('returns 404 for nonexistent poll', async () => {
      const res = await request(app).get('/api/polls/nonexistent/results');
      assert.strictEqual(res.status, 404);
    });
  });

  describe('GET /api/templates', () => {
    it('returns available templates', async () => {
      const res = await request(app).get('/api/templates');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.templates));
      assert.ok(res.body.templates.length >= 3);

      const yesNo = res.body.templates.find(t => t.id === 'yes-no');
      assert.ok(yesNo);
      assert.deepStrictEqual(yesNo.options, ['Yes', 'No']);
    });
  });

  describe('GET /api/tags', () => {
    it('returns all unique tags', async () => {
      await request(app)
        .post('/api/polls')
        .send({ title: 'P1', options: ['A', 'B'], tags: ['tech', 'fun'] });
      await request(app)
        .post('/api/polls')
        .send({ title: 'P2', options: ['A', 'B'], tags: ['fun', 'food'] });

      const res = await request(app).get('/api/tags');
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body.tags, ['food', 'fun', 'tech']);
    });
  });
});
