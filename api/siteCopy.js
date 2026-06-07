import express from "express";
import { pool } from "../db.js";

const router = express.Router();
let siteCopySchemaReady;
const eventFieldColumns = {
  title: "title",
  location: "location",
  description: "description"
};

async function ensureSiteCopySchema() {
  if (!siteCopySchemaReady) {
    siteCopySchemaReady = pool.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

      CREATE TABLE IF NOT EXISTS public.cms_site_copy (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        page_path text NOT NULL,
        selector text NOT NULL,
        text_content text NOT NULL,
        created_at timestamp without time zone DEFAULT now() NOT NULL,
        updated_at timestamp without time zone DEFAULT now() NOT NULL,
        CONSTRAINT cms_site_copy_pkey PRIMARY KEY (id)
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_cms_site_copy_unique
      ON public.cms_site_copy USING btree (page_path, selector);

      CREATE INDEX IF NOT EXISTS idx_cms_site_copy_page
      ON public.cms_site_copy USING btree (page_path);
    `).catch(error => {
      siteCopySchemaReady = null;
      throw error;
    });
  }

  return siteCopySchemaReady;
}

function normalizeRow(row) {
  return {
    id: row.id,
    pagePath: row.page_path,
    selector: row.selector,
    textContent: row.text_content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizePagePath(value) {
  let path = String(value || "").trim();
  if (path.startsWith("/html-source/")) {
    path = `/public-site${path}`;
  }

  if (/^\/[A-Za-z0-9_-]+\.html$/.test(path)) {
    path = `/public-site/html-source${path}`;
  }

  if (!path.startsWith("/public-site/html-source/") || !path.endsWith(".html")) {
    return "";
  }

  return path;
}

router.get("/public", async (req, res) => {
  const pagePath = normalizePagePath(req.query.pagePath);

  if (!pagePath) {
    return res.status(400).json({ error: "Invalid public page path." });
  }

  try {
    await ensureSiteCopySchema();
    const result = await pool.query(
      `
      SELECT id, page_path, selector, text_content, created_at, updated_at
      FROM public.cms_site_copy
      WHERE page_path = $1
      ORDER BY selector ASC
      `,
      [pagePath]
    );

    res.json({ overrides: result.rows.map(normalizeRow) });
  } catch (error) {
    console.error("Public site copy error:", error);
    res.status(500).json({ error: "Unable to load site copy." });
  }
});

router.get("/cms", async (req, res) => {
  const pagePath = req.query.pagePath ? normalizePagePath(req.query.pagePath) : "";

  try {
    await ensureSiteCopySchema();
    const result = await pool.query(
      `
      SELECT id, page_path, selector, text_content, created_at, updated_at
      FROM public.cms_site_copy
      WHERE ($1::text = '' OR page_path = $1)
      ORDER BY page_path ASC, selector ASC
      `,
      [pagePath]
    );

    res.json({ overrides: result.rows.map(normalizeRow) });
  } catch (error) {
    console.error("CMS site copy error:", error);
    res.status(500).json({ error: "Unable to load CMS site copy." });
  }
});

router.put("/cms", async (req, res) => {
  const { changes } = req.body;

  if (!Array.isArray(changes)) {
    return res.status(400).json({ error: "Changes must be an array." });
  }

  const normalizedChanges = changes.map(change => ({
    type: change.type === "event" ? "event" : "copy",
    pagePath: normalizePagePath(change.pagePath),
    selector: String(change.selector || "").trim(),
    textContent: String(change.textContent ?? ""),
    eventId: String(change.eventId || "").trim(),
    field: String(change.field || "").trim()
  }));

  if (normalizedChanges.some(change => !change.pagePath || (change.type === "copy" && !change.selector))) {
    return res.status(400).json({ error: "Each copy change needs a page path and selector." });
  }

  if (normalizedChanges.some(change => (
    change.type === "event" && (!change.eventId || !eventFieldColumns[change.field])
  ))) {
    return res.status(400).json({ error: "Each event change needs an event id and editable field." });
  }

  try {
    await ensureSiteCopySchema();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const saved = [];
      for (const change of normalizedChanges) {
        if (change.type === "event") {
          const column = eventFieldColumns[change.field];
          const result = await client.query(
            `
            UPDATE public.cms_events
            SET ${column} = $1,
                updated_at = now()
            WHERE id = $2
            RETURNING id, title, location, description, updated_at
            `,
            [change.textContent, change.eventId]
          );

          if (result.rowCount === 0) {
            throw new Error("Event not found for site copy change.");
          }

          saved.push({
            type: "event",
            pagePath: change.pagePath,
            eventId: result.rows[0].id,
            field: change.field,
            textContent: change.textContent,
            updatedAt: result.rows[0].updated_at
          });
          continue;
        }

        const result = await client.query(
          `
          INSERT INTO public.cms_site_copy (page_path, selector, text_content)
          VALUES ($1, $2, $3)
          ON CONFLICT (page_path, selector)
          DO UPDATE SET text_content = EXCLUDED.text_content,
                        updated_at = now()
          RETURNING id, page_path, selector, text_content, created_at, updated_at
          `,
          [change.pagePath, change.selector, change.textContent]
        );
        saved.push(normalizeRow(result.rows[0]));
      }

      await client.query("COMMIT");
      res.json({ overrides: saved });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Save CMS site copy error:", error);
    res.status(500).json({ error: "Unable to save site copy." });
  }
});

export default router;
