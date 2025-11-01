import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import pluginRoutes from "./routes/plugin.routes.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";
import { authRequired, requireAdmin } from "./middlewares/auth.middleware.js";


const app = express();

/* ---------- Security & utils ---------- */
app.use(helmet());

// CORS — allow local dev + add Netlify later
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://findmyplugin.netlify.app"
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // <-- add this
  })
);


// ✅ Express 5-safe preflight handler (regex, not "*")
app.options(/.*/, cors());

app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));   // higher for screenshots
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ---------- Sanitization ---------- */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    const val = obj[key];
    if (val && typeof val === "object") sanitizeObject(val);
  }
}
app.use(hpp());
app.use((req, _res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
});

/* ---------- Rate limiter ---------- */
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

/* ---------- Routes ---------- */
app.use("/api/auth", authRoutes);
// Example admin-only API
app.get("/api/admin/summary", authRequired, requireAdmin, (_req, res) => {
  res.json({
    totalPlugins: 123,
    pendingRequests: 5,
    lastDeployedAt: new Date().toISOString(),
  });
});

app.use("/api/plugins", pluginRoutes);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ---------- Errors ---------- */
app.use(notFound);
app.use(errorHandler);

export default app;
