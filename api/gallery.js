import express from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultBaseUrl = "https://raw.githubusercontent.com/smileytr25/GeneseeSwiftImages/main/";
const uploadDir = path.join(__dirname, "..", "public-site", "image-assets", "gallery");
const uploadUrlBase = "/image-assets/gallery/";
const githubImageOwner = process.env.GALLERY_IMAGE_REPO_OWNER || "smileytr25";
const githubImageRepo = process.env.GALLERY_IMAGE_REPO || "GeneseeSwiftImages";
const githubImageBranch = process.env.GALLERY_IMAGE_BRANCH || "main";
const githubImagePath = (process.env.GALLERY_IMAGE_PATH || "").replace(/^\/+|\/+$/g, "");
const githubImageToken = process.env.GALLERY_IMAGE_TOKEN || process.env.GITHUB_IMAGE_TOKEN || process.env.GITHUB_TOKEN;
const galleryUploadStorage = process.env.GALLERY_UPLOAD_STORAGE || "github";
const maxUploadBytes = 12 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);
const validStatuses = ["draft", "published", "archived"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

function splitBuffer(buffer, separator) {
  const parts = [];
  let start = 0;
  let index = buffer.indexOf(separator);

  while (index !== -1) {
    parts.push(buffer.subarray(start, index));
    start = index + separator.length;
    index = buffer.indexOf(separator, start);
  }

  parts.push(buffer.subarray(start));
  return parts;
}

function sanitizeUploadName(name) {
  const parsed = path.parse(name || "gallery-image");
  const base = parsed.name
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "gallery-image";

  return base.toLowerCase();
}

function getRawGithubImageUrl(filename) {
  const encodedPath = [githubImagePath, filename]
    .filter(Boolean)
    .map(part => part.split("/").map(segment => encodeURIComponent(segment)).join("/"))
    .join("/");

  return `https://raw.githubusercontent.com/${githubImageOwner}/${githubImageRepo}/${githubImageBranch}/${encodedPath}`;
}

function getGithubRepoPathForImage(image) {
  if (image.file) {
    return [githubImagePath, image.file].filter(Boolean).join("/");
  }

  if (!image.image_url) return "";

  try {
    const url = new URL(image.image_url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const [owner, repo, branch, ...fileParts] = pathParts;

    if (
      url.hostname !== "raw.githubusercontent.com"
      || owner !== githubImageOwner
      || repo !== githubImageRepo
      || branch !== githubImageBranch
      || fileParts.length === 0
    ) {
      return "";
    }

    return fileParts.map(part => decodeURIComponent(part)).join("/");
  } catch {
    return "";
  }
}

function getGithubContentsApiUrl(repoPath) {
  return `https://api.github.com/repos/${githubImageOwner}/${githubImageRepo}/contents/${repoPath
    .split("/")
    .map(segment => encodeURIComponent(segment))
    .join("/")}`;
}

async function saveUploadedImageLocally(filename, content) {
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), content);
  return `${uploadUrlBase}${encodeURIComponent(filename)}`;
}

