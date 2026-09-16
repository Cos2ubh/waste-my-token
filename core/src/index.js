require('dotenv').config();
const express = require('express');
const { buildProxy } = require('./proxy');
const { detect } = require('./detect');

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ORIGIN_URL || 'https://example.com';

const app = express();

app.use((req, res, next) => {
  const result = detect(req);

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`  User-Agent : ${req.headers['user-agent']}`);
  console.log(`  Detection  : isAI=${result.isAI} | agent=${result.agentName} | confidence=${result.confidence} | score=${result.score}`);

  // Attach detection result to request for downstream middleware
  req.aiDetection = result;
  next();
});

// Pass everything through to the origin for now
app.use('/', buildProxy(ORIGIN));

app.listen(PORT, () => {
  console.log(`\nMiddleware proxy running on http://localhost:${PORT}`);
  console.log(`Forwarding all traffic to: ${ORIGIN}\n`);
});
