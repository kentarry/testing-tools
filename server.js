/**
 * ═══════════════════════════════════════════════════
 * AI 自動改財產 — 本地 CORS 代理伺服器
 * 解決瀏覽器 CORS 限制，讓前端可直接呼叫遊戲 API
 * Usage: node server.js  →  http://localhost:8787
 * ═══════════════════════════════════════════════════
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 8787;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// Allowed proxy target hosts
const ALLOWED_HOSTS = [
  'tmd.towergame.com',
  'test-vegasfrenzy.towergame.com',
  'test-aio.towergame.com',
  '34.80.13.113',
  '35.221.224.197',
  'test-wbslot-platform-donut.towergame.com',
  'uat-wbslot-platform-donut.towergame.com',
];

function readBody(req) {
  return new Promise(resolve => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d));
  });
}

const server = http.createServer(async (rq, rs) => {
  const parsed = new URL(rq.url, `http://localhost:${PORT}`);

  // CORS preflight
  if (rq.method === 'OPTIONS') {
    rs.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    rs.end();
    return;
  }

  // API: Generic CORS proxy
  if (parsed.pathname === '/api/proxy') {
    const target = parsed.searchParams.get('url');
    if (!target) { json(rs, 400, { error: 'Missing url param' }); return; }
    const method = (parsed.searchParams.get('method') || 'GET').toUpperCase();
    try {
      const targetUrl = new URL(target);
      if (!ALLOWED_HOSTS.includes(targetUrl.hostname)) {
        json(rs, 403, { error: 'Host not allowed: ' + targetUrl.hostname });
        return;
      }
      let postBody = null;
      let contentType = null;
      if (method === 'POST') {
        postBody = await readBody(rq);
        contentType = rq.headers['content-type'] || 'application/json';
      }
      const proxyRes = await new Promise((resolve, reject) => {
        const opts = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
          path: targetUrl.pathname + targetUrl.search,
          method,
          rejectUnauthorized: false,
          timeout: 15000,
          headers: { 'User-Agent': 'AI-AutoModify/1.0' },
        };
        if (postBody && contentType) {
          opts.headers['Content-Type'] = contentType;
          opts.headers['Content-Length'] = Buffer.byteLength(postBody);
        }
        const httpMod = targetUrl.protocol === 'http:' ? http : https;
        const pReq = httpMod.request(opts, pRes => {
          let d = '';
          pRes.setEncoding('utf8');
          pRes.on('data', c => d += c);
          pRes.on('end', () => resolve({ status: pRes.statusCode, headers: pRes.headers, body: d }));
        });
        pReq.on('error', reject);
        pReq.on('timeout', () => { pReq.destroy(); reject(new Error('Proxy timeout')); });
        if (postBody) pReq.write(postBody);
        pReq.end();
      });
      const ct = proxyRes.headers['content-type'] || 'text/plain';
      const buf = Buffer.from(proxyRes.body, 'utf8');
      rs.writeHead(proxyRes.status, {
        'Content-Type': ct,
        'Access-Control-Allow-Origin': '*',
        'Content-Length': buf.length,
      });
      rs.end(buf);
      console.log(`[Proxy] ${method} ${target} → ${proxyRes.status}`);
    } catch (e) {
      json(rs, 502, { error: 'Proxy error: ' + e.message });
      console.error(`[Proxy] Error: ${e.message}`);
    }
    return;
  }

  // Static files
  let fp = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  fp = path.join(__dirname, decodeURIComponent(fp));
  fs.readFile(fp, (err, data) => {
    if (err) { rs.writeHead(404); rs.end('Not Found'); return; }
    rs.writeHead(200, {
      'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    rs.end(data);
  });
});

function json(rs, code, data) {
  const b = Buffer.from(JSON.stringify(data), 'utf8');
  rs.writeHead(code, {
    'Content-Type': 'application/json;charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Content-Length': b.length,
  });
  rs.end(b);
}

server.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════════════╗`);
  console.log(`║  ✅ AI 自動改財產 — CORS 代理伺服器              ║`);
  console.log(`║  🌐 http://localhost:${PORT}                       ║`);
  console.log(`║  📡 代理 API: /api/proxy?url=...                  ║`);
  console.log(`╚═══════════════════════════════════════════════════╝\n`);
});
