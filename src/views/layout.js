/**
 * Base HTML layout wrapper
 */
function layout(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Polls</title>
  <link rel="stylesheet" href="/public/css/style.css">
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a href="/" class="nav-brand">Polls</a>
      <ul class="nav-links">
        <li><a href="/">Browse</a></li>
        <li><a href="/create">Create</a></li>
      </ul>
    </div>
  </nav>
  <div class="container">
    ${content}
  </div>
  <script src="/public/js/app.js"></script>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { layout, escapeHtml };
