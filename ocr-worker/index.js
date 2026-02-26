// File: ocr-worker/index.js
// OCR worker: fetches signed URL, runs Tesseract (or stub). Protect with OCR_API_KEY in production.

const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const TESSERACT_AVAILABLE = process.env.TESSERACT_AVAILABLE === 'true';
const OCR_API_KEY = process.env.OCR_API_KEY;

function checkAuth(req) {
  if (!OCR_API_KEY) return true;
  const key = req.headers['x-ocr-api-key'];
  return key === OCR_API_KEY;
}

app.post('/ocr', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url' });

  if (!TESSERACT_AVAILABLE) {
    return res.json({
      merchant: 'Stub Merchant',
      date: new Date().toISOString().slice(0, 10),
      total: 0,
      line_items: [],
    });
  }

  try {
    // TODO: Fetch image from url, run: tesseract image.png stdout
    // const { execSync } = require('child_process');
    // const fs = require('fs');
    // const path = require('path');
    // const tmp = path.join('/tmp', `ocr-${Date.now()}.png`);
    // fetch(url).then(r => r.buffer()).then(b => fs.writeFileSync(tmp, b));
    // const out = execSync(`tesseract ${tmp} stdout`, { encoding: 'utf8' });
    // Parse out for merchant, date, total, line items (regex or simple parser)
    const merchant = 'Parsed Merchant';
    const date = new Date().toISOString().slice(0, 10);
    const total = 0;
    const line_items = [];
    return res.json({ merchant, date, total, line_items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'OCR failed' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`OCR worker listening on ${PORT}`));
