import express from "express";
import {
  createPlugin,
  getPlugins,
  getPluginById,
  updatePlugin,
  deletePlugin,
} from "../controllers/plugin.controller.js";

const router = express.Router();

// CREATE a new plugin
router.post("/", createPlugin);

// GET all plugins (with optional filters)
router.get("/", getPlugins);

// GET a single plugin by ID
router.get("/:id", getPluginById);

// UPDATE a plugin by ID
router.patch("/:id", updatePlugin);

// DELETE a plugin by ID
router.delete("/:id", deletePlugin);

export default router;
