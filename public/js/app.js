/* === Create Poll Form === */
function initCreateForm() {
  const form = document.getElementById('create-form');
  if (!form) return;

  const optionsList = document.getElementById('options-list');
  const addBtn = document.getElementById('add-option');
  const templateCards = document.querySelectorAll('.template-card');

  // Dynamic option adding
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const count = optionsList.querySelectorAll('.option-row').length;
      if (count >= 10) {
        alert('Maximum 10 options allowed');
        return;
      }
      addOptionRow('');
    });
  }

  // Option removal
  optionsList.addEventListener('click', (e) => {
    if (e.target.closest('.option-remove')) {
      const rows = optionsList.querySelectorAll('.option-row');
      if (rows.length <= 2) {
        alert('Minimum 2 options required');
        return;
      }
      e.target.closest('.option-row').remove();
      updateOptionNumbers();
    }
  });

  // Template selection
  templateCards.forEach(card => {
    card.addEventListener('click', () => {
      templateCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const options = JSON.parse(card.dataset.options);
      const templateId = card.dataset.template;

      // Clear existing options
      optionsList.innerHTML = '';

      // Add template options
      options.forEach(opt => addOptionRow(opt));

      // Set template hidden field
      const templateInput = document.getElementById('template-input');
      if (templateInput) templateInput.value = templateId;
    });
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = form.querySelector('#poll-title').value.trim();
    const optionInputs = optionsList.querySelectorAll('.option-input');
    const options = Array.from(optionInputs).map(i => i.value.trim()).filter(v => v);
    const tagsInput = form.querySelector('#poll-tags');
    const tags = tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : [];
    const expiresAt = form.querySelector('#poll-expires') ? form.querySelector('#poll-expires').value : null;
    const template = document.getElementById('template-input') ? document.getElementById('template-input').value : null;

    // Validation
    if (!title) {
      showError('Title is required');
      return;
    }
    if (options.length < 2) {
      showError('At least 2 options are required');
      return;
    }
    if (options.length > 10) {
      showError('Maximum 10 options allowed');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          options,
          tags,
          expiresAt: expiresAt || null,
          template: template || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Failed to create poll');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Poll';
        return;
      }

      // Redirect to the poll vote page
      window.location.href = `/poll/${data.slug}`;
    } catch (err) {
      showError('Network error. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Poll';
    }
  });
}

function addOptionRow(value) {
  const optionsList = document.getElementById('options-list');
  const count = optionsList.querySelectorAll('.option-row').length + 1;

  const row = document.createElement('div');
  row.className = 'option-row';
  row.innerHTML = `
    <input type="text" class="form-input option-input"
           placeholder="Option ${count}" value="${escapeHtml(value)}" maxlength="200">
    <button type="button" class="option-remove" title="Remove option">&times;</button>
  `;
  optionsList.appendChild(row);
}

function updateOptionNumbers() {
  const rows = document.querySelectorAll('.option-row .option-input');
  rows.forEach((input, i) => {
    input.placeholder = `Option ${i + 1}`;
  });
}

/* === Vote Page === */
function initVotePage() {
  const form = document.getElementById('vote-form');
  if (!form) return;

  const options = form.querySelectorAll('.vote-option');

  // Click on label/div selects radio
  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return; // Let radio handle itself
      const radio = opt.querySelector('input[type="radio"]');
      radio.checked = true;
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });

    opt.querySelector('input[type="radio"]').addEventListener('change', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selected = form.querySelector('input[name="optionId"]:checked');
    if (!selected) {
      showError('Please select an option');
      return;
    }

    const slug = form.dataset.slug;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await fetch(`/api/polls/${slug}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: parseInt(selected.value, 10) })
      });

      const data = await res.json();

      if (res.status === 409) {
        window.location.href = `/poll/${slug}/results`;
        return;
      }

      if (res.status === 410) {
        showError('This poll has expired');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Vote';
        return;
      }

      if (!res.ok) {
        showError(data.error || 'Failed to submit vote');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Vote';
        return;
      }

      // Redirect to results
      window.location.href = `/poll/${slug}/results`;
    } catch (err) {
      showError('Network error. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Vote';
    }
  });
}

/* === Results Page === */
function initResultsPage() {
  const bars = document.querySelectorAll('.result-bar');
  if (!bars.length) return;

  // Animate bars on load
  requestAnimationFrame(() => {
    setTimeout(() => {
      bars.forEach(bar => {
        const pct = bar.dataset.percentage;
        bar.style.width = pct + '%';
      });
    }, 100);
  });
}

/* === Share Modal === */
function initShareModal() {
  const openBtn = document.getElementById('share-btn');
  const overlay = document.getElementById('share-modal');
  if (!openBtn || !overlay) return;

  const closeBtn = overlay.querySelector('.modal-close');
  const copyBtn = document.getElementById('copy-link');
  const linkInput = document.getElementById('share-link');
  const feedback = document.getElementById('copy-feedback');

  openBtn.addEventListener('click', () => {
    overlay.classList.add('active');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
    }
  });

  if (copyBtn && linkInput) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(linkInput.value);
        feedback.textContent = 'Copied!';
        setTimeout(() => { feedback.textContent = ''; }, 2000);
      } catch {
        linkInput.select();
        document.execCommand('copy');
        feedback.textContent = 'Copied!';
        setTimeout(() => { feedback.textContent = ''; }, 2000);
      }
    });
  }
}

/* === Search/Filter === */
function initSearch() {
  const searchInput = document.getElementById('search-input');
  const tagFilter = document.getElementById('tag-filter');
  if (!searchInput && !tagFilter) return;

  let debounceTimer;

  function updateList() {
    const q = searchInput ? searchInput.value : '';
    const tag = tagFilter ? tagFilter.value : '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);

    window.location.href = '/?' + params.toString();
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateList, 500);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(debounceTimer);
        updateList();
      }
    });
  }

  if (tagFilter) {
    tagFilter.addEventListener('change', updateList);
  }
}

/* === Utilities === */
function showError(message) {
  let errorDiv = document.querySelector('.form-error-msg');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-msg';
    errorDiv.style.cssText = 'background: rgba(239,68,68,0.1); color: #ef4444; padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; font-size: 0.9rem;';
    const form = document.querySelector('form') || document.querySelector('.card');
    if (form) form.prepend(errorDiv);
  }
  errorDiv.textContent = message;
  setTimeout(() => { if (errorDiv) errorDiv.remove(); }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* === Init === */
document.addEventListener('DOMContentLoaded', () => {
  initCreateForm();
  initVotePage();
  initResultsPage();
  initShareModal();
  initSearch();
});
