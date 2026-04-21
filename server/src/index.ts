import express from "express";
import cors from "cors";
import fieldRoutes from "./routes/fields";
import adminRoutes from "./routes/admin";

// Vercel securely injects environment variables natively.
// Only load dotenv locally.
if (process.env.NODE_ENV !== "production") {
  import("dotenv").then((dotenv) => {
    import("path").then(({ join }) => {
      dotenv.config({ path: join(process.cwd(), "../.env") });
    });
  });
}

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
app.use("/api/admin", adminRoutes);

// ─── Start ──────────────────────────────────────────────────

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`\n🌱 SmartSeason API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
