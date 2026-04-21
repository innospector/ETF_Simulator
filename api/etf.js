export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { code } = req.query;
  const TICKERS = {
    '091160': '091160.KS',  // KODEX 반도체
    '395160': '395160.KS',  // TIGER 반도체TOP10
    '396500': '396500.KS',  // SOL 반도체후공정
  };

  const ticker = TICKERS[code];
  if (!ticker) {
    return res.status(400).json({ error: '지원하지 않는 ETF 코드입니다.' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!r.ok) throw new Error(`Yahoo Finance 응답 오류: ${r.status}`);

    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('데이터 형식 오류');

    const closes = result.indicators.quote[0].close.filter(v => v != null);
    if (closes.length < 2) throw new Error('데이터 부족');

    const annualReturn = ((closes.at(-1) / closes[0]) - 1) * 100;
    const currentPrice = Math.round(closes.at(-1));

    return res.json({
      code,
      ticker,
      annualReturn: parseFloat(annualReturn.toFixed(2)),
      currentPrice,
      dataPoints: closes.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
