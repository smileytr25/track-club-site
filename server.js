import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import registerRoute from "./api/register.js";
import cmsAuthRoute from "./api/cmsAuth.js";
import eventsRoute from "./api/events.js";
import galleryRoute from "./api/gallery.js";

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
app.use("/cms", express.static(path.join(__dirname, "cms")));
app.use("/public-site", express.static(path.join(__dirname, "public-site")));

app.get("/", (_, res) => res.send("API running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