async function uploadImageToGithub(filename, content) {
  if (!githubImageToken) {
    return {
      error: "GitHub image uploads need GALLERY_IMAGE_TOKEN in .env. Create a fine-grained GitHub token with Contents read/write access to smileytr25/GeneseeSwiftImages."
    };
  }

  const repoPath = [githubImagePath, filename].filter(Boolean).join("/");
  const apiUrl = getGithubContentsApiUrl(repoPath);
  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${githubImageToken}`,
      "Content-Type": "application/json",
      "User-Agent": "genesee-swift-cms"
    },
    body: JSON.stringify({
      message: `Add gallery image ${filename}`,
      content: content.toString("base64"),
      branch: githubImageBranch
    })
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      error: data.message ? `GitHub upload failed: ${data.message}` : "GitHub upload failed."
    };
  }

  return { imageUrl: getRawGithubImageUrl(filename) };
}

async function deleteImageFromGithub(image) {
  const repoPath = getGithubRepoPathForImage(image);

  if (!repoPath) {
    return { skipped: true };
  }

  if (!githubImageToken) {
    return {
      error: "GitHub image deletion needs GALLERY_IMAGE_TOKEN in .env."
    };
  }

  const apiUrl = getGithubContentsApiUrl(repoPath);
  const headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${githubImageToken}`,
    "Content-Type": "application/json",
    "User-Agent": "genesee-swift-cms"
  };
  const current = await fetch(`${apiUrl}?ref=${encodeURIComponent(githubImageBranch)}`, { headers });
  const currentData = await current.json().catch(() => ({}));

  if (!current.ok) {
    return {
      error: current.status === 404
        ? "GitHub image file was not found, so the gallery row was not deleted."
        : currentData.message
          ? `GitHub lookup failed: ${currentData.message}`
          : "GitHub lookup failed."
    };
  }

  const response = await fetch(apiUrl, {
    method: "DELETE",
    headers,
    body: JSON.stringify({
      message: `Delete gallery image ${repoPath}`,
      sha: currentData.sha,
      branch: githubImageBranch
    })
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      error: data.message ? `GitHub deletion failed: ${data.message}` : "GitHub deletion failed."
    };
  }

  return { deleted: true };
}

async function storeUploadedImage(filename, content) {
  if (galleryUploadStorage === "local") {
    return { imageUrl: await saveUploadedImageLocally(filename, content) };
  }

  return uploadImageToGithub(filename, content);
}

function getHeaderValue(headers, name) {
  const prefix = `${name.toLowerCase()}:`;
  const line = headers.find(header => header.toLowerCase().startsWith(prefix));
  return line ? line.slice(prefix.length).trim() : "";
}

function parseContentDisposition(value) {
  const result = {};

  for (const part of value.split(";")) {
    const [key, rawValue] = part.trim().split("=");
    if (!rawValue) continue;
    result[key] = rawValue.replace(/^"|"$/g, "");
  }

  return result;
}

async function readMultipartGalleryPayload(req) {
  const contentType = req.headers["content-type"] || "";
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1]
    || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];

  if (!boundary) {
    return { error: "Invalid upload request." };
  }

  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;

    if (totalBytes > maxUploadBytes) {
      return { error: "Image upload must be 12 MB or smaller." };
    }

    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks);
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const fields = {};
  let uploadedImage = null;

  for (let part of splitBuffer(body, boundaryBuffer)) {
    if (part.length === 0) continue;
    if (part.subarray(0, 2).toString() === "\r\n") part = part.subarray(2);
    if (part.subarray(0, 2).toString() === "--") continue;

    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) continue;

    const headerLines = part.subarray(0, headerEnd).toString("utf8").split("\r\n");
    let content = part.subarray(headerEnd + 4);
    if (content.subarray(content.length - 2).toString() === "\r\n") {
      content = content.subarray(0, content.length - 2);
    }

    const disposition = parseContentDisposition(getHeaderValue(headerLines, "content-disposition"));
    if (!disposition.name) continue;

    if (disposition.filename) {
      if (content.length === 0) continue;

      const mimeType = getHeaderValue(headerLines, "content-type").toLowerCase();
      const extension = allowedImageTypes.get(mimeType);

      if (!extension) {
        return { error: "Upload a JPG, PNG, WebP, or GIF image." };
      }

      const filename = `${sanitizeUploadName(disposition.filename)}-${crypto.randomUUID()}${extension}`;
      const storedImage = await storeUploadedImage(filename, content);

      if (storedImage.error) {
        return storedImage;
      }

      uploadedImage = {
        filename,
        imageUrl: storedImage.imageUrl
      };
    } else {
      fields[disposition.name] = content.toString("utf8");
    }
  }

  if (uploadedImage) {
    fields.file = "";
    fields.imageUrl = uploadedImage.imageUrl;
  }

  return fields;
}

