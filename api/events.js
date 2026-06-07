import express from "express";
import { pool } from "../db.js";

const router = express.Router();

function normalizeEvent(row) {
  const eventDate = row.event_date instanceof Date
    ? row.event_date.toISOString().slice(0, 10)
    : row.event_date;

  return {
    id: row.id,
    title: row.title,
    eventDate,
    eventTime: row.event_time,
    location: row.location,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.get("/public", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, title, event_date, event_time, location, description, status, created_at, updated_at
      FROM public.cms_events
      WHERE status = 'published'
        AND event_date >= CURRENT_DATE
      ORDER BY event_date ASC, event_time ASC NULLS LAST
      `
    );

    res.json({ events: result.rows.map(normalizeEvent) });
  } catch (error) {
    console.error("Public events error:", error);
    res.status(500).json({ error: "Unable to load events." });
  }
});

router.get("/cms", async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, title, event_date, event_time, location, description, status, created_at, updated_at
      FROM public.cms_events
      ORDER BY event_date ASC, event_time ASC NULLS LAST
      `
    );

    res.json({ events: result.rows.map(normalizeEvent) });
  } catch (error) {
    console.error("CMS events error:", error);
    res.status(500).json({ error: "Unable to load CMS events." });
  }
});

router.post("/cms", async (req, res) => {
  const {
    title,
    eventDate,
    eventTime,
    location,
    description,
    status = "draft"
  } = req.body;

  if (!title || !eventDate || !location) {
    return res.status(400).json({ error: "Title, date, and location are required." });
  }

  if (!["draft", "published"].includes(status)) {
    return res.status(400).json({ error: "Invalid event status." });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO public.cms_events (title, event_date, event_time, location, description, status)
      VALUES ($1, $2, NULLIF($3, '')::time, $4, $5, $6)
      RETURNING id, title, event_date, event_time, location, description, status, created_at, updated_at
      `,
      [title.trim(), eventDate, eventTime || "", location.trim(), description?.trim() || null, status]
    );

    res.status(201).json({ event: normalizeEvent(result.rows[0]) });
  } catch (error) {
    console.error("Create CMS event error:", error);
    res.status(500).json({ error: "Unable to create event." });
  }
});

export default router;
