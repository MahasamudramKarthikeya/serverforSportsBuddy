// server.js - Express proxy with real keys loaded from .env
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// RapidAPI GeoDB settings
const GEO_DB_API_HOST = process.env.GEO_DB_API_HOST || "wft-geo-db.p.rapidapi.com";
const GEO_DB_API_KEY = process.env.GEO_DB_API_KEY || "4bb94db0c9msha5e7677bb5a0eccp154176jsncbb124f8c237";

// Playo settings
const PLAYO_VENUE_URL = process.env.PLAYO_VENUE_URL || "https://playo.co/_next/data/F8G8ypLIqaoTgwKPXMu7e/venues/";
const PLAYO_AUTH_TOKEN = process.env.PLAYO_AUTH_TOKEN || "5534898698eb3426d00168b6ed447d23d000026552ed6200";
const PLAYO_USER_AGENT = process.env.PLAYO_USER_AGENT || `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36`;

// EmailJS settings
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_2jpsg99";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "template_2utqp9m";
const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID || "dSKjNZ4-J5-UsAKDQ";

app.get('/', (req, res) => res.send('Proxy server running ✅'));

// GET /api/cities?q= - proxies GeoDB (RapidAPI) for city suggestions
app.get('/api/cities', async (req, res) => {
  const q = req.query.q || '';
  if (GEO_DB_API_KEY && GEO_DB_API_HOST) {
    try {
      const upstream = `https://${GEO_DB_API_HOST}/v1/geo/cities?namePrefix=${encodeURIComponent(q)}&limit=8&sort=-population`;
      const r = await fetch(upstream, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': GEO_DB_API_KEY,
          'X-RapidAPI-Host': GEO_DB_API_HOST
        }
      });
      const data = await r.json();
      return res.json(data);
    } catch (err) {
      console.error('GeoDB proxy error:', err.message || err);
    }
  }

  // fallback simple list
  const cities = [
    { name: 'Hyderabad', lat: 17.385044, lng: 78.486671 },
    { name: 'Bangalore', lat: 12.971599, lng: 77.594566 },
    { name: 'Tirupati', lat: 13.632, lng: 79.423 },
    { name: 'Visakhapatnam', lat: 17.7042, lng: 83.2978 }
  ];
  const out = cities.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  res.json({ data: out });
});

// GET /api/venues?lat=&lng=&pageNo= - proxies Playo or returns mock
app.get('/api/venues', async (req, res) => {
  const lat = req.query.lat || process.env.DEFAULT_LAT || '';
  const lng = req.query.lng || process.env.DEFAULT_LNG || '';
  const pageNo = req.query.pageNo || 1;

  if (PLAYO_VENUE_URL && PLAYO_AUTH_TOKEN) {
    try {
      // If PLAYO_VENUE_URL expects path-based, caller should set it accordingly in .env.
      const url = PLAYO_VENUE_URL + `?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&page=${encodeURIComponent(pageNo)}`;
      const r = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PLAYO_AUTH_TOKEN}`,
          'User-Agent': PLAYO_USER_AGENT
        }
      });
      const data = await r.json();
      return res.json(data);
    } catch (err) {
      console.error('Playo proxy error:', err.message || err);
    }
  }

  // fallback mock response
  res.json({ message: 'Mock response - PLAYO not configured on server', venues: [] });
});

// POST /api/send-email - server-side proxy to EmailJS
app.post('/api/send-email', async (req, res) => {
  const template_params = req.body.template_params || req.body;
  const service_id = process.env.EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID;
  const template_id = process.env.EMAILJS_TEMPLATE_ID || EMAILJS_TEMPLATE_ID;
  const user_id = process.env.EMAILJS_USER_ID || EMAILJS_USER_ID;

  if (!service_id || !template_id || !user_id) {
    return res.status(500).json({ error: 'EmailJS credentials not configured on server' });
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id,
        template_id,
        user_id,
        template_params
      })
    });
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (err) {
    console.error('EmailJS proxy error:', err.message || err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
