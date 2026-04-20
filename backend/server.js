/**
 * Builddy SaaS Scaffold — Express Server
 * Health check, API routes, error handler, graceful shutdown.
 *
 * Modification Points:
 *   // {{MIDDLEWARE_INSERTION_POINT}}  — Add custom middleware here
 *   // {{ROUTE_INSERTION_POINT}}       — Add custom API routes here
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initSchema, closeDb } from "./db.js";
import {
  rateLimiter,
  requestLogger,
  corsMiddleware,
  sanitizeInput,
} from "./middleware.js";
import apiRoutes from "./routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, "..", "frontend");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);

// ---------------------------------------------------------------------------
// Newsletter Rate Limiter (stricter — 5 requests per IP per minute)
// ---------------------------------------------------------------------------

const newsletterWindows = new Map();

function newsletterRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  if (!newsletterWindows.has(ip)) newsletterWindows.set(ip, []);
  const timestamps = newsletterWindows.get(ip).filter((t) => now - t < 60_000);
  timestamps.push(now);
  newsletterWindows.set(ip, timestamps);
  if (timestamps.length > 5) {
    return res.status(429).json({ success: false, error: "Too many requests. Please wait before subscribing again." });
  }
  next();
}

// ---------------------------------------------------------------------------
// Express App
// ---------------------------------------------------------------------------

const app = express();

// {{MIDDLEWARE_INSERTION_POINT}}
app.use(corsMiddleware(ALLOWED_ORIGINS));
app.use(sanitizeInput);
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// API routes
app.use("/api", apiRoutes);

// Serve static files
app.use(express.static(STATIC_DIR));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "OK", timestamp: new Date().toISOString() });
});

// {{ROUTE_INSERTION_POINT}}

// Fallback for SPA routes
app.get("*", (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

function start() {
  // Initialize database
  try {
    initSchema();
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }

  // Start server
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });

  // Graceful shutdown
  function shutdown() {
    console.log("Shutting down...");
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

export { app, start };

// If this file is run directly, start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}