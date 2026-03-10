const { v4: uuidv4 } = require('uuid');

/**
 * In-memory data store for polls.
 *
 * Data structures:
 * - polls: Map<pollId, PollObject>
 * - slugIndex: Map<slug, pollId>
 * - votes: Map<"pollId:visitorId", true>
 */

class Store {
  constructor() {
    this.polls = new Map();
    this.slugIndex = new Map();
    this.votes = new Map();
  }

  /**
   * Generate a URL-friendly slug from a title
   */
  generateSlug(title) {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 40)
      .replace(/^-|-$/g, '');

    const suffix = uuidv4().substring(0, 8);
    return `${base}-${suffix}`;
  }

  /**
   * Create a new poll
   * @param {Object} data - { title, options, tags, expiresAt, template }
   * @returns {Object} Created poll
   */
  createPoll({ title, options, tags = [], expiresAt = null, template = null }) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
      throw new Error('Options must be an array with 2-10 items');
    }
    for (const opt of options) {
      if (!opt || typeof opt !== 'string' || opt.trim().length === 0) {
        throw new Error('Each option must be a non-empty string');
      }
    }

    const id = uuidv4();
    const slug = this.generateSlug(title);

    const poll = {
      id,
      slug,
      title: title.trim(),
      options: options.map((text, index) => ({
        id: index,
        text: text.trim(),
        votes: 0
      })),
      tags: tags.filter(t => typeof t === 'string' && t.trim().length > 0).map(t => t.trim().toLowerCase()),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      template: template || null,
      totalVotes: 0,
      createdAt: new Date().toISOString()
    };

    this.polls.set(id, poll);
    this.slugIndex.set(slug, id);

    return poll;
  }

  /**
   * Get a poll by its slug
   * @param {string} slug
   * @returns {Object|null} Poll or null
   */
  getBySlug(slug) {
    const id = this.slugIndex.get(slug);
    if (!id) return null;
    return this.polls.get(id) || null;
  }

  /**
   * Get a poll by its ID
   * @param {string} id
   * @returns {Object|null}
   */
  getById(id) {
    return this.polls.get(id) || null;
  }

  /**
   * Check if a poll has expired
   * @param {Object} poll
   * @returns {boolean}
   */
  isExpired(poll) {
    if (!poll.expiresAt) return false;
    return new Date(poll.expiresAt) <= new Date();
  }

  /**
   * Record a vote
   * @param {string} slug - Poll slug
   * @param {number} optionId - Option index
   * @param {string} visitorId - Visitor identifier
   * @returns {Object} Updated poll
   */
  vote(slug, optionId, visitorId) {
    const poll = this.getBySlug(slug);
    if (!poll) throw new Error('Poll not found');

    if (this.isExpired(poll)) {
      const err = new Error('Poll has expired');
      err.code = 'EXPIRED';
      throw err;
    }

    const voteKey = `${poll.id}:${visitorId}`;
    if (this.votes.has(voteKey)) {
      const err = new Error('Already voted');
      err.code = 'DUPLICATE';
      throw err;
    }

    if (optionId < 0 || optionId >= poll.options.length) {
      throw new Error('Invalid option');
    }

    poll.options[optionId].votes += 1;
    poll.totalVotes += 1;
    this.votes.set(voteKey, true);

    return poll;
  }

  /**
   * Check if a visitor has voted on a poll
   */
  hasVoted(slug, visitorId) {
    const poll = this.getBySlug(slug);
    if (!poll) return false;
    return this.votes.has(`${poll.id}:${visitorId}`);
  }

  /**
   * Get results for a poll
   * @param {string} slug
   * @returns {Object} Results with counts and percentages
   */
  getResults(slug) {
    const poll = this.getBySlug(slug);
    if (!poll) return null;

    return {
      id: poll.id,
      slug: poll.slug,
      title: poll.title,
      totalVotes: poll.totalVotes,
      expired: this.isExpired(poll),
      expiresAt: poll.expiresAt,
      options: poll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt.votes,
        percentage: poll.totalVotes > 0
          ? Math.round((opt.votes / poll.totalVotes) * 100)
          : 0
      }))
    };
  }

  /**
   * List polls with optional search and tag filter
   * @param {Object} params - { q, tag, page, limit }
   * @returns {Object} { polls, total, page, totalPages }
   */
  list({ q = '', tag = '', page = 1, limit = 20 } = {}) {
    let results = Array.from(this.polls.values());

    // Filter by search query
    if (q) {
      const query = q.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(query)
      );
    }

    // Filter by tag
    if (tag) {
      const tagLower = tag.toLowerCase();
      results = results.filter(p =>
        p.tags.includes(tagLower)
      );
    }

    // Sort by creation date (newest first)
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return {
      polls: paginatedResults.map(p => ({
        slug: p.slug,
        title: p.title,
        tags: p.tags,
        totalVotes: p.totalVotes,
        expired: this.isExpired(p),
        expiresAt: p.expiresAt,
        optionCount: p.options.length,
        createdAt: p.createdAt
      })),
      total,
      page,
      totalPages
    };
  }

  /**
   * Get all unique tags across all polls
   */
  getAllTags() {
    const tagSet = new Set();
    for (const poll of this.polls.values()) {
      for (const tag of poll.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }

  /**
   * Clear all data (useful for testing)
   */
  clear() {
    this.polls.clear();
    this.slugIndex.clear();
    this.votes.clear();
  }
}

// Singleton instance
const store = new Store();

module.exports = { Store, store };
