// Per-agent mode configuration.
// Modes: BLACKHOLE | TARPIT | WHITEHOLE | NORMAL
// BLACKHOLE — token bomb (fills context window instantly)
// TARPIT    — slow drip (burns time, never completes)
// WHITEHOLE — clean stripped feed (for authorized/paying agents)
// NORMAL    — pass through to origin (same as a human visit)

const defaultRules = {
  GPTBot:         'BLACKHOLE',
  'ChatGPT-User': 'BLACKHOLE',
  ClaudeBot:      'BLACKHOLE',
  'Claude-Web':   'BLACKHOLE',
  PerplexityBot:  'TARPIT',
  Bytespider:     'BLACKHOLE',
  CCBot:          'BLACKHOLE',
  Diffbot:        'TARPIT',
  GoogleExtended: 'NORMAL',    // Google gets normal — you may want search indexing
  Applebot:       'NORMAL',
  'unknown-bot':  'TARPIT',
};

function getModeForAgent(agentName) {
  if (!agentName) return 'NORMAL';
  return defaultRules[agentName] ?? 'BLACKHOLE'; // unknown named agents get bombed
}

module.exports = { getModeForAgent, defaultRules };
