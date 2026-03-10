const { layout, escapeHtml } = require('./layout');

/**
 * Home / Poll Listing page
 */
function homePage({ polls, total, page, totalPages, q, tag, allTags }) {
  const tagOptions = allTags.map(t =>
    `<option value="${escapeHtml(t)}" ${tag === t ? 'selected' : ''}>${escapeHtml(t)}</option>`
  ).join('');

  const pollItems = polls.length > 0 ? polls.map(p => `
    <a href="/poll/${escapeHtml(p.slug)}" class="poll-item">
      <div class="poll-item-title">${escapeHtml(p.title)}</div>
      <div class="poll-item-meta">
        <span>${p.totalVotes} vote${p.totalVotes !== 1 ? 's' : ''}</span>
        <span>${p.optionCount} options</span>
        ${p.expired
          ? '<span class="badge-expired">Expired</span>'
          : '<span class="badge-active">Active</span>'}
        ${p.tags.length > 0 ? `<span class="tags">${p.tags.map(t =>
          `<span class="tag">${escapeHtml(t)}</span>`
        ).join('')}</span>` : ''}
      </div>
    </a>
  `).join('') : '<div class="empty-state"><p>No polls found.</p><p><a href="/create" class="btn btn-primary mt-2">Create one</a></p></div>';

  const pagination = totalPages > 1 ? `
    <div class="flex-between mt-2">
      ${page > 1 ? `<a href="/?page=${page - 1}${q ? '&q=' + encodeURIComponent(q) : ''}${tag ? '&tag=' + encodeURIComponent(tag) : ''}" class="btn btn-secondary btn-sm">Previous</a>` : '<span></span>'}
      <span>Page ${page} of ${totalPages}</span>
      ${page < totalPages ? `<a href="/?page=${page + 1}${q ? '&q=' + encodeURIComponent(q) : ''}${tag ? '&tag=' + encodeURIComponent(tag) : ''}" class="btn btn-secondary btn-sm">Next</a>` : '<span></span>'}
    </div>
  ` : '';

  return layout('Browse Polls', `
    <h1>Polls</h1>
    <p class="subtitle">Browse and vote on polls, or create your own.</p>

    <div class="search-bar">
      <input type="text" id="search-input" class="form-input"
             placeholder="Search polls..." value="${escapeHtml(q || '')}">
      <select id="tag-filter" class="form-select" style="max-width: 180px;">
        <option value="">All tags</option>
        ${tagOptions}
      </select>
      <a href="/create" class="btn btn-primary">+ Create Poll</a>
    </div>

    <div class="poll-list">
      ${pollItems}
    </div>

    ${pagination}
  `);
}

/**
 * Create Poll page
 */
function createPage({ templates }) {
  const templateCards = templates.map(t => `
    <div class="template-card" data-template="${escapeHtml(t.id)}"
         data-options='${JSON.stringify(t.options)}'>
      <div class="template-name">${escapeHtml(t.name)}</div>
      <div class="template-options">${t.options.join(', ')}</div>
    </div>
  `).join('');

  return layout('Create Poll', `
    <h1>Create a Poll</h1>
    <p class="subtitle">Set up your question and options.</p>

    <div class="card">
      <h2>Quick Start Templates</h2>
      <div class="templates-grid">
        ${templateCards}
      </div>
    </div>

    <div class="card">
      <form id="create-form">
        <input type="hidden" id="template-input" value="">

        <div class="form-group">
          <label class="form-label" for="poll-title">Question</label>
          <input type="text" id="poll-title" class="form-input"
                 placeholder="What would you like to ask?" maxlength="300" required>
        </div>

        <div class="form-group">
          <label class="form-label">Options</label>
          <div id="options-list" class="options-list">
            <div class="option-row">
              <input type="text" class="form-input option-input"
                     placeholder="Option 1" maxlength="200">
              <button type="button" class="option-remove" title="Remove">&times;</button>
            </div>
            <div class="option-row">
              <input type="text" class="form-input option-input"
                     placeholder="Option 2" maxlength="200">
              <button type="button" class="option-remove" title="Remove">&times;</button>
            </div>
          </div>
          <button type="button" id="add-option" class="btn btn-secondary btn-sm add-option-btn">
            + Add Option
          </button>
        </div>

        <div class="form-group">
          <label class="form-label" for="poll-tags">Tags (comma-separated, optional)</label>
          <input type="text" id="poll-tags" class="form-input"
                 placeholder="e.g. tech, fun, food">
        </div>

        <div class="form-group">
          <label class="form-label" for="poll-expires">Expires (optional)</label>
          <input type="datetime-local" id="poll-expires" class="form-input">
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
          Create Poll
        </button>
      </form>
    </div>
  `);
}

/**
 * Vote page
 */
