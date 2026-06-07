import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import registerRoute from "./api/register.js";
import cmsAuthRoute from "./api/cmsAuth.js";
import eventsRoute from "./api/events.js";
import galleryRoute from "./api/gallery.js";
import siteCopyRoute from "./api/siteCopy.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/register", registerRoute);
app.use("/api/cms", cmsAuthRoute);
app.use("/api/events", eventsRoute);
app.use("/api/gallery", galleryRoute);
app.use("/api/site-copy", siteCopyRoute);

app.get("/cms", (_req, res) => res.redirect(301, "/cms/html-source/index.html"));
app.get("/cms/", (_req, res) => res.redirect(301, "/cms/html-source/index.html"));
app.get("/cms/:page.html", (req, res, next) => {
  const cmsPages = new Set([
    "index",
    "dashboard",
    "events",
    "event-new",
    "gallery",
    "registrations",
    "site-copy"
  ]);

  if (!cmsPages.has(req.params.page)) {
    return next();
  }

  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.redirect(301, `/cms/html-source/${req.params.page}.html${query}`);
});

app.use("/cms", express.static(path.join(__dirname, "cms")));
app.use("/image-assets", express.static(path.join(__dirname, "public-site", "image-assets")));
app.use("/public-site", express.static(path.join(__dirname, "public-site")));

app.get("/", (_, res) => res.send("API running"));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const server = app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

server.on("error", error => {
  console.error("Server startup error:", error);
});

export { app, server };
