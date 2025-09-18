// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 5000;

// ✅ Enable CORS for all requests
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Proxy server running ✅");
});

// ✅ Example proxy endpoint
// Call this from frontend: http://localhost:5000/api/venues
app.get("/api/venues", async (req, res) => {
  try {
    // Replace with your real API URL
    const apiUrl = "https://example.com/api/venues";

    const response = await fetch(apiUrl);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ error: "Failed to fetch venues" });
  }
});

// ✅ Another proxy endpoint example (with query params)
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    const apiUrl = `https://example.com/api/search?q=${query}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error fetching search results:", error);
    res.status(500).json({ error: "Failed to fetch search results" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running on http://localhost:${PORT}`);
});
