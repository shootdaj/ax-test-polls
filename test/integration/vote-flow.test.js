const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');
const { store } = require('../../src/store');

describe('Vote Flow Integration Tests', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('VOTE-01: Vote on a poll', () => {
    it('records vote and returns success with total count', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Test', options: ['A', 'B'] });

      const { slug } = createRes.body;
      const voteRes = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .send({ optionId: 0 });

      assert.strictEqual(voteRes.status, 200);
      assert.strictEqual(voteRes.body.success, true);
      assert.strictEqual(voteRes.body.slug, slug);
      assert.strictEqual(voteRes.body.totalVotes, 1);
    });
  });

  describe('VOTE-02: One vote per user per poll', () => {
    it('rejects duplicate vote from same cookie', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Dedup', options: ['A', 'B'] });

      const { slug } = createRes.body;

      await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=user123')
        .send({ optionId: 0 });

      const dupRes = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=user123')
        .send({ optionId: 1 });

      assert.strictEqual(dupRes.status, 409);
      assert.ok(dupRes.body.error.includes('Already voted'));
    });

    it('allows different users to vote on same poll', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Multi-user', options: ['A', 'B'] });

      const { slug } = createRes.body;

      const vote1 = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=user1')
        .send({ optionId: 0 });
      assert.strictEqual(vote1.status, 200);

      const vote2 = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=user2')
        .send({ optionId: 1 });
      assert.strictEqual(vote2.status, 200);
      assert.strictEqual(vote2.body.totalVotes, 2);
    });
  });

  describe('VOTE-03: Expired poll rejects votes', () => {
    it('returns 410 for expired poll', async () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Expired', options: ['A', 'B'], expiresAt: pastDate });

      const { slug } = createRes.body;
      const voteRes = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .send({ optionId: 0 });

      assert.strictEqual(voteRes.status, 410);
      assert.ok(voteRes.body.error.includes('expired'));
    });

    it('poll detail endpoint shows expired status', async () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Expired', options: ['A', 'B'], expiresAt: pastDate });

      const { slug } = createRes.body;
      const pollRes = await request(app).get(`/api/polls/${slug}`);
      assert.strictEqual(pollRes.body.expired, true);
    });
  });

  describe('VOTE-04: Vote confirmation', () => {
    it('returns success true and slug for redirect after voting', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Confirm', options: ['A', 'B'] });

      const { slug } = createRes.body;
      const voteRes = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .send({ optionId: 0 });

      assert.strictEqual(voteRes.body.success, true);
      assert.strictEqual(voteRes.body.slug, slug);
      // Client uses slug to redirect to /poll/:slug/results
    });
  });

  describe('RSLT-01: Vote count per option', () => {
    it('shows individual vote counts', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Counts', options: ['X', 'Y', 'Z'] });

      const { slug } = createRes.body;

      await request(app).post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v1').send({ optionId: 0 });
      await request(app).post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v2').send({ optionId: 0 });
      await request(app).post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v3').send({ optionId: 2 });

      const results = await request(app).get(`/api/polls/${slug}/results`);
      assert.strictEqual(results.body.options[0].votes, 2);
      assert.strictEqual(results.body.options[1].votes, 0);
      assert.strictEqual(results.body.options[2].votes, 1);
    });
  });

  describe('RSLT-02: Percentages', () => {
    it('shows correct percentages rounded to integers', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Pct', options: ['A', 'B', 'C'] });

      const { slug } = createRes.body;

      await request(app).post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v1').send({ optionId: 0 });
      await request(app).post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v2').send({ optionId: 0 });
      await request(app).post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v3').send({ optionId: 1 });

      const results = await request(app).get(`/api/polls/${slug}/results`);
      assert.strictEqual(results.body.options[0].percentage, 67);
      assert.strictEqual(results.body.options[1].percentage, 33);
      assert.strictEqual(results.body.options[2].percentage, 0);
      assert.strictEqual(results.body.totalVotes, 3);
    });
  });

  describe('RSLT-04: Results update on refresh', () => {
    it('returns updated results after new votes', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Refresh', options: ['A', 'B'] });

      const { slug } = createRes.body;

      // First check — no votes
      const results1 = await request(app).get(`/api/polls/${slug}/results`);
      assert.strictEqual(results1.body.totalVotes, 0);

      // Add a vote
      await request(app).post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v1').send({ optionId: 0 });

      // Second check — 1 vote
      const results2 = await request(app).get(`/api/polls/${slug}/results`);
      assert.strictEqual(results2.body.totalVotes, 1);
      assert.strictEqual(results2.body.options[0].votes, 1);
    });
  });
});
