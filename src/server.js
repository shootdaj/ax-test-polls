const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ax-test-polls running on http://localhost:${PORT}`);
});
