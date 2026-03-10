const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');
const { store } = require('../../src/store');

describe('Discovery Integration Tests', () => {
  beforeEach(() => {
    store.clear();
  });

  describe('DISC-01: Poll listing page', () => {
    it('home page returns HTML with poll list', async () => {
      await request(app).post('/api/polls').send({ title: 'Poll A', options: ['X', 'Y'] });
      await request(app).post('/api/polls').send({ title: 'Poll B', options: ['X', 'Y'] });

      const res = await request(app).get('/');
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes('Poll A'));
      assert.ok(res.text.includes('Poll B'));
      assert.ok(res.text.includes('poll-list'));
    });

    it('shows empty state when no polls exist', async () => {
      const res = await request(app).get('/');
      assert.ok(res.text.includes('No polls found'));
      assert.ok(res.text.includes('Create one'));
    });
  });

  describe('DISC-02: Search by title', () => {
    it('filters polls by search query via page', async () => {
      await request(app).post('/api/polls').send({ title: 'JavaScript vs Python', options: ['JS', 'Py'] });
      await request(app).post('/api/polls').send({ title: 'Best Pizza', options: ['Pepperoni', 'Mushroom'] });

      const res = await request(app).get('/?q=javascript');
      assert.ok(res.text.includes('JavaScript vs Python'));
      assert.ok(!res.text.includes('Best Pizza'));
    });

    it('search is case-insensitive', async () => {
      await request(app).post('/api/polls').send({ title: 'UPPERCASE POLL', options: ['A', 'B'] });

      const res = await request(app).get('/?q=uppercase');
      assert.ok(res.text.includes('UPPERCASE POLL'));
    });

    it('search input preserves query value', async () => {
      const res = await request(app).get('/?q=test');
      assert.ok(res.text.includes('value="test"'));
    });
  });

  describe('DISC-03: Filter by tag', () => {
    it('filters polls by tag via page', async () => {
      await request(app).post('/api/polls').send({ title: 'Tech Poll', options: ['A', 'B'], tags: ['tech'] });
      await request(app).post('/api/polls').send({ title: 'Food Poll', options: ['A', 'B'], tags: ['food'] });

      const res = await request(app).get('/?tag=tech');
      assert.ok(res.text.includes('Tech Poll'));
      assert.ok(!res.text.includes('Food Poll'));
    });

    it('tag filter dropdown includes all tags', async () => {
      await request(app).post('/api/polls').send({ title: 'P1', options: ['A', 'B'], tags: ['alpha'] });
      await request(app).post('/api/polls').send({ title: 'P2', options: ['A', 'B'], tags: ['beta'] });

      const res = await request(app).get('/');
      assert.ok(res.text.includes('alpha'));
      assert.ok(res.text.includes('beta'));
    });
  });

  describe('DISC-04: Listing shows title, votes, status', () => {
    it('shows vote count per poll', async () => {
      const createRes = await request(app).post('/api/polls').send({ title: 'Voted Poll', options: ['A', 'B'] });
      const { slug } = createRes.body;

      await request(app).post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v1').send({ optionId: 0 });
      await request(app).post(`/api/polls/${slug}/vote`)
        .set('Cookie', 'poll_voter_id=v2').send({ optionId: 1 });

      const res = await request(app).get('/');
      assert.ok(res.text.includes('2 votes'));
    });

    it('shows active badge for non-expired polls', async () => {
      await request(app).post('/api/polls').send({ title: 'Active', options: ['A', 'B'] });

      const res = await request(app).get('/');
      assert.ok(res.text.includes('Active'));
      assert.ok(res.text.includes('badge-active'));
    });

    it('shows expired badge for expired polls', async () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      await request(app).post('/api/polls').send({
        title: 'Old Poll', options: ['A', 'B'], expiresAt: pastDate
      });

      const res = await request(app).get('/');
      assert.ok(res.text.includes('badge-expired'));
    });

    it('shows tag badges on poll items', async () => {
      await request(app).post('/api/polls').send({
        title: 'Tagged', options: ['A', 'B'], tags: ['tech', 'fun']
      });

      const res = await request(app).get('/');
      assert.ok(res.text.includes('tech'));
      assert.ok(res.text.includes('fun'));
    });
  });

  describe('POLL-06: Poll templates', () => {
    it('API returns templates', async () => {
      const res = await request(app).get('/api/templates');
      assert.strictEqual(res.status, 200);

      const { templates } = res.body;
      assert.ok(templates.find(t => t.id === 'yes-no'));
      assert.ok(templates.find(t => t.id === 'multiple-choice'));
      assert.ok(templates.find(t => t.id === 'rating'));
    });

    it('create page shows template cards', async () => {
      const res = await request(app).get('/create');
      assert.ok(res.text.includes('template-card'));
      assert.ok(res.text.includes('Yes / No'));
      assert.ok(res.text.includes('Multiple Choice'));
      assert.ok(res.text.includes('Rating 1-5'));
    });

    it('can create poll with template options', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send({
          title: 'Rate our service',
          options: ['1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'],
          template: 'rating'
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.options.length, 5);
    });
  });

  describe('SHAR-01 & SHAR-02: Share modal and copy link', () => {
    it('vote page includes share modal with poll URL', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Share Me', options: ['A', 'B'] });

      const { slug } = createRes.body;
      const res = await request(app).get(`/poll/${slug}`);

      assert.ok(res.text.includes('share-modal'));
      assert.ok(res.text.includes('share-btn'));
      assert.ok(res.text.includes('copy-link'));
      assert.ok(res.text.includes(`/poll/${slug}`));
    });

    it('results page includes share modal with poll URL', async () => {
      const createRes = await request(app)
        .post('/api/polls')
        .send({ title: 'Share Results', options: ['A', 'B'] });

      const { slug } = createRes.body;
      const res = await request(app).get(`/poll/${slug}/results`);

      assert.ok(res.text.includes('share-modal'));
      assert.ok(res.text.includes(`/poll/${slug}`));
    });
  });
});
