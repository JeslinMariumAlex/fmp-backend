import { Router } from "express";
import {
  createPlugin,
  listPlugins,
  getPluginById,
  updatePlugin,
  deletePlugin
} from "../controllers/plugin.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createPluginSchema, updatePluginSchema, listQuerySchema } from "../schemas/plugin.schema.js";

const router = Router();

// Create
router.post("/", validate(createPluginSchema), createPlugin);



// List / filter / paginate
router.get("/", validate(listQuerySchema), listPlugins);

// Get one
router.get("/:id", getPluginById);

// Update (partial)
router.patch("/:id", validate(updatePluginSchema), updatePlugin);

// Delete
router.delete("/:id", deletePlugin);

export default router;
