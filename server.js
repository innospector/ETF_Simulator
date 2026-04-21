// 로컬 테스트 서버 (vercel dev 대용)
// 실행: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3333;
const DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

const TICKERS = {
  '091160': '091160.KS',
  '395160': '395160.KS',
  '396500': '396500.KS',
};

async function handleETFApi(code, res) {
  const ticker = TICKERS[code];
  if (!ticker) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: '지원하지 않는 ETF 코드입니다.' }));
  }

  try {
    const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    const r = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!r.ok) throw new Error(`Yahoo Finance 오류: ${r.status}`);

    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('데이터 형식 오류');

    const closes = result.indicators.quote[0].close.filter(v => v != null);
    if (closes.length < 2) throw new Error('데이터 부족');

    const annualReturn = ((closes.at(-1) / closes[0]) - 1) * 100;

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      code, ticker,
      annualReturn: parseFloat(annualReturn.toFixed(2)),
      currentPrice: Math.round(closes.at(-1)),
      dataPoints: closes.length,
      updatedAt: new Date().toISOString(),
    }));
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.message }));
  }
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  // API 라우트
  if (pathname === '/api/etf') {
    return handleETFApi(parsed.query.code, res);
  }

  // 정적 파일
  let filePath = path.join(DIR, pathname === '/' ? '/2. CLAUDE_Semiconductor_ETF_Simulator.html' : pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✅ 로컬 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📊 API 테스트: http://localhost:${PORT}/api/etf?code=091160`);
});
