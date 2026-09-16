function whitehole(req, res, originContent) {
  const agentName = req.aiDetection?.agentName || 'unknown';
  console.log(`[whitehole] serving clean feed to ${agentName}`);

  // If we have origin content, strip it down to bare text
  // Otherwise serve a structured stub
  const content = originContent
    ? stripToText(originContent)
    : { status: 'ok', message: 'Authorized AI access. Content served at minimal token cost.' };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Middleware-Mode', 'whitehole');
  res.status(200).json({
    agent: agentName,
    mode: 'whitehole',
    content,
    tokenHint: 'This response is optimized for minimal token consumption.',
  });
}

// Strip HTML to plain text — removes all tags, collapses whitespace
function stripToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000); // hard cap — keeps the response token-cheap
}

module.exports = { whitehole };
