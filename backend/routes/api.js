/**
 * Builddy SaaS Scaffold — Newsletter API Routes
 * Subscribe, list subscribers, unsubscribe endpoints.
 */

import { Router } from "express";
import { getDb, getOneWhere, create, deleteRow } from "../db.js";

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Validate email format with regex.
 * Returns trimmed email if valid, null otherwise.
 */
function validateEmail(email) {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed) ? trimmed : null;
}

// ---------------------------------------------------------------------------
// POST /subscribe — Subscribe to newsletter
// ---------------------------------------------------------------------------

router.post("/subscribe", (req, res) => {
  try {
    const { email, source } = req.body;

    // Validate email
    const validEmail = validateEmail(email);
    if (!validEmail) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    const db = getDb();

    // Check for duplicates
    const existing = getOneWhere("newsletter_subscribers", { email: validEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "This email is already subscribed.",
        data: { id: existing.id, email: existing.email },
      });
    }

    // Insert subscriber
    const subscriber = create("newsletter_subscribers", {
      email: validEmail,
      source: source || "landing",
    });

    res.status(201).json({
      success: true,
      message: "Successfully subscribed to the newsletter!",
      data: { id: subscriber.id, email: subscriber.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /subscribers — List subscribers (admin, paginated)
// ---------------------------------------------------------------------------

router.get("/subscribers", (req, res) => {
  try {
    const db = getDb();
    const { page, limit, offset } = parsePagination(req.query);

    const countRow = db.prepare("SELECT COUNT(*) as count FROM newsletter_subscribers").get();
    const rows = db.prepare(
      "SELECT * FROM newsletter_subscribers ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).all(limit, offset);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: countRow.count,
        pages: Math.ceil(countRow.count / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /subscribers/:id — Unsubscribe
// ---------------------------------------------------------------------------

router.delete("/subscribers/:id", (req, res) => {
  try {
    const db = getDb();
    const subscriber = db.prepare("SELECT * FROM newsletter_subscribers WHERE id = ?").get(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        error: "Subscriber not found.",
      });
    }

    deleteRow("newsletter_subscribers", req.params.id);

    res.json({
      success: true,
      message: "Successfully unsubscribed.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;