function votePage({ poll, hasVoted, baseUrl }) {
  if (hasVoted) {
    return layout(poll.title, `
      <div class="card">
        <h1>${escapeHtml(poll.title)}</h1>
        <p class="subtitle">You have already voted on this poll.</p>
        <a href="/poll/${escapeHtml(poll.slug)}/results" class="btn btn-primary">View Results</a>
      </div>
    `);
  }

  if (poll.expired) {
    return layout(poll.title, `
      <div class="card">
        <h1>${escapeHtml(poll.title)}</h1>
        <div class="mb-2">
          <span class="badge-expired">Expired</span>
        </div>
        <p class="subtitle">This poll has expired and is no longer accepting votes.</p>
        <a href="/poll/${escapeHtml(poll.slug)}/results" class="btn btn-primary">View Results</a>
      </div>
    `);
  }

  const optionItems = poll.options.map((opt, i) => `
    <label class="vote-option">
      <input type="radio" name="optionId" value="${i}">
      <span>${escapeHtml(opt.text)}</span>
    </label>
  `).join('');

  const shareUrl = `${baseUrl}/poll/${poll.slug}`;

  return layout(poll.title, `
    <div class="card">
      <div class="flex-between mb-2">
        <h1>${escapeHtml(poll.title)}</h1>
        <button id="share-btn" class="btn btn-secondary btn-sm">Share</button>
      </div>

      ${poll.tags && poll.tags.length > 0 ? `
        <div class="tags mb-2">
          ${poll.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      ` : ''}

      ${poll.expiresAt ? `<p class="subtitle">Expires: ${new Date(poll.expiresAt).toLocaleString()}</p>` : ''}

      <form id="vote-form" data-slug="${escapeHtml(poll.slug)}">
        <div class="vote-options">
          ${optionItems}
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">
          Submit Vote
        </button>
      </form>
    </div>

    <div id="share-modal" class="modal-overlay">
      <div class="modal">
        <div class="flex-between mb-2">
          <h2>Share this poll</h2>
          <button class="modal-close btn btn-secondary btn-sm">&times;</button>
        </div>
        <div class="share-link-container">
          <input type="text" id="share-link" class="share-link-input"
                 value="${escapeHtml(shareUrl)}" readonly>
          <button id="copy-link" class="btn btn-primary btn-sm">Copy</button>
        </div>
        <div id="copy-feedback" class="copy-feedback"></div>
      </div>
    </div>
  `);
}

/**
 * Results page
 */
function resultsPage({ results, baseUrl }) {
  const maxVotes = Math.max(...results.options.map(o => o.votes), 1);

  const resultItems = results.options.map(opt => {
    const isWinner = opt.votes === maxVotes && opt.votes > 0;
    return `
      <div class="result-item">
        <div class="result-header">
          <span class="result-text">${escapeHtml(opt.text)}</span>
          <span class="result-stats">${opt.votes} vote${opt.votes !== 1 ? 's' : ''} (${opt.percentage}%)</span>
        </div>
        <div class="result-bar-bg">
          <div class="result-bar ${isWinner ? 'winner' : ''}"
               data-percentage="${opt.percentage}"></div>
        </div>
      </div>
    `;
  }).join('');

  const shareUrl = `${baseUrl}/poll/${results.slug}`;

  return layout(`Results: ${results.title}`, `
    <div class="card">
      <div class="flex-between mb-2">
        <h1>${escapeHtml(results.title)}</h1>
        <button id="share-btn" class="btn btn-secondary btn-sm">Share</button>
      </div>

      ${results.expired ? '<span class="badge-expired mb-2" style="display:inline-block;">Expired</span>' : ''}

      <div class="results-list">
        ${resultItems}
      </div>

      <div class="total-votes">
        ${results.totalVotes} total vote${results.totalVotes !== 1 ? 's' : ''}
      </div>

      <div class="mt-2 text-center">
        ${!results.expired ? `<a href="/poll/${escapeHtml(results.slug)}" class="btn btn-secondary">Vote</a>` : ''}
        <a href="/" class="btn btn-secondary">Browse Polls</a>
      </div>
    </div>

    <div id="share-modal" class="modal-overlay">
      <div class="modal">
        <div class="flex-between mb-2">
          <h2>Share this poll</h2>
          <button class="modal-close btn btn-secondary btn-sm">&times;</button>
        </div>
        <div class="share-link-container">
          <input type="text" id="share-link" class="share-link-input"
                 value="${escapeHtml(shareUrl)}" readonly>
          <button id="copy-link" class="btn btn-primary btn-sm">Copy</button>
        </div>
        <div id="copy-feedback" class="copy-feedback"></div>
      </div>
    </div>
  `);
}

module.exports = { homePage, createPage, votePage, resultsPage };
