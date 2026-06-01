const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

const BACKEND = 'http://127.0.0.1:8080';

// API proxy
app.use('/api', async (req, res) => {
  try {
    const targetUrl = BACKEND + req.originalUrl;
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers['authorization'] || '',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.text();
    res.status(response.status)
      .set('Content-Type', response.headers.get('content-type') || 'application/json')
      .set('Access-Control-Allow-Origin', '*')
      .send(data);
  } catch (err) {
    res.status(502).json({ error: 'Backend unavailable' });
  }
});

// Static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(8081, '0.0.0.0', () => console.log('Mobile server on 8081'));
