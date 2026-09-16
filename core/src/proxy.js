const { createProxyMiddleware } = require('http-proxy-middleware');

function buildProxy(target) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error('[proxy error]', err.message);
        res.status(502).send('Bad gateway — could not reach origin.');
      },
    },
  });
}

module.exports = { buildProxy };
