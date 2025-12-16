import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import registerRoute from "./api/register.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/register", registerRoute);

app.get("/", (_, res) => res.send("API running"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
