const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Store } = require('../../src/store');

describe('Store', () => {
  let store;

  beforeEach(() => {
    store = new Store();
  });

  describe('createPoll', () => {
    it('creates a poll with valid data', () => {
      const poll = store.createPoll({
        title: 'Favorite Color',
        options: ['Red', 'Blue', 'Green']
      });

      assert.ok(poll.id);
      assert.ok(poll.slug);
      assert.strictEqual(poll.title, 'Favorite Color');
      assert.strictEqual(poll.options.length, 3);
      assert.strictEqual(poll.options[0].text, 'Red');
      assert.strictEqual(poll.options[0].votes, 0);
      assert.strictEqual(poll.totalVotes, 0);
      assert.ok(poll.createdAt);
    });

    it('generates a slug from the title', () => {
      const poll = store.createPoll({
        title: 'My Awesome Poll!',
        options: ['Yes', 'No']
      });

      assert.ok(poll.slug.startsWith('my-awesome-poll'));
    });

    it('stores tags as lowercase', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B'],
        tags: ['Technology', 'FUN']
      });

      assert.deepStrictEqual(poll.tags, ['technology', 'fun']);
    });

    it('stores expiration date as ISO string', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B'],
        expiresAt: future
      });

      assert.strictEqual(poll.expiresAt, future);
    });

    it('rejects poll with no title', () => {
      assert.throws(() => {
        store.createPoll({ title: '', options: ['A', 'B'] });
      }, /Title is required/);
    });

    it('rejects poll with fewer than 2 options', () => {
      assert.throws(() => {
        store.createPoll({ title: 'Test', options: ['Only one'] });
      }, /Options must be an array with 2-10 items/);
    });

    it('rejects poll with more than 10 options', () => {
      const options = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);
      assert.throws(() => {
        store.createPoll({ title: 'Test', options });
      }, /Options must be an array with 2-10 items/);
    });

    it('rejects poll with empty option strings', () => {
      assert.throws(() => {
        store.createPoll({ title: 'Test', options: ['A', ''] });
      }, /Each option must be a non-empty string/);
    });
  });

  describe('getBySlug', () => {
    it('returns poll by slug', () => {
      const created = store.createPoll({
        title: 'Test',
        options: ['A', 'B']
      });

      const found = store.getBySlug(created.slug);
      assert.strictEqual(found.id, created.id);
    });

    it('returns null for unknown slug', () => {
      assert.strictEqual(store.getBySlug('nonexistent'), null);
    });
  });

  describe('isExpired', () => {
    it('returns false for poll with no expiration', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B']
      });

      assert.strictEqual(store.isExpired(poll), false);
    });

    it('returns false for poll with future expiration', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B'],
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      });

      assert.strictEqual(store.isExpired(poll), false);
    });

    it('returns true for poll with past expiration', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B'],
        expiresAt: new Date(Date.now() - 1000).toISOString()
      });

      assert.strictEqual(store.isExpired(poll), true);
    });
  });

  describe('vote', () => {
    it('records a vote and increments counts', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B']
      });

      const updated = store.vote(poll.slug, 0, 'visitor-1');
      assert.strictEqual(updated.options[0].votes, 1);
      assert.strictEqual(updated.totalVotes, 1);
    });

    it('prevents duplicate votes from same visitor', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B']
      });

      store.vote(poll.slug, 0, 'visitor-1');
      assert.throws(() => {
        store.vote(poll.slug, 1, 'visitor-1');
      }, /Already voted/);
    });

    it('allows different visitors to vote', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B']
      });

      store.vote(poll.slug, 0, 'visitor-1');
      store.vote(poll.slug, 1, 'visitor-2');

      const results = store.getResults(poll.slug);
      assert.strictEqual(results.totalVotes, 2);
    });

    it('rejects vote on expired poll', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B'],
        expiresAt: new Date(Date.now() - 1000).toISOString()
      });

      assert.throws(() => {
        store.vote(poll.slug, 0, 'visitor-1');
      }, /Poll has expired/);
    });

    it('rejects vote with invalid option', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B']
      });

      assert.throws(() => {
        store.vote(poll.slug, 5, 'visitor-1');
      }, /Invalid option/);
    });

    it('throws for nonexistent poll', () => {
      assert.throws(() => {
        store.vote('nonexistent', 0, 'visitor-1');
      }, /Poll not found/);
    });
  });

  describe('getResults', () => {
    it('returns results with percentages', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B', 'C']
      });

      store.vote(poll.slug, 0, 'v1');
      store.vote(poll.slug, 0, 'v2');
      store.vote(poll.slug, 1, 'v3');

      const results = store.getResults(poll.slug);
      assert.strictEqual(results.totalVotes, 3);
      assert.strictEqual(results.options[0].percentage, 67);
      assert.strictEqual(results.options[1].percentage, 33);
      assert.strictEqual(results.options[2].percentage, 0);
    });

    it('returns 0% for polls with no votes', () => {
      const poll = store.createPoll({
        title: 'Test',
        options: ['A', 'B']
      });

      const results = store.getResults(poll.slug);
      assert.strictEqual(results.options[0].percentage, 0);
    });

    it('returns null for nonexistent poll', () => {
      assert.strictEqual(store.getResults('nonexistent'), null);
    });
  });

  describe('list', () => {
    it('returns all polls', () => {
      store.createPoll({ title: 'Poll 1', options: ['A', 'B'] });
      store.createPoll({ title: 'Poll 2', options: ['C', 'D'] });

      const result = store.list();
      assert.strictEqual(result.total, 2);
      assert.strictEqual(result.polls.length, 2);
    });

    it('filters by search query', () => {
      store.createPoll({ title: 'Favorite Color', options: ['A', 'B'] });
      store.createPoll({ title: 'Best Movie', options: ['C', 'D'] });

      const result = store.list({ q: 'color' });
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.polls[0].title, 'Favorite Color');
    });

    it('filters by tag', () => {
      store.createPoll({ title: 'P1', options: ['A', 'B'], tags: ['tech'] });
      store.createPoll({ title: 'P2', options: ['C', 'D'], tags: ['food'] });

      const result = store.list({ tag: 'tech' });
      assert.strictEqual(result.total, 1);
    });

    it('paginates results', () => {
      for (let i = 0; i < 5; i++) {
        store.createPoll({ title: `Poll ${i}`, options: ['A', 'B'] });
      }

      const result = store.list({ page: 1, limit: 2 });
      assert.strictEqual(result.polls.length, 2);
      assert.strictEqual(result.total, 5);
      assert.strictEqual(result.totalPages, 3);
    });
  });

  describe('getAllTags', () => {
    it('returns unique sorted tags', () => {
      store.createPoll({ title: 'P1', options: ['A', 'B'], tags: ['beta', 'alpha'] });
      store.createPoll({ title: 'P2', options: ['C', 'D'], tags: ['alpha', 'gamma'] });

      const tags = store.getAllTags();
      assert.deepStrictEqual(tags, ['alpha', 'beta', 'gamma']);
    });
  });

  describe('hasVoted', () => {
    it('returns false before voting', () => {
      const poll = store.createPoll({ title: 'Test', options: ['A', 'B'] });
      assert.strictEqual(store.hasVoted(poll.slug, 'visitor-1'), false);
    });

    it('returns true after voting', () => {
      const poll = store.createPoll({ title: 'Test', options: ['A', 'B'] });
      store.vote(poll.slug, 0, 'visitor-1');
      assert.strictEqual(store.hasVoted(poll.slug, 'visitor-1'), true);
    });
  });

  describe('clear', () => {
    it('removes all data', () => {
      store.createPoll({ title: 'Test', options: ['A', 'B'] });
      store.clear();
      assert.strictEqual(store.list().total, 0);
    });
  });
});
