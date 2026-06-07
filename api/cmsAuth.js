import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { username, password, displayName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  if (username.trim().length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO public.cms_auth (username, password_hash, display_name, role)
      VALUES ($1, crypt($2, gen_salt('bf')), $3, 'admin')
      RETURNING id, username, display_name, role
      `,
      [username.trim(), password, displayName?.trim() || null]
    );

    return res.status(201).json({
      created: true,
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "That username is already taken." });
    }

    console.error("CMS signup error:", error);
    return res.status(500).json({ error: "Unable to create CMS user." });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, username, display_name, role
      FROM public.cms_auth
      WHERE lower(username) = lower($1)
        AND active = true
        AND password_hash = crypt($2, password_hash)
      LIMIT 1
      `,
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const user = result.rows[0];

    await pool.query(
      "UPDATE public.cms_auth SET last_login_at = now(), updated_at = now() WHERE id = $1",
      [user.id]
    );

    return res.json({
      authenticated: true,
      user
    });
  } catch (error) {
    console.error("CMS login error:", error);
    return res.status(500).json({ error: "Unable to log in." });
  }
});

export default router;
