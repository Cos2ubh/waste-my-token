require('dotenv').config();
const express = require('express');
const { buildProxy } = require('./proxy');

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ORIGIN_URL || 'https://example.com';

const app = express();

// Log every incoming request so we can see what's hitting the proxy
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`  User-Agent: ${req.headers['user-agent']}`);
  next();
});

// Pass everything through to the origin for now
app.use('/', buildProxy(ORIGIN));

app.listen(PORT, () => {
  console.log(`\nMiddleware proxy running on http://localhost:${PORT}`);
  console.log(`Forwarding all traffic to: ${ORIGIN}\n`);
});
