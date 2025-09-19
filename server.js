// server.js - Proxy server with explicit CORS handling
const express = require("express");
const fetch = require("node-fetch").default; // Important for CommonJS
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors()); // This allows CORS for all routes globally
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ---------------- GeoDB Cities ----------------
const GEO_DB_API_HOST =
  process.env.GEO_DB_API_HOST || "wft-geo-db.p.rapidapi.com";
const GEO_DB_API_KEY = process.env.GEO_DB_API_KEY || "";

app.get("/", (req, res) => res.send("Proxy server running ✅"));

app.get("/api/cities", async (req, res) => {
  const q = req.query.q || "";
  if (GEO_DB_API_KEY && GEO_DB_API_HOST) {
    try {
      const url = `https://${GEO_DB_API_HOST}/v1/geo/cities?namePrefix=${encodeURIComponent(
        q
      )}&limit=8&sort=-populatio`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": GEO_DB_API_KEY,
          "X-RapidAPI-Host": GEO_DB_API_HOST,
        },
      });
      const data = await response.json();
      return res.json(data);
    } catch (err) {
      console.error("GeoDB proxy error:", err.message || err);
    }
  }

  // Fallback cities
  const cities = [
    { name: "Hyderabad", lat: 17.385044, lng: 78.486671 },
    { name: "Bangalore", lat: 12.971599, lng: 77.594566 },
    { name: "Tirupati", lat: 13.632, lng: 79.423 },
    { name: "Visakhapatnam", lat: 17.7042, lng: 83.2978 },
  ];
  const out = cities.filter(
    (c) => !q || c.name.toLowerCase().includes(q.toLowerCase())
  );
  res.json({ data: out });
});

// ---------------- Proxy Playo Venues ----------------
app.get("/api/venues/:city/:activeKey", async (req, res) => {
  const { city, activeKey } = req.params;
  
  // Construct the Playo API URL
  const VENUE_URL = `https://playo.co/_next/data/BILrBORA4nyP5228jUa_H/venues/${city}/${activeKey}.json`;

  try {
    const response = await fetch(VENUE_URL);
    const data = await response.json();
    
    // Set CORS headers explicitly for this route
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Return the data back to the client
    res.json(data);
  } catch (err) {
    console.error("Error fetching venue details:", err);
    res.status(500).json({ error: "Failed to fetch venue details" });
  }
});

// ---------------- Playo Venues (For other API calls) ----------------
const PLAYO_AUTH_TOKEN = process.env.PLAYO_AUTH_TOKEN || ""; // must have Bearer token

app.get("/api/venues", async (req, res) => {
  const { lat, lng, pageNo } = req.query;

  if (!PLAYO_AUTH_TOKEN) {
    return res.status(500).json({ error: "Playo auth token not configured" });
  }

  try {
    const response = await fetch("https://api.playo.io/venue-public/v2/list", {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${PLAYO_AUTH_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        page: pageNo || 0,
        lat: lat || 0,
        lng: lng || 0,
        sportId: [],
        category: "venue",
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Playo fetch error:", err.message || err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- EmailJS ----------------
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "";
const EMAILJS_USER_ID = process.env.EMAILJS_USER_ID || "";

app.post("/api/send-email", async (req, res) => {
  const template_params = req.body.template_params || req.body;

  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_USER_ID) {
    return res
      .status(500)
      .json({ error: "EmailJS credentials not configured" });
  }

  try {
    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_USER_ID,
          template_params,
        }),
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("EmailJS proxy error:", err.message || err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
