import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

import pluginRoutes from "./routes/plugin.routes.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";

const app = express();

/* ---------- Security & utils ---------- */
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ---------- Sanitization (Express 5–safe) ---------- */
/** Remove keys starting with "$" or containing "." to avoid Mongo operator injection. */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    // dangerous key? remove it
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    const val = obj[key];
    if (val && typeof val === "object") sanitizeObject(val);
  }
}

app.use(hpp()); // prevent HTTP param pollution

// sanitize in place; DO NOT reassign req.query / req.params on Express 5
app.use((req, _res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
});

/* ---------- Rate limiter ---------- */
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // 120 requests/min/IP
});
app.use(limiter);

/* ---------- Routes ---------- */
app.use("/api/plugins", pluginRoutes);

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ---------- Errors ---------- */
app.use(notFound);
app.use(errorHandler);

export default app;
