import "dotenv/config";
import express from "express";
import pluginRoutes from "./routes/plugin.routes.js";
import { connectDB } from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

// parse JSON
app.use(express.json());

// test route
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// plugin routes
app.use("/api/plugins", pluginRoutes);

// start function
const start = async () => {
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

start();
