import express from "express";
import { pool } from "../db.js";

const router = express.Router();
const eventFields = `
  id, title, event_date, event_time, location, description, status, created_at, updated_at
`;
const validStatuses = ["draft", "published", "archived"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let eventSchemaReady;

async function ensureEventSchema() {
  if (!eventSchemaReady) {
    eventSchemaReady = pool.query(`
      ALTER TABLE public.cms_events
      DROP CONSTRAINT IF EXISTS cms_events_status_check;

      ALTER TABLE public.cms_events
      ADD CONSTRAINT cms_events_status_check
      CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
    `).catch(error => {
      eventSchemaReady = null;
      throw error;
    });
  }

  return eventSchemaReady;
}

async function archivePublishedEvents() {
  await ensureEventSchema();
  await pool.query(`
    UPDATE public.cms_events
    SET status = 'archived',
        updated_at = now()
    WHERE status = 'published'
      AND event_date <= CURRENT_DATE
  `);
}

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
    await archivePublishedEvents();
    const result = await pool.query(
      `
      SELECT id, title, event_date, event_time, location, description, status, created_at, updated_at
      FROM public.cms_events
      WHERE status = 'published'
        AND event_date > CURRENT_DATE
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
    await archivePublishedEvents();
    const result = await pool.query(
      `
      SELECT ${eventFields}
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

router.get("/cms/:id", async (req, res) => {
  const { id } = req.params;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid event id." });
  }

  try {
    await archivePublishedEvents();
    const result = await pool.query(
      `
      SELECT ${eventFields}
      FROM public.cms_events
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.json({ event: normalizeEvent(result.rows[0]) });
  } catch (error) {
    console.error("CMS event detail error:", error);
    res.status(500).json({ error: "Unable to load event." });
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

  if (!title?.trim() || !eventDate || !location?.trim()) {
    return res.status(400).json({ error: "Title, date, and location are required." });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid event status." });
  }

  try {
    await ensureEventSchema();
    const result = await pool.query(
      `
      INSERT INTO public.cms_events (title, event_date, event_time, location, description, status)
      VALUES (
        $1,
        $2,
        NULLIF($3, '')::time,
        $4,
        $5,
        CASE
          WHEN $6 = 'published' AND $2::date <= CURRENT_DATE THEN 'archived'
          ELSE $6
        END
      )
      RETURNING ${eventFields}
      `,
      [title.trim(), eventDate, eventTime || "", location.trim(), description?.trim() || null, status]
    );

    res.status(201).json({ event: normalizeEvent(result.rows[0]) });
  } catch (error) {
    console.error("Create CMS event error:", error);
    res.status(500).json({ error: "Unable to create event." });
  }
});

router.put("/cms/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    eventDate,
    eventTime,
    location,
    description,
    status = "draft"
  } = req.body;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid event id." });
  }

  if (!title?.trim() || !eventDate || !location?.trim()) {
    return res.status(400).json({ error: "Title, date, and location are required." });
  }

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid event status." });
  }

  try {
    await ensureEventSchema();
    const result = await pool.query(
      `
      UPDATE public.cms_events
      SET title = $1,
          event_date = $2,
          event_time = NULLIF($3, '')::time,
          location = $4,
          description = $5,
          status = CASE
            WHEN $6 = 'published' AND $2::date <= CURRENT_DATE THEN 'archived'
            ELSE $6
          END,
          updated_at = now()
      WHERE id = $7
      RETURNING ${eventFields}
      `,
      [title.trim(), eventDate, eventTime || "", location.trim(), description?.trim() || null, status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.json({ event: normalizeEvent(result.rows[0]) });
  } catch (error) {
    console.error("Update CMS event error:", error);
    res.status(500).json({ error: "Unable to update event." });
  }
});

export default router;
