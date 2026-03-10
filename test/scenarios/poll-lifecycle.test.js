const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');
const { store } = require('../../src/store');

describe('Poll Lifecycle Scenarios', () => {
  beforeEach(() => {
    store.clear();
  });

  it('full poll lifecycle: create -> vote -> results', async () => {
    // Step 1: Create a poll
    const createRes = await request(app)
      .post('/api/polls')
      .send({
        title: 'Best Programming Language',
        options: ['JavaScript', 'Python', 'Rust', 'Go'],
        tags: ['tech', 'programming']
      });

    assert.strictEqual(createRes.status, 201);
    const { slug } = createRes.body;
    assert.ok(slug);

    // Step 2: Get poll details
    const pollRes = await request(app).get(`/api/polls/${slug}`);
    assert.strictEqual(pollRes.status, 200);
    assert.strictEqual(pollRes.body.title, 'Best Programming Language');
    assert.strictEqual(pollRes.body.options.length, 4);

    // Step 3: Vote on the poll
    const vote1 = await request(app)
      .post(`/api/polls/${slug}/vote`)
      .set('Cookie', 'poll_voter_id=user1')
      .send({ optionId: 0 }); // JavaScript
    assert.strictEqual(vote1.status, 200);

    const vote2 = await request(app)
      .post(`/api/polls/${slug}/vote`)
      .set('Cookie', 'poll_voter_id=user2')
      .send({ optionId: 2 }); // Rust
    assert.strictEqual(vote2.status, 200);

    const vote3 = await request(app)
      .post(`/api/polls/${slug}/vote`)
      .set('Cookie', 'poll_voter_id=user3')
      .send({ optionId: 0 }); // JavaScript
    assert.strictEqual(vote3.status, 200);

    // Step 4: Check results
    const resultsRes = await request(app).get(`/api/polls/${slug}/results`);
    assert.strictEqual(resultsRes.status, 200);
    assert.strictEqual(resultsRes.body.totalVotes, 3);

    const jsOption = resultsRes.body.options.find(o => o.text === 'JavaScript');
    assert.strictEqual(jsOption.votes, 2);
    assert.strictEqual(jsOption.percentage, 67);

    const rustOption = resultsRes.body.options.find(o => o.text === 'Rust');
    assert.strictEqual(rustOption.votes, 1);
    assert.strictEqual(rustOption.percentage, 33);
  });

  it('expired poll prevents voting', async () => {
    // Create an already-expired poll
    const pastDate = new Date(Date.now() - 60000).toISOString();
    const createRes = await request(app)
      .post('/api/polls')
      .send({
        title: 'Expired Question',
        options: ['Yes', 'No'],
        expiresAt: pastDate
      });

    const { slug } = createRes.body;

    // Try to vote
    const voteRes = await request(app)
      .post(`/api/polls/${slug}/vote`)
      .send({ optionId: 0 });
    assert.strictEqual(voteRes.status, 410);
    assert.ok(voteRes.body.error.includes('expired'));

    // Results should still be viewable
    const resultsRes = await request(app).get(`/api/polls/${slug}/results`);
    assert.strictEqual(resultsRes.status, 200);
    assert.strictEqual(resultsRes.body.expired, true);
  });

  it('duplicate vote prevention works', async () => {
    const createRes = await request(app)
      .post('/api/polls')
      .send({
        title: 'One Vote Only',
        options: ['Option A', 'Option B']
      });

    const { slug } = createRes.body;

    // First vote succeeds
    const vote1 = await request(app)
      .post(`/api/polls/${slug}/vote`)
      .set('Cookie', 'poll_voter_id=same-user')
      .send({ optionId: 0 });
    assert.strictEqual(vote1.status, 200);

    // Second vote fails
    const vote2 = await request(app)
      .post(`/api/polls/${slug}/vote`)
      .set('Cookie', 'poll_voter_id=same-user')
      .send({ optionId: 1 });
    assert.strictEqual(vote2.status, 409);

    // Total votes should still be 1
    const resultsRes = await request(app).get(`/api/polls/${slug}/results`);
    assert.strictEqual(resultsRes.body.totalVotes, 1);
  });

  it('poll discovery: search and tag filtering', async () => {
    // Create several polls
    await request(app).post('/api/polls').send({
      title: 'Best JavaScript Framework',
      options: ['React', 'Vue'],
      tags: ['tech', 'javascript']
    });

    await request(app).post('/api/polls').send({
      title: 'Favorite Pizza Topping',
      options: ['Pepperoni', 'Mushroom'],
      tags: ['food']
    });

    await request(app).post('/api/polls').send({
      title: 'Best Python Library',
      options: ['Django', 'Flask'],
      tags: ['tech', 'python']
    });

    // List all
    const allRes = await request(app).get('/api/polls');
    assert.strictEqual(allRes.body.total, 3);

    // Search by title
    const searchRes = await request(app).get('/api/polls?q=javascript');
    assert.strictEqual(searchRes.body.total, 1);

    // Filter by tag
    const tagRes = await request(app).get('/api/polls?tag=tech');
    assert.strictEqual(tagRes.body.total, 2);

    // Get all tags
    const tagsRes = await request(app).get('/api/tags');
    assert.ok(tagsRes.body.tags.includes('tech'));
    assert.ok(tagsRes.body.tags.includes('food'));
  });
});