async function parseGalleryRequest(req) {
  if ((req.headers["content-type"] || "").includes("multipart/form-data")) {
    return readMultipartGalleryPayload(req);
  }

  return req.body;
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
  if (body?.error) {
    return body;
  }

  body = body || {};
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
  const body = await parseGalleryRequest(req);
  const payload = parseGalleryPayload(body);

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
  const { imageId, direction, imageIds } = req.body;

  if (imageId || direction) {
    if (!uuidPattern.test(imageId) || !["up", "down"].includes(direction)) {
      return res.status(400).json({ error: "A valid image and direction are required." });
    }

    try {
      await ensureGallerySchema();
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const current = await client.query(
          `
          SELECT id, file, image_url, caption, sort_order, status, created_at, updated_at
          FROM public.cms_gallery
          ORDER BY sort_order ASC, created_at ASC
          FOR UPDATE
          `
        );
        const rows = current.rows;
        const index = rows.findIndex(row => row.id === imageId);
        const nextIndex = direction === "up" ? index - 1 : index + 1;

        if (index < 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Gallery image not found." });
        }

        if (nextIndex < 0 || nextIndex >= rows.length) {
          await client.query("COMMIT");
          return res.json({ images: rows.map(normalizeGalleryImage) });
        }

        [rows[index], rows[nextIndex]] = [rows[nextIndex], rows[index]];

        for (const [orderIndex, row] of rows.entries()) {
          await client.query(
            `
            UPDATE public.cms_gallery
            SET sort_order = $1,
                updated_at = now()
            WHERE id = $2
            `,
            [orderIndex + 1, row.id]
          );
        }

        const result = await client.query(
          `
          SELECT id, file, image_url, caption, sort_order, status, created_at, updated_at
          FROM public.cms_gallery
          ORDER BY sort_order ASC, created_at ASC
          `
        );

        await client.query("COMMIT");
        return res.json({ images: result.rows.map(normalizeGalleryImage) });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Move CMS gallery image error:", error);
      return res.status(500).json({ error: "Unable to move gallery image." });
    }
  }

  if (!Array.isArray(imageIds) || imageIds.some(id => !uuidPattern.test(id))) {
    return res.status(400).json({ error: "A valid image order is required." });
  }

  try {
    await ensureGallerySchema();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const [index, id] of imageIds.entries()) {
        await client.query(
          `
          UPDATE public.cms_gallery
          SET sort_order = $1,
              updated_at = now()
          WHERE id = $2
          `,
          [index + 1, id]
        );
      }

      const result = await client.query(
        `
        SELECT id, file, image_url, caption, sort_order, status, created_at, updated_at
        FROM public.cms_gallery
        ORDER BY sort_order ASC, created_at ASC
        `
      );

      await client.query("COMMIT");
      res.json({ images: result.rows.map(normalizeGalleryImage) });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Order CMS gallery error:", error);
    res.status(500).json({ error: "Unable to save gallery order." });
  }
});

router.put("/cms/:id", async (req, res) => {
  const { id } = req.params;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid gallery image id." });
  }

  const body = await parseGalleryRequest(req);
  const payload = parseGalleryPayload(body);

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
    const existing = await pool.query(
      `
      SELECT id, file, image_url, caption
      FROM public.cms_gallery
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Gallery image not found." });
    }

    const githubDelete = await deleteImageFromGithub(existing.rows[0]);

    if (githubDelete.error) {
      return res.status(502).json({ error: githubDelete.error });
    }

    await pool.query("DELETE FROM public.cms_gallery WHERE id = $1", [id]);

    res.json({ success: true });
  } catch (error) {
    console.error("Delete CMS gallery image error:", error);
    res.status(500).json({ error: "Unable to delete gallery image." });
  }
});

export default router;
