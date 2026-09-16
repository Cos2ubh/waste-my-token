// Known AI crawler User-Agent signatures
const AI_AGENTS = [
  { name: 'GPTBot',        pattern: /GPTBot/i },
  { name: 'ChatGPT-User',  pattern: /ChatGPT-User/i },
  { name: 'ClaudeBot',     pattern: /ClaudeBot/i },
  { name: 'Claude-Web',    pattern: /Claude-Web/i },
  { name: 'PerplexityBot', pattern: /PerplexityBot/i },
  { name: 'Bytespider',    pattern: /Bytespider/i },
  { name: 'FacebookBot',   pattern: /facebookexternalhit/i },
  { name: 'Applebot',      pattern: /Applebot/i },
  { name: 'GoogleExtended',pattern: /Google-Extended/i },
  { name: 'CCBot',         pattern: /CCBot/i },
  { name: 'Diffbot',       pattern: /Diffbot/i },
  { name: 'ImagesiftBot',  pattern: /ImagesiftBot/i },
  { name: 'OmgiliBot',     pattern: /omgili/i },
  { name: 'YouBot',        pattern: /YouBot/i },
  { name: 'Amazonbot',     pattern: /Amazonbot/i },
];

function matchAgent(ua) {
  for (const agent of AI_AGENTS) {
    if (agent.pattern.test(ua)) return agent.name;
  }
  return null;
}

// Heuristic signals that suggest a non-human client
function behavioralScore(req) {
  let score = 0;
  const ua = req.headers['user-agent'] || '';

  // No Accept-Language header — browsers always send this
  if (!req.headers['accept-language']) score += 2;

  // No Referer header on a non-root path — humans almost always have one
  if (req.path !== '/' && !req.headers['referer']) score += 1;

  // Minimal Accept header — browsers send a long list
  const accept = req.headers['accept'] || '';
  if (accept === '*/*' || accept === '') score += 2;

  // No DNT, Sec-Fetch-*, or other browser-specific headers
  if (!req.headers['sec-fetch-site']) score += 1;

  return score;
}

function detect(req) {
  const ua = req.headers['user-agent'] || '';
  const knownAgent = matchAgent(ua);
  const score = behavioralScore(req);

  return {
    isAI: knownAgent !== null || score >= 4,
    agentName: knownAgent || (score >= 4 ? 'unknown-bot' : null),
    confidence: knownAgent ? 'high' : score >= 4 ? 'medium' : 'low',
    score,
  };
}

module.exports = { detect };
