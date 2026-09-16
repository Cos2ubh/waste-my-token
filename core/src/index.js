require('dotenv').config();
const express = require('express');
const { buildProxy } = require('./proxy');
const { detect } = require('./detect');
const { tokenBomb, tarpit } = require('./modes/blackhole');

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ORIGIN_URL || 'https://example.com';
// BLACKHOLE or TARPIT — swap to test each mode
const AI_MODE = process.env.AI_MODE || 'BLACKHOLE';

const app = express();

app.use((req, res, next) => {
  const result = detect(req);

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`  User-Agent : ${req.headers['user-agent']}`);
  console.log(`  Detection  : isAI=${result.isAI} | agent=${result.agentName} | confidence=${result.confidence} | score=${result.score}`);

  req.aiDetection = result;

  if (result.isAI) {
    console.log(`  Action     : ${AI_MODE}`);
    if (AI_MODE === 'TARPIT') return tarpit(req, res);
    return tokenBomb(req, res);
  }

  next();
});

// Only humans reach the origin
app.use('/', buildProxy(ORIGIN));

app.listen(PORT, () => {
  console.log(`\nMiddleware proxy running on http://localhost:${PORT}`);
  console.log(`Forwarding all traffic to: ${ORIGIN}\n`);
});
