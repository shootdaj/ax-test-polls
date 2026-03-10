const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');
const { store } = require('../../src/store');

describe('Discovery & Polish Scenarios', () => {
  beforeEach(() => {
    store.clear();
  });

  it('complete discovery flow: create -> list -> search -> filter -> share', async () => {
    // Create several polls with different tags
    const poll1 = await request(app).post('/api/polls').send({
      title: 'Best Programming Language',
      options: ['JavaScript', 'Python', 'Rust'],
      tags: ['tech', 'programming']
    });

    const poll2 = await request(app).post('/api/polls').send({
      title: 'Favorite Pizza',
      options: ['Pepperoni', 'Mushroom', 'Hawaiian'],
      tags: ['food']
    });

    await request(app).post('/api/polls').send({
      title: 'Best Frontend Framework',
      options: ['React', 'Vue', 'Svelte'],
      tags: ['tech', 'frontend']
    });

    // Step 1: Browse all polls
    const allRes = await request(app).get('/');
    assert.ok(allRes.text.includes('Best Programming Language'));
    assert.ok(allRes.text.includes('Favorite Pizza'));
    assert.ok(allRes.text.includes('Best Frontend Framework'));

    // Step 2: Search for "programming"
    const searchRes = await request(app).get('/?q=programming');
    assert.ok(searchRes.text.includes('Best Programming Language'));
    assert.ok(!searchRes.text.includes('Favorite Pizza'));

    // Step 3: Filter by "tech" tag
    const tagRes = await request(app).get('/?tag=tech');
    assert.ok(tagRes.text.includes('Best Programming Language'));
    assert.ok(tagRes.text.includes('Best Frontend Framework'));
    assert.ok(!tagRes.text.includes('Favorite Pizza'));

    // Step 4: View a poll and share it
    const slug1 = poll1.body.slug;
    const pollPage = await request(app).get(`/poll/${slug1}`);
    assert.ok(pollPage.text.includes('share-modal'));
    assert.ok(pollPage.text.includes(`/poll/${slug1}`));
  });

  it('template flow: select template -> create poll -> vote -> results', async () => {
    // Step 1: View templates on create page
    const createPage = await request(app).get('/create');
    assert.ok(createPage.text.includes('Yes / No'));
    assert.ok(createPage.text.includes('data-template'));

    // Step 2: Create poll with rating template
    const createRes = await request(app)
      .post('/api/polls')
      .send({
        title: 'Rate our customer service',
        options: ['1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'],
        template: 'rating',
        tags: ['feedback']
      });

    assert.strictEqual(createRes.status, 201);
    const { slug } = createRes.body;

    // Step 3: Vote
    await request(app)
      .post(`/api/polls/${slug}/vote`)
      .set('Cookie', 'poll_voter_id=customer1')
      .send({ optionId: 4 }); // 5 - Excellent

    await request(app)
      .post(`/api/polls/${slug}/vote`)
      .set('Cookie', 'poll_voter_id=customer2')
      .send({ optionId: 3 }); // 4 - Very Good

    // Step 4: Check results
    const resultsPage = await request(app).get(`/poll/${slug}/results`);
    assert.ok(resultsPage.text.includes('Rate our customer service'));
    assert.ok(resultsPage.text.includes('2 total votes'));

    // Step 5: Verify in listing
    const listRes = await request(app).get('/?tag=feedback');
    assert.ok(listRes.text.includes('Rate our customer service'));
    assert.ok(listRes.text.includes('2 votes'));
  });

  it('pagination works on listing page', async () => {
    // Create enough polls to trigger pagination
    for (let i = 0; i < 25; i++) {
      await request(app).post('/api/polls').send({
        title: `Poll ${i + 1}`,
        options: ['A', 'B']
      });
    }

    // Page 1 should have 20 polls
    const page1 = await request(app).get('/');
    assert.ok(page1.text.includes('Page 1 of 2'));
    assert.ok(page1.text.includes('Next'));

    // Page 2 should have 5 polls
    const page2 = await request(app).get('/?page=2');
    assert.ok(page2.text.includes('Page 2 of 2'));
    assert.ok(page2.text.includes('Previous'));
  });

  it('combined search and tag filter', async () => {
    await request(app).post('/api/polls').send({
      title: 'JavaScript Best Practices',
      options: ['A', 'B'],
      tags: ['tech']
    });

    await request(app).post('/api/polls').send({
      title: 'JavaScript Frameworks',
      options: ['A', 'B'],
      tags: ['tech']
    });

    await request(app).post('/api/polls').send({
      title: 'Best JavaScript Food',
      options: ['A', 'B'],
      tags: ['food']
    });

    // API supports combined search+tag
    const apiRes = await request(app).get('/api/polls?q=javascript&tag=tech');
    assert.strictEqual(apiRes.body.total, 2);
  });
});
