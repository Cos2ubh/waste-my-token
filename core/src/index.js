require('dotenv').config();
const express = require('express');
const { buildProxy } = require('./proxy');
const { detect } = require('./detect');
const { tokenBomb, tarpit } = require('./modes/blackhole');
const { whitehole } = require('./modes/whithole');
const { getModeForAgent } = require('./config');

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ORIGIN_URL || 'https://example.com';

const app = express();

app.use((req, res, next) => {
  const result = detect(req);
  const mode = result.isAI ? getModeForAgent(result.agentName) : 'NORMAL';

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`  User-Agent : ${req.headers['user-agent']}`);
  console.log(`  Detection  : isAI=${result.isAI} | agent=${result.agentName} | confidence=${result.confidence}`);
  console.log(`  Mode       : ${mode}`);

  req.aiDetection = result;

  if (mode === 'BLACKHOLE') return tokenBomb(req, res);
  if (mode === 'TARPIT')    return tarpit(req, res);
  if (mode === 'WHITEHOLE') return whitehole(req, res, null);

  next(); // NORMAL — fall through to proxy
});

// Only NORMAL visitors reach the origin
app.use('/', buildProxy(ORIGIN));

app.listen(PORT, () => {
  console.log(`\nMiddleware proxy running on http://localhost:${PORT}`);
  console.log(`Forwarding all traffic to: ${ORIGIN}\n`);
});
