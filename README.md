SportsBuddy Backend (full keys extracted from frontend)

This backend is prepared for deployment. It includes a .env file populated from your frontend/server files.
**Security reminder:** .env is present in this package - do NOT commit it to GitHub. Before pushing to a public repo, remove .env or replace with .env.example.

Run locally:
1. npm install
2. node server.js
3. Server runs on port 5000 by default.

Endpoints:
- GET /api/cities?q=...   (proxies RapidAPI geo DB using GEO_DB_API_KEY)
- GET /api/venues?lat=&lng=&pageNo=  (proxies PLAYO_VENUE_URL with PLAYO_AUTH_TOKEN)
- POST /api/send-email  (proxy to EmailJS API using EMAILJS_SERVICE_ID/TEMPLATE/USER_ID)

.env contents included (sensitive) - keep safe.
