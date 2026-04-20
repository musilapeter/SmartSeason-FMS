import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fieldRoutes from "./routes/fields.js";

// Load env from root .env file
import { join } from "path";
dotenv.config({ path: join(process.cwd(), "../.env") });

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/fields", fieldRoutes);

// ─── Start ──────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🌱 SmartSeason API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
