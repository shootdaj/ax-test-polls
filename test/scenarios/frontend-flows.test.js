const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');
const { store } = require('../../src/store');

describe('Frontend Flow Scenarios', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('FRNT-01: Mobile-responsive pages', () => {
    it('home page returns HTML with viewport meta tag', async () => {
      const res = await request(app).get('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes('viewport'));
      assert.ok(res.text.includes('width=device-width'));
    });

    it('create page returns HTML with viewport meta tag', async () => {
      const res = await request(app).get('/create');
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes('viewport'));
    });
  });

  describe('FRNT-02: Create form with validation', () => {
    it('create page has form with required fields', async () => {
      const res = await request(app).get('/create');
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes('id="create-form"'));
      assert.ok(res.text.includes('id="poll-title"'));
      assert.ok(res.text.includes('id="options-list"'));
      assert.ok(res.text.includes('id="add-option"'));
    });

    it('create page shows templates', async () => {
      const res = await request(app).get('/create');
      assert.ok(res.text.includes('Yes / No'));
      assert.ok(res.text.includes('Multiple Choice'));
      assert.ok(res.text.includes('Rating 1-5'));
    });
  });

  describe('FRNT-03: Vote page with radio buttons', () => {
    it('vote page shows radio buttons for options', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Radio Test', options: ['Alpha', 'Beta', 'Gamma'] });

      const { slug } = createRes.body;
      const res = await request(app).get(`/poll/${slug}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes('type="radio"'));
      assert.ok(res.text.includes('Alpha'));
      assert.ok(res.text.includes('Beta'));
      assert.ok(res.text.includes('Gamma'));
      assert.ok(res.text.includes('id="vote-form"'));
    });

    it('vote page shows already-voted message for returning voter', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Already Voted', options: ['X', 'Y'] });

      const { slug } = createRes.body;

      // Vote first
      await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=voter123')
        .send({ optionId: 0 });

      // Visit vote page again
      const res = await request(app)
        .get(`/poll/${slug}`)
        .set('Cookie', 'poll_voter_id=voter123');

      assert.ok(res.text.includes('already voted'));
    });
  });

  describe('FRNT-04: Expired poll indicator', () => {
    it('shows expired badge on vote page', async () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Old Poll', options: ['A', 'B'], expiresAt: pastDate });

      const { slug } = createRes.body;
      const res = await request(app).get(`/poll/${slug}`);
      assert.ok(res.text.includes('Expired'));
      assert.ok(res.text.includes('no longer accepting votes'));
    });

    it('shows expired badge on results page', async () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Expired Results', options: ['A', 'B'], expiresAt: pastDate });

      const { slug } = createRes.body;
      const res = await request(app).get(`/poll/${slug}/results`);
      assert.ok(res.text.includes('Expired'));
    });
  });

  describe('POLL-02: Dynamic option adding', () => {
    it('create page has add option button', async () => {
      const res = await request(app).get('/create');
      assert.ok(res.text.includes('id="add-option"'));
      assert.ok(res.text.includes('Add Option'));
    });

    it('create page starts with 2 option inputs', async () => {
      const res = await request(app).get('/create');
      const optionInputs = (res.text.match(/class="form-input option-input"/g) || []).length;
      assert.strictEqual(optionInputs, 2);
    });
  });

  describe('RSLT-03: Animated bar charts', () => {
    it('results page has bar elements with percentage data', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Bar Chart', options: ['A', 'B'] });

      const { slug } = createRes.body;

      await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v1')
        .send({ optionId: 0 });

      const res = await request(app).get(`/poll/${slug}/results`);
      assert.ok(res.text.includes('result-bar'));
      assert.ok(res.text.includes('data-percentage'));
      // Bar uses CSS class with width: 0 default, animated via JS
    });
  });

  describe('Full create-vote-results flow', () => {
    it('complete flow returns valid HTML at every step', async () => {
      // Step 1: Visit create page
      const createPageRes = await request(app).get('/create');
      assert.strictEqual(createPageRes.status, 200);
      assert.ok(createPageRes.text.includes('<!DOCTYPE html>'));

      // Step 2: Create a poll via API
      const createRes = await request(app)
        .post('/api/polls')
        .send({
          title: 'Frontend Flow Test',
          options: ['Yes', 'No', 'Maybe'],
          tags: ['test']
        });
      assert.strictEqual(createRes.status, 201);
      const { slug } = createRes.body;

      // Step 3: Visit vote page
      const votePageRes = await request(app).get(`/poll/${slug}`);
      assert.strictEqual(votePageRes.status, 200);
      assert.ok(votePageRes.text.includes('Frontend Flow Test'));
      assert.ok(votePageRes.text.includes('Yes'));
      assert.ok(votePageRes.text.includes('No'));
      assert.ok(votePageRes.text.includes('Maybe'));

      // Step 4: Vote
      const voteRes = await request(app)
        .post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=test-user')
        .send({ optionId: 0 });
      assert.strictEqual(voteRes.status, 200);

      // Step 5: View results
      const resultsPageRes = await request(app).get(`/poll/${slug}/results`);
      assert.strictEqual(resultsPageRes.status, 200);
      assert.ok(resultsPageRes.text.includes('Frontend Flow Test'));
      assert.ok(resultsPageRes.text.includes('1 vote'));
      assert.ok(resultsPageRes.text.includes('100%'));

      // Step 6: Home page shows the poll
      const homeRes = await request(app).get('/');
      assert.strictEqual(homeRes.status, 200);
      assert.ok(homeRes.text.includes('Frontend Flow Test'));
    });
  });

  describe('Share functionality', () => {
    it('vote page has share button and modal', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Share Test', options: ['A', 'B'] });

      const { slug } = createRes.body;
      const res = await request(app).get(`/poll/${slug}`);
      assert.ok(res.text.includes('id="share-btn"'));
      assert.ok(res.text.includes('id="share-modal"'));
      assert.ok(res.text.includes('id="copy-link"'));
      assert.ok(res.text.includes(`/poll/${slug}`));
    });

    it('results page has share button and modal', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Share Results', options: ['A', 'B'] });

      const { slug } = createRes.body;
      const res = await request(app).get(`/poll/${slug}/results`);
      assert.ok(res.text.includes('id="share-btn"'));
      assert.ok(res.text.includes('id="share-modal"'));
    });
  });

  describe('404 handling', () => {
    it('nonexistent poll returns 404', async () => {
      const res = await request(app).get('/poll/does-not-exist');
      assert.strictEqual(res.status, 404);
    });

    it('nonexistent results returns 404', async () => {
      const res = await request(app).get('/poll/does-not-exist/results');
      assert.strictEqual(res.status, 404);
    });
  });
});
