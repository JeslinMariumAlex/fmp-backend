// src/controllers/plugin.controller.js
import mongoose from "mongoose";
import Plugin from "../models/plugin.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createPluginSchema,
  updatePluginSchema,
  listQuerySchema,
} from "../schemas/plugin.schema.js";

// helper: send nice Zod errors
// helper: send readable Zod errors (shows nested paths clearly)
const zodError = (res, result) => {
  const details = result.error.issues.map((issue) => ({
    path: issue.path.join("."), // e.g. body.title, body.screenshots.0.url
    message: issue.message, // human-readable error
  }));

  return res.status(400).json({
    success: false,
    message: "Validation error",
    errors: details,
  });
};

// Create
export const createPlugin = async (req, res, next) => {
  try {
    const parsed = createPluginSchema.safeParse({ body: req.body });

    if (!parsed.success) {
      console.log("❌ Validation failed:", parsed.error.issues);
      return zodError(res, parsed);
    }

    const payload = parsed.data.body;
    const plugin = await Plugin.create(payload);
    return ApiResponse.created(res, plugin);
  } catch (err) {
    next(err);
  }
};

// Get by ID
export const getPluginById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plugin id" });
    }
    const plugin = await Plugin.findById(req.params.id);
    if (!plugin)
      return res
        .status(404)
        .json({ success: false, message: "Plugin not found" });
    return ApiResponse.ok(res, plugin);
  } catch (err) {
    next(err);
  }
};

// List + Filtering + Pagination + Sorting
export const listPlugins = async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse({ query: req.query });
    if (!parsed.success) return zodError(res, parsed);

    const {
      q,
      category,
      subcategory,
      tags,
      minRating,
      sortBy = "newest",
      order = "desc",
      page = "1",
      limit = "12",
    } = parsed.data.query;

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 12, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (q) {
      // use $text if you have an index; otherwise regex fallback:
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { desc: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;

    if (tags) {
      const tagArr = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagArr.length) filter.tags = { $all: tagArr };
    }

    if (minRating) {
      const r = parseFloat(minRating);
      if (!Number.isNaN(r)) filter.rating = { $gte: r };
    }

    const dir = order === "asc" ? 1 : -1;
    let sort = { createdAt: -1 };
    if (sortBy === "newest") sort = { createdAt: dir };
    else if (sortBy === "popular") sort = { likes: dir, hearts: dir, oks: dir };
    else if (sortBy === "rating") sort = { rating: dir, ratingsCount: dir };

    const finalFilter = { ...filter, isDeleted: false };
    const [items, total] = await Promise.all([
      Plugin.find(finalFilter).sort(sort).skip(skip).limit(limitNum),
      Plugin.countDocuments(finalFilter),
    ]);

    return ApiResponse.ok(res, items, {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

// Update (partial)
export const updatePlugin = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plugin id" });
    }

    const parsed = updatePluginSchema.safeParse({ body: req.body });
    if (!parsed.success) return zodError(res, parsed);

    const payload = parsed.data.body;

    const updated = await Plugin.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false }, // ensure not deleted
      payload,
      { new: true, runValidators: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Plugin not found" });
    return ApiResponse.ok(res, updated);
  } catch (err) {
    next(err);
  }
};

// Soft Delete
export const deletePlugin = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plugin id" });
    }

    const deleted = await Plugin.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Plugin not found" });
    }

    return ApiResponse.ok(res, {
      _id: deleted._id,
      message: "Plugin soft-deleted",
    });
  } catch (err) {
    next(err);
  }
};

// Restore soft-deleted plugin
export const restorePlugin = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid plugin id" });
    }

    const restored = await Plugin.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true }
    );

    if (!restored) {
      return res
        .status(404)
        .json({ success: false, message: "No deleted plugin found" });
    }

    return ApiResponse.ok(res, restored);
  } catch (err) {
    next(err);
  }
};
