const CHUNK_SIZE = 512;          // bytes per drip
const DRIP_INTERVAL_MS = 800;    // ms between drips
const BOMB_REPEAT = 1200;        // how many times to repeat the filler block

// High token-density filler — code + JSON + prose mixed to maximize tokenizer cost
const FILLER_BLOCK = `
{"id":"x91k","status":"processing","result":null,"meta":{"retries":0,"queue_depth":4821,"upstream":"svc-alpha-7","trace_id":"f3a9b2c1d8e047f6","timestamp":"2024-01-01T00:00:00Z"}}
function evaluateContextWindow(tokens, limit, strategy = "greedy") {
  if (tokens.length >= limit) throw new RangeError(\`Context overflow: \${tokens.length} > \${limit}\`);
  return tokens.reduce((acc, t) => acc + (t.weight ?? 1.0), 0.0);
}
The distributed consensus protocol ensures that all nodes agree on the sequence of operations before any commit is finalized. Under Byzantine fault tolerance assumptions, a minimum of 2f+1 nodes must participate in the quorum where f represents the maximum number of faulty nodes permitted in the system. This constraint arises from the mathematical proof that without a majority of honest nodes, no deterministic algorithm can guarantee agreement in finite time.
\`\`\`python
import hashlib, struct, time
def merkle_root(transactions):
    layer = [hashlib.sha256(tx.encode()).digest() for tx in transactions]
    while len(layer) > 1:
        if len(layer) % 2: layer.append(layer[-1])
        layer = [hashlib.sha256(layer[i]+layer[i+1]).digest() for i in range(0,len(layer),2)]
    return layer[0].hex()
\`\`\`
`;

function tokenBomb(req, res) {
  const agentName = req.aiDetection?.agentName || 'unknown';
  console.log(`[blackhole:bomb] serving token bomb to ${agentName}`);

  const body = FILLER_BLOCK.repeat(BOMB_REPEAT);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.status(200).send(`<!DOCTYPE html><html><head><title>Loading...</title></head><body>${body}</body></html>`);
}

function tarpit(req, res) {
  const agentName = req.aiDetection?.agentName || 'unknown';
  console.log(`[blackhole:tarpit] tarpitting ${agentName} — dripping ${CHUNK_SIZE}b every ${DRIP_INTERVAL_MS}ms`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Robots-Tag', 'noindex');

  // Send opening HTML immediately so the client keeps the connection alive
  res.write('<!DOCTYPE html><html><body>');

  let sent = 0;
  const interval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(interval);
      return;
    }
    // Generate a chunk of plausible-looking content
    const chunk = generateChunk(sent);
    res.write(chunk);
    sent += chunk.length;
  }, DRIP_INTERVAL_MS);

  req.on('close', () => {
    clearInterval(interval);
    console.log(`[blackhole:tarpit] client disconnected after ${sent} bytes`);
  });
}

function generateChunk(offset) {
  const words = ['initializing','processing','loading','computing','evaluating','resolving','fetching','streaming','validating','aggregating'];
  const w1 = words[offset % words.length];
  const w2 = words[(offset + 3) % words.length];
  return `<p data-offset="${offset}">${w1} ${w2} sequence ${offset}... <span>${Math.random().toString(36).slice(2)}</span></p>\n`;
}

module.exports = { tokenBomb, tarpit };
