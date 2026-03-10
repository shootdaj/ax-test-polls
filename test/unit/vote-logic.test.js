const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Store } = require('../../src/store');

describe('Vote Logic', () => {
  let store;

  beforeEach(() => {
    store = new Store();
  });

  describe('Vote Deduplication', () => {
    it('tracks vote by poll+visitor combination', () => {
      const poll = store.createPoll({ title: 'Test', options: ['A', 'B'] });
      store.vote(poll.slug, 0, 'visitor-1');

      assert.strictEqual(store.hasVoted(poll.slug, 'visitor-1'), true);
      assert.strictEqual(store.hasVoted(poll.slug, 'visitor-2'), false);
    });

    it('allows same visitor to vote on different polls', () => {
      const poll1 = store.createPoll({ title: 'Poll 1', options: ['A', 'B'] });
      const poll2 = store.createPoll({ title: 'Poll 2', options: ['C', 'D'] });

      store.vote(poll1.slug, 0, 'visitor-1');
      // Should NOT throw for a different poll
      store.vote(poll2.slug, 1, 'visitor-1');

      assert.strictEqual(store.hasVoted(poll1.slug, 'visitor-1'), true);
      assert.strictEqual(store.hasVoted(poll2.slug, 'visitor-1'), true);
    });

    it('duplicate vote error has DUPLICATE code', () => {
      const poll = store.createPoll({ title: 'Test', options: ['A', 'B'] });
      store.vote(poll.slug, 0, 'visitor-1');

      try {
        store.vote(poll.slug, 1, 'visitor-1');
        assert.fail('Should have thrown');
      } catch (err) {
        assert.strictEqual(err.code, 'DUPLICATE');
      }
    });
  });

  describe('Expiration Logic', () => {
    it('poll with null expiresAt never expires', () => {
      const poll = store.createPoll({
        title: 'Forever Poll',
        options: ['A', 'B'],
        expiresAt: null
      });

      assert.strictEqual(store.isExpired(poll), false);
    });

    it('poll expires exactly at expiration time', () => {
      const now = new Date();
      const poll = store.createPoll({
        title: 'Expiring Now',
        options: ['A', 'B'],
        expiresAt: now.toISOString()
      });

      // At or past the expiration time => expired
      assert.strictEqual(store.isExpired(poll), true);
    });

    it('expired poll error has EXPIRED code', () => {
      const poll = store.createPoll({
        title: 'Expired',
        options: ['A', 'B'],
        expiresAt: new Date(Date.now() - 1000).toISOString()
      });

      try {
        store.vote(poll.slug, 0, 'visitor-1');
        assert.fail('Should have thrown');
      } catch (err) {
        assert.strictEqual(err.code, 'EXPIRED');
      }
    });

    it('results include expired flag', () => {
      const poll = store.createPoll({
        title: 'Expired Poll',
        options: ['A', 'B'],
        expiresAt: new Date(Date.now() - 1000).toISOString()
      });

      const results = store.getResults(poll.slug);
      assert.strictEqual(results.expired, true);
    });

    it('active poll results show not expired', () => {
      const poll = store.createPoll({
        title: 'Active Poll',
        options: ['A', 'B'],
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      });

      const results = store.getResults(poll.slug);
      assert.strictEqual(results.expired, false);
    });
  });

  describe('Results Computation', () => {
    it('computes correct percentages for even split', () => {
      const poll = store.createPoll({
        title: 'Even Split',
        options: ['A', 'B']
      });

      store.vote(poll.slug, 0, 'v1');
      store.vote(poll.slug, 1, 'v2');

      const results = store.getResults(poll.slug);
      assert.strictEqual(results.options[0].percentage, 50);
      assert.strictEqual(results.options[1].percentage, 50);
    });

    it('computes correct percentages for uneven split', () => {
      const poll = store.createPoll({
        title: 'Uneven',
        options: ['A', 'B', 'C']
      });

      store.vote(poll.slug, 0, 'v1');
      store.vote(poll.slug, 0, 'v2');
      store.vote(poll.slug, 0, 'v3');
      store.vote(poll.slug, 1, 'v4');

      const results = store.getResults(poll.slug);
      assert.strictEqual(results.options[0].percentage, 75);
      assert.strictEqual(results.options[1].percentage, 25);
      assert.strictEqual(results.options[2].percentage, 0);
    });

    it('includes all options in results even with zero votes', () => {
      const poll = store.createPoll({
        title: 'No Votes',
        options: ['A', 'B', 'C', 'D']
      });

      const results = store.getResults(poll.slug);
      assert.strictEqual(results.options.length, 4);
      results.options.forEach(opt => {
        assert.strictEqual(opt.votes, 0);
        assert.strictEqual(opt.percentage, 0);
      });
    });

    it('results include poll metadata', () => {
      const poll = store.createPoll({
        title: 'Metadata Test',
        options: ['X', 'Y'],
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      });

      const results = store.getResults(poll.slug);
      assert.strictEqual(results.title, 'Metadata Test');
      assert.strictEqual(results.slug, poll.slug);
      assert.ok(results.expiresAt);
      assert.strictEqual(results.expired, false);
    });
  });
});
