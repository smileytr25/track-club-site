import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultBaseUrl = "https://raw.githubusercontent.com/smileytr25/GeneseeSwiftImages/main/";
const validStatuses = ["draft", "published", "archived"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
let gallerySchemaReady;

function normalizeGalleryImage(row) {
  const imageUrl = row.image_url || `${defaultBaseUrl}${encodeURIComponent(row.file)}`;

  return {
    id: row.id,
    file: row.file,
    imageUrl,
    caption: row.caption,
    sortOrder: row.sort_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function loadDefaultGalleryImages() {
  const sourcePath = path.join(__dirname, "..", "public-site", "js-source", "gallery-images.js");
  const source = await fs.readFile(sourcePath, "utf8");
  const match = source.match(/const\s+(?:defaultGalleryImages|galleryImages)\s*=\s*(\[[\s\S]*?\]);/);

  if (!match) return [];

  return Function(`"use strict"; return ${match[1]}`)();
}

async function seedDefaultGalleryImages() {
  const count = await pool.query("SELECT COUNT(*)::int AS count FROM public.cms_gallery");

  if (count.rows[0].count > 0) return;

  const defaults = await loadDefaultGalleryImages();

  for (const [index, image] of defaults.entries()) {
    await pool.query(
      `
      INSERT INTO public.cms_gallery (file, caption, sort_order, status)
      VALUES ($1, $2, $3, 'published')
      `,
      [image.file, image.caption, index + 1]
    );
  }
}

async function ensureGallerySchema() {
  if (!gallerySchemaReady) {
    gallerySchemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS public.cms_gallery (
          id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
          file text,
          image_url text,
          caption text NOT NULL,
          sort_order integer DEFAULT 0 NOT NULL,
          status text DEFAULT 'published'::text NOT NULL,
          created_at timestamp without time zone DEFAULT now() NOT NULL,
          updated_at timestamp without time zone DEFAULT now() NOT NULL,
          CONSTRAINT cms_gallery_image_source_check CHECK (
            (file IS NOT NULL AND length(trim(file)) > 0)
            OR (image_url IS NOT NULL AND length(trim(image_url)) > 0)
          ),
          CONSTRAINT cms_gallery_status_check CHECK (
            status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])
          )
        );

        CREATE INDEX IF NOT EXISTS idx_cms_gallery_status ON public.cms_gallery USING btree (status);
        CREATE INDEX IF NOT EXISTS idx_cms_gallery_sort_order ON public.cms_gallery USING btree (sort_order);
      `);
      await seedDefaultGalleryImages();
    })().catch(error => {
      gallerySchemaReady = null;
      throw error;
    });
  }

  return gallerySchemaReady;
}

function parseGalleryPayload(body) {
  const file = body.file?.trim() || null;
  const imageUrl = body.imageUrl?.trim() || null;
  const caption = body.caption?.trim();
  const sortOrder = Number.parseInt(body.sortOrder, 10);
  const status = body.status || "published";

  if (!file && !imageUrl) {
    return { error: "Add either a GitHub image filename or a full image URL." };
  }

  if (!caption) {
    return { error: "Caption is required." };
  }

  if (!validStatuses.includes(status)) {
    return { error: "Invalid gallery status." };
  }

  return {
    file,
    imageUrl,
    caption,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    status
  };
}

router.get("/public", async (_req, res) => {
  try {
    await ensureGallerySchema();
    const result = await pool.query(
      `
      SELECT id, file, image_url, caption, sort_order, status, created_at, updated_at
      FROM public.cms_gallery
      WHERE status = 'published'
      ORDER BY sort_order ASC, created_at ASC
      `
    );

    res.json({ images: result.rows.map(normalizeGalleryImage) });
  } catch (error) {
    console.error("Public gallery error:", error);
    res.status(500).json({ error: "Unable to load gallery." });
  }
});

router.get("/cms", async (_req, res) => {
  try {
    await ensureGallerySchema();
    const result = await pool.query(
      `
      SELECT id, file, image_url, caption, sort_order, status, created_at, updated_at
      FROM public.cms_gallery
      ORDER BY sort_order ASC, created_at ASC
      `
    );

    res.json({ images: result.rows.map(normalizeGalleryImage) });
  } catch (error) {
    console.error("CMS gallery error:", error);
    res.status(500).json({ error: "Unable to load CMS gallery." });
  }
});

router.post("/cms", async (req, res) => {
  const payload = parseGalleryPayload(req.body);

  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  try {
    await ensureGallerySchema();
    const result = await pool.query(
      `
      INSERT INTO public.cms_gallery (file, image_url, caption, sort_order, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, file, image_url, caption, sort_order, status, created_at, updated_at
      `,
      [payload.file, payload.imageUrl, payload.caption, payload.sortOrder, payload.status]
    );

    res.status(201).json({ image: normalizeGalleryImage(result.rows[0]) });
  } catch (error) {
    console.error("Create CMS gallery image error:", error);
    res.status(500).json({ error: "Unable to create gallery image." });
  }
});

router.put("/cms/order", async (req, res) => {
  const { imageIds } = req.body;

  if (!Array.isArray(imageIds) || imageIds.some(id => !uuidPattern.test(id))) {
    return res.status(400).json({ error: "A valid image order is required." });
  }

  try {
    await ensureGallerySchema();

    for (const [index, id] of imageIds.entries()) {
      await pool.query(
        `
        UPDATE public.cms_gallery
        SET sort_order = $1,
            updated_at = now()
        WHERE id = $2
        `,
        [index + 1, id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Order CMS gallery error:", error);
    res.status(500).json({ error: "Unable to save gallery order." });
  }
});

router.put("/cms/:id", async (req, res) => {
  const { id } = req.params;
  const payload = parseGalleryPayload(req.body);

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid gallery image id." });
  }

  if (payload.error) {
    return res.status(400).json({ error: payload.error });
  }

  try {
    await ensureGallerySchema();
    const result = await pool.query(
      `
      UPDATE public.cms_gallery
      SET file = $1,
          image_url = $2,
          caption = $3,
          sort_order = $4,
          status = $5,
          updated_at = now()
      WHERE id = $6
      RETURNING id, file, image_url, caption, sort_order, status, created_at, updated_at
      `,
      [payload.file, payload.imageUrl, payload.caption, payload.sortOrder, payload.status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Gallery image not found." });
    }

    res.json({ image: normalizeGalleryImage(result.rows[0]) });
  } catch (error) {
    console.error("Update CMS gallery image error:", error);
    res.status(500).json({ error: "Unable to update gallery image." });
  }
});

router.delete("/cms/:id", async (req, res) => {
  const { id } = req.params;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid gallery image id." });
  }

  try {
    await ensureGallerySchema();
    const result = await pool.query("DELETE FROM public.cms_gallery WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Gallery image not found." });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete CMS gallery image error:", error);
    res.status(500).json({ error: "Unable to delete gallery image." });
  }
});

export default router;
