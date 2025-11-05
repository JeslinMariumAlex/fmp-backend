import { Router } from "express";
import {
  createPlugin,
  listPlugins,
  getPluginById,
  updatePlugin,
  deletePlugin,
  restorePlugin,
} from "../controllers/plugin.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createPluginSchema,
  updatePluginSchema,
  listQuerySchema,
} from "../schemas/plugin.schema.js";

// ✅ add these imports
import { authRequired, requireAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * Public (read-only)
 */
router.get("/", validate(listQuerySchema), listPlugins);  // list / filter / paginate
router.get("/:id", getPluginById);                        // get one

/**
 * Admin-only (write)
 * Order matters: auth → role → validate → controller
 * (Fail fast on auth before running schema validation.)
 */
router.post(
  "/",
  authRequired,
  requireAdmin,
  validate(createPluginSchema),
  createPlugin
);

router.patch(
  "/:id",
  authRequired,
  requireAdmin,
  validate(updatePluginSchema),
  updatePlugin
);

router.delete(
  "/:id",
  authRequired,
  requireAdmin,
  deletePlugin
);

router.post(
  "/:id/restore",
  authRequired,
  requireAdmin,
  restorePlugin
);

export default router;